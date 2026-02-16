import sys, json, subprocess
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import pandas as pd
from app.db import SessionLocal
from app import models
from app.models.training_job import TrainingJob


def utcnow():
    return datetime.utcnow()


def write_manifest(samples, out_csv: Path, out_ids: Path):
    rows = []
    ids = []
    for s in samples:
        path = getattr(s, "image_path", None)
        if not path:
            continue
        rows.append({"path": path, "label": int(s.label), "user_id": int(s.user_id)})
        ids.append(int(s.id))

    df = pd.DataFrame(rows)
    df.to_csv(out_csv, index=False, encoding="utf-8")

    out_ids.write_text("\n".join(map(str, ids)), encoding="utf-8")
    return len(ids)


def run_one_job(job_id: int):
    db = SessionLocal()
    try:
        job = db.query(TrainingJob).filter(TrainingJob.id == job_id).first()
        if not job or job.status != "queued":
            return

        job.status = "running"
        job.started_at = utcnow()
        db.commit()

        job_dir = ROOT / "training_jobs" / f"job_{job.id}"
        job_dir.mkdir(parents=True, exist_ok=True)

        manifest_csv = job_dir / "manifest.csv"
        manifest_ids = job_dir / "manifest_ids.txt"
        log_path = job_dir / "train.log"
        meta_path = job_dir / "train_metadata.json"

        job.manifest_csv_path = str(manifest_csv)
        job.manifest_ids_path = str(manifest_ids)
        job.log_path = str(log_path)
        db.commit()

        sample_ids = json.loads(job.sample_ids_json or "[]")

        q = db.query(models.GestureSample)
        if sample_ids:
            q = q.filter(models.GestureSample.id.in_(sample_ids))

        if not job.include_trained:
            q = q.filter(models.GestureSample.trained_at.is_(None))

        samples = q.all()
        n = write_manifest(samples, manifest_csv, manifest_ids)

        if n == 0:
            job.status = "failed"
            job.error_message = "No samples matched to train."
            job.finished_at = utcnow()
            db.commit()
            return

        # run training script
        cmd = [
            sys.executable,
            str(ROOT / "train" / "train_mlflow.py"),
            "--manifest", str(manifest_csv),
            "--ids", str(manifest_ids),
            "--out-metadata", str(meta_path),
        ]

        with open(log_path, "w", encoding="utf-8") as logf:
            p = subprocess.Popen(cmd, cwd=str(ROOT), stdout=logf, stderr=subprocess.STDOUT)
            # wait + allow cancel
            while True:
                db.refresh(job)
                if job.cancel_requested:
                    try:
                        p.terminate()
                    except Exception:
                        pass
                    job.status = "cancelled"
                    job.finished_at = utcnow()
                    db.commit()
                    return

                ret = p.poll()
                if ret is not None:
                    break

        if ret == 0:
            job.status = "succeeded"
            if meta_path.exists():
                job.metadata_json = meta_path.read_text(encoding="utf-8")
        else:
            job.status = "failed"
            job.error_message = f"Training process exited with code {ret}. Check log."

        job.finished_at = utcnow()
        db.commit()

    finally:
        db.close()


def main():
    # loop queue
    while True:
        db = SessionLocal()
        try:
            next_job = (
                db.query(TrainingJob)
                .filter(TrainingJob.status == "queued")
                .order_by(TrainingJob.created_at.asc())
                .first()
            )
            if not next_job:
                return
            job_id = next_job.id
        finally:
            db.close()

        run_one_job(job_id)


if __name__ == "__main__":
    main()

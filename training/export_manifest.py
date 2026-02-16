import sys
import argparse
import pandas as pd
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]  # backend/
sys.path.append(str(ROOT))

from app.db import SessionLocal
from app import models

DATA_ROOT = ROOT / "data"

def build_manifest(out_csv: Path, ids_out: Path | None, only_new: bool):
    db = SessionLocal()
    try:
        q = db.query(models.GestureSample).order_by(models.GestureSample.created_at.desc())

        if only_new:
            q = q.filter(models.GestureSample.trained_at.is_(None))

        rows = q.all()

        items = []
        used_ids = []
        missing = 0

        for s in rows:
            rel = str(s.image_path).replace("\\", "/")
            abs_path = (DATA_ROOT / rel).resolve()

            if not abs_path.is_file():
                missing += 1
                continue

            items.append({
                "id": int(s.id),
                "path": str(abs_path),
                "label": int(s.label),
                "user_id": int(s.user_id),
                "created_at": s.created_at.isoformat() if s.created_at else None,
            })
            used_ids.append(int(s.id))

        df = pd.DataFrame(items)
        out_csv.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(out_csv, index=False, encoding="utf-8")

        print(f"✅ Wrote {len(df)} rows to {out_csv}")
        if missing:
            print(f"⚠️ Missing files skipped: {missing}")

        if ids_out:
            ids_out.parent.mkdir(parents=True, exist_ok=True)
            ids_out.write_text("\n".join(map(str, used_ids)), encoding="utf-8")
            print(f"✅ Wrote {len(used_ids)} ids to {ids_out}")

    finally:
        db.close()


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(Path(__file__).parent / "manifest.csv"))
    ap.add_argument("--ids-out", default=str(Path(__file__).parent / "manifest_ids.txt"))
    ap.add_argument("--only-new", action="store_true")
    args = ap.parse_args()

    build_manifest(Path(args.out), Path(args.ids_out), only_new=args.only_new)

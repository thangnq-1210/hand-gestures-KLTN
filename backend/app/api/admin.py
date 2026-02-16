from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime
import os
from app.db import get_db
from app.core.security import get_current_user
from app.core.security import require_admin
from app.models.user import User
from app import models
from app.ml import gesture_model

import json
import subprocess
import sys
from pathlib import Path
from datetime import datetime, timedelta
from sqlalchemy import func, case
from app.models.training_job import TrainingJob
from fastapi import HTTPException
from app.core.security import require_admin, get_password_hash
router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/samples")
def list_all_samples(
    label: str | None = None,
    user_id: int | None = None,
    trained: bool | None = None,
    limit: int = Query(200, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    q = db.query(models.GestureSample)

    # label trong DB của bạn có thể là INT -> ép kiểu cho chắc
    if label is not None and label != "":
        try:
            q = q.filter(models.GestureSample.label == int(label))
        except ValueError:
            # nếu label DB là string thì bỏ int() đi
            q = q.filter(models.GestureSample.label == label)

    if user_id is not None:
        q = q.filter(models.GestureSample.user_id == user_id)

    if trained is True:
        q = q.filter(models.GestureSample.trained_at.isnot(None))
    if trained is False:
        q = q.filter(models.GestureSample.trained_at.is_(None))

    rows = (
        q.order_by(models.GestureSample.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    out = []
    for s in rows:
        # image_path thường dạng: user_samples/3/0/xxx.jpg (hoặc có \ trên Windows)
        image_path_str = str(getattr(s, "image_path", "") or "")
        filename = os.path.basename(image_path_str.replace("\\", "/"))

        # Nếu DB chưa có image_path hoặc filename rỗng -> không tạo url
        image_url = None
        if filename:
            image_url = f"/collect/sample-file/{s.user_id}/{s.label}/{filename}"

        out.append(
            {
                "id": s.id,
                "user_id": s.user_id,
                "label": str(s.label),
                "filename": filename,
                "image_url": image_url,
                "trained": s.trained_at is not None,
                "trained_at": s.trained_at.isoformat() if s.trained_at else None,
                "created_at": s.created_at.isoformat() if s.created_at else None,
            }
        )

    return out

@router.post("/reload-model")
def reload_model(_: User = Depends(require_admin)):
    return gesture_model.reload_model()

@router.get("/model-info")
def model_info(_: User = Depends(require_admin)):
    return {"source": getattr(gesture_model, "_model_source", None)}

@router.post("/training-jobs")
def create_training_job(
    payload: dict,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """
    payload options:
    - sample_ids: list[int] | None
    - include_trained: bool (default False)
    """
    sample_ids = payload.get("sample_ids")  # can be None
    include_trained = bool(payload.get("include_trained", False))

    job = TrainingJob(
        requested_by_admin_id=admin.id,
        status="queued",
        include_trained=include_trained,
        sample_ids_json=json.dumps(sample_ids or []),
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # auto kick worker nếu chưa có job running
    running = db.query(func.count(TrainingJob.id)).filter(TrainingJob.status == "running").scalar() or 0
    if running == 0:
        backend_root = Path(__file__).resolve().parents[2]  # backend/
        cmd = [sys.executable, str(backend_root / "scripts" / "training_worker.py")]
        subprocess.Popen(cmd, cwd=str(backend_root))

    return {"job_id": job.id, "status": job.status}

@router.get("/training-jobs")
def list_training_jobs(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    rows = (
        db.query(TrainingJob)
        .order_by(TrainingJob.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    out = []
    for j in rows:
        out.append({
            "id": j.id,
            "status": j.status,
            "include_trained": j.include_trained,
            "sample_ids": json.loads(j.sample_ids_json or "[]"),
            "created_at": j.created_at.isoformat() if j.created_at else None,
            "started_at": j.started_at.isoformat() if j.started_at else None,
            "finished_at": j.finished_at.isoformat() if j.finished_at else None,
            "error_message": j.error_message,
        })
    return out

@router.get("/training-jobs/{job_id}/log")
def get_job_log(
    job_id: int,
    tail_lines: int = Query(300, ge=50, le=2000),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    job = db.query(TrainingJob).filter(TrainingJob.id == job_id).first()
    if not job or not job.log_path:
        return {"log": ""}

    p = Path(job.log_path)
    if not p.exists():
        return {"log": ""}

    lines = p.read_text(encoding="utf-8", errors="ignore").splitlines()
    return {"log": "\n".join(lines[-tail_lines:])}

@router.post("/training-jobs/{job_id}/cancel")
def cancel_job(
    job_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    job = db.query(TrainingJob).filter(TrainingJob.id == job_id).first()
    if not job:
        return {"ok": False, "error": "job not found"}

    if job.status == "queued":
        job.status = "cancelled"
        job.finished_at = datetime.utcnow()
        db.commit()
        return {"ok": True, "status": job.status}

    if job.status == "running":
        job.cancel_requested = True
        db.commit()
        return {"ok": True, "status": "cancel_requested"}

    return {"ok": True, "status": job.status}

@router.post("/samples/mark-untrained")
def mark_untrained(
    sample_ids: list[int],
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    if not sample_ids:
        return {"ok": True, "updated": 0}
    updated = (
        db.query(models.GestureSample)
        .filter(models.GestureSample.id.in_(sample_ids))
        .update({models.GestureSample.trained_at: None}, synchronize_session=False)
    )
    db.commit()
    return {"ok": True, "updated": int(updated)}

@router.get("/overview")
def admin_overview(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    now_utc = datetime.utcnow()
    since_24h = now_utc - timedelta(hours=24)
    since_7d = now_utc - timedelta(days=7)
    prev_7d = now_utc - timedelta(days=14)

    # Tổng users
    total_users = db.query(func.count(models.User.id)).scalar() or 0

    # Users hoạt động (dựa trên prediction_logs trong 24h)
    active_users_24h = (
        db.query(func.count(func.distinct(models.PredictionLog.user_id)))
        .filter(models.PredictionLog.user_id.isnot(None))
        .filter(models.PredictionLog.created_at >= since_24h)
        .scalar()
        or 0
    )

    # Tổng dự đoán hôm nay (24h) - loại no_hand
    predictions_24h = (
        db.query(func.count(models.PredictionLog.id))
        .filter(models.PredictionLog.created_at >= since_24h)
        .filter(models.PredictionLog.gesture_label != "no_hand")
        .scalar()
        or 0
    )

    # Tăng users tuần này = users tạo trong 7d gần nhất
    users_added_7d = (
        db.query(func.count(models.User.id))
        .filter(models.User.created_at >= since_7d)
        .scalar()
        or 0
    )

    # Tỷ lệ lỗi: tạm tính theo no_hand / tổng logs trong 24h (bạn chưa có feedback)
    total_logs_24h = db.query(func.count(models.PredictionLog.id)).filter(models.PredictionLog.created_at >= since_24h).scalar() or 0
    no_hand_24h = (
        db.query(func.count(models.PredictionLog.id))
        .filter(models.PredictionLog.created_at >= since_24h)
        .filter(models.PredictionLog.gesture_label == "no_hand")
        .scalar()
        or 0
    )
    error_rate = (no_hand_24h / total_logs_24h * 100.0) if total_logs_24h > 0 else 0.0

    return {
        "total_users": int(total_users),
        "users_added_7d": int(users_added_7d),
        "active_users_24h": int(active_users_24h),
        "predictions_24h": int(predictions_24h),
        "error_rate_pct": float(round(error_rate, 2)),
        "as_of": now_utc.isoformat(),
    }

@router.get("/users")
def admin_list_users(
    limit: int = Query(200, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    rows = (
        db.query(models.User)
        .order_by(models.User.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return [
        {
            "id": u.id,
            "email": u.email,
            "name": u.name,
            "role": u.role,
            "isLocked": (not u.is_active),
            "createdAt": u.created_at.isoformat() if u.created_at else None,
        }
        for u in rows
    ]


@router.patch("/users/{user_id}/lock")
def admin_set_lock(
    user_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    locked = bool(payload.get("locked"))

    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="user not found")

    if u.id == admin.id and locked:
        raise HTTPException(status_code=400, detail="cannot lock yourself")

    u.is_active = (not locked)
    db.commit()

    return {"ok": True, "id": u.id, "isLocked": (not u.is_active)}


@router.patch("/users/{user_id}/role")
def admin_change_role(
    user_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    new_role = payload.get("role")
    if new_role not in ("user", "admin"):
        raise HTTPException(status_code=400, detail="role must be 'user' or 'admin'")

    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="user not found")

    if u.id == admin.id and new_role != "admin":
        raise HTTPException(status_code=400, detail="cannot demote yourself")

    u.role = new_role
    db.commit()
    return {"ok": True, "id": u.id, "role": u.role}


@router.patch("/users/{user_id}/password")
def admin_set_password(
    user_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    new_password = (payload.get("new_password") or "").strip()
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="new_password must be >= 6 chars")

    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="user not found")

    u.password_hash = get_password_hash(new_password)
    db.commit()
    return {"ok": True, "id": u.id}





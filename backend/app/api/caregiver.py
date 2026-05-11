from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from datetime import datetime, timedelta

from ..db import get_db
from .. import models
from ..models.caregiver_relations import CaregiverRelation
from ..models.prediction_logs import PredictionLog
from ..models.gesture_mapping import GestureDictionary, UserGestureMapping
from ..core.security import get_current_user, require_caregiver, ensure_caregiver_has_patient
from ..schemas.caregiver import CaregiverLinkByEmailIn
from ..schemas.gesture import UpdateUserGestureMapping

router = APIRouter(prefix="/caregiver", tags=["caregiver"])
# API liên kết caregiver với bệnh nhân
# POST /caregiver/patients/link
#
# Caregiver nhập email bệnh nhân để liên kết.
@router.post("/patients/link")
def link_patient_by_email(
    data: CaregiverLinkByEmailIn,
    db: Session = Depends(get_db),
    caregiver: models.User = Depends(require_caregiver),
):
    patient = (
        db.query(models.User)
        .filter(models.User.email == data.patient_email)
        .first()
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Không tìm thấy bệnh nhân")

    if patient.id == caregiver.id:
        raise HTTPException(status_code=400, detail="Không thể tự liên kết với chính mình")

    if patient.role != "user":
        raise HTTPException(status_code=400, detail="Chỉ có thể liên kết với tài khoản người dùng")

    existed = (
        db.query(CaregiverRelation)
        .filter(
            CaregiverRelation.caregiver_id == caregiver.id,
            CaregiverRelation.patient_id == patient.id,
        )
        .first()
    )
    if existed:
        raise HTTPException(status_code=400, detail="Đã liên kết với bệnh nhân này")

    rel = CaregiverRelation(
        caregiver_id=caregiver.id,
        patient_id=patient.id,
        relation_type=data.relation_type,
    )
    db.add(rel)
    db.commit()
    db.refresh(rel)

    return {
        "id": rel.id,
        "caregiver_id": rel.caregiver_id,
        "patient_id": rel.patient_id,
        "relation_type": rel.relation_type,
        "patient": {
            "id": patient.id,
            "email": patient.email,
            "name": patient.name,
            "role": patient.role,
            "preferred_language": patient.preferred_language,
            "is_active": patient.is_active,
        },
    }
# API lấy danh sách bệnh nhân caregiver đang quản lý
@router.get("/patients")
def get_my_patients(
    db: Session = Depends(get_db),
    caregiver: models.User = Depends(require_caregiver),
):
    rows = (
        db.query(CaregiverRelation)
        .filter(CaregiverRelation.caregiver_id == caregiver.id)
        .all()
    )

    result = []
    for r in rows:
        patient = (
            db.query(models.User)
            .filter(models.User.id == r.patient_id)
            .first()
        )
        if not patient:
            continue

        result.append({
            "id": r.id,
            "caregiver_id": r.caregiver_id,
            "patient_id": r.patient_id,
            "relation_type": r.relation_type,
            "patient": {
                "id": patient.id,
                "email": patient.email,
                "name": patient.name,
                "role": patient.role,
                "preferred_language": patient.preferred_language,
                "is_active": patient.is_active,
            }
        })

    return result

# API hủy liên kết
@router.delete("/patients/{patient_id}", status_code=204)
def unlink_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    caregiver: models.User = Depends(require_caregiver),
):
    rel = (
        db.query(CaregiverRelation)
        .filter(
            CaregiverRelation.caregiver_id == caregiver.id,
            CaregiverRelation.patient_id == patient_id,
        )
        .first()
    )
    if not rel:
        raise HTTPException(status_code=404, detail="Không tìm thấy liên kết")

    db.delete(rel)
    db.commit()
    return

# API caregiver xem hồ sơ bệnh nhân
@router.get("/patients/{patient_id}/profile")
def get_patient_profile(
    patient_id: int,
    db: Session = Depends(get_db),
    caregiver: models.User = Depends(require_caregiver),
):
    ensure_caregiver_has_patient(caregiver.id, patient_id, db)

    patient = db.query(models.User).filter(models.User.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Không tìm thấy bệnh nhân")

    return {
        "id": patient.id,
        "email": patient.email,
        "name": patient.name,
        "role": patient.role,
        "preferred_language": patient.preferred_language,
        "avatar_url": patient.avatar_url,
        "is_active": patient.is_active,
        "created_at": patient.created_at.isoformat() if patient.created_at else None,
    }

# API caregiver xem lịch sử nhận diện của bệnh nhân
@router.get("/patients/{patient_id}/predictions")
def get_patient_predictions(
    patient_id: int,
    limit: int = 50,
    db: Session = Depends(get_db),
    caregiver: models.User = Depends(require_caregiver),
):
    ensure_caregiver_has_patient(caregiver.id, patient_id, db)

    rows = (
        db.query(PredictionLog)
        .filter(PredictionLog.user_id == patient_id)
        .filter(PredictionLog.has_hand == True)
        .filter(PredictionLog.gesture_label != "no_hand")
        .order_by(PredictionLog.created_at.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "id": int(r.id),
            "gesture_label": r.gesture_label,
            "predicted_text": r.predicted_text,
            "confidence": r.confidence,
            "has_hand": r.has_hand,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "image_url": r.image_path,
        }
        for r in rows
    ]

# API caregiver xem thống kê thật của bệnh nhân
@router.get("/patients/{patient_id}/stats")
def get_patient_stats(
    patient_id: int,
    days: int = 7,
    db: Session = Depends(get_db),
    caregiver: models.User = Depends(require_caregiver),
):
    ensure_caregiver_has_patient(caregiver.id, patient_id, db)

    now_utc = datetime.utcnow()
    now_vn = now_utc + timedelta(hours=7)
    since_vn = now_vn - timedelta(days=days)
    since_utc = since_vn - timedelta(hours=7)

    gesture_rows = (
        db.query(PredictionLog.gesture_label, func.count(PredictionLog.id))
        .filter(PredictionLog.user_id == patient_id)
        .filter(PredictionLog.created_at >= since_utc)
        .filter(PredictionLog.gesture_label != "no_hand")
        .group_by(PredictionLog.gesture_label)
        .order_by(func.count(PredictionLog.id).desc())
        .all()
    )

    gesture_stats = [{"gesture": g, "count": int(c)} for g, c in gesture_rows]
    total_predictions = sum(x["count"] for x in gesture_stats)
    most_used_gesture = gesture_stats[0]["gesture"] if gesture_stats else ""

    avg_conf = (
        db.query(func.avg(PredictionLog.confidence))
        .filter(PredictionLog.user_id == patient_id)
        .filter(PredictionLog.created_at >= since_utc)
        .filter(PredictionLog.gesture_label != "no_hand")
        .scalar()
    ) or 0

    local_dt = func.date_add(PredictionLog.created_at, text("INTERVAL 7 HOUR"))
    hour_expr = func.extract("hour", local_dt)

    hour_rows = (
        db.query(hour_expr.label("h"), func.count(PredictionLog.id).label("c"))
        .filter(PredictionLog.user_id == patient_id)
        .filter(PredictionLog.created_at >= since_utc)
        .filter(PredictionLog.gesture_label != "no_hand")
        .group_by(hour_expr)
        .order_by(hour_expr)
        .all()
    )

    hour_map = {int(h): int(c) for h, c in hour_rows if h is not None}
    time_stats = [{"time": f"{h:02d}:00", "predictions": hour_map.get(h, 0)} for h in range(24)]

    return {
        "total_predictions": total_predictions,
        "most_used_gesture": most_used_gesture,
        "avg_confidence": float(avg_conf),
        "gesture_stats": gesture_stats,
        "time_stats": time_stats,
        "days": days,
    }

# API caregiver chỉnh câu nói của bệnh nhân
@router.get("/patients/{patient_id}/gesture-mapping")
def get_patient_gesture_mapping(
    patient_id: int,
    db: Session = Depends(get_db),
    caregiver: models.User = Depends(require_caregiver),
):
    ensure_caregiver_has_patient(caregiver.id, patient_id, db)

    dictionaries = (
        db.query(GestureDictionary)
        .filter(GestureDictionary.is_active == True)
        .all()
    )

    user_mappings = (
        db.query(UserGestureMapping)
        .filter(UserGestureMapping.user_id == patient_id)
        .all()
    )
    mapping_by_label = {m.model_label: m for m in user_mappings}

    result = []
    for d in dictionaries:
        m = mapping_by_label.get(d.model_label)
        custom = m.custom_text if m else None
        result.append({
            "model_label": d.model_label,
            "default_text": d.default_text,
            "custom_text": custom,
            "effective_text": custom or d.default_text,
        })

    result.sort(key=lambda x: x["model_label"])
    return result

# Caregiver cập nhật mapping của bệnh nhân
@router.put("/patients/{patient_id}/gesture-mapping/{model_label}")
def upsert_patient_gesture_mapping(
    patient_id: int,
    model_label: str,
    data: UpdateUserGestureMapping,
    db: Session = Depends(get_db),
    caregiver: models.User = Depends(require_caregiver),
):
    ensure_caregiver_has_patient(caregiver.id, patient_id, db)

    d = (
        db.query(GestureDictionary)
        .filter(GestureDictionary.model_label == model_label)
        .first()
    )
    if not d:
        raise HTTPException(status_code=404, detail="Cử chỉ không tồn tại")

    m = (
        db.query(UserGestureMapping)
        .filter(
            UserGestureMapping.user_id == patient_id,
            UserGestureMapping.model_label == model_label,
        )
        .first()
    )

    if m:
        m.custom_text = data.custom_text
    else:
        m = UserGestureMapping(
            user_id=patient_id,
            model_label=model_label,
            custom_text=data.custom_text,
        )
        db.add(m)

    db.commit()
    db.refresh(m)

    return {
        "model_label": model_label,
        "default_text": d.default_text,
        "custom_text": m.custom_text,
        "effective_text": m.custom_text or d.default_text,
    }


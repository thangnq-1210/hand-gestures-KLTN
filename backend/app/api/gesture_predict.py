from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pathlib import Path
import base64
import traceback
import uuid

from ..db import get_db
from .. import models
from ..core.security import get_current_user
from ..ml.gesture_model import predict_image_bytes
from ..schemas.gesture import GesturePredictRequest, GesturePredictResponse

router = APIRouter(prefix="/gesture", tags=["gesture"])

PREDICTION_SNAPSHOT_DIR = Path("backend/data/prediction_snapshots")
PREDICTION_SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)


def save_prediction_snapshot(base64_image: str, user_id: int) -> str | None:
    try:
        if "," in base64_image:
            _, encoded = base64_image.split(",", 1)
        else:
            encoded = base64_image

        image_bytes = base64.b64decode(encoded)
        filename = f"{user_id}_{uuid.uuid4().hex}.jpg"
        file_path = PREDICTION_SNAPSHOT_DIR / filename

        with open(file_path, "wb") as f:
            f.write(image_bytes)

        return f"/prediction-snapshots/{filename}"
    except Exception as e:
        print("save_prediction_snapshot error:", e)
        return None


def get_effective_text(db: Session, user_id: int | None, model_label: str) -> str:
    d = (
        db.query(models.GestureDictionary)
        .filter(models.GestureDictionary.model_label == model_label)
        .first()
    )
    default_text = d.default_text if d else None

    if user_id is not None:
        m = (
            db.query(models.UserGestureMapping)
            .filter(
                models.UserGestureMapping.user_id == user_id,
                models.UserGestureMapping.model_label == model_label,
            )
            .first()
        )
        if m and m.custom_text:
            return m.custom_text

    if default_text:
        return default_text
    return model_label


def decode_base64_image(dataurl_or_b64: str) -> bytes:
    if not dataurl_or_b64 or not isinstance(dataurl_or_b64, str):
        raise HTTPException(status_code=400, detail="image is empty")

    s = dataurl_or_b64.strip()

    if "," in s:
        s = s.split(",", 1)[1].strip()

    if s.lower() in ("null", "undefined"):
        raise HTTPException(status_code=400, detail=f"image is {s}")

    s = s.replace(" ", "+")
    missing = len(s) % 4
    if missing:
        s += "=" * (4 - missing)

    try:
        raw = base64.b64decode(s, validate=False)
    except Exception:
        raise HTTPException(status_code=400, detail="image base64 invalid")

    if not raw:
        raise HTTPException(status_code=400, detail="decoded image bytes empty")

    return raw


@router.post("/predict-base64", response_model=GesturePredictResponse)
def predict_base64(
    data: GesturePredictRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    try:
        image_bytes = decode_base64_image(data.image)
        label, prob, has_hand = predict_image_bytes(image_bytes)

        # chỉ lưu snapshot khi có user hợp lệ
        snapshot_path = None
        if current_user and current_user.id:
            snapshot_path = save_prediction_snapshot(data.image, current_user.id)

        if not has_hand:
            try:
                new_log = models.PredictionLog(
                    user_id=current_user.id if current_user else None,
                    gesture_label="no_hand",
                    predicted_text="Vui lòng giơ tay vào camera",
                    confidence=0.0,
                    has_hand=False,
                    model_version=None,
                    is_correct=None,
                    image_path=snapshot_path,
                )
                db.add(new_log)
                db.commit()
            except Exception:
                db.rollback()
        #     if not has_hand:
        #         return GesturePredictResponse(
        #             gesture="no_hand",
        #             confidence=0.0,
        #             has_hand=False,
        #             text="Vui lòng giơ tay vào camera",
        #         )

            return GesturePredictResponse(
                gesture="no_hand",
                confidence=0.0,
                has_hand=False,
                text="Vui lòng giơ tay vào camera",
            )

        effective_text = get_effective_text(
            db=db,
            user_id=current_user.id if current_user else None,
            model_label=label,
        )

        try:
            new_log = models.PredictionLog(
                user_id=current_user.id if current_user else None,
                gesture_label=label,
                predicted_text=effective_text,
                confidence=float(prob),
                has_hand=True,
                model_version=None,
                is_correct=None,
                image_path=snapshot_path,
            )
            db.add(new_log)
            db.commit()
        except Exception as log_err:
            db.rollback()
            print(f"[warn] cannot write PredictionLog: {log_err}")

        return GesturePredictResponse(
            gesture=label,
            confidence=float(prob),
            has_hand=True,
            text=effective_text,
        )

    except HTTPException:
        raise
    except Exception as e:
        print("=== ERROR /gesture/predict-base64 ===")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"{type(e).__name__}: {e}",
        )

@router.get("/predictions/me")
def get_my_predictions(
    limit: int = 8,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = (
        db.query(models.PredictionLog)
        .filter(
            models.PredictionLog.user_id == current_user.id,
            models.PredictionLog.has_hand == True,
        )
        .order_by(models.PredictionLog.created_at.desc())
    )

    total = q.count()
    rows = q.offset(offset).limit(limit).all()

    return {
        "items": [
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
        ],
        "total": total,
    }

@router.delete("/predictions/me")
def delete_my_predictions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    rows = (
        db.query(models.PredictionLog)
        .filter(models.PredictionLog.user_id == current_user.id)
        .all()
    )

    deleted = 0
    for row in rows:
        db.delete(row)
        deleted += 1

    db.commit()

    return {"deleted": deleted}

@router.delete("/predictions/{prediction_id}")
def delete_my_prediction(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    row = (
        db.query(models.PredictionLog)
        .filter(
            models.PredictionLog.id == prediction_id,
            models.PredictionLog.user_id == current_user.id,
        )
        .first()
    )

    if not row:
        raise HTTPException(status_code=404, detail="Không tìm thấy mục lịch sử")

    db.delete(row)
    db.commit()

    return {"message": "Đã xóa mục lịch sử"}
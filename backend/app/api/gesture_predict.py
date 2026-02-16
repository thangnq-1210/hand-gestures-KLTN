from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import base64
from ..db import get_db
from .. import models
from ..core.security import get_current_user
from ..ml.gesture_model import predict_image_bytes
from ..schemas.gesture import GesturePredictRequest, GesturePredictResponse
import traceback
router = APIRouter(prefix="/gesture", tags=["gesture"])


def get_effective_text(db: Session, user_id: int | None, model_label: str) -> str:
    """
    Lấy câu text hiệu lực cho 1 label:
    - Nếu user có override trong user_gesture_mapping --> dùng custom_text
    - Nếu không --> dùng default_text trong gesture_dictionary
    - Nếu cũng không có --> fallback trả lại model_label
    """
    # 1. default trong gesture_dictionary
    d = (
        db.query(models.GestureDictionary)
        .filter(models.GestureDictionary.model_label == model_label)
        .first()
    )
    default_text = d.default_text if d else None

    # 2. override của user
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

    # 3. fallback
    if default_text:
        return default_text
    return model_label

def decode_base64_image(dataurl_or_b64: str) -> bytes:
    """
    Accept:
      - data:image/jpeg;base64,....
      - raw base64 string
    """
    if not dataurl_or_b64 or not isinstance(dataurl_or_b64, str):
        raise HTTPException(status_code=400, detail="image is empty")

    s = dataurl_or_b64.strip()

    # Nếu là dataURL: tách phần sau dấu phẩy
    if "," in s:
        s = s.split(",", 1)[1].strip()

    # Một số trường hợp FE gửi 'null' hoặc 'undefined'
    if s.lower() in ("null", "undefined"):
        raise HTTPException(status_code=400, detail=f"image is {s}")

    # Chuẩn hoá base64 web
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
                )
                db.add(new_log)
                db.commit()
            except Exception:
                db.rollback()

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

        # --- GHI LOG PREDICTION ---
        try:
            new_log = models.PredictionLog(
                user_id=current_user.id if current_user else None,
                gesture_label=label,
                predicted_text=effective_text,
                confidence=float(prob),
                has_hand=True,
                model_version=None,
                is_correct=None,
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


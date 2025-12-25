from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import base64

from ..db import get_db
from .. import models
from ..core.security import get_current_user
from ..ml.gesture_model import predict_image_bytes
from ..schemas.gesture import GesturePredictRequest, GesturePredictResponse

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


@router.post("/predict-base64", response_model=GesturePredictResponse)
def predict_base64(
    data: GesturePredictRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # data.image: "data:image/jpeg;base64,xxxx"
    try:
        header, encoded = data.image.split(",", 1)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chuỗi base64 không hợp lệ",
        )

    image_bytes = base64.b64decode(encoded)

    label, prob, has_hand = predict_image_bytes(image_bytes)

    if not has_hand:
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

    return GesturePredictResponse(
        gesture=label,
        confidence=prob,
        has_hand=True,
        text=effective_text,
    )


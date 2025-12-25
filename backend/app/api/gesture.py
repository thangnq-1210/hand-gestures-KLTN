# from fastapi import APIRouter, UploadFile, File
# from typing import Dict, List
# import base64
#
# from ..ml.gesture_model import predict_image_bytes, CLASS_NAMES
# from ..schemas.gesture import (
#     GestureResponse,
#     FrameBase64,
#     GestureClass,
#     GestureClassList,
# )
#
# router = APIRouter(
#     prefix="/gesture",
#     tags=["gesture"]
# )
#
# # Mapping lớp → câu nói (bạn sửa lại nội dung cho phù hợp)
# GESTURE_TEXTS: Dict[str, str] = {
#     "0": "Xin chào",
#     "1": "Tôi cần giúp đỡ",
#     "2": "Vâng",
#     "3": "Không",
#     "4": "Cảm ơn",
#     "5": "Tôi đang đau",
# }
#
#
# @router.get("/classes", response_model=GestureClassList)
# async def list_gesture_classes():
#     """
#     Trả về danh sách tất cả lớp cử chỉ + câu nói gợi ý.
#     """
#     classes: List[GestureClass] = []
#     for idx, name in enumerate(CLASS_NAMES):
#         speak_text = GESTURE_TEXTS.get(name)
#         classes.append(
#             GestureClass(index=idx, name=name, speak_text=speak_text)
#         )
#     return GestureClassList(classes=classes)
#
#
# @router.post("/predict-image", response_model=GestureResponse)
# async def predict_image(file: UploadFile = File(...)):
#     """
#     Nhận file ảnh (FormData) → trả nhãn cử chỉ + độ tự tin.
#     Dùng được khi upload ảnh tĩnh từ máy.
#     """
#     image_bytes = await file.read()
#     label, prob, has_hand = predict_image_bytes(image_bytes)
#     return GestureResponse(
#         gesture=label,
#         confidence=prob,
#         has_hand=has_hand,
#     )
#
#
# @router.post("/predict-base64", response_model=GestureResponse)
# async def predict_base64(data: FrameBase64):
#     """
#     Nhận ảnh base64 (từ canvas / webcam) → trả nhãn cử chỉ + độ tự tin.
#     Frontend: dùng video + canvas.toDataURL(...) rồi POST body { image_base64: dataURL }.
#     """
#     # data:image/jpeg;base64,xxxx...
#     header, encoded = data.image_base64.split(",", 1)
#     image_bytes = base64.b64decode(encoded)
#     # label, prob = predict_image_bytes(image_bytes)
#     # return GestureResponse(gesture=label, confidence=prob
#     label, prob, has_hand = predict_image_bytes(image_bytes)
#     return GestureResponse(
#         gesture=label,
#         confidence=prob,
#         has_hand=has_hand,
#     )

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..models import UserGestureMapping, GestureDictionary
from ..db import get_db
from .. import models
from ..schemas.gesture import (
    GestureMappingEffective,
    UpdateUserGestureMapping,
)
from ..core.security import get_current_user  # hàm bạn đã có trong security.py

router = APIRouter(prefix="/gestures", tags=["gestures"])


@router.get("/my-mapping", response_model=List[GestureMappingEffective])
def get_my_gesture_mapping(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Trả về danh sách cử chỉ cho user hiện tại:
    - default_text từ gesture_dictionary
    - custom_text nếu user có override
    - effective_text = custom_text hoặc default_text
    """
    dictionaries = (
        db.query(models.GestureDictionary)
        .filter(models.GestureDictionary.is_active == True)
        .all()
    )

    user_mappings = (
        db.query(models.UserGestureMapping)
        .filter(models.UserGestureMapping.user_id == current_user.id)
        .all()
    )
    mapping_by_label = {m.model_label: m for m in user_mappings}

    result: list[GestureMappingEffective] = []
    for d in dictionaries:
        m = mapping_by_label.get(d.model_label)
        custom = m.custom_text if m else None
        effective = custom or d.default_text

        result.append(
            GestureMappingEffective(
                model_label=d.model_label,
                default_text=d.default_text,
                custom_text=custom,
                effective_text=effective,
            )
        )

    # để frontend hiển thị theo thứ tự 0..5
    result.sort(key=lambda x: x.model_label)
    return result


@router.put("/my-mapping/{model_label}", response_model=GestureMappingEffective)
def upsert_my_gesture_mapping(
    model_label: str,
    data: UpdateUserGestureMapping,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Tạo hoặc cập nhật custom_text cho 1 label cụ thể
    """
    # đảm bảo label tồn tại trong từ điển
    d = (
        db.query(models.GestureDictionary)
        .filter(models.GestureDictionary.model_label == model_label)
        .first()
    )
    if not d:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cử chỉ không tồn tại trong từ điển",
        )

    m = (
        db.query(models.UserGestureMapping)
        .filter(
            models.UserGestureMapping.user_id == current_user.id,
            models.UserGestureMapping.model_label == model_label,
        )
        .first()
    )

    if m:
        m.custom_text = data.custom_text
    else:
        m = models.UserGestureMapping(
            user_id=current_user.id,
            model_label=model_label,
            custom_text=data.custom_text,
        )
        db.add(m)

    db.commit()
    db.refresh(m)

    return GestureMappingEffective(
        model_label=model_label,
        default_text=d.default_text,
        custom_text=m.custom_text,
        effective_text=m.custom_text or d.default_text,
    )


@router.delete("/my-mapping/{model_label}", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_gesture_mapping(
    model_label: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Xoá override, quay lại dùng default_text
    """
    m = (
        db.query(models.UserGestureMapping)
        .filter(
            models.UserGestureMapping.user_id == current_user.id,
            models.UserGestureMapping.model_label == model_label,
        )
        .first()
    )

    if not m:
        # không có gì để xoá → trả 204 luôn
        return

    db.delete(m)
    db.commit()


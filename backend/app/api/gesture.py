from fastapi import APIRouter, UploadFile, File
from typing import Dict, List
import base64

from ..ml.gesture_model import predict_image_bytes, CLASS_NAMES
from ..schemas.gesture import (
    GestureResponse,
    FrameBase64,
    GestureClass,
    GestureClassList,
)

router = APIRouter(
    prefix="/gesture",
    tags=["gesture"]
)

# Mapping lớp → câu nói (bạn sửa lại nội dung cho phù hợp)
GESTURE_TEXTS: Dict[str, str] = {
    "0": "Xin chào",
    "1": "Tôi cần giúp đỡ",
    "2": "Vâng",
    "3": "Không",
    "4": "Cảm ơn",
    "5": "Tôi đang đau",
}


@router.get("/classes", response_model=GestureClassList)
async def list_gesture_classes():
    """
    Trả về danh sách tất cả lớp cử chỉ + câu nói gợi ý.
    """
    classes: List[GestureClass] = []
    for idx, name in enumerate(CLASS_NAMES):
        speak_text = GESTURE_TEXTS.get(name)
        classes.append(
            GestureClass(index=idx, name=name, speak_text=speak_text)
        )
    return GestureClassList(classes=classes)


@router.post("/predict-image", response_model=GestureResponse)
async def predict_image(file: UploadFile = File(...)):
    """
    Nhận file ảnh (FormData) → trả nhãn cử chỉ + độ tự tin.
    Dùng được khi upload ảnh tĩnh từ máy.
    """
    image_bytes = await file.read()
    label, prob, has_hand = predict_image_bytes(image_bytes)
    return GestureResponse(
        gesture=label,
        confidence=prob,
        has_hand=has_hand,
    )


@router.post("/predict-base64", response_model=GestureResponse)
async def predict_base64(data: FrameBase64):
    """
    Nhận ảnh base64 (từ canvas / webcam) → trả nhãn cử chỉ + độ tự tin.
    Frontend: dùng video + canvas.toDataURL(...) rồi POST body { image_base64: dataURL }.
    """
    # data:image/jpeg;base64,xxxx...
    header, encoded = data.image_base64.split(",", 1)
    image_bytes = base64.b64decode(encoded)
    # label, prob = predict_image_bytes(image_bytes)
    # return GestureResponse(gesture=label, confidence=prob
    label, prob, has_hand = predict_image_bytes(image_bytes)
    return GestureResponse(
        gesture=label,
        confidence=prob,
        has_hand=has_hand,
    )
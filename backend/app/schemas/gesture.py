from pydantic import BaseModel
from typing import List, Optional


class FrameBase64(BaseModel):
    """Body gửi từ frontend khi dùng ảnh base64 (canvas / webcam)."""
    image_base64: str


class GestureResponse(BaseModel):
    """Response chung cho API dự đoán cử chỉ."""
    gesture: str
    confidence: float
    has_hand: bool = True


class GestureClass(BaseModel):
    """Thông tin 1 lớp cử chỉ."""
    index: int
    name: str
    speak_text: Optional[str] = None


class GestureClassList(BaseModel):
    """Danh sách tất cả lớp cử chỉ."""
    classes: List[GestureClass]
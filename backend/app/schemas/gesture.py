# from pydantic import BaseModel
# from typing import List, Optional
#
#
# class FrameBase64(BaseModel):
#     """Body gửi từ frontend khi dùng ảnh base64 (canvas / webcam)."""
#     image_base64: str
#
#
# class GestureResponse(BaseModel):
#     """Response chung cho API dự đoán cử chỉ."""
#     gesture: str
#     confidence: float
#     has_hand: bool = True
#
#
# class GestureClass(BaseModel):
#     """Thông tin 1 lớp cử chỉ."""
#     index: int
#     name: str
#     speak_text: Optional[str] = None
#
#
# class GestureClassList(BaseModel):
#     """Danh sách tất cả lớp cử chỉ."""
#     classes: List[GestureClass]
#

from pydantic import BaseModel
from typing import Optional


# ------------- Từ điển mặc định (admin dùng sau này) -------------
class GestureDictionaryBase(BaseModel):
    model_label: str      # "0", "1", ...
    default_text: str     # "Xin chào"
    description: Optional[str] = None
    is_active: bool = True


class GestureDictionaryOut(GestureDictionaryBase):
    id: int

    # Pydantic v2: dùng model_config, KHÔNG dùng class Config + orm_mode
    model_config = {
        "from_attributes": True
    }


# ------------- Mapping tuỳ chỉnh theo user -------------
class UserGestureMappingBase(BaseModel):
    model_label: str      # "0"
    custom_text: str      # "Chào bác sĩ"


class UserGestureMappingOut(UserGestureMappingBase):
    id: int

    model_config = {
        "from_attributes": True
    }


# ------------- View gộp cho frontend -------------
class GestureMappingEffective(BaseModel):
    model_label: str
    default_text: str
    custom_text: Optional[str] = None
    effective_text: str

    model_config = {
        "from_attributes": True
    }


class UpdateUserGestureMapping(BaseModel):
    custom_text: str


# ------------- Schema cho predict cử chỉ -------------
class GesturePredictRequest(BaseModel):
    # khớp với frontend: body { "image": "data:image/jpeg;base64,..." }
    image: str  # base64 image string


class GesturePredictResponse(BaseModel):
    gesture: str
    text: str
    confidence: float
    has_hand: bool

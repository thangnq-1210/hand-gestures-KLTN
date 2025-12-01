from pydantic import BaseModel


class CollectSampleBase64(BaseModel):
    """Body dùng để gửi 1 mẫu ảnh + nhãn về server."""
    user_id: str       # vd: "user01" (sau này có tài khoản thì dùng id thật)
    label: str         # vd: "0", "1", ... hoặc "hello"
    image_base64: str  # dataURL từ canvas/video.toDataURL(...)
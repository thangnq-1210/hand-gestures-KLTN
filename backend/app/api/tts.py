from fastapi import APIRouter
from pydantic import BaseModel
from gtts import gTTS
import io
from fastapi.responses import StreamingResponse

router = APIRouter(
    prefix="/tts",
    tags=["tts"]
)

class TTSRequest(BaseModel):
    text: str

@router.post("/vi")
async def tts_vi(data: TTSRequest):
    """
    Nhận text tiếng Việt -> trả về file mp3
    """
    if not data.text.strip():
        # trả file rỗng cũng được, tuỳ bạn
        buf = io.BytesIO()
        return StreamingResponse(buf, media_type="audio/mpeg")

    # Tạo TTS tiếng Việt
    tts = gTTS(text=data.text, lang="vi")
    buf = io.BytesIO()
    tts.write_to_fp(buf)
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="audio/mpeg",
        headers={
            "Content-Disposition": 'inline; filename="tts_vi.mp3"'
        }
    )

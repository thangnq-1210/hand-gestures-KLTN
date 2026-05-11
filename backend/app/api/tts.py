
from fastapi import APIRouter
from pydantic import BaseModel
from gtts import gTTS
import io
import unicodedata
from fastapi.responses import StreamingResponse

router = APIRouter(
    prefix="/tts",
    tags=["tts"]
)

class TTSRequest(BaseModel):
    text: str

@router.post("/vi")
async def tts_vi(data: TTSRequest):
    text = unicodedata.normalize("NFC", data.text or "")
    text = " ".join(text.split()).strip()

    if not text:
        buf = io.BytesIO()
        return StreamingResponse(buf, media_type="audio/mpeg")

    tts = gTTS(text=text, lang="vi", slow=False)
    buf = io.BytesIO()
    tts.write_to_fp(buf)
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="audio/mpeg",
        headers={
            "Content-Disposition": 'inline; filename="tts_vi.mp3"',
            "Cache-Control": "no-store",
        }
    )

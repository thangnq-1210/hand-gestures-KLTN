from fastapi import APIRouter
from pathlib import Path
from datetime import datetime
import base64

from ..schemas.collect import CollectSampleBase64

router = APIRouter(
    prefix="/collect",
    tags=["collect"]
)

DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "user_samples"
DATA_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/sample-base64")
async def collect_sample_base64(payload: CollectSampleBase64):
    """
    Lưu 1 mẫu ảnh (base64) + nhãn (label) + user_id vào thư mục data/user_samples.
    Sau này bạn zip cả thư mục này để đưa lên Kaggle train tiếp.
    """
    header, encoded = payload.image_base64.split(",", 1)
    image_bytes = base64.b64decode(encoded)

    # Thư mục: data/user_samples/<user_id>/<label>/
    user_dir = DATA_DIR / payload.user_id / payload.label
    user_dir.mkdir(parents=True, exist_ok=True)

    filename = datetime.now().strftime("%Y%m%d_%H%M%S_%f") + ".jpg"
    file_path = user_dir / filename

    with open(file_path, "wb") as f:
        f.write(image_bytes)

    return {
        "status": "ok",
        "saved_path": str(file_path.relative_to(DATA_DIR.parent)),
    }
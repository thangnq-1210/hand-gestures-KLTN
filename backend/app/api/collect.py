# from fastapi import APIRouter, HTTPException, Depends
# from fastapi.responses import FileResponse
# from sqlalchemy.orm import Session
# from datetime import datetime
# from pathlib import Path
# import base64
# import os
#
# from .. import models
# from ..db import get_db
# from ..schemas.collect import CollectSampleBase64
#
# router = APIRouter(prefix="/collect", tags=["collect"])
#
# DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "user_samples"
# DATA_DIR.mkdir(parents=True, exist_ok=True)
#
#
# @router.post("/sample-base64")
# async def collect_sample_base64(payload: CollectSampleBase64, db: Session = Depends(get_db)):
#     img = payload.image_base64
#     encoded = img.split(",", 1)[1] if "," in img else img
#
#     try:
#         image_bytes = base64.b64decode(encoded)
#     except Exception:
#         raise HTTPException(status_code=422, detail="image_base64 is invalid")
#
#     user_id = str(payload.user_id)
#     label = str(payload.label)
#
#     user_dir = DATA_DIR / user_id / label
#     user_dir.mkdir(parents=True, exist_ok=True)
#
#     filename = datetime.now().strftime("%Y%m%d_%H%M%S_%f") + ".jpg"
#     file_path = user_dir / filename
#
#     with open(file_path, "wb") as f:
#         f.write(image_bytes)
#
#     # Lưu DB: dùng as_posix() để không bị \ trên Windows
#     rel_path = file_path.relative_to(DATA_DIR.parent).as_posix()  # vd: user_samples/3/0/xxx.jpg
#
#     new_sample = models.GestureSample(
#         user_id=payload.user_id,
#         label=payload.label,
#         image_path=rel_path,
#         source="manual_collect",
#         created_at=datetime.now(),
#     )
#
#     db.add(new_sample)
#     db.commit()
#     db.refresh(new_sample)
#
#     return {
#         "status": "ok",
#         "id": new_sample.id,
#         "user_id": new_sample.user_id,
#         "label": new_sample.label,
#         "filename": filename,
#         "image_url": f"/collect/sample-file/{user_id}/{label}/{filename}",
#         "image_path": rel_path,
#         "created_at": new_sample.created_at.isoformat(),
#
#     }
#
#
# @router.get("/sample-file/{user_id}/{label}/{filename}")
# async def get_sample_file(user_id: str, label: str, filename: str):
#     file_path = DATA_DIR / user_id / label / filename
#     if not file_path.is_file():
#         raise HTTPException(status_code=404, detail="Not found")
#     return FileResponse(file_path)
#
#
# @router.get("/my-samples")
# async def my_samples(user_id: str, db: Session = Depends(get_db)):
#     # ép kiểu để query chuẩn (cột user_id là INT)
#     uid = int(user_id)
#
#     samples = (
#         db.query(models.GestureSample)
#         .filter(models.GestureSample.user_id == uid)
#         .order_by(models.GestureSample.created_at.desc())
#         .all()
#     )
#
#     out = []
#     for s in samples:
#         # lấy filename an toàn cho cả \ và /
#         filename = os.path.basename(str(s.image_path).replace("\\", "/"))
#         out.append(
#             {
#                 "id": s.id,
#                 "user_id": s.user_id,
#                 "label": str(s.label),
#                 "filename": filename,
#                 "image_url": f"/collect/sample-file/{s.user_id}/{s.label}/{filename}",
#                 "source": s.source,
#                 "created_at": s.created_at.isoformat() if s.created_at else None,
#             }
#         )
#     return out
#
#
# @router.delete("/sample-file/{user_id}/{label}/{filename}")
# async def delete_sample_file(user_id: str, label: str, filename: str, db: Session = Depends(get_db)):
#     file_path = DATA_DIR / user_id / label / filename
#     if not file_path.is_file():
#         raise HTTPException(status_code=404, detail="Not found")
#
#     file_path.unlink()
#
#     uid = int(user_id)
#
#     # Xoá DB theo filename (vì image_path có thể là user_samples/3/0/filename.jpg)
#     sample = (
#         db.query(models.GestureSample)
#         .filter(models.GestureSample.user_id == uid)
#         .filter(models.GestureSample.label == label)
#         .filter(models.GestureSample.image_path.like(f"%{filename}"))
#         .first()
#     )
#     if sample:
#         db.delete(sample)
#         db.commit()
#
#     return {"status": "ok"}

from __future__ import annotations

import base64
import os
from datetime import datetime
from pathlib import Path, PurePath

from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from .. import models
from ..db import get_db
from ..schemas.collect import CollectSampleBase64
from ..core.security import get_current_user
router = APIRouter(prefix="/collect", tags=["collect"])

# Lưu tại: backend/app/api/collect.py  -> parents[2] = backend/
# DATA_DIR = backend/data/user_samples
DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "user_samples"
DATA_DIR.mkdir(parents=True, exist_ok=True)


def _decode_base64_image(image_base64: str) -> bytes:
    """Decode base64 string (có thể kèm prefix data:image/...;base64,) thành bytes."""
    encoded = image_base64.split(",", 1)[1] if "," in image_base64 else image_base64
    try:
        return base64.b64decode(encoded)
    except Exception:
        raise HTTPException(status_code=422, detail="image_base64 is invalid")


def _safe_filename(filename: str) -> str:
    """
    Chỉ cho phép basename để tránh path traversal.
    Nếu user gửi 'user_samples/3/0/a.jpg' hoặc '../a.jpg' -> reject.
    """
    if PurePath(filename).name != filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    return filename


def _build_file_path(user_id: str, label: str, filename: str) -> Path:
    filename = _safe_filename(filename)
    return DATA_DIR / str(user_id) / str(label) / filename


@router.post("/sample-base64")
async def collect_sample_base64(payload: CollectSampleBase64, db: Session = Depends(get_db)):
    """
    Nhận ảnh base64 -> lưu vào disk -> lưu record DB.
    Trả về image_url để frontend mở trực tiếp.
    """
    image_bytes = _decode_base64_image(payload.image_base64)

    user_id = str(payload.user_id)
    label = str(payload.label)

    user_dir = DATA_DIR / user_id / label
    user_dir.mkdir(parents=True, exist_ok=True)

    filename = datetime.now().strftime("%Y%m%d_%H%M%S_%f") + ".jpg"
    file_path = user_dir / filename

    with open(file_path, "wb") as f:
        f.write(image_bytes)

    # Lưu đường dẫn relative để không bị \ trên Windows
    # DATA_DIR = .../data/user_samples
    # DATA_DIR.parent = .../data
    # -> rel_path: user_samples/<user_id>/<label>/<filename>
    rel_path = file_path.relative_to(DATA_DIR.parent).as_posix()

    new_sample = models.GestureSample(
        user_id=payload.user_id,
        label=payload.label,
        image_path=rel_path,
        source="manual_collect",
        created_at=datetime.now(),
    )

    db.add(new_sample)
    db.commit()
    db.refresh(new_sample)

    return {
        "status": "ok",
        "id": new_sample.id,
        "user_id": new_sample.user_id,
        "label": str(new_sample.label),
        "filename": filename,
        "image_url": f"/collect/sample-file/{user_id}/{label}/{filename}",
        "image_path": rel_path,
        "created_at": new_sample.created_at.isoformat(),
    }


@router.get("/sample-file/{user_id}/{label}/{filename}")
async def get_sample_file(user_id: str, label: str, filename: str):
    """
    Lấy file ảnh mẫu theo user_id/label/filename.
    LƯU Ý: filename chỉ là basename (vd: 20250101_123000_000001.jpg)
    """
    file_path = _build_file_path(user_id, label, filename)
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse(file_path)


@router.get("/my-samples")
async def my_samples(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    uid = int(current_user.id)

    samples = (
        db.query(models.GestureSample)
        .filter(models.GestureSample.user_id == uid)
        .order_by(models.GestureSample.created_at.desc())
        .all()
    )

    out = []
    for s in samples:
        filename = os.path.basename(str(s.image_path).replace("\\", "/"))
        out.append(
            {
                "id": s.id,
                "user_id": s.user_id,
                "label": str(s.label),
                "filename": filename,
                "image_url": f"/collect/sample-file/{s.user_id}/{s.label}/{filename}",
                "source": s.source,
                "created_at": s.created_at.isoformat() if s.created_at else None,
            }
        )
    return out


@router.delete("/sample-file/{user_id}/{label}/{filename}")
async def delete_sample_file(
    user_id: int,
    label: int,
    filename: str,
    db: Session = Depends(get_db),
):
    """
    Xoá file ảnh + record DB tương ứng (match theo user_id/label + filename suffix).
    """
    filename = _safe_filename(filename)
    file_path = _build_file_path(str(user_id), str(label), filename)

    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="Not found")

    # Xoá file trên disk
    file_path.unlink()

    # Xoá DB record (image_path có thể chứa folder)
    sample = (
        db.query(models.GestureSample)
        .filter(models.GestureSample.user_id == user_id)
        .filter(models.GestureSample.label == label)
        .filter(models.GestureSample.image_path.like(f"%{filename}"))
        .first()
    )

    if sample:
        db.delete(sample)
        db.commit()

    return {"status": "ok"}



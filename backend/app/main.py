from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from .core.config import setup_cors
from .db import engine, Base, get_db
from . import models

from .api.gesture import router as gesture_router
from .api.collect import router as collect_router
from .api.tts import router as tts_router
from .api.auth import router as auth_router

# Tạo bảng nếu chưa có (dựa trên các model đã import)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Hand Gesture API Documentation",
    version="1.0.0",
)

setup_cors(app)


@app.get("/")
def root():
    return {"message": "Gesture API is running"}


@app.get("/db-test")
def db_test(db: Session = Depends(get_db)):
    # test đơn giản SELECT 1
    result = db.execute(text("SELECT 1")).scalar()
    return {"db_ok": result == 1}


# gắn các router
app.include_router(auth_router)
app.include_router(gesture_router)
app.include_router(collect_router)
app.include_router(tts_router)

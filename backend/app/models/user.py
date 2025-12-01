from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Boolean,
)
from sqlalchemy.orm import relationship
from ..db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)

    password_hash = Column(String(255), nullable=False)

    name = Column(String(255), nullable=False)

    role = Column(String(20), nullable=False, default="user")

    preferred_language = Column(String(10), default="vi")
    avatar_url = Column(String(255))
    is_active = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    # Quan hệ tới các bảng khác (đảm bảo GestureSample & PredictionLog có back_populates="user")
    gesture_samples = relationship("GestureSample", back_populates="user", lazy="selectin")
    prediction_logs = relationship("PredictionLog", back_populates="user", lazy="selectin")



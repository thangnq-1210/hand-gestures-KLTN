from datetime import datetime
from sqlalchemy import (
    Column,
    BigInteger,
    Integer,
    String,
    Float,
    DateTime,
    Boolean,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from ..db import Base


class PredictionLog(Base):
    __tablename__ = "prediction_logs"

    id = Column(BigInteger, primary_key=True, autoincrement=True)

    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    gesture_label = Column(String(50), nullable=False)
    predicted_text = Column(String(255))
    confidence = Column(Float, nullable=False)
    has_hand = Column(Boolean, nullable=False, default=True)
    model_version = Column(String(50))
    is_correct = Column(Boolean)  # có thể null

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("User", back_populates="prediction_logs")

from datetime import datetime
from sqlalchemy import (
    Column,
    BigInteger,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from ..db import Base


class GestureSample(Base):
    __tablename__ = "gesture_samples"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    label = Column(String(50), nullable=False)
    image_path = Column(Text, nullable=False)
    source = Column(String(50), nullable=False, default="manual_collect")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    user = relationship("User", back_populates="gesture_samples")

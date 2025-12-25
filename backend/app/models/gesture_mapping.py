from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from ..db import Base


class GestureDictionary(Base):
    __tablename__ = "gesture_dictionary"

    id = Column(Integer, primary_key=True, autoincrement=True)
    model_label = Column(String(50), unique=True, index=True, nullable=False)
    default_text = Column(String(255), nullable=False)
    description = Column(String(255), nullable=True)
    is_active = Column(Integer, default=1)



class UserGestureMapping(Base):
    __tablename__ = "user_gesture_mapping"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    model_label = Column(String(50), nullable=False)  # ❌ KHÔNG FK
    custom_text = Column(String(255), nullable=False)

    user = relationship("User", back_populates="gesture_mappings")

    __table_args__ = (
        UniqueConstraint("user_id", "model_label", name="uq_user_label"),
    )

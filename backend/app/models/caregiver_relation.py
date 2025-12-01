from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
)
from ..db import Base


class CaregiverRelation(Base):
    __tablename__ = "caregiver_relations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    caregiver_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    relation_type = Column(String(50))
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

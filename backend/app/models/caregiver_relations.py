from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey, UniqueConstraint,
)
from sqlalchemy.orm import relationship

from ..db import Base


class CaregiverRelation(Base):
    __tablename__ = "caregiver_relations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    caregiver_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    relation_type = Column(String(50), nullable=True)

    caregiver = relationship("User", back_populates="caregiver_relations_as_caregiver", foreign_keys=[caregiver_id])
    patient = relationship("User", back_populates="caregiver_relations_as_patient", foreign_keys=[patient_id])

from pydantic import BaseModel, EmailStr
from typing import Optional, List

class CaregiverLinkByEmailIn(BaseModel):
    patient_email: EmailStr
    relation_type: Optional[str] = None

class PatientBasicOut(BaseModel):
    id: int
    email: str
    name: str
    role: str
    preferred_language: str = "vi"
    is_active: bool = True

    model_config = {"from_attributes": True}

class CaregiverRelationOut(BaseModel):
    id: int
    caregiver_id: int
    patient_id: int
    relation_type: Optional[str] = None
    patient: PatientBasicOut

    model_config = {"from_attributes": True}

class PatientProfileOut(BaseModel):
    id: int
    email: str
    name: str
    role: str
    preferred_language: str = "vi"
    avatar_url: Optional[str] = None
    is_active: bool = True
    created_at: Optional[str] = None

class PredictionHistoryItemOut(BaseModel):
    id: int
    gesture_label: str
    predicted_text: Optional[str] = None
    confidence: float
    has_hand: bool
    created_at: str

class CaregiverStatsOut(BaseModel):
    total_predictions: int
    most_used_gesture: str
    avg_confidence: float
    gesture_stats: list
    time_stats: list
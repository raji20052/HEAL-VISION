"""Doctor, Clinical Notes, and Review Schemas."""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class DoctorNoteCreate(BaseModel):
    wound_id: str
    wound_image_id: Optional[str] = None
    clinical_observation: str = Field(..., min_length=5)
    recommendations: Optional[str] = None
    follow_up_date: Optional[str] = None
    review_status: str = Field(default="reviewed")  # reviewed, follow_up_required, urgent_consult


class DoctorNoteResponse(BaseModel):
    id: str
    wound_id: str
    wound_image_id: Optional[str] = None
    doctor_id: str
    doctor_name: str
    clinical_observation: str
    recommendations: Optional[str] = None
    follow_up_date: Optional[str] = None
    review_status: str
    created_at: datetime

    class Config:
        from_attributes = True


class DoctorPatientListItem(BaseModel):
    patient_id: str
    patient_name: str
    patient_email: str
    patient_phone: Optional[str] = None
    wound_id: str
    wound_name: str
    wound_type: str
    body_location: str
    dressing_type: str
    latest_capture_date: Optional[str] = None
    latest_status: str = "healing_normally"
    latest_status_display: str = "Healing Normally"
    latest_area_cm2: float = 0.0
    area_reduction_pct: float = 0.0
    pending_review: bool = True
    last_doctor_note: Optional[str] = None
    last_doctor_review_date: Optional[datetime] = None

"""Wound Schemas."""

from typing import Optional, List, Any, Dict
from datetime import datetime
from pydantic import BaseModel, Field


class WoundBase(BaseModel):
    name: str = Field(..., min_length=2, example="Post-Op Abdominal Incision")
    wound_type: str = Field(..., example="surgical")  # surgical, pressure, traumatic, burn, ulcer, other
    body_location: str = Field(..., example="Lower Abdomen")
    first_observed_date: Optional[str] = None
    dressing_applied_date: Optional[str] = None
    dressing_type: str = Field(default="Chitosan Biopolymer Transparent Film")
    status: str = Field(default="active")  # active, healing, resolved, archived
    description: Optional[str] = None
    notes: Optional[str] = None


class WoundCreate(WoundBase):
    pass


class WoundUpdate(BaseModel):
    name: Optional[str] = None
    wound_type: Optional[str] = None
    body_location: Optional[str] = None
    dressing_applied_date: Optional[str] = None
    dressing_type: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None


class WoundSummary(WoundBase):
    id: str
    patient_id: str
    created_at: datetime
    updated_at: datetime
    image_count: int = 0
    latest_image_url: Optional[str] = None
    latest_status: Optional[str] = "healing_normally"
    latest_status_display: Optional[str] = "Healing Normally"
    latest_area_cm2: Optional[float] = 0.0
    area_reduction_pct: Optional[float] = 0.0
    days_in_monitoring: int = 1
    shared_with_doctor_count: int = 0

    class Config:
        from_attributes = True


class WoundDetailResponse(WoundBase):
    id: str
    patient_id: str
    created_at: datetime
    updated_at: datetime
    images: List[Any] = []
    doctor_notes: List[Any] = []
    patient_notes: List[Any] = []
    shared_records: List[Any] = []
    latest_analysis: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

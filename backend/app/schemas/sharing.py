"""Wound Sharing and Telemedicine Schemas."""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class ShareWoundRequest(BaseModel):
    wound_id: str
    doctor_email: Optional[str] = None
    doctor_id: Optional[str] = None
    permissions: str = "can_comment"  # read_only, can_comment
    expires_in_days: Optional[int] = 30


class SharedWoundResponse(BaseModel):
    id: str
    wound_id: str
    patient_id: str
    doctor_id: Optional[str] = None
    doctor_email: Optional[str] = None
    share_token: str
    permissions: str
    expires_at: Optional[datetime] = None
    is_revoked: bool
    created_at: datetime

    class Config:
        from_attributes = True

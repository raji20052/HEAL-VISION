"""Notification Schemas."""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class NotificationCreate(BaseModel):
    user_id: str
    title: str
    message: str
    type: str = "alert"  # reminder, alert, doctor_review, quality_warning, share_update
    related_wound_id: Optional[str] = None


class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    type: str
    is_read: bool
    related_wound_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

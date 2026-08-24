"""Image and Capture Schemas."""

from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel


class WoundImageCreate(BaseModel):
    wound_id: str
    capture_date: Optional[str] = None
    days_since_dressing: Optional[int] = 1
    notes: Optional[str] = None
    pain_score: Optional[int] = 0
    symptoms: Optional[list] = []


class WoundImageResponse(BaseModel):
    id: str
    wound_id: str
    image_url: str
    thumbnail_url: Optional[str] = None
    mask_url: Optional[str] = None
    overlay_url: Optional[str] = None
    heatmap_url: Optional[str] = None
    capture_date: str
    days_since_dressing: int
    notes: Optional[str] = None
    image_width: int
    image_height: int
    file_size_kb: float
    image_quality_score: float
    is_baseline: bool
    created_at: datetime
    ai_analysis: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

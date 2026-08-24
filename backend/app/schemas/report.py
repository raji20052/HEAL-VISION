"""Report and Clinical Summary Schemas."""

from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel


class ReportGenerateRequest(BaseModel):
    wound_id: str
    report_type: str = "longitudinal_progress"
    title: Optional[str] = "Wound Healing Monitoring Summary Report"


class ReportResponse(BaseModel):
    id: str
    wound_id: str
    patient_id: str
    doctor_id: Optional[str] = None
    report_type: str
    title: str
    summary_json: Dict[str, Any]
    html_content: Optional[str] = None
    generated_at: datetime

    class Config:
        from_attributes = True

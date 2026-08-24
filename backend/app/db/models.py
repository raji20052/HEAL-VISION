"""SQLAlchemy Relational Database Models for Smart Wound Healing Monitor."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON, Enum
)
from sqlalchemy.orm import relationship

from .session import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="patient")  # "patient", "doctor", "admin"
    phone = Column(String(50), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    patient_profile = relationship("PatientProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    doctor_profile = relationship("DoctorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    wounds = relationship("Wound", back_populates="patient", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")


class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    date_of_birth = Column(String(50), nullable=True)
    gender = Column(String(50), nullable=True)
    emergency_contact = Column(String(255), nullable=True)
    medical_history = Column(Text, nullable=True)

    user = relationship("User", back_populates="patient_profile")


class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    specialty = Column(String(255), default="Wound Care Specialist")
    license_number = Column(String(100), nullable=True)
    hospital_clinic = Column(String(255), default="Center for Advanced Wound Healing")
    contact_phone = Column(String(50), nullable=True)

    user = relationship("User", back_populates="doctor_profile")


class Wound(Base):
    __tablename__ = "wounds"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    patient_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    wound_type = Column(String(100), nullable=False)  # "surgical", "pressure", "traumatic", "burn", "ulcer", "other"
    body_location = Column(String(255), nullable=False)
    first_observed_date = Column(String(50), nullable=True)
    dressing_applied_date = Column(String(50), nullable=True)
    dressing_type = Column(String(150), default="Chitosan Biopolymer Transparent Film")
    status = Column(String(50), default="active")  # "active", "healing", "resolved", "archived"
    description = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    patient = relationship("User", back_populates="wounds")
    images = relationship("WoundImage", back_populates="wound", cascade="all, delete-orphan", order_by="WoundImage.capture_date")
    measurements = relationship("WoundMeasurement", back_populates="wound", cascade="all, delete-orphan")
    shared_records = relationship("SharedWound", back_populates="wound", cascade="all, delete-orphan")
    doctor_notes = relationship("DoctorNote", back_populates="wound", cascade="all, delete-orphan")
    patient_notes = relationship("PatientNote", back_populates="wound", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="wound", cascade="all, delete-orphan")


class WoundImage(Base):
    __tablename__ = "wound_images"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    wound_id = Column(String(36), ForeignKey("wounds.id", ondelete="CASCADE"), nullable=False, index=True)
    image_url = Column(String(500), nullable=False)
    thumbnail_url = Column(String(500), nullable=True)
    mask_url = Column(String(500), nullable=True)
    overlay_url = Column(String(500), nullable=True)
    heatmap_url = Column(String(500), nullable=True)
    capture_date = Column(String(50), nullable=False)
    days_since_dressing = Column(Integer, default=1)
    notes = Column(Text, nullable=True)
    image_width = Column(Integer, default=800)
    image_height = Column(Integer, default=600)
    file_size_kb = Column(Float, default=0.0)
    image_quality_score = Column(Float, default=95.0)
    is_baseline = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    wound = relationship("Wound", back_populates="images")
    ai_analysis = relationship("AIAnalysis", back_populates="wound_image", uselist=False, cascade="all, delete-orphan")
    doctor_notes = relationship("DoctorNote", back_populates="wound_image")
    patient_notes = relationship("PatientNote", back_populates="wound_image")


class AIAnalysis(Base):
    __tablename__ = "ai_analyses"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    wound_image_id = Column(String(36), ForeignKey("wound_images.id", ondelete="CASCADE"), unique=True, nullable=False)
    wound_id = Column(String(36), ForeignKey("wounds.id", ondelete="CASCADE"), nullable=False, index=True)
    model_version = Column(String(100), default="v1.2.0-biopolymer-cv-research")
    image_quality_status = Column(String(50), default="PASS")  # "PASS", "WARNING", "FAIL"
    quality_metrics_json = Column(JSON, default=dict)
    wound_area_px = Column(Integer, default=0)
    estimated_area_cm2 = Column(Float, default=0.0)
    calibration_factor = Column(Float, nullable=True)
    color_granulation_pct = Column(Float, default=0.0)
    color_slough_pct = Column(Float, default=0.0)
    color_necrotic_pct = Column(Float, default=0.0)
    color_pale_pct = Column(Float, default=0.0)
    exudate_level = Column(String(50), default="None")  # "None", "Low", "Moderate", "High"
    exudate_area_pct = Column(Float, default=0.0)
    perimeter_px = Column(Float, default=0.0)
    tissue_classification = Column(String(150), default="Granulation")
    change_from_previous_json = Column(JSON, default=dict)
    healing_trend = Column(String(50), default="improving")  # "improving", "stable", "worsening", "undetermined"
    monitoring_status = Column(String(50), default="healing_normally")  # "healing_normally", "needs_monitoring", "possible_abnormal_change", "insufficient_quality"
    confidence_score = Column(Float, default=0.9)
    limitations_json = Column(JSON, default=list)
    observations_json = Column(JSON, default=list)
    disclaimer = Column(Text, default="AI assessment is an experimental decision-support indicator, not a definitive medical diagnosis.")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    wound_image = relationship("WoundImage", back_populates="ai_analysis")


class WoundMeasurement(Base):
    __tablename__ = "wound_measurements"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    wound_id = Column(String(36), ForeignKey("wounds.id", ondelete="CASCADE"), nullable=False, index=True)
    wound_image_id = Column(String(36), ForeignKey("wound_images.id", ondelete="SET NULL"), nullable=True)
    length_mm = Column(Float, default=0.0)
    width_mm = Column(Float, default=0.0)
    depth_mm = Column(Float, default=0.0)
    area_cm2 = Column(Float, default=0.0)
    recorded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    wound = relationship("Wound", back_populates="measurements")


class DoctorPatientRelationship(Base):
    __tablename__ = "doctor_patient_relationships"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    doctor_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    patient_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), default="active")  # "active", "pending", "terminated"
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class SharedWound(Base):
    __tablename__ = "shared_wounds"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    wound_id = Column(String(36), ForeignKey("wounds.id", ondelete="CASCADE"), nullable=False, index=True)
    patient_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    doctor_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    doctor_email = Column(String(255), nullable=True)
    share_token = Column(String(100), unique=True, index=True, default=generate_uuid)
    permissions = Column(String(50), default="can_comment")  # "read_only", "can_comment"
    expires_at = Column(DateTime, nullable=True)
    is_revoked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    wound = relationship("Wound", back_populates="shared_records")


class DoctorNote(Base):
    __tablename__ = "doctor_notes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    wound_id = Column(String(36), ForeignKey("wounds.id", ondelete="CASCADE"), nullable=False, index=True)
    wound_image_id = Column(String(36), ForeignKey("wound_images.id", ondelete="SET NULL"), nullable=True)
    doctor_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    doctor_name = Column(String(255), default="Dr. Specialist")
    clinical_observation = Column(Text, nullable=False)
    recommendations = Column(Text, nullable=True)
    follow_up_date = Column(String(50), nullable=True)
    review_status = Column(String(50), default="reviewed")  # "reviewed", "follow_up_required", "urgent_consult"
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    wound = relationship("Wound", back_populates="doctor_notes")
    wound_image = relationship("WoundImage", back_populates="doctor_notes")


class PatientNote(Base):
    __tablename__ = "patient_notes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    wound_id = Column(String(36), ForeignKey("wounds.id", ondelete="CASCADE"), nullable=False, index=True)
    wound_image_id = Column(String(36), ForeignKey("wound_images.id", ondelete="SET NULL"), nullable=True)
    patient_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    pain_score = Column(Integer, default=0)  # 0 to 10 scale
    symptoms_json = Column(JSON, default=list)  # ["itching", "warmth", "redness", "odor", "swelling"]
    note_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    wound = relationship("Wound", back_populates="patient_notes")
    wound_image = relationship("WoundImage", back_populates="patient_notes")


class Report(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    wound_id = Column(String(36), ForeignKey("wounds.id", ondelete="CASCADE"), nullable=False, index=True)
    patient_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    report_type = Column(String(50), default="longitudinal_progress")
    title = Column(String(255), default="Wound Healing Monitoring Summary Report")
    summary_json = Column(JSON, default=dict)
    html_content = Column(Text, nullable=True)
    generated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    wound = relationship("Wound", back_populates="reports")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="alert")  # "reminder", "alert", "doctor_review", "quality_warning", "share_update"
    is_read = Column(Boolean, default=False)
    related_wound_id = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="notifications")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False)  # "IMAGE_UPLOAD", "AI_ANALYSIS_EXECUTED", "SHARED_WITH_DOCTOR", "DOCTOR_REVIEW"
    resource_type = Column(String(100), nullable=True)
    resource_id = Column(String(36), nullable=True)
    details_json = Column(JSON, default=dict)
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="audit_logs")

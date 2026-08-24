"""Doctor Clinical Workspace and Telemedicine Review Endpoints."""

from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ....core.security import get_current_user, require_role
from ....db.session import get_db
from ....db.models import User, Wound, WoundImage, AIAnalysis, SharedWound, DoctorNote, Notification, AuditLog
from ....schemas.doctor import DoctorNoteCreate, DoctorNoteResponse, DoctorPatientListItem

router = APIRouter()


@router.get("/dashboard-stats")
def get_doctor_dashboard_stats(
    current_user: User = Depends(require_role(["doctor", "admin"])),
    db: Session = Depends(get_db)
):
    """Calculates summary KPIs for the doctor's clinical dashboard."""
    # Find all shared wounds
    shared_wound_records = db.query(SharedWound).filter(
        (SharedWound.doctor_id == current_user.id) | (SharedWound.doctor_email == current_user.email),
        SharedWound.is_revoked == False
    ).all()
    
    wound_ids = [sr.wound_id for sr in shared_wound_records]
    wounds = db.query(Wound).filter(Wound.id.in_(wound_ids)).all() if wound_ids else []
    
    unique_patient_ids = set(w.patient_id for w in wounds)
    
    total_patients = len(unique_patient_ids)
    active_cases = len([w for w in wounds if w.status == "active"])
    
    abnormal_count = 0
    monitoring_count = 0
    pending_reviews = 0
    
    for w in wounds:
        last_img = db.query(WoundImage).filter(WoundImage.wound_id == w.id).order_by(WoundImage.capture_date.desc()).first()
        if last_img and last_img.ai_analysis:
            status_val = last_img.ai_analysis.monitoring_status
            if status_val == "possible_abnormal_change":
                abnormal_count += 1
            elif status_val == "needs_monitoring":
                monitoring_count += 1
                
        # Check if doctor has reviewed the latest image
        has_note = db.query(DoctorNote).filter(
            DoctorNote.wound_id == w.id,
            DoctorNote.doctor_id == current_user.id
        ).first()
        if not has_note:
            pending_reviews += 1

    return {
        "total_assigned_patients": total_patients,
        "total_active_wounds": active_cases,
        "cases_possible_abnormal": abnormal_count,
        "cases_needs_monitoring": monitoring_count,
        "pending_clinical_reviews": pending_reviews
    }


@router.get("/patients", response_model=List[DoctorPatientListItem])
def list_doctor_patients(
    filter_status: Optional[str] = None,
    current_user: User = Depends(require_role(["doctor", "admin"])),
    db: Session = Depends(get_db)
):
    """Lists all shared patient cases with clinical triage indicators."""
    shared_wound_records = db.query(SharedWound).filter(
        (SharedWound.doctor_id == current_user.id) | (SharedWound.doctor_email == current_user.email),
        SharedWound.is_revoked == False
    ).all()

    wound_ids = [sr.wound_id for sr in shared_wound_records]
    if not wound_ids:
        return []

    wounds = db.query(Wound).filter(Wound.id.in_(wound_ids)).order_by(Wound.updated_at.desc()).all()
    results = []

    for w in wounds:
        patient = db.query(User).filter(User.id == w.patient_id).first()
        images = db.query(WoundImage).filter(WoundImage.wound_id == w.id).order_by(WoundImage.capture_date.asc()).all()
        
        latest_img = images[-1] if images else None
        first_img = images[0] if images else None
        
        latest_analysis = latest_img.ai_analysis if latest_img else None
        first_analysis = first_img.ai_analysis if first_img else None

        status_val = latest_analysis.monitoring_status if latest_analysis else "healing_normally"
        if filter_status and status_val != filter_status:
            continue

        status_display_map = {
            "healing_normally": "Healing Normally",
            "needs_monitoring": "Needs Monitoring",
            "possible_abnormal_change": "Possible Abnormal Change",
            "insufficient_quality": "Insufficient Image Quality"
        }
        status_disp = status_display_map.get(status_val, "Healing Normally")

        latest_area = latest_analysis.estimated_area_cm2 if latest_analysis else 0.0
        first_area = first_analysis.estimated_area_cm2 if first_analysis else latest_area
        
        reduction_pct = 0.0
        if first_area > 0 and latest_area > 0:
            reduction_pct = round(((first_area - latest_area) / first_area) * 100, 1)

        last_doctor_note = db.query(DoctorNote).filter(
            DoctorNote.wound_id == w.id,
            DoctorNote.doctor_id == current_user.id
        ).order_by(DoctorNote.created_at.desc()).first()

        results.append(DoctorPatientListItem(
            patient_id=w.patient_id,
            patient_name=patient.full_name if patient else "Unknown Patient",
            patient_email=patient.email if patient else "",
            patient_phone=patient.phone if patient else None,
            wound_id=w.id,
            wound_name=w.name,
            wound_type=w.wound_type,
            body_location=w.body_location,
            dressing_type=w.dressing_type,
            latest_capture_date=latest_img.capture_date if latest_img else None,
            latest_status=status_val,
            latest_status_display=status_disp,
            latest_area_cm2=latest_area,
            area_reduction_pct=reduction_pct,
            pending_review=(last_doctor_note is None),
            last_doctor_note=last_doctor_note.clinical_observation if last_doctor_note else None,
            last_doctor_review_date=last_doctor_note.created_at if last_doctor_note else None
        ))

    return results


@router.post("/notes", response_model=DoctorNoteResponse, status_code=status.HTTP_201_CREATED)
def add_clinical_note(
    note_in: DoctorNoteCreate,
    current_user: User = Depends(require_role(["doctor", "admin"])),
    db: Session = Depends(get_db)
):
    """Submits a doctor's clinical observation and recommendations for a patient's wound."""
    wound = db.query(Wound).filter(Wound.id == note_in.wound_id).first()
    if not wound:
        raise HTTPException(status_code=404, detail="Wound not found.")

    doc_note = DoctorNote(
        wound_id=note_in.wound_id,
        wound_image_id=note_in.wound_image_id,
        doctor_id=current_user.id,
        doctor_name=current_user.full_name,
        clinical_observation=note_in.clinical_observation,
        recommendations=note_in.recommendations,
        follow_up_date=note_in.follow_up_date,
        review_status=note_in.review_status or "reviewed"
    )
    db.add(doc_note)

    # Notify patient of doctor review
    notif = Notification(
        user_id=wound.patient_id,
        title=f"Clinical Review: {current_user.full_name}",
        message=f"Dr. {current_user.full_name} reviewed '{wound.name}'. Status: {doc_note.review_status.replace('_', ' ').title()}.",
        type="doctor_review",
        related_wound_id=wound.id
    )
    db.add(notif)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="DOCTOR_CLINICAL_REVIEW_SUBMITTED",
        resource_type="wound",
        resource_id=wound.id,
        details_json={"review_status": doc_note.review_status}
    )
    db.add(audit)

    db.commit()
    db.refresh(doc_note)

    return doc_note

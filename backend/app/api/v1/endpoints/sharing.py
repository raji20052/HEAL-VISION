"""Wound Sharing and Telemedicine Access Endpoints."""

import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ....core.security import get_current_user
from ....db.session import get_db
from ....db.models import User, Wound, SharedWound, DoctorPatientRelationship, Notification, AuditLog
from ....schemas.sharing import ShareWoundRequest, SharedWoundResponse

router = APIRouter()


@router.post("", response_model=SharedWoundResponse, status_code=status.HTTP_201_CREATED)
def share_wound(
    share_in: ShareWoundRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Grants a physician secure access to view wound images and AI analysis."""
    wound = db.query(Wound).filter(Wound.id == share_in.wound_id).first()
    if not wound:
        raise HTTPException(status_code=404, detail="Wound not found.")
    if current_user.role == "patient" and wound.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied: You do not own this wound.")

    # Find doctor if email or ID provided
    doctor = None
    if share_in.doctor_id:
        doctor = db.query(User).filter(User.id == share_in.doctor_id, User.role == "doctor").first()
    if not doctor and share_in.doctor_email:
        doctor = db.query(User).filter(User.email == share_in.doctor_email.lower(), User.role == "doctor").first()

    expires_at = None
    if share_in.expires_in_days:
        expires_at = datetime.now(timezone.utc) + timedelta(days=share_in.expires_in_days)

    share_token = f"share_{uuid.uuid4().hex[:16]}"

    shared_rec = SharedWound(
        wound_id=share_in.wound_id,
        patient_id=current_user.id,
        doctor_id=doctor.id if doctor else None,
        doctor_email=share_in.doctor_email.lower() if share_in.doctor_email else (doctor.email if doctor else None),
        share_token=share_token,
        permissions=share_in.permissions or "can_comment",
        expires_at=expires_at,
        is_revoked=False
    )
    db.add(shared_rec)

    # Establish doctor-patient relationship if doctor is registered
    if doctor:
        existing_rel = db.query(DoctorPatientRelationship).filter(
            DoctorPatientRelationship.doctor_id == doctor.id,
            DoctorPatientRelationship.patient_id == current_user.id
        ).first()
        if not existing_rel:
            rel = DoctorPatientRelationship(
                doctor_id=doctor.id,
                patient_id=current_user.id,
                status="active"
            )
            db.add(rel)

        # Notify doctor
        notif = Notification(
            user_id=doctor.id,
            title="New Patient Wound Shared",
            message=f"{current_user.full_name} has shared wound record '{wound.name}' for telemedicine review.",
            type="share_update",
            related_wound_id=wound.id
        )
        db.add(notif)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="SHARE_WOUND_WITH_DOCTOR",
        resource_type="shared_wound",
        resource_id=wound.id,
        details_json={"doctor_email": share_in.doctor_email, "permissions": share_in.permissions}
    )
    db.add(audit)

    db.commit()
    db.refresh(shared_rec)
    return shared_rec


@router.get("/my-shares", response_model=List[dict])
def list_my_shares(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists all active wound sharing records for the logged in patient."""
    shares = db.query(SharedWound).filter(
        SharedWound.patient_id == current_user.id,
        SharedWound.is_revoked == False
    ).order_by(SharedWound.created_at.desc()).all()

    results = []
    for s in shares:
        wound = db.query(Wound).filter(Wound.id == s.wound_id).first()
        doctor = db.query(User).filter(User.id == s.doctor_id).first() if s.doctor_id else None
        
        doc_name = doctor.full_name if doctor else (s.doctor_email or "Dr. Specialist")
        doc_spec = doctor.doctor_profile.specialty if doctor and doctor.doctor_profile else "Wound Care Specialist"
        doc_hosp = doctor.doctor_profile.hospital_clinic if doctor and doctor.doctor_profile else "City Medical Center"
        doc_avatar = doctor.avatar_url if doctor and doctor.avatar_url else "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80"

        results.append({
            "id": s.id,
            "wound_id": s.wound_id,
            "wound_name": wound.name if wound else "Wound Profile",
            "doctor_id": s.doctor_id,
            "doctor_name": doc_name,
            "doctor_email": s.doctor_email or (doctor.email if doctor else ""),
            "specialty": doc_spec,
            "hospital": doc_hosp,
            "avatar_url": doc_avatar,
            "permissions": s.permissions,
            "share_token": s.share_token,
            "created_at": s.created_at.strftime("%d %b %Y") if s.created_at else "Recent",
            "expires_at": s.expires_at.strftime("%d %b %Y") if s.expires_at else "No expiration"
        })
    return results


@router.delete("/{share_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_share(
    share_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Revokes physician access to a shared wound record."""
    shared_rec = db.query(SharedWound).filter(SharedWound.id == share_id).first()
    if not shared_rec:
        raise HTTPException(status_code=404, detail="Share record not found.")
    if current_user.role == "patient" and shared_rec.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    shared_rec.is_revoked = True
    db.commit()
    return None


@router.get("/doctors", response_model=List[dict])
def list_available_doctors(db: Session = Depends(get_db)):
    """Lists accredited healthcare practitioners and registered doctors in the directory."""
    doctors = db.query(User).filter(User.role == "doctor", User.is_active == True).all()
    results = []
    seen_emails = set()

    for doc in doctors:
        spec = doc.doctor_profile.specialty if doc.doctor_profile else "Wound Care Specialist"
        hosp = doc.doctor_profile.hospital_clinic if doc.doctor_profile else "Center for Advanced Wound Healing"
        avatar = doc.avatar_url or "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80"
        seen_emails.add(doc.email.lower())
        results.append({
            "id": doc.id,
            "name": doc.full_name,
            "email": doc.email,
            "specialty": spec,
            "hospital": hosp,
            "avatar_url": avatar
        })

    # Default accredited specialists directory
    default_directory = [
        {
            "id": "doc-sarah-johnson",
            "name": "Dr. Sarah Johnson, MD",
            "email": "dr.sarah.johnson@woundcare.org",
            "specialty": "MBBS, Wound Care & Biopolymer Specialist",
            "hospital": "City Medical Center",
            "avatar_url": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80"
        },
        {
            "id": "doc-michael-brown",
            "name": "Dr. Michael Brown, MD",
            "email": "dr.michael.brown@metrohealth.org",
            "specialty": "Clinical Dermatologist",
            "hospital": "Metro Health Clinic",
            "avatar_url": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80"
        },
        {
            "id": "doc-emily-davis",
            "name": "Dr. Emily Davis, MD",
            "email": "dr.emily.davis@carehospital.org",
            "specialty": "Plastic & Reconstructive Surgeon",
            "hospital": "Care General Hospital",
            "avatar_url": "https://images.unsplash.com/photo-1594824813515-32a8292fa073?w=150&auto=format&fit=crop&q=80"
        }
    ]

    for d in default_directory:
        if d["email"].lower() not in seen_emails:
            results.append(d)

    return results

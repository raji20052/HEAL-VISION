"""Authentication Endpoints."""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ....core.config import settings
from ....core.security import (
    verify_password, get_password_hash, create_access_token, get_current_user
)
from ....db.session import get_db
from ....db.models import User, PatientProfile, DoctorProfile, Notification
from ....schemas.auth import (
    UserCreate, UserLogin, TokenResponse, UserResponse, UserUpdate,
    ChangePasswordRequest, ForgotPasswordRequest, ResetPasswordRequest
)

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Registers a new patient or doctor account."""
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    user = User(
        email=user_in.email.lower(),
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role if user_in.role in ["patient", "doctor", "admin"] else "patient",
        phone=user_in.phone,
        avatar_url=user_in.avatar_url or f"https://api.dicebear.com/7.x/bottts/svg?seed={user_in.email}"
    )
    db.add(user)
    db.flush()

    if user.role == "doctor":
        doc_profile = DoctorProfile(
            user_id=user.id,
            specialty=user_in.specialty or "Wound Care Specialist",
            license_number=user_in.license_number or "MD-882193",
            hospital_clinic=user_in.hospital_clinic or "Center for Advanced Wound Healing",
            contact_phone=user_in.phone
        )
        db.add(doc_profile)
    else:
        pat_profile = PatientProfile(
            user_id=user.id,
            date_of_birth=user_in.date_of_birth or "1988-04-12",
            gender=user_in.gender or "Female",
            emergency_contact=user_in.emergency_contact
        )
        db.add(pat_profile)

    # Add welcome notification
    welcome_notif = Notification(
        user_id=user.id,
        title="Welcome to Smart Wound Healing Monitor",
        message="Your account is active. You can register your wound profile and capture images under biopolymer dressings.",
        type="alert"
    )
    db.add(welcome_notif)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id, role=user.role)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/login", response_model=TokenResponse)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """Logs in an existing user with Email or Mobile Number and returns JWT token."""
    identifier = (login_data.username_or_email_or_phone or login_data.email or "").strip().lower()
    
    if not identifier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide an email address or mobile number."
        )

    # Query matching email OR phone
    user = db.query(User).filter(
        (User.email == identifier) | (User.phone == identifier)
    ).first()

    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/mobile number or password."
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated."
        )

    token = create_access_token(subject=user.id, role=user.role)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Gets currently authenticated user details."""
    return current_user


@router.put("/me", response_model=UserResponse)
def update_me(update_data: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Updates user profile information in the database."""
    if update_data.full_name is not None:
        current_user.full_name = update_data.full_name
    if update_data.phone is not None:
        current_user.phone = update_data.phone
    if update_data.avatar_url is not None:
        current_user.avatar_url = update_data.avatar_url

    if current_user.role == "patient":
        if not current_user.patient_profile:
            current_user.patient_profile = PatientProfile(user_id=current_user.id)
            db.add(current_user.patient_profile)
        if update_data.gender is not None:
            current_user.patient_profile.gender = update_data.gender
        if update_data.date_of_birth is not None:
            current_user.patient_profile.date_of_birth = update_data.date_of_birth
        if update_data.emergency_contact is not None:
            current_user.patient_profile.emergency_contact = update_data.emergency_contact
    elif current_user.role == "doctor":
        if not current_user.doctor_profile:
            current_user.doctor_profile = DoctorProfile(user_id=current_user.id)
            db.add(current_user.doctor_profile)
        if update_data.hospital_clinic is not None:
            current_user.doctor_profile.hospital_clinic = update_data.hospital_clinic
        if update_data.specialty is not None:
            current_user.doctor_profile.specialty = update_data.specialty

    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/change-password")
def change_password(req: ChangePasswordRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Changes password for the currently logged-in user."""
    if not verify_password(req.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password does not match."
        )
    current_user.hashed_password = get_password_hash(req.new_password)
    db.commit()
    return {"message": "Password changed successfully."}


@router.post("/demo-login", response_model=TokenResponse)
def demo_login(role: str = "patient", db: Session = Depends(get_db)):
    """Convenience endpoint for demo login."""
    target_emails = ["demo.patient@example.com", "sarah.jenkins@healvision.demo"] if role == "patient" else ["demo.doctor@example.com", "dr.robert.chen@healvision.demo"]
    user = db.query(User).filter(User.email.in_(target_emails)).first()
    
    if not user:
        user = db.query(User).filter(User.role == role).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No demo account found for role '{role}'."
            )

    token = create_access_token(subject=user.id, role=user.role)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Simulates sending a password reset token."""
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user:
        return {"message": "If an account exists, a reset link has been dispatched."}
    return {
        "message": "Reset instructions sent to email.",
        "demo_reset_token": "DEMO-RESET-TOKEN-9942"
    }


@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Resets user password with token."""
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.hashed_password = get_password_hash(req.new_password)
    db.commit()
    return {"message": "Password updated successfully. You can now login."}

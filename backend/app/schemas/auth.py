"""Authentication and User Schemas."""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "patient"  # "patient", "doctor", "admin"
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    emergency_contact: Optional[str] = None
    specialty: Optional[str] = None
    license_number: Optional[str] = None
    hospital_clinic: Optional[str] = None


class UserLogin(BaseModel):
    username_or_email_or_phone: Optional[str] = None
    email: Optional[str] = None
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None
    emergency_contact: Optional[str] = None
    hospital_clinic: Optional[str] = None
    specialty: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    token: str
    new_password: str = Field(..., min_length=6)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class PatientProfileResponse(BaseModel):
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    emergency_contact: Optional[str] = None
    medical_history: Optional[str] = None

    class Config:
        from_attributes = True


class DoctorProfileResponse(BaseModel):
    specialty: Optional[str] = None
    license_number: Optional[str] = None
    hospital_clinic: Optional[str] = None
    contact_phone: Optional[str] = None

    class Config:
        from_attributes = True


class UserResponse(UserBase):
    id: str
    is_active: bool
    created_at: datetime
    patient_profile: Optional[PatientProfileResponse] = None
    doctor_profile: Optional[DoctorProfileResponse] = None

    class Config:
        from_attributes = True


TokenResponse.model_rebuild()

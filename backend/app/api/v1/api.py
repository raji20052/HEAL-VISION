"""API v1 Router Definition."""

from fastapi import APIRouter

from .endpoints import auth, wounds, images, ai, doctor, sharing, reports, notifications, demo

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(wounds.router, prefix="/wounds", tags=["Wounds"])
api_router.include_router(images.router, prefix="/images", tags=["Images"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI & Computer Vision"])
api_router.include_router(doctor.router, prefix="/doctor", tags=["Doctor Clinical Workspace"])
api_router.include_router(sharing.router, prefix="/sharing", tags=["Telemedicine & Sharing"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(demo.router, prefix="/demo", tags=["Demo Data"])

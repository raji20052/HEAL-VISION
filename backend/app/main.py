"""Smart Wound Healing Monitor - Unified FastAPI Application Server.

Serves both the REST API, AI inference engine, and the production React frontend
on the exact same host and port (http://localhost:8000).
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from .core.config import settings
from .db.session import engine, Base, SessionLocal
from .db.seed_demo import seed_demo_database
from .api.v1.api import api_router


# Locate frontend dist directory
FRONTEND_DIST_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
)
FRONTEND_ASSETS_DIR = os.path.join(FRONTEND_DIST_DIR, "assets")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure DB tables exist and storage folders are created
    os.makedirs(os.path.join(settings.STORAGE_DIR, "images"), exist_ok=True)
    os.makedirs(os.path.join(settings.STORAGE_DIR, "masks"), exist_ok=True)
    os.makedirs(os.path.join(settings.STORAGE_DIR, "overlays"), exist_ok=True)
    os.makedirs(os.path.join(settings.STORAGE_DIR, "heatmaps"), exist_ok=True)
    
    Base.metadata.create_all(bind=engine)
    
    # Auto seed demo data on fresh startup
    db = SessionLocal()
    try:
        seed_demo_database(db)
    except Exception as e:
        print(f"Demo seeding notice: {e}")
    finally:
        db.close()
        
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Computer Vision-Based Assessment of Biopolymer Wound Dressings for Infection and Healing Monitoring.",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount storage directory for visual masks, original images, overlays, and heatmaps
app.mount("/storage", StaticFiles(directory=settings.STORAGE_DIR), name="storage")

# Include API Router under /api/v1
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "environment": "unified-fullstack",
        "medical_disclaimer": "AI assessments are visual decision-support indicators, not a clinical diagnosis."
    }


# Mount frontend assets if compiled
if os.path.exists(FRONTEND_ASSETS_DIR):
    app.mount("/assets", StaticFiles(directory=FRONTEND_ASSETS_DIR), name="assets")


# SPA Catch-all Route: Serve React App index.html on all frontend routes
@app.get("/{full_path:path}", include_in_schema=False)
async def serve_spa_frontend(request: Request, full_path: str):
    # Allow API, docs, openapi, storage to pass through if unmatched
    if full_path.startswith(("api/", "storage/", "docs", "openapi.json", "redoc", "health")):
        return JSONResponse(status_code=404, content={"detail": f"Path '{full_path}' not found"})
    
    index_file = os.path.join(FRONTEND_DIST_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    
    return JSONResponse(
        status_code=200,
        content={
            "service": settings.PROJECT_NAME,
            "status": "Frontend not compiled yet. Run 'npm run build' in /frontend directory.",
            "api_docs": "/docs"
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)

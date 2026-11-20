import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.core.database import Base, engine
from backend.app.seed_data import seed_database
from backend.app.api import (
    auth, dashboard, seer, vuln, dispatch,
    shelters, citizen, replay, transparency, settings as sys_settings
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="KAVAL – AI-Powered Household-Level Flood Intelligence and Disaster Response System (CipherCop 2026)"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure database tables exist and are seeded
@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
    try:
        seed_database()
    except Exception as e:
        print(f"[Startup] Seeding notice: {e}")

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(seer.router, prefix=settings.API_V1_STR)
app.include_router(vuln.router, prefix=settings.API_V1_STR)
app.include_router(dispatch.router, prefix=settings.API_V1_STR)
app.include_router(shelters.router, prefix=settings.API_V1_STR)
app.include_router(citizen.router, prefix=settings.API_V1_STR)
app.include_router(replay.router, prefix=settings.API_V1_STR)
app.include_router(transparency.router, prefix=settings.API_V1_STR)
app.include_router(sys_settings.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "system": "KAVAL – AI Household-Level Flood Intelligence",
        "tagline": "Don't warn the city. Warn every doorstep.",
        "hackathon": "CipherCop 2026",
        "team": "The G.O.A.T.",
        "status": "online",
        "documentation": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "engines": ["SEER", "VULN", "DISPATCH"]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)

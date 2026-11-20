import os
from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "KAVAL – AI Flood Intelligence & Disaster Response"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Environment
    ENV: str = os.getenv("ENV", "development")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "kaval_super_secret_jwt_key_ciphercop_2026_goat_resilience")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    ALGORITHM: str = "HS256"
    
    # Database: Supports SQLite by default for instant zero-dependency execution,
    # or PostgreSQL / PostGIS if DATABASE_URL is set.
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./kaval.db")
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "*"
    ]
    
    # Pilot Cities
    DEFAULT_CITY: str = "Chennai"
    AVAILABLE_CITIES: List[str] = ["Chennai", "Mumbai", "Patna", "Cuttack"]
    
    # AI / LLM Configuration
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", None)
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", None)
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "mock")  # 'gemini', 'openai', or 'mock'
    
    # Open-Meteo
    OPEN_METEO_BASE_URL: str = "https://api.open-meteo.com/v1"
    
    # ML Model Path
    ML_MODEL_PATH: str = os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "models", "seer_lgbm_model.joblib")

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

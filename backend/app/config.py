import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
DEFAULT_DB_FILE = (ROOT_DIR / "duo_leads.db").as_posix()
RAW_DB_URL = os.getenv("DATABASE_URL", "")
if not RAW_DB_URL or RAW_DB_URL in ["sqlite:///./duo_leads.db", "sqlite:///duo_leads.db"]:
    RESOLVED_DB_URL = f"sqlite:///{DEFAULT_DB_FILE}"
else:
    RESOLVED_DB_URL = RAW_DB_URL

class Settings(BaseSettings):
    PROJECT_NAME: str = "DUO SYSTEMS LEAD FINDER"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    
    # Database
    DATABASE_URL: str = RESOLVED_DB_URL
    
    # Google Places API (New)
    GOOGLE_PLACES_API_KEY: str = os.getenv("GOOGLE_PLACES_API_KEY", "")
    
    # Google OAuth 2.0 & Sheets
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI: str = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/sheets/oauth-callback")
    
    # CORS & Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "duo-systems-super-secret-production-key-2026")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]
    
    # Safety Limits
    MAX_AREAS_PER_SEARCH: int = 15
    MAX_RESULTS_PER_SEARCH: int = 200
    MAX_PAGES_PER_SEARCH: int = 5
    
    # Mock / Demo fallback if no key provided
    ENABLE_DEMO_SIMULATION: bool = True
    
    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

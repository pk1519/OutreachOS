from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine, Base, ensure_schema_migrations
import app.models  # Ensure all models are registered with Base.metadata
from app.api.search_routes import router as search_router
from app.api.lead_routes import router as lead_router
from app.api.campaign_routes import router as campaign_router
from app.api.outreach_routes import router as outreach_router
from app.api.gmail_routes import router as gmail_router
from app.api.sheets_routes import router as sheets_router
from app.api.analytics_routes import router as analytics_router
from app.api.settings_routes import router as settings_router
from app.utils.logging import logger

# Create tables on startup
Base.metadata.create_all(bind=engine)
ensure_schema_migrations()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Duo Systems Lead Finder database schema...")
    Base.metadata.create_all(bind=engine)
    ensure_schema_migrations()
    logger.info("Duo Systems Lead Finder backend is ready.")
    yield
    logger.info("Shutting down Duo Systems Lead Finder backend.")

app = FastAPI(
    title="DUO SYSTEMS — LEAD FINDER & OUTREACH CENTER",
    version=settings.VERSION,
    description="Universal B2B Lead Discovery, Qualification, Management, Gmail Outreach, and CRM Platform",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(search_router, prefix=settings.API_V1_PREFIX)
app.include_router(lead_router, prefix=settings.API_V1_PREFIX)
app.include_router(campaign_router, prefix=settings.API_V1_PREFIX)
app.include_router(outreach_router, prefix=settings.API_V1_PREFIX)
app.include_router(gmail_router, prefix=settings.API_V1_PREFIX)
app.include_router(sheets_router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics_router, prefix=settings.API_V1_PREFIX)
app.include_router(settings_router, prefix=settings.API_V1_PREFIX)

@app.get("/")
def root():
    return {
        "brand": "DUO SYSTEMS",
        "app": "Duo Systems Lead Finder & Outreach Center",
        "status": "operational",
        "version": settings.VERSION,
        "docs_url": "/docs"
    }

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {"status": "healthy", "database": "connected", "service": "DUO SYSTEMS"}

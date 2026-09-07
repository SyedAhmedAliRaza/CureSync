"""CureSync Backend - FastAPI application entry point."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import chat, interactions, ocr, drugs, medications, auth, chat_sessions
from app.services.medication_service import medication_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown."""
    # Startup: initialize medication scheduler
    medication_service.start_scheduler()
    print("CureSync backend started. Medication scheduler active.")
    yield
    # Shutdown: stop scheduler
    medication_service.stop_scheduler()
    print("CureSync backend stopped.")


app = FastAPI(
    title="CureSync API",
    description="AI Medicine Interaction & Personalized Medication Assistant",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(auth.router, prefix="/api", tags=["Auth"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(chat_sessions.router, prefix="/api", tags=["Chat Sessions"])
app.include_router(interactions.router, prefix="/api", tags=["Interactions"])
app.include_router(ocr.router, prefix="/api", tags=["OCR"])
app.include_router(drugs.router, prefix="/api", tags=["Drugs"])
app.include_router(medications.router, prefix="/api", tags=["Medications"])


@app.get("/")
async def root():
    return {
        "app": "CureSync",
        "version": "0.1.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "dashscope_configured": settings.has_dashscope_key,
    }

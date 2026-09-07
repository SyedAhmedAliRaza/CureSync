"""CureSync Backend - Pydantic request/response schemas."""
from __future__ import annotations

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# ── Auth ────────────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)
    full_name: str = Field(default="")


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=1)


class UserProfile(BaseModel):
    id: str
    email: str
    full_name: str = ""


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str = ""
    user: UserProfile


class SignupResponse(BaseModel):
    message: str
    email_confirmation_required: bool = False


# ── Chat ────────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    history: list[ChatMessage] = Field(default_factory=list)
    session_id: Optional[str] = None
    language: str = "en"


class ChatResponse(BaseModel):
    reply: str
    history: list[ChatMessage]
    session_id: Optional[str] = None


class ChatSessionSummary(BaseModel):
    id: str
    created_at: str
    title: str = ""
    last_message: str = ""
    message_count: int = 0


# ── Drugs ───────────────────────────────────────────────────────────────────

class DrugInfo(BaseModel):
    id: str
    name: str
    category: str
    common_dosages: list[str]
    side_effects: list[str]
    interactions: dict
    warnings: list[str]
    brand_names: list[str] = []


# ── Interactions ────────────────────────────────────────────────────────────

class InteractionCheckRequest(BaseModel):
    medicines: list[str] = Field(..., min_length=2)
    language: str = "en"


class InteractionDetail(BaseModel):
    drug_a: str
    drug_b: str
    severity: str  # high | medium | low
    description: str
    recommendation: str = ""


class InteractionReport(BaseModel):
    interactions: list[InteractionDetail]
    summary: str
    emergency_alert: bool = False
    emergency_message: str = ""
    ai_analysis: str = ""


# ── OCR / Prescription Scanning ─────────────────────────────────────────────

class ExtractedMedicine(BaseModel):
    name: str
    dosage: str = ""
    frequency: str = ""
    confidence: str = ""


class OCRScanResponse(BaseModel):
    raw_text: str
    medicines: list[ExtractedMedicine]


# ── Medications / Schedule ──────────────────────────────────────────────────

class MedicationCreate(BaseModel):
    name: str = Field(..., min_length=1)
    dosage: str = ""
    frequency: str = ""
    times: list[str] = Field(default_factory=list)
    notes: str = ""


class MedicationUpdate(BaseModel):
    name: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    times: Optional[list[str]] = None
    notes: Optional[str] = None


class MedicationResponse(BaseModel):
    id: str
    name: str
    dosage: str
    frequency: str
    times: list[str]
    notes: str
    active: bool = True

"""CureSync Backend - Authentication router using Supabase Auth."""
from fastapi import APIRouter, HTTPException, Request

from app.models.schemas import SignupRequest, LoginRequest, AuthResponse, UserProfile, SignupResponse
from app.services.db_service import db_service

router = APIRouter()


@router.post("/auth/signup", response_model=SignupResponse)
async def signup(data: SignupRequest):
    """Create a new user account.

    The user is NOT logged in automatically -- they must sign in
    separately on the login page.
    """
    if not db_service.available:
        raise HTTPException(status_code=503, detail="Database not configured")
    try:
        result = db_service.signup(data.email, data.password, data.full_name)
        # A missing session on the fallback path means email confirmation
        # is required before the user can log in.
        email_confirmation_required = result.get("email_confirmation_required", False)
        if email_confirmation_required:
            message = "Account created. Please confirm your email address, then log in."
        else:
            message = "Account created successfully. Please log in to continue."
        return SignupResponse(
            message=message,
            email_confirmation_required=email_confirmation_required,
        )
    except Exception as e:
        error_msg = str(e)
        if "already registered" in error_msg.lower() or "duplicate" in error_msg.lower():
            raise HTTPException(status_code=409, detail="Email already registered")
        raise HTTPException(status_code=400, detail=error_msg)


@router.post("/auth/login", response_model=AuthResponse)
async def login(data: LoginRequest):
    """Sign in with email and password."""
    if not db_service.available:
        raise HTTPException(status_code=503, detail="Database not configured")
    try:
        result = db_service.login(data.email, data.password)
        return result
    except Exception as e:
        error_msg = str(e)
        if "invalid" in error_msg.lower():
            raise HTTPException(status_code=401, detail="Invalid email or password")
        raise HTTPException(status_code=400, detail=error_msg)


@router.post("/auth/logout")
async def logout(request: Request):
    """Sign out the current user."""
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
        db_service.logout(token)
    return {"message": "Logged out"}


@router.get("/auth/me", response_model=UserProfile)
async def get_me(request: Request):
    """Get the currently authenticated user's profile."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth_header[7:]
    user = db_service.get_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user


def get_current_user_id(request: Request) -> str:
    """Dependency / helper to extract the current user's ID from the auth token."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        # Fallback for unauthenticated access (MVP backward compatibility)
        return "00000000-0000-0000-0000-000000000000"
    token = auth_header[7:]
    user = db_service.get_user_from_token(token)
    if not user:
        return "00000000-0000-0000-0000-000000000000"
    return user["id"]

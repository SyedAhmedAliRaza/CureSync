"""CureSync Backend - Chat sessions router for conversation history."""
from fastapi import APIRouter, HTTPException, Request

from app.services.db_service import db_service
from app.routers.auth import get_current_user_id

router = APIRouter()


@router.get("/chat/sessions")
async def list_sessions(request: Request):
    """List all chat sessions for the authenticated user."""
    user_id = get_current_user_id(request)
    if not db_service.available:
        return []
    sessions = db_service.list_chat_sessions(user_id)
    return sessions


@router.get("/chat/sessions/{session_id}")
async def get_session(session_id: str, request: Request):
    """Get a chat session with all its messages."""
    if not db_service.available:
        raise HTTPException(status_code=503, detail="Database not configured")
    session = db_service.get_chat_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.delete("/chat/sessions/{session_id}")
async def delete_session(session_id: str, request: Request):
    """Delete a chat session and all its messages."""
    if not db_service.available:
        raise HTTPException(status_code=503, detail="Database not configured")
    success = db_service.delete_chat_session(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Session deleted"}

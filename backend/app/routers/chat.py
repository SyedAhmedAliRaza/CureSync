"""CureSync Backend - Chat router for AI health assistant."""
from fastapi import APIRouter, HTTPException, Request
from app.models.schemas import ChatRequest, ChatResponse, ChatMessage
from app.services.ai_service import ai_service
from app.routers.auth import get_current_user_id

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, req: Request):
    """
    Send a message to the AI health assistant and get a response.
    Includes conversation history for multi-turn dialogue.
    Persists to Supabase chat_sessions/chat_messages when available.
    """
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    reply = ai_service.health_chat(request.message, request.history, language=request.language)

    # Build updated history
    updated_history = list(request.history)
    updated_history.append(ChatMessage(role="user", content=request.message))
    updated_history.append(ChatMessage(role="assistant", content=reply))

    # Keep history manageable (last 20 messages)
    if len(updated_history) > 20:
        updated_history = updated_history[-20:]

    # Persist to Supabase if available
    session_id = request.session_id
    try:
        from app.services.db_service import db_service
        if db_service.available:
            user_id = get_current_user_id(req)
            # Create or reuse session
            if not session_id:
                session = db_service.create_chat_session(user_id)
                if session:
                    session_id = session["id"]
            if session_id:
                # Only save the new messages (not the full history)
                db_service.save_chat_message(session_id, "user", request.message)
                db_service.save_chat_message(session_id, "assistant", reply)
    except Exception as e:
        print(f"Failed to persist chat to DB: {e}")

    return ChatResponse(reply=reply, history=updated_history, session_id=session_id)

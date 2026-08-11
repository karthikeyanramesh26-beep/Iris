from fastapi import APIRouter
from models.schemas import SessionCreateRequest, SessionRenameRequest
import database

router = APIRouter()

@router.get("/api/sessions")
def get_sessions():
    return {"sessions": database.get_sessions()}

@router.post("/api/sessions")
def create_session(request: SessionCreateRequest):
    return database.create_session(request.sessionId, request.title, request.projectId)

@router.delete("/api/sessions")
def clear_all_sessions():
    database.clear_all_sessions()
    return {"status": "success", "message": "All conversations cleared"}

@router.delete("/api/sessions/{session_id}")
def delete_session(session_id: str):
    database.delete_session(session_id)
    return {"status": "success"}

@router.put("/api/sessions/{session_id}")
def rename_session(session_id: str, request: SessionRenameRequest):
    return database.rename_session(session_id, request.title)

@router.get("/api/history")
def get_history(sessionId: str):
    return {"messages": database.get_messages(sessionId)}

@router.delete("/api/history")
def delete_history(sessionId: str):
    database.delete_session(sessionId)
    return {"status": "success", "message": "History cleared"}

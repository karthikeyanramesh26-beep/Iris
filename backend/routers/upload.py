import os
import tempfile
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from services import ingest_service, rag_service

router = APIRouter()

@router.post("/api/upload")
async def upload_document(file: UploadFile = File(...), sessionId: str = Form(...), subject: str = Form("General")):
    try:
        suffix = os.path.splitext(file.filename)[1].lower() if file.filename else ".txt"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        ingest_service.ingest_file(tmp_path, file.filename, sessionId, subject)
        
        os.remove(tmp_path)
        
        return {"success": True, "message": f"Successfully ingested {file.filename}", "fileName": file.filename}
    except Exception as e:
        print(f"Error processing document: {e}")
        if 'tmp_path' in locals() and os.path.exists(tmp_path):
            os.remove(tmp_path)
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/api/documents")
def delete_document(sessionId: str, fileName: str):
    try:
        rag_service.delete_document_vectors(sessionId, fileName)
        return {"success": True, "message": f"Deleted {fileName}"}
    except Exception as e:
        print(f"Error deleting document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

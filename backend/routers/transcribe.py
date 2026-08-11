import os
import tempfile
from fastapi import APIRouter, UploadFile, File, HTTPException
from services import stt_service

router = APIRouter()

@router.post("/api/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    try:
        audio_bytes = await audio.read()
        suffix = os.path.splitext(audio.filename)[1].lower() if audio.filename else ".webm"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name
        
        text, lang_code = stt_service.transcribe_audio(tmp_path)
        
        translation = ""
        if lang_code and lang_code != "en" and text.strip():
            from services import llm_service
            translation = llm_service.translate_to_english(text)
        
        os.remove(tmp_path)
        
        return {
            "transcription": text, 
            "languageCode": lang_code,
            "translation": translation
        }
    except Exception as e:
        print(f"Error in transcription: {e}")
        raise HTTPException(status_code=500, detail="Transcription failed")

@router.post("/api/translate")
async def translate(request: dict):
    try:
        text = request.get("text", "")
        lang_code = request.get("languageCode", "en")
        translation = ""
        if lang_code != "en" and text.strip():
            from services import llm_service
            translation = llm_service.translate_to_english(text)
        return {"translation": translation}
    except Exception as e:
        print(f"Error in translation endpoint: {e}")
        raise HTTPException(status_code=500, detail="Translation failed")

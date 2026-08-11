from fastapi import APIRouter
from models.schemas import ChatTextRequest
from services import llm_service, rag_service, tts_service
import database

router = APIRouter()

@router.post("/api/chat-text")
def chat_text(request: ChatTextRequest):
    try:
        # RAG Retrieval
        retriever = rag_service.get_retriever(request.sessionId)
        relevant_docs = retriever.invoke(request.queryText)
        
        context_text = "\n\n".join([doc.page_content for doc in relevant_docs])
        
        # Deduplicate citations
        seen_files = set()
        citations = []
        for doc in relevant_docs:
            fname = doc.metadata.get("fileName", "Unknown")
            if fname not in seen_files:
                citations.append({
                    "fileName": fname,
                    "snippet": doc.page_content[:100] + "..."
                })
                seen_files.add(fname)
            
        # Build prompt
        language_map = {
            "en": "English",
            "hi": "Hindi",
            "ta": "Tamil",
            "te": "Telugu",
            "kn": "Kannada",
            "or": "Odia",
            "mr": "Marathi",
            "ml": "Malayalam",
            "bn": "Bengali"
        }
        lang_name = language_map.get(request.languageCode, "English")
        lang_instruction = f" Please provide your response in {lang_name}."
            
        if relevant_docs:
            prompt = f"Context information is below.\n---------------------\n{context_text}\n---------------------\nGiven the context information and not prior knowledge, answer the following question concisely: {request.queryText}{lang_instruction}"
        else:
            prompt = f"Answer the following question concisely: {request.queryText}{lang_instruction}"
            
        # Generate Text Response
        response_text = llm_service.generate_chat_response(prompt)
        
        # Generate TTS
        try:
            if getattr(request, 'voiceEnabled', True):
                audio_filename = tts_service.generate_tts(response_text, request.languageCode)
                audio_url = f"http://localhost:5002/static/audio/{audio_filename}"
            else:
                audio_url = None
        except Exception as tts_e:
            print(f"TTS Error: {tts_e}")
            audio_url = None
            
    except Exception as e:
        print(f"Hugging Face / RAG API Error: {e}")
        response_text = "I encountered an error while processing your request."
        citations = []
        audio_url = None
    
    # Store in history
    parent_id = request.parentId
    if parent_id is None:
        parent_id = database.get_last_message_id(request.sessionId)
        
    user_msg_id = database.add_message(request.sessionId, "user", request.queryText, "text", parent_id=parent_id)
    model_msg_id = database.add_message(request.sessionId, "model", response_text, "text", audio_url, citations, parent_id=user_msg_id)
    
    return {
        "modelResponse": response_text,
        "audioUrl": audio_url,
        "citations": citations,
        "messageId": model_msg_id,
        "userMessageId": user_msg_id
    }

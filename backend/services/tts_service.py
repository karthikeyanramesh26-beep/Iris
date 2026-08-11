import os
import uuid
from gtts import gTTS

def generate_tts(text: str, lang_code: str) -> str:
    audio_filename = f"{uuid.uuid4().hex}.mp3"
    audio_dir = os.path.join("static", "audio")
    os.makedirs(audio_dir, exist_ok=True)
    audio_path = os.path.join(audio_dir, audio_filename)
    
    tts_lang = lang_code if lang_code in ['ta', 'hi', 'te', 'kn', 'ml', 'bn', 'mr', 'or', 'en'] else 'en'
    tts = gTTS(text=text, lang=tts_lang, slow=False)
    tts.save(audio_path)
    
    return audio_filename

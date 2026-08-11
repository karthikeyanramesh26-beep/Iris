from faster_whisper import WhisperModel

try:
    import torch
    device = "cuda" if torch.cuda.is_available() else "cpu"
except ImportError:
    device = "cpu"

print(f"Loading Whisper model on {device}...")
compute_type = "float16" if device == "cuda" else "int8"
whisper_model = WhisperModel("small", device=device, compute_type=compute_type)

def transcribe_audio(tmp_path: str):
    segments, info = whisper_model.transcribe(tmp_path, beam_size=5)
    text = " ".join([s.text for s in segments]).strip()
    return text, info.language

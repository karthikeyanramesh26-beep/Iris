import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routers import chat, transcribe, upload, history, projects

app = FastAPI(title="Voice Assistant Backend")

# Ensure static/audio directory exists
os.makedirs(os.path.join("static", "audio"), exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "online"}

app.include_router(chat.router)
app.include_router(transcribe.router)
app.include_router(upload.router)
app.include_router(history.router)
app.include_router(projects.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5002)

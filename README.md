<div align="center">

# 🌸 Iris — AI-Powered Voice Learning Assistant

**A conversational AI tutor that understands your documents, speaks your language, and teaches with patience.**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.141-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![HuggingFace](https://img.shields.io/badge/HuggingFace-Qwen2.5-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)](https://huggingface.co/)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector_DB-FF6B35?style=for-the-badge)](https://www.trychroma.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

</div>

---

## ✨ What is Iris?

**Iris** is a full-stack AI voice assistant designed as a **supportive, patient teacher**. Upload your study materials — PDFs, Word documents — and Iris will answer your questions about them using Retrieval-Augmented Generation (RAG). Ask questions by typing or speaking, and Iris responds in both text and voice.

> *"Speak with patience, clarity, and encourage the user to explore and learn."* — Iris's core philosophy

---

## 🖼️ Demo

> Ask Iris any question — by voice or text — and get clear, structured educational explanations powered by Qwen 2.5.

---

## 🚀 Features

| Feature | Description |
|---|---|
| 🎙️ **Voice Input** | Speak your questions using Faster-Whisper (local STT) |
| 🔊 **Voice Output** | Iris responds aloud using Google Text-to-Speech (gTTS) |
| 📄 **Document Upload** | Upload PDF & DOCX files for context-aware Q&A |
| 🧠 **RAG-Powered Answers** | Retrieves relevant document chunks via ChromaDB + LangChain |
| 🌐 **Multilingual** | Auto-translates non-English input to English before processing |
| 💬 **Chat History** | Persistent session-based conversation history |
| 📁 **Project Management** | Organise documents and chats into separate projects |
| ⚡ **Real-time** | Streaming responses with a beautiful animated UI |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                  React Frontend (Vite)               │
│         Tailwind CSS · Framer Motion · Axios         │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP (proxy → :5002)
┌──────────────────────▼──────────────────────────────┐
│              FastAPI Backend (:5002)                 │
│                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │  STT Service │  │  LLM Service │  │ TTS Service│  │
│  │Faster-Whisper│  │ Qwen2.5-7B  │  │   gTTS     │  │
│  └─────────────┘  └──────┬───────┘  └────────────┘  │
│                          │                           │
│  ┌───────────────────────▼────────────────────────┐  │
│  │              RAG Service                        │  │
│  │  LangChain · ChromaDB · all-MiniLM-L6-v2       │  │
│  │  Ingest (PDF/DOCX) → Embed → Retrieve → Answer │  │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Backend
| Layer | Technology |
|---|---|
| **Framework** | FastAPI + Uvicorn |
| **LLM** | Qwen/Qwen2.5-7B-Instruct via HuggingFace Inference API |
| **RAG** | LangChain + ChromaDB + `all-MiniLM-L6-v2` embeddings |
| **STT** | Faster-Whisper (local, runs on CPU/GPU) |
| **TTS** | gTTS (Google Text-to-Speech) |
| **Document Parsing** | PyMuPDF (PDF) · python-docx (DOCX) |
| **Database** | SQLite (chat history) + ChromaDB (vectors) |

### Frontend
| Layer | Technology |
|---|---|
| **Framework** | React 18 + Vite |
| **Styling** | Tailwind CSS + Framer Motion |
| **HTTP Client** | Axios |
| **Icons** | Lucide React |
| **Markdown** | react-markdown + remark-gfm |

---

## 📦 Project Structure

```
Iris/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── database.py              # SQLite history & project models
│   ├── download_model.py        # Pre-download Whisper model
│   ├── requirements.txt         # Python dependencies
│   ├── .env.example             # Environment variable template
│   ├── routers/
│   │   ├── chat.py              # /api/chat endpoint (RAG Q&A)
│   │   ├── transcribe.py        # /api/transcribe (voice → text)
│   │   ├── upload.py            # /api/upload (ingest documents)
│   │   ├── history.py           # /api/history (chat persistence)
│   │   └── projects.py          # /api/projects (project mgmt)
│   └── services/
│       ├── llm_service.py       # Qwen2.5 inference + translation
│       ├── rag_service.py       # ChromaDB vector store & retrieval
│       ├── ingest_service.py    # PDF/DOCX chunking & embedding
│       ├── stt_service.py       # Faster-Whisper transcription
│       └── tts_service.py       # gTTS audio generation
└── frontend/
    ├── src/
    │   ├── App.jsx              # Main app component
    │   ├── components/          # UI components
    │   └── index.css            # Global styles
    ├── vite.config.js           # Vite + proxy config
    └── package.json
```

---

## ⚙️ Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+ (LTS)
- A [HuggingFace account](https://huggingface.co/) with an API token

### 1. Clone the Repository

```bash
git clone https://github.com/karthikeyanramesh26-beep/Iris.git
cd Iris
```

### 2. Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
copy .env.example .env
# Edit .env and add your HuggingFace token:
#   HF_TOKEN=hf_your_token_here
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

### 4. Run the App

**Terminal 1 — Backend:**
```bash
cd backend
venv\Scripts\activate          # Windows
uvicorn main:app --reload --host 0.0.0.0 --port 5002
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Open **[http://localhost:3002](http://localhost:3002)** in your browser. 🎉

---

## 🔑 Environment Variables

Create a `.env` file in the `backend/` directory based on `.env.example`:

| Variable | Description | Default |
|---|---|---|
| `HF_TOKEN` | Your HuggingFace API token (**required**) | — |
| `PORT` | Backend server port | `5000` |
| `CHROMA_DB_PATH` | Path to store ChromaDB vectors | `./data/chroma_db` |

> ⚠️ **Never commit your `.env` file.** It is already included in `.gitignore`.

Get your free HuggingFace token at [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens).

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server health check |
| `POST` | `/api/chat` | Send a message, get an AI response |
| `POST` | `/api/transcribe` | Upload audio → transcribed text |
| `POST` | `/api/upload` | Upload PDF/DOCX for RAG ingestion |
| `GET` | `/api/history/{session_id}` | Retrieve chat history |
| `GET/POST` | `/api/projects` | Manage projects |

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with ❤️ by [Karthikeyan Ramesh](https://github.com/karthikeyanramesh26-beep)

*Iris — Teaching, one conversation at a time.*

</div>

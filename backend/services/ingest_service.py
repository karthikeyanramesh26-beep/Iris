import os
from langchain_community.document_loaders import PyMuPDFLoader, Docx2txtLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from services.rag_service import add_documents

text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)

def ingest_file(tmp_path: str, file_name: str, session_id: str, subject: str):
    suffix = os.path.splitext(file_name)[1].lower()
    
    if suffix == ".pdf":
        loader = PyMuPDFLoader(tmp_path)
    elif suffix in [".docx", ".doc"]:
        loader = Docx2txtLoader(tmp_path)
    elif suffix in [".txt", ".md"]:
        loader = TextLoader(tmp_path, encoding="utf-8")
    else:
        raise ValueError(f"Unsupported file type: {suffix}")
        
    docs = loader.load()
    
    for doc in docs:
        doc.metadata["sessionId"] = session_id
        doc.metadata["fileName"] = file_name
        doc.metadata["subject"] = subject
        
    chunks = text_splitter.split_documents(docs)
    add_documents(chunks)

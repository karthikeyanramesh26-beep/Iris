import os
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

CHROMA_DB_PATH = os.environ.get("CHROMA_DB_PATH", "./data/chroma_db")
os.makedirs(CHROMA_DB_PATH, exist_ok=True)

try:
    import torch
    device = "cuda" if torch.cuda.is_available() else "cpu"
except ImportError:
    device = "cpu"

embeddings = HuggingFaceEmbeddings(
    model_name="all-MiniLM-L6-v2",
    model_kwargs={"device": device}
)

vectorstore = Chroma(
    persist_directory=CHROMA_DB_PATH,
    embedding_function=embeddings
)

def get_retriever(session_id: str):
    return vectorstore.as_retriever(
        search_kwargs={
            "k": 3,
            "filter": {"sessionId": session_id}
        }
    )

def add_documents(chunks):
    vectorstore.add_documents(chunks)

def delete_document_vectors(session_id: str, file_name: str):
    vectorstore._collection.delete(where={"$and": [{"sessionId": session_id}, {"fileName": file_name}]})

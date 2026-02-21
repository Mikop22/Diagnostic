import os
os.environ["TOKENIZERS_PARALLELISM"] = "false"  # MUST be before any ML imports

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.services.embeddings import load_embedding_model
    app.state.embedding_model = load_embedding_model()
    yield

app = FastAPI(title="Diagnostic API", version="0.1.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/health")
async def health():
    return {"status": "ok"}

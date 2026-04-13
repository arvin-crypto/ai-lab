"""
FastAPI server — REST API for the RAG Agent system.
Endpoints for document upload, Q&A, and tech radar.
"""

import sys
sys.path.append("../rag_agent")
sys.path.append("../tech_radar")

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="AI Lab", description="RAG Agent + Tech Radar API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory document store
documents = {}
agent_instance = None


class QuestionRequest(BaseModel):
    question: str


class AnswerResponse(BaseModel):
    answer: str
    sources: list[str] = []


@app.get("/health")
def health():
    return {"status": "ok", "model": "llama3"}


@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload a document to the RAG system."""
    content = await file.read()
    text = content.decode("utf-8")
    documents[file.filename] = text

    # Rebuild index
    from retriever import build_index
    from agent import get_or_build_index
    all_text = "\n\n".join(documents.values())
    get_or_build_index(all_text)

    return {"filename": file.filename, "chunks": len(text) // 500}


@app.post("/ask", response_model=AnswerResponse)
def ask_question(req: QuestionRequest):
    """Ask a question against uploaded documents."""
    from agent import create_agent, get_or_build_index

    if not documents:
        return AnswerResponse(answer="No documents uploaded yet. Please upload a document first.")

    all_text = "\n\n".join(documents.values())
    get_or_build_index(all_text)

    agent = create_agent()
    result = agent.invoke({"input": req.question})

    return AnswerResponse(answer=result["output"], sources=list(documents.keys()))


@app.get("/documents")
def list_documents():
    """List all uploaded documents."""
    return {"documents": list(documents.keys()), "count": len(documents)}


@app.get("/tech-radar")
def tech_radar():
    """Fetch latest AI/LLM tech trends, grouped by source."""
    from scraper import fetch_all, summarize_items
    items = fetch_all()
    summary = summarize_items(items, limit=8)

    # Group by source
    grouped: dict[str, list] = {}
    for item in items:
        source = item["source"]
        if source not in grouped:
            grouped[source] = []
        grouped[source].append({
            "title": item["title"],
            "url": item["url"],
            "description": item.get("description", ""),
            "date": item.get("date", ""),
        })

    return {
        "grouped": grouped,
        "total": len(items),
        "sources": len(grouped),
        "summary": summary,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

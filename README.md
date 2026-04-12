# ai-lab — AI Agent Document Assistant + Tech Radar

RAG-powered document Q&A system with multi-tool AI Agent, plus an automated AI technology tracker.

## Features

- **Local LLM** via Ollama (LLaMA3) — no API key needed, runs entirely on your machine
- **Document RAG** — chunk, embed, vector search (FAISS), generate answers
- **AI Agent** — multi-tool agent that can search documents, summarize, and translate
- **Prompt Engineering** — zero-shot vs few-shot comparison with measurable results
- **Tech Radar** — auto-scrape HuggingFace trending, AI blogs, and RSS feeds; LLM-summarized digest
- **REST API** — FastAPI backend for document upload and Q&A
- **Docker Compose** — one-command deployment

## Architecture

```
User Question
     |
     v
[FastAPI Server] ---> [AI Agent (LangChain)]
                           |
                      Tool Selection
                      /    |    \
              Search   Summarize  Translate
                |
        [FAISS Vector Store]
                |
        [Ollama LLM (local)]
                |
             Answer
```

## Quick Start

```bash
# Install Ollama and pull model
brew install ollama
ollama run llama3

# Install Python dependencies
pip install -r requirements.txt

# Start API server
cd api && python server.py

# Or use Docker
docker-compose up
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/upload` | Upload a document (text file) |
| POST | `/ask` | Ask a question about uploaded documents |
| GET | `/documents` | List uploaded documents |

## Chunking Strategy Findings

Tested 3 strategies on sample documents:

| Strategy | Chunk Size | Overlap | Result |
|----------|-----------|---------|--------|
| Small | 200 | 20 | More chunks, precise retrieval, but loses context |
| Medium | 500 | 50 | Best balance of precision and context |
| Large | 1000 | 100 | Fewer chunks, retains context, but less precise |

**Conclusion:** Medium (500 chars, 50 overlap) gives the best trade-off for general document Q&A.

## Prompt Engineering Comparison

| Technique | When to Use | Quality |
|-----------|------------|---------|
| Zero-shot | General questions, simple tasks | Good for common knowledge |
| Few-shot | Domain-specific, consistent format needed | Better for specialized output |

## Tech Radar

Auto-generated AI technology digest. Sources: HuggingFace Trending, LangChain Blog, AI research feeds.

```bash
cd tech_radar && python scraper.py
# Outputs digest.md with latest AI/LLM trends
```

## Tech Stack

Python, LangChain, FAISS, Ollama (LLaMA3), FastAPI, Docker

## Author

Jun-Long Ye — [cxz6304@gmail.com](mailto:cxz6304@gmail.com)

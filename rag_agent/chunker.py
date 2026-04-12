"""
Document chunker — split documents into chunks for RAG pipeline.
Tests multiple strategies to find optimal chunk size.
"""

from langchain.text_splitter import RecursiveCharacterTextSplitter


def create_chunker(chunk_size: int = 500, chunk_overlap: int = 50):
    """Create a text splitter with given parameters."""
    return RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
    )


def chunk_document(text: str, chunk_size: int = 500, chunk_overlap: int = 50) -> list[str]:
    """Split a document into chunks."""
    splitter = create_chunker(chunk_size, chunk_overlap)
    return splitter.split_text(text)


def compare_strategies(text: str) -> dict:
    """Compare different chunking strategies and return stats."""
    strategies = [
        {"name": "small", "chunk_size": 200, "chunk_overlap": 20},
        {"name": "medium", "chunk_size": 500, "chunk_overlap": 50},
        {"name": "large", "chunk_size": 1000, "chunk_overlap": 100},
    ]

    results = {}
    for s in strategies:
        chunks = chunk_document(text, s["chunk_size"], s["chunk_overlap"])
        results[s["name"]] = {
            "chunk_size": s["chunk_size"],
            "chunk_overlap": s["chunk_overlap"],
            "num_chunks": len(chunks),
            "avg_chunk_length": sum(len(c) for c in chunks) / len(chunks) if chunks else 0,
        }

    return results


if __name__ == "__main__":
    sample = open("../README.md").read() if __import__("os").path.exists("../README.md") else "Sample text. " * 200
    results = compare_strategies(sample)
    for name, stats in results.items():
        print(f"{name}: {stats['num_chunks']} chunks, avg {stats['avg_chunk_length']:.0f} chars")

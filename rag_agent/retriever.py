"""
RAG Retriever — embed documents and search with FAISS vector store.
Uses Ollama for local embeddings (no API key needed).
"""

from langchain_community.vectorstores import FAISS
from langchain.schema import Document
from chunker import chunk_document
from llm_provider import get_embeddings


def build_index(text: str, chunk_size: int = 500) -> FAISS:
    """Build a FAISS index from document text."""
    chunks = chunk_document(text, chunk_size=chunk_size)
    docs = [Document(page_content=chunk) for chunk in chunks]
    return FAISS.from_documents(docs, get_embeddings())


def search(index: FAISS, query: str, k: int = 3) -> list[Document]:
    """Search the index for relevant documents."""
    return index.similarity_search(query, k=k)


if __name__ == "__main__":
    sample_text = """
    RAG (Retrieval-Augmented Generation) is a technique that combines information retrieval
    with text generation. It first retrieves relevant documents from a knowledge base,
    then uses those documents as context for the language model to generate answers.

    The key components of a RAG system are: document chunking, embedding generation,
    vector storage, similarity search, and answer generation. The chunking strategy
    has the biggest impact on retrieval quality.

    MCP (Model Context Protocol) is an open protocol from Anthropic that provides a
    standard interface for LLMs to connect with external tools and data sources.
    It enables AI agents to interact with APIs, databases, and other services.
    """

    print("Building index...")
    index = build_index(sample_text, chunk_size=200)

    query = "What is RAG?"
    print(f"\nQuery: {query}")
    results = search(index, query)
    for i, doc in enumerate(results):
        print(f"\nResult {i+1}: {doc.page_content[:100]}...")

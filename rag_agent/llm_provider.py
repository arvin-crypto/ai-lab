"""
LLM Provider — switch between Ollama (local) and Gemini (cloud) via env var.

Usage:
  LLM_PROVIDER=ollama  → local LLaMA3 (default, no API key needed)
  LLM_PROVIDER=gemini  → Google Gemini API (needs GOOGLE_API_KEY)
"""

import os
from langchain_core.language_models import BaseChatModel


def get_llm(temperature: float = 0) -> BaseChatModel:
    provider = os.environ.get("LLM_PROVIDER", "ollama").lower()

    if provider == "gemini":
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            temperature=temperature,
            google_api_key=os.environ.get("GOOGLE_API_KEY"),
        )
    else:
        from langchain_ollama import ChatOllama
        return ChatOllama(model="llama3", temperature=temperature)


def get_embeddings():
    provider = os.environ.get("LLM_PROVIDER", "ollama").lower()

    if provider == "gemini":
        from langchain_google_genai import GoogleGenerativeAIEmbeddings
        return GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            google_api_key=os.environ.get("GOOGLE_API_KEY"),
        )
    else:
        from langchain_ollama import OllamaEmbeddings
        return OllamaEmbeddings(model="llama3")

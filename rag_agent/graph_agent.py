"""
LangGraph Agent — graph-based workflow for document Q&A.
Demonstrates stateful, multi-step AI Agent with conditional routing.

Flow:
  classify → route → (search | summarize | translate) → generate → END
"""

from typing import TypedDict, Literal
from langgraph.graph import StateGraph, END
from retriever import build_index, search
from llm_provider import get_llm


# --- State ---

class AgentState(TypedDict):
    question: str
    category: str  # "search" | "summarize" | "translate"
    context: str
    answer: str


# --- LLM ---

llm = get_llm()

# --- Index ---

_index = None


def init_index(text: str):
    global _index
    _index = build_index(text)


# --- Nodes ---

def classify_node(state: AgentState) -> AgentState:
    """Classify the question type."""
    prompt = f"""Classify this question into one category.
Categories: search, summarize, translate

Question: {state['question']}

Reply with ONLY the category name, nothing else."""

    response = llm.invoke(prompt)
    category = response.content.strip().lower()

    # Default to search if unclear
    if category not in ("search", "summarize", "translate"):
        category = "search"

    return {**state, "category": category}


def search_node(state: AgentState) -> AgentState:
    """Search documents for relevant context."""
    if _index is None:
        return {**state, "context": "No documents indexed."}

    results = search(_index, state["question"], k=3)
    context = "\n\n".join([doc.page_content for doc in results])
    return {**state, "context": context}


def summarize_node(state: AgentState) -> AgentState:
    """Summarize the context."""
    if _index is None:
        return {**state, "context": "No documents to summarize."}

    results = search(_index, state["question"], k=5)
    full_text = "\n".join([doc.page_content for doc in results])

    response = llm.invoke(f"Summarize in 2-3 sentences:\n\n{full_text}")
    return {**state, "context": response.content}


def translate_node(state: AgentState) -> AgentState:
    """Translate the question context to Chinese."""
    if _index is None:
        return {**state, "context": "No documents to translate."}

    results = search(_index, state["question"], k=2)
    text = "\n".join([doc.page_content for doc in results])

    response = llm.invoke(f"Translate to Traditional Chinese:\n\n{text}")
    return {**state, "context": response.content}


def generate_node(state: AgentState) -> AgentState:
    """Generate final answer based on context."""
    prompt = f"""Based on the context below, answer the question concisely.

Context: {state['context']}

Question: {state['question']}

Answer:"""

    response = llm.invoke(prompt)
    return {**state, "answer": response.content}


# --- Router ---

def route_by_category(state: AgentState) -> Literal["search", "summarize", "translate"]:
    """Route to the appropriate node based on classification."""
    return state["category"]


# --- Build Graph ---

def build_graph() -> StateGraph:
    """Build the LangGraph workflow."""
    graph = StateGraph(AgentState)

    # Add nodes
    graph.add_node("classify", classify_node)
    graph.add_node("search", search_node)
    graph.add_node("summarize", summarize_node)
    graph.add_node("translate", translate_node)
    graph.add_node("generate", generate_node)

    # Entry point
    graph.set_entry_point("classify")

    # Conditional routing after classification
    graph.add_conditional_edges(
        "classify",
        route_by_category,
        {
            "search": "search",
            "summarize": "summarize",
            "translate": "translate",
        },
    )

    # All paths lead to generate
    graph.add_edge("search", "generate")
    graph.add_edge("summarize", "generate")
    graph.add_edge("translate", "generate")

    # End
    graph.add_edge("generate", END)

    return graph.compile()


if __name__ == "__main__":
    # Index sample documents
    sample = """
    RAG (Retrieval-Augmented Generation) improves LLM accuracy by retrieving
    relevant documents before generating answers. The chunking strategy has
    the biggest impact on retrieval quality.

    MCP (Model Context Protocol) is an open protocol from Anthropic that
    provides a standard interface for LLMs to connect with external tools.

    AI Agents can autonomously decide which tools to use and in what order,
    enabling complex multi-step task execution.

    LangGraph enables building stateful, multi-step agent workflows using
    a graph-based architecture with conditional routing.
    """
    init_index(sample)

    app = build_graph()

    # Test different question types
    questions = [
        "What is the most important factor in RAG?",
        "Summarize what MCP does",
        "Translate the description of AI Agents to Chinese",
    ]

    for q in questions:
        print(f"\n{'='*50}")
        print(f"Question: {q}")
        result = app.invoke({"question": q, "category": "", "context": "", "answer": ""})
        print(f"Category: {result['category']}")
        print(f"Answer: {result['answer']}")

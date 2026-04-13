"""
AI Agent — LangChain agent with custom tools for document Q&A.
Demonstrates tool calling, multi-step reasoning, and RAG integration.
"""

from langchain.agents import AgentExecutor, create_react_agent
from langchain.tools import Tool
from langchain.prompts import PromptTemplate
from retriever import build_index, search
from llm_provider import get_llm


# Global index (built once, reused)
_index = None


def get_or_build_index(text: str = None):
    """Lazy-load the FAISS index."""
    global _index
    if _index is None and text:
        _index = build_index(text)
    return _index


def search_documents(query: str) -> str:
    """Search tool — find relevant documents."""
    index = get_or_build_index()
    if not index:
        return "No documents indexed yet."
    results = search(index, query, k=3)
    return "\n\n".join([doc.page_content for doc in results])


def summarize_text(text: str) -> str:
    """Summarize tool — condense text using LLM."""
    llm = get_llm()
    response = llm.invoke(f"Summarize the following text in 2-3 sentences:\n\n{text}")
    return response.content


def translate_text(text: str) -> str:
    """Translate tool — translate text to Chinese."""
    llm = get_llm()
    response = llm.invoke(f"Translate the following text to Traditional Chinese:\n\n{text}")
    return response.content


# Define tools
tools = [
    Tool(
        name="SearchDocuments",
        func=search_documents,
        description="Search the document knowledge base for relevant information. Input should be a search query.",
    ),
    Tool(
        name="Summarize",
        func=summarize_text,
        description="Summarize a given text into 2-3 concise sentences. Input should be the text to summarize.",
    ),
    Tool(
        name="Translate",
        func=translate_text,
        description="Translate text to Traditional Chinese. Input should be the text to translate.",
    ),
]

# Agent prompt
AGENT_PROMPT = PromptTemplate.from_template("""You are a helpful AI assistant with access to tools.
Answer the user's question using the tools available to you.

You have access to the following tools:
{tools}

Tool names: {tool_names}

Use this format:
Question: the input question
Thought: think about what to do
Action: the tool to use
Action Input: the input to the tool
Observation: the tool result
... (repeat as needed)
Thought: I now know the final answer
Final Answer: the answer

Question: {input}
{agent_scratchpad}""")


def create_agent():
    """Create a ReAct agent with tools."""
    llm = get_llm()
    agent = create_react_agent(llm, tools, AGENT_PROMPT)
    return AgentExecutor(agent=agent, tools=tools, verbose=True, handle_parsing_errors=True, max_iterations=3)


if __name__ == "__main__":
    # Index sample documents
    sample = """
    RAG systems combine retrieval with generation for accurate answers.
    MCP protocol enables LLMs to call external tools via a standard interface.
    AI Agents can autonomously decide which tools to use and in what order.
    Chunking strategy is the most important factor in RAG retrieval quality.
    """
    get_or_build_index(sample)

    agent = create_agent()
    result = agent.invoke({"input": "What is the most important factor in RAG systems?"})
    print(f"\nAnswer: {result['output']}")

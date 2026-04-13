"""
Zero-shot vs Few-shot prompt comparison.
Demonstrates prompt engineering techniques mentioned in the ASUS JD.
"""

import sys
sys.path.append("../rag_agent")
from llm_provider import get_llm


llm = get_llm()


def zero_shot(question: str, context: str) -> str:
    """Zero-shot: no examples, just ask."""
    prompt = f"""Based on the following context, answer the question.

Context: {context}

Question: {question}
Answer:"""
    return llm.invoke(prompt).content


def few_shot(question: str, context: str) -> str:
    """Few-shot: provide examples first."""
    prompt = f"""Based on the context provided, answer the question. Here are some examples:

Example 1:
Context: Python is a programming language created by Guido van Rossum in 1991.
Question: Who created Python?
Answer: Guido van Rossum created Python in 1991.

Example 2:
Context: Docker containers package applications with their dependencies for consistent deployment.
Question: What do Docker containers do?
Answer: Docker containers package applications with their dependencies to ensure consistent deployment across environments.

Now answer this:
Context: {context}

Question: {question}
Answer:"""
    return llm.invoke(prompt).content


def compare(question: str, context: str) -> dict:
    """Compare zero-shot and few-shot responses."""
    return {
        "question": question,
        "zero_shot": zero_shot(question, context),
        "few_shot": few_shot(question, context),
    }


if __name__ == "__main__":
    context = "RAG (Retrieval-Augmented Generation) improves LLM accuracy by retrieving relevant documents before generating answers. The chunking strategy has the biggest impact on retrieval quality."
    question = "What has the biggest impact on RAG quality?"

    result = compare(question, context)
    print(f"Question: {result['question']}\n")
    print(f"Zero-shot answer:\n{result['zero_shot']}\n")
    print(f"Few-shot answer:\n{result['few_shot']}")

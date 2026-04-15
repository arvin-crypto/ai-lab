"""
Agent Harness — control layer for AI Agent behavior.

Harness Engineering = everything around the model that makes it reliable.
This module defines: permissions, tool access, token budgets, and guardrails.

Usage:
    harness = AgentHarness.from_yaml("harness.yml")
    agent = harness.create_agent()
"""

import os
import yaml
from dataclasses import dataclass, field


@dataclass
class ToolPermission:
    """Which tools the agent can use."""
    name: str
    enabled: bool = True
    max_calls: int = 10  # max calls per session


@dataclass
class AgentHarness:
    """
    The harness wraps the model with:
    - Feedforward controls (guide before acting): system prompt, allowed tools, token budget
    - Feedback controls (correct after acting): output validation, retry logic
    """
    name: str = "default"
    model: str = "llama3"
    provider: str = "ollama"
    max_tokens: int = 4096
    temperature: float = 0.0
    system_prompt: str = "You are a helpful assistant."
    tools: list[ToolPermission] = field(default_factory=list)
    max_iterations: int = 5
    require_source_citation: bool = False
    language: str = "zh-TW"

    @classmethod
    def from_yaml(cls, path: str) -> "AgentHarness":
        """Load harness config from YAML file."""
        with open(path) as f:
            config = yaml.safe_load(f)

        tools = [
            ToolPermission(**t) for t in config.get("tools", [])
        ]

        return cls(
            name=config.get("name", "default"),
            model=config.get("model", "llama3"),
            provider=config.get("provider", os.environ.get("LLM_PROVIDER", "ollama")),
            max_tokens=config.get("max_tokens", 4096),
            temperature=config.get("temperature", 0.0),
            system_prompt=config.get("system_prompt", "You are a helpful assistant."),
            tools=tools,
            max_iterations=config.get("max_iterations", 5),
            require_source_citation=config.get("require_source_citation", False),
            language=config.get("language", "zh-TW"),
        )

    def get_allowed_tools(self) -> list[str]:
        """Return names of enabled tools only."""
        return [t.name for t in self.tools if t.enabled]

    def check_tool_budget(self, tool_name: str, current_calls: int) -> bool:
        """Check if tool still has budget remaining."""
        for t in self.tools:
            if t.name == tool_name:
                return current_calls < t.max_calls
        return False

    # --- Feedback: Evaluate + Correct ---

    def evaluate(self, query: str, answer: str, context: str = "") -> dict:
        """
        Evaluate agent output quality.
        Returns scores for: relevancy, faithfulness, completeness.
        """
        from llm_provider import get_llm
        llm = get_llm(temperature=0)

        eval_prompt = f"""Evaluate the following answer on three dimensions.
Score each 1-5 (1=terrible, 5=perfect). Reply in JSON format only.

Question: {query}
Context provided: {context[:500] if context else "None"}
Answer: {answer}

Evaluate:
- relevancy: Does the answer address the question?
- faithfulness: Is the answer grounded in the context (not hallucinated)?
- completeness: Does the answer fully address the question?

Reply format: {{"relevancy": N, "faithfulness": N, "completeness": N, "pass": true/false}}
Set pass=true if ALL scores >= 3, otherwise false."""

        import json
        response = llm.invoke(eval_prompt)
        try:
            result = json.loads(response.content)
        except json.JSONDecodeError:
            result = {"relevancy": 0, "faithfulness": 0, "completeness": 0, "pass": False, "raw": response.content}

        return result

    def correct(self, query: str, bad_answer: str, eval_result: dict, context: str = "") -> str:
        """
        Re-generate answer with feedback from evaluation.
        Only called when evaluate() returns pass=False.
        """
        from llm_provider import get_llm
        llm = get_llm(temperature=0)

        feedback_parts = []
        if eval_result.get("relevancy", 5) < 3:
            feedback_parts.append("The answer did not address the question directly.")
        if eval_result.get("faithfulness", 5) < 3:
            feedback_parts.append("The answer contained information not found in the context.")
        if eval_result.get("completeness", 5) < 3:
            feedback_parts.append("The answer was incomplete.")

        feedback = " ".join(feedback_parts)

        correct_prompt = f"""The previous answer was not good enough.

Question: {query}
Context: {context[:500] if context else "None"}
Previous answer: {bad_answer}
Problems: {feedback}

Please provide a better answer that addresses these issues. Be concise and accurate."""

        response = llm.invoke(correct_prompt)
        return response.content

    def run_with_evaluation(self, query: str, context: str = "", max_retries: int = 2) -> dict:
        """
        Full harness loop: generate → evaluate → correct if needed.
        Returns the final answer with evaluation scores.
        """
        from llm_provider import get_llm
        llm = get_llm(temperature=self.temperature)

        # Initial generation
        prompt = f"""{self.system_prompt}

Context: {context[:1000] if context else "No context provided."}

Question: {query}
Answer:"""

        answer = llm.invoke(prompt).content

        # Evaluate
        eval_result = self.evaluate(query, answer, context)

        # Correct loop
        attempts = 0
        while not eval_result.get("pass", False) and attempts < max_retries:
            attempts += 1
            answer = self.correct(query, answer, eval_result, context)
            eval_result = self.evaluate(query, answer, context)

        return {
            "answer": answer,
            "evaluation": eval_result,
            "attempts": attempts + 1,
            "passed": eval_result.get("pass", False),
        }

    # --- Feedforward: Create controlled agent ---

    def create_agent(self):
        """Create a LangChain agent with harness controls applied."""
        from llm_provider import get_llm
        from langchain.agents import AgentExecutor, create_react_agent
        from agent import tools as all_tools, AGENT_PROMPT

        llm = get_llm(temperature=self.temperature)

        # Filter tools based on harness permissions
        allowed = self.get_allowed_tools()
        filtered_tools = [t for t in all_tools if t.name in allowed]

        agent = create_react_agent(llm, filtered_tools, AGENT_PROMPT)
        return AgentExecutor(
            agent=agent,
            tools=filtered_tools,
            verbose=True,
            handle_parsing_errors=True,
            max_iterations=self.max_iterations,
        )


if __name__ == "__main__":
    harness = AgentHarness.from_yaml("harness.yml")
    print(f"Harness: {harness.name}")
    print(f"Model: {harness.provider}/{harness.model}")
    print(f"Allowed tools: {harness.get_allowed_tools()}")
    print()

    # Demo: run with evaluation loop
    context = "RAG combines retrieval with generation. Chunking strategy is the most important factor for retrieval quality."
    result = harness.run_with_evaluation(
        query="What is the most important factor in RAG?",
        context=context,
    )
    print(f"Answer: {result['answer']}")
    print(f"Evaluation: {result['evaluation']}")
    print(f"Attempts: {result['attempts']}")
    print(f"Passed: {result['passed']}")

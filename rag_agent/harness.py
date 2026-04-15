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

    def create_agent(self):
        """Create a LangChain agent with harness controls applied."""
        from llm_provider import get_llm
        from langchain.agents import AgentExecutor, create_react_agent
        from langchain.prompts import PromptTemplate
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
    # Demo: load harness and show config
    harness = AgentHarness.from_yaml("harness.yml")
    print(f"Harness: {harness.name}")
    print(f"Model: {harness.provider}/{harness.model}")
    print(f"Allowed tools: {harness.get_allowed_tools()}")
    print(f"Max iterations: {harness.max_iterations}")
    print(f"Temperature: {harness.temperature}")

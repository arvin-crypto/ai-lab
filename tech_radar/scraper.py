"""
Tech Radar — scrape AI/LLM news from HuggingFace, GitHub Trending, and RSS feeds.
Auto-summarize with local LLM.
"""

import os
import sys
import requests
import feedparser
from datetime import datetime

sys.path.append(os.path.join(os.path.dirname(__file__), "../rag_agent"))
from llm_provider import get_llm


def fetch_huggingface_trending(limit: int = 10) -> list[dict]:
    """Fetch trending models from HuggingFace."""
    try:
        resp = requests.get(
            "https://huggingface.co/api/models",
            params={"sort": "downloads", "direction": -1, "limit": limit},
            timeout=10,
        )
        resp.raise_for_status()
        models = resp.json()
        return [
            {
                "source": "HuggingFace",
                "title": m.get("modelId", ""),
                "url": f"https://huggingface.co/{m.get('modelId', '')}",
                "description": m.get("pipeline_tag", ""),
                "date": datetime.now().strftime("%Y-%m-%d"),
            }
            for m in models
        ]
    except Exception as e:
        print(f"HuggingFace fetch error: {e}")
        return []


def fetch_rss_feed(url: str, source_name: str, limit: int = 10) -> list[dict]:
    """Fetch entries from an RSS feed."""
    try:
        feed = feedparser.parse(url)
        entries = []
        for entry in feed.entries[:limit]:
            entries.append({
                "source": source_name,
                "title": entry.get("title", ""),
                "url": entry.get("link", ""),
                "description": entry.get("summary", "")[:300],
                "date": entry.get("published", datetime.now().strftime("%Y-%m-%d")),
            })
        return entries
    except Exception as e:
        print(f"RSS fetch error ({source_name}): {e}")
        return []


def fetch_github_trending(limit: int = 10) -> list[dict]:
    """Fetch trending AI repositories from GitHub via RSS."""
    # GitHub trending doesn't have an API, use curated repos RSS
    feeds = [
        ("https://github.com/langchain-ai/langchain/releases.atom", "langchain-ai/langchain"),
        ("https://github.com/run-llama/llama_index/releases.atom", "run-llama/llama_index"),
        ("https://github.com/ollama/ollama/releases.atom", "ollama/ollama"),
        ("https://github.com/anthropics/anthropic-sdk-python/releases.atom", "anthropics/sdk-python"),
        ("https://github.com/modelcontextprotocol/servers/releases.atom", "mcp/servers"),
    ]
    items = []
    for url, repo_name in feeds:
        try:
            feed = feedparser.parse(url)
            for entry in feed.entries[:2]:
                items.append({
                    "source": "GitHub",
                    "title": f"{repo_name}: {entry.get('title', '')[:80]}",
                    "url": entry.get("link", ""),
                    "description": (entry.get("summary", "") or "")[:200],
                    "date": entry.get("published", "")[:10] if entry.get("published") else datetime.now().strftime("%Y-%m-%d"),
                })
        except Exception as e:
            print(f"GitHub RSS error ({repo_name}): {e}")
    return items[:limit]


def fetch_ai_newsletters(limit: int = 10) -> list[dict]:
    """Fetch from AI newsletters and aggregators."""
    feeds = [
        ("https://buttondown.com/ainews/rss", "AI News"),
        ("https://www.deeplearning.ai/the-batch/feed/", "DeepLearning.AI"),
    ]
    items = []
    for url, name in feeds:
        items.extend(fetch_rss_feed(url, name, 5))
    return items[:limit]


def fetch_all() -> list[dict]:
    """Fetch from all sources."""
    items = []

    # HuggingFace trending models
    items.extend(fetch_huggingface_trending(10))

    # GitHub releases (AI frameworks)
    items.extend(fetch_github_trending(10))

    # AI newsletters
    items.extend(fetch_ai_newsletters(10))

    # AI blogs (RSS)
    rss_sources = [
        ("https://blog.langchain.dev/rss/", "LangChain Blog"),
        ("https://lilianweng.github.io/index.xml", "Lilian Weng"),
        ("https://simonwillison.net/atom/everything/", "Simon Willison"),
        ("https://www.latent.space/feed", "Latent Space"),
        ("https://blog.anthropic.com/rss.xml", "Anthropic Blog"),
        ("https://openai.com/blog/rss.xml", "OpenAI Blog"),
    ]
    for url, name in rss_sources:
        items.extend(fetch_rss_feed(url, name, 5))

    return items


def summarize_items(items: list[dict], limit: int = 5) -> str:
    """Use local LLM to summarize tech news into a digest."""
    if not items:
        return "No items to summarize."

    llm = get_llm()

    items_text = "\n".join(
        [f"- [{item['source']}] {item['title']}: {item['description'][:100]}" for item in items[:limit]]
    )

    prompt = f"""Summarize the following AI/LLM technology updates into a brief tech radar digest.
Group by category (Models, Tools, Research). Keep it concise.

Updates:
{items_text}

Tech Radar Digest:"""

    response = llm.invoke(prompt)
    return response.content


def generate_digest() -> str:
    """Generate a complete tech radar digest."""
    items = fetch_all()
    date = datetime.now().strftime("%Y-%m-%d")

    md = f"# Tech Radar Digest - {date}\n\n"
    md += f"Sources scanned: {len(set(i['source'] for i in items))}\n"
    md += f"Items found: {len(items)}\n\n"

    md += "## Trending Items\n\n"
    for item in items[:15]:
        md += f"- **[{item['source']}]** [{item['title']}]({item['url']})\n"

    md += "\n## AI Summary\n\n"
    md += summarize_items(items)

    return md


if __name__ == "__main__":
    digest = generate_digest()
    print(digest)

    # Save to file
    with open("digest.md", "w") as f:
        f.write(digest)
    print("\nSaved to digest.md")

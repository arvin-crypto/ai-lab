"use client";

import { useState, useRef, useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface TechItem {
  source: string;
  title: string;
  url: string;
  description: string;
  date: string;
}

export default function Home() {
  const [tab, setTab] = useState<"agent" | "radar">("agent");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [radarItems, setRadarItems] = useState<TechItem[]>([]);
  const [radarSummary, setRadarSummary] = useState("");
  const [radarLoading, setRadarLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer || "No response." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Could not connect to API. Make sure the FastAPI server is running on port 8000.",
        },
      ]);
    }

    setLoading(false);
  };

  const fetchRadar = async () => {
    setRadarLoading(true);
    try {
      const res = await fetch(`${API_BASE}/tech-radar`);
      const data = await res.json();
      setRadarItems(data.items || []);
      setRadarSummary(data.summary || "");
    } catch {
      setRadarSummary(
        "Could not connect to API. Make sure the FastAPI server is running."
      );
    }
    setRadarLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-emerald-400">AI</span> Lab
            </h1>
            <p className="text-xs text-zinc-500">
              RAG Agent + Tech Radar | Powered by Ollama + LangGraph
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setTab("agent")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === "agent"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              AI Agent
            </button>
            <button
              onClick={() => {
                setTab("radar");
                if (radarItems.length === 0) fetchRadar();
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === "radar"
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Tech Radar
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-6">
        {tab === "agent" ? (
          <div className="flex flex-col h-[calc(100vh-200px)]">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 pb-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="text-5xl mb-4">🤖</div>
                  <h2 className="text-lg font-semibold text-zinc-300">
                    AI Agent Document Assistant
                  </h2>
                  <p className="text-sm text-zinc-500 mt-2 max-w-md">
                    Upload documents and ask questions. The agent uses RAG +
                    LangGraph to search, summarize, and translate.
                  </p>
                  <div className="flex gap-2 mt-6">
                    {[
                      "What is RAG?",
                      "Summarize MCP protocol",
                      "What are AI Agents?",
                    ].map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          setInput(q);
                        }}
                        className="px-3 py-1.5 text-xs rounded-full border border-zinc-700 text-zinc-400 hover:border-emerald-500/50 hover:text-emerald-400 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-emerald-500/20 text-emerald-100 border border-emerald-500/20"
                        : "bg-zinc-800 text-zinc-200 border border-zinc-700"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-zinc-800 border border-zinc-700 px-4 py-3 rounded-2xl text-sm text-zinc-400">
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="flex gap-3 pt-4 border-t border-zinc-800">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask a question about your documents..."
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-xl text-sm font-medium transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        ) : (
          /* Tech Radar */
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">
                <span className="text-purple-400">Tech Radar</span> — AI/LLM
                Trends
              </h2>
              <button
                onClick={fetchRadar}
                disabled={radarLoading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 rounded-lg text-sm font-medium transition-colors"
              >
                {radarLoading ? "Scanning..." : "Refresh"}
              </button>
            </div>

            {radarSummary && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 mb-6">
                <h3 className="text-sm font-semibold text-purple-400 mb-2">
                  AI Summary
                </h3>
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {radarSummary}
                </p>
              </div>
            )}

            <div className="grid gap-3">
              {radarItems.map((item, i) => (
                <a
                  key={i}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-4 bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-purple-500/30 transition-colors"
                >
                  <span className="text-xs font-medium text-purple-400 bg-purple-500/10 px-2 py-1 rounded whitespace-nowrap">
                    {item.source}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-zinc-200 truncate">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-zinc-600 whitespace-nowrap">
                    {item.date}
                  </span>
                </a>
              ))}

              {radarItems.length === 0 && !radarLoading && (
                <div className="text-center py-12 text-zinc-500">
                  <div className="text-4xl mb-3">📡</div>
                  <p>Click &quot;Refresh&quot; to scan for latest AI/LLM trends</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-xs text-zinc-600">
          <span>Built with Next.js + LangGraph + Ollama (LLaMA3)</span>
          <span>Jun-Long Ye | AI Lab Portfolio</span>
        </div>
      </footer>
    </div>
  );
}

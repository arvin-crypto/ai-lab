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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [radarItems, setRadarItems] = useState<TechItem[]>([]);
  const [radarSummary, setRadarSummary] = useState("");
  const [radarLoading, setRadarLoading] = useState(false);
  const [docCount, setDocCount] = useState(0);
  const [apiStatus, setApiStatus] = useState<"online" | "offline" | "checking">("checking");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    checkHealth();
    fetchRadar();
  }, []);

  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (res.ok) setApiStatus("online");
      else setApiStatus("offline");
    } catch {
      setApiStatus("offline");
    }
  };

  const fetchDocCount = async () => {
    try {
      const res = await fetch(`${API_BASE}/documents`);
      const data = await res.json();
      setDocCount(data.count || 0);
    } catch { /* ignore */ }
  };

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
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer || "No response." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "API connection failed." }]);
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
      setRadarSummary("Could not connect to API.");
    }
    setRadarLoading(false);
    fetchDocCount();
  };

  const sourceColors: Record<string, string> = {
    HuggingFace: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
    "LangChain Blog": "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    "Lilian Weng Blog": "bg-blue-500/15 text-blue-400 border-blue-500/20",
    default: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  };

  const getSourceColor = (source: string) => sourceColors[source] || sourceColors.default;

  const sourceCounts = radarItems.reduce((acc, item) => {
    acc[item.source] = (acc[item.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100">
      {/* Top Bar */}
      <header className="border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-purple-600 flex items-center justify-center text-sm font-bold">A</div>
            <div>
              <h1 className="text-base font-bold tracking-tight">AI Lab</h1>
              <p className="text-[10px] text-zinc-500">RAG Agent + Tech Radar Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${apiStatus === "online" ? "bg-emerald-400 animate-pulse" : apiStatus === "offline" ? "bg-red-400" : "bg-yellow-400"}`} />
              <span className="text-zinc-500">Ollama {apiStatus === "online" ? "LLaMA3" : apiStatus}</span>
            </div>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-500">by Jun-Long Ye</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto w-full p-6 flex-1">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
            <div className="text-xs text-zinc-500 mb-1">Tech Sources</div>
            <div className="text-2xl font-bold text-emerald-400">{Object.keys(sourceCounts).length}</div>
            <div className="text-[10px] text-zinc-600 mt-1">active feeds</div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
            <div className="text-xs text-zinc-500 mb-1">Items Tracked</div>
            <div className="text-2xl font-bold text-purple-400">{radarItems.length}</div>
            <div className="text-[10px] text-zinc-600 mt-1">latest trends</div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
            <div className="text-xs text-zinc-500 mb-1">Documents</div>
            <div className="text-2xl font-bold text-blue-400">{docCount}</div>
            <div className="text-[10px] text-zinc-600 mt-1">in RAG index</div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
            <div className="text-xs text-zinc-500 mb-1">Agent Queries</div>
            <div className="text-2xl font-bold text-yellow-400">{messages.filter(m => m.role === "user").length}</div>
            <div className="text-[10px] text-zinc-600 mt-1">this session</div>
          </div>
        </div>

        {/* Main Grid: 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Left: Tech Radar (3 cols) */}
          <div className="lg:col-span-3 space-y-6">
            {/* AI Summary Card */}
            <div className="bg-gradient-to-br from-purple-500/5 to-emerald-500/5 border border-zinc-800/50 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <span className="text-lg">📡</span> Tech Radar — AI Summary
                </h2>
                <button
                  onClick={fetchRadar}
                  disabled={radarLoading}
                  className="px-3 py-1 bg-purple-600/80 hover:bg-purple-500 disabled:bg-zinc-700 rounded-lg text-xs font-medium transition-colors"
                >
                  {radarLoading ? "Scanning..." : "Refresh"}
                </button>
              </div>
              {radarSummary ? (
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{radarSummary}</p>
              ) : (
                <p className="text-sm text-zinc-600">Loading summary...</p>
              )}
            </div>

            {/* Source Breakdown */}
            {Object.keys(sourceCounts).length > 0 && (
              <div className="flex gap-3 flex-wrap">
                {Object.entries(sourceCounts).map(([source, count]) => (
                  <div key={source} className={`${getSourceColor(source)} border rounded-lg px-3 py-2 text-xs`}>
                    <span className="font-semibold">{source}</span>
                    <span className="ml-2 opacity-70">{count} items</span>
                  </div>
                ))}
              </div>
            )}

            {/* Trending Items */}
            <div>
              <h3 className="text-sm font-semibold text-zinc-400 mb-3 flex items-center gap-2">
                <span>🔥</span> Trending
              </h3>
              <div className="space-y-2">
                {radarItems.map((item, i) => (
                  <a
                    key={i}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-zinc-900/30 border border-zinc-800/30 rounded-lg px-4 py-3 hover:border-purple-500/30 hover:bg-zinc-900/60 transition-all group"
                  >
                    <span className="text-xs text-zinc-600 w-5">{i + 1}</span>
                    <span className={`${getSourceColor(item.source)} border rounded px-2 py-0.5 text-[10px] font-medium whitespace-nowrap`}>
                      {item.source}
                    </span>
                    <span className="text-sm text-zinc-300 group-hover:text-zinc-100 truncate flex-1">{item.title}</span>
                    <span className="text-[10px] text-zinc-700">{item.date}</span>
                  </a>
                ))}
                {radarItems.length === 0 && !radarLoading && (
                  <div className="text-center py-8 text-zinc-600 text-sm">Loading trends...</div>
                )}
              </div>
            </div>
          </div>

          {/* Right: AI Agent Chat (2 cols) */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl flex flex-col h-[calc(100vh-280px)] sticky top-20">
              {/* Chat Header */}
              <div className="px-4 py-3 border-b border-zinc-800/50 flex items-center gap-2">
                <span className="text-base">🤖</span>
                <span className="text-sm font-semibold">AI Agent</span>
                <span className="text-[10px] text-zinc-600 ml-auto">RAG + LangGraph</span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <p className="text-xs text-zinc-500 mb-4">Ask questions about uploaded documents</p>
                    <div className="flex flex-col gap-2 w-full">
                      {["What is RAG?", "Summarize MCP protocol", "What are AI Agents?"].map((q) => (
                        <button
                          key={q}
                          onClick={() => setInput(q)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-800 text-zinc-400 hover:border-emerald-500/40 hover:text-emerald-400 transition-colors text-left"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-emerald-500/15 text-emerald-100 border border-emerald-500/15"
                        : "bg-zinc-800/50 text-zinc-300 border border-zinc-700/50"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-zinc-800/50 border border-zinc-700/50 px-3 py-2 rounded-xl text-xs text-zinc-500">
                      <span className="animate-pulse">Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-zinc-800/50">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Ask anything..."
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-lg text-xs font-medium transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-800/30 px-6 py-3 mt-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[10px] text-zinc-700">
          <span>Next.js + LangChain + LangGraph + Ollama (LLaMA3) + FAISS + FastAPI</span>
          <span>github.com/arvin-crypto/ai-lab</span>
        </div>
      </footer>
    </div>
  );
}

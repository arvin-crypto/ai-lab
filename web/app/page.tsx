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
  const [chatOpen, setChatOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    checkHealth();
    fetchRadar();
    fetchDocCount();
  }, []);

  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_BASE}/health`);
      setApiStatus(res.ok ? "online" : "offline");
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
    setChatOpen(true);
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
      setRadarSummary("Waiting for API connection...");
    }
    setRadarLoading(false);
  };

  const sourceColors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    HuggingFace: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20", dot: "bg-yellow-400" },
    GitHub: { bg: "bg-zinc-500/10", text: "text-zinc-300", border: "border-zinc-500/20", dot: "bg-zinc-300" },
    "LangChain Blog": { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", dot: "bg-emerald-400" },
    "Lilian Weng": { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", dot: "bg-blue-400" },
    "Simon Willison": { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20", dot: "bg-orange-400" },
    "Latent Space": { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/20", dot: "bg-pink-400" },
    "Anthropic Blog": { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", dot: "bg-amber-400" },
  };
  const moreColors: Record<string, typeof defaultColor> = {
    "OpenAI Blog": { bg: "bg-teal-500/10", text: "text-teal-400", border: "border-teal-500/20", dot: "bg-teal-400" },
    "AI News": { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20", dot: "bg-red-400" },
    "DeepLearning.AI": { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20", dot: "bg-cyan-400" },
  };
  const getColorForSource = (s: string) => {
    return sourceColors[s] || moreColors[s] || defaultColor;
  };
  const defaultColor = { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20", dot: "bg-purple-400" };
  const getColor = (s: string) => getColorForSource(s);

  const sourceCounts = radarItems.reduce((acc, item) => {
    acc[item.source] = (acc[item.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const techStack = [
    { name: "LangChain", desc: "Agent Framework", color: "emerald" },
    { name: "LangGraph", desc: "Workflow Engine", color: "blue" },
    { name: "Ollama", desc: "Local LLM", color: "purple" },
    { name: "FAISS", desc: "Vector Search", color: "yellow" },
    { name: "FastAPI", desc: "REST API", color: "emerald" },
    { name: "Next.js", desc: "Frontend", color: "blue" },
    { name: "MCP", desc: "Tool Protocol", color: "purple" },
    { name: "Docker", desc: "Deployment", color: "yellow" },
  ];

  const queryCount = messages.filter((m) => m.role === "user").length;

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0f] text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800/60 bg-[#0a0a0f] sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-sm font-bold shadow-lg shadow-emerald-500/20">A</div>
            <div>
              <h1 className="text-base font-semibold tracking-tight">AI Lab</h1>
              <p className="text-[10px] text-zinc-500 leading-none mt-0.5">RAG Agent + Tech Radar Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 bg-zinc-900/50 border border-zinc-800/50 rounded-full px-3 py-1">
              <div className={`w-1.5 h-1.5 rounded-full ${apiStatus === "online" ? "bg-emerald-400 shadow-sm shadow-emerald-400/50" : "bg-red-400"}`} />
              <span className="text-zinc-400">{apiStatus === "online" ? "Ollama LLaMA3" : "Offline"}</span>
            </div>
            <a href="https://github.com/arvin-crypto/ai-lab" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-300 transition-colors hidden sm:block">github.com/arvin-crypto/ai-lab</a>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-5 flex-1">
        {/* Row 1: Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Tech Sources", value: Object.keys(sourceCounts).length || "-", sub: "active feeds", color: "emerald", icon: "📡" },
            { label: "Items Tracked", value: radarItems.length || "-", sub: "latest trends", color: "purple", icon: "📊" },
            { label: "RAG Documents", value: docCount || "-", sub: "indexed", color: "blue", icon: "📄" },
            { label: "Agent Queries", value: queryCount || "-", sub: "this session", color: "yellow", icon: "🤖" },
          ].map((s) => (
            <div key={s.label} className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl p-4 hover:border-zinc-700/60 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-zinc-500 font-medium">{s.label}</span>
                <span className="text-base">{s.icon}</span>
              </div>
              <div className={`text-2xl font-bold ${s.color === "emerald" ? "text-emerald-400" : s.color === "purple" ? "text-purple-400" : s.color === "blue" ? "text-blue-400" : "text-yellow-400"}`}>
                {s.value}
              </div>
              <div className="text-[10px] text-zinc-600 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Row 2: Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Column 1: AI Summary + Sources (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            {/* AI Summary */}
            <div className="bg-gradient-to-b from-purple-500/[0.07] to-transparent border border-zinc-800/40 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-purple-500/20 flex items-center justify-center text-[10px]">AI</span>
                  Summary
                </h2>
                <button onClick={fetchRadar} disabled={radarLoading} className="text-[10px] text-purple-400 hover:text-purple-300 disabled:text-zinc-600 transition-colors">
                  {radarLoading ? "scanning..." : "refresh"}
                </button>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">
                {radarSummary || "Connecting to AI..."}
              </p>
            </div>

            {/* Source Breakdown */}
            <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl p-5">
              <h3 className="text-xs font-semibold text-zinc-500 mb-3 uppercase tracking-wider">Sources</h3>
              <div className="space-y-2">
                {Object.entries(sourceCounts).length > 0 ? (
                  Object.entries(sourceCounts).map(([source, count]) => {
                    const c = getColor(source);
                    const pct = Math.round((count / radarItems.length) * 100);
                    return (
                      <div key={source}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${c.dot}`} />
                            <span className="text-xs text-zinc-300">{source}</span>
                          </div>
                          <span className="text-[10px] text-zinc-500">{count} ({pct}%)</span>
                        </div>
                        <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${c.dot}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-zinc-600">Waiting for data...</p>
                )}
              </div>
            </div>

            {/* Tech Stack */}
            <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl p-5">
              <h3 className="text-xs font-semibold text-zinc-500 mb-3 uppercase tracking-wider">Tech Stack</h3>
              <div className="grid grid-cols-2 gap-2">
                {techStack.map((t) => (
                  <div key={t.name} className="flex items-center gap-2 py-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${t.color === "emerald" ? "bg-emerald-400" : t.color === "blue" ? "bg-blue-400" : t.color === "purple" ? "bg-purple-400" : "bg-yellow-400"}`} />
                    <div>
                      <div className="text-xs text-zinc-300 font-medium leading-none">{t.name}</div>
                      <div className="text-[9px] text-zinc-600 leading-none mt-0.5">{t.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Trending Feed (5 cols) */}
          <div className="lg:col-span-5">
            <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl">
              <div className="px-5 py-4 border-b border-zinc-800/40 flex items-center justify-between">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <span className="text-base">🔥</span> Trending
                  <span className="text-[10px] text-zinc-600 font-normal ml-1">{radarItems.length} items</span>
                </h2>
              </div>
              <div className="divide-y divide-zinc-800/30 max-h-[600px] overflow-y-auto">
                {radarItems.length > 0 ? radarItems.map((item, i) => {
                  const c = getColor(item.source);
                  return (
                    <a
                      key={i}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 px-5 py-3 hover:bg-zinc-800/20 transition-colors group"
                    >
                      <span className="text-[10px] text-zinc-700 w-4 pt-0.5 text-right shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`${c.bg} ${c.text} ${c.border} border rounded px-1.5 py-px text-[9px] font-medium`}>
                            {item.source}
                          </span>
                          <span className="text-[9px] text-zinc-700">{item.date}</span>
                        </div>
                        <p className="text-xs text-zinc-300 group-hover:text-zinc-100 truncate transition-colors">{item.title}</p>
                        {item.description && (
                          <p className="text-[10px] text-zinc-600 truncate mt-0.5">{item.description.slice(0, 80)}</p>
                        )}
                      </div>
                    </a>
                  );
                }) : (
                  <div className="px-5 py-12 text-center">
                    <div className="text-3xl mb-2 opacity-30">📡</div>
                    <p className="text-xs text-zinc-600">Scanning for trends...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Column 3: AI Agent Chat (3 cols) */}
          <div className="lg:col-span-3">
            <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl flex flex-col lg:sticky lg:top-20" style={{ height: "calc(100vh - 200px)", minHeight: "500px" }}>
              {/* Chat Header */}
              <div className="px-4 py-3 border-b border-zinc-800/40 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-[10px]">🤖</div>
                  <span className="text-sm font-semibold">Agent</span>
                </div>
                <span className="text-[9px] text-zinc-600">RAG + LangGraph</span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full px-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-lg mb-3">🤖</div>
                    <p className="text-[11px] text-zinc-500 text-center mb-4">Ask me about your documents</p>
                    <div className="flex flex-col gap-1.5 w-full">
                      {["What is RAG?", "Summarize MCP protocol", "What are AI Agents?"].map((q) => (
                        <button
                          key={q}
                          onClick={() => setInput(q)}
                          className="w-full px-3 py-2 text-[11px] rounded-lg border border-zinc-800/60 text-zinc-400 hover:border-emerald-500/30 hover:text-emerald-400 hover:bg-emerald-500/5 transition-all text-left"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[90%] px-3 py-2 rounded-xl text-[11px] leading-relaxed ${
                      msg.role === "user"
                        ? "bg-emerald-500/15 text-emerald-100"
                        : "bg-zinc-800/60 text-zinc-300"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-zinc-800/60 px-3 py-2 rounded-xl text-[11px] text-zinc-500">
                      <span className="inline-flex gap-1">
                        <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
                        <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
                        <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
                      </span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-zinc-800/40 shrink-0">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Ask anything..."
                    className="flex-1 bg-zinc-900/80 border border-zinc-800/60 rounded-lg px-3 py-2 text-[11px] text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40 transition-colors"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-lg text-[11px] font-medium transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Architecture */}
        <div className="mt-5 bg-zinc-900/40 border border-zinc-800/40 rounded-xl p-5">
          <h3 className="text-xs font-semibold text-zinc-500 mb-4 uppercase tracking-wider">System Architecture</h3>
          <div className="flex flex-wrap items-center justify-center gap-3 text-[10px]">
            {[
              { from: "User Query", to: "FastAPI", color: "zinc" },
              { from: "FastAPI", to: "LangGraph Agent", color: "emerald" },
              { from: "LangGraph Agent", to: "Tool Router", color: "blue" },
              { from: "Tool Router", to: "FAISS Search", color: "purple" },
              { from: "Tool Router", to: "Summarizer", color: "purple" },
              { from: "Tool Router", to: "Translator", color: "purple" },
              { from: "FAISS Search", to: "Ollama LLM", color: "yellow" },
              { from: "Ollama LLM", to: "Answer", color: "emerald" },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="bg-zinc-800 border border-zinc-700/50 rounded-md px-2.5 py-1.5 text-zinc-300">{step.from}</span>
                <span className="text-zinc-700">→</span>
                <span className={`rounded-md px-2.5 py-1.5 border ${
                  step.color === "emerald" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                  step.color === "blue" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                  step.color === "purple" ? "bg-purple-500/10 border-purple-500/20 text-purple-400" :
                  step.color === "yellow" ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" :
                  "bg-zinc-800 border-zinc-700/50 text-zinc-300"
                }`}>{step.to}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-800/30 px-4 sm:px-6 py-3 mt-4">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-zinc-600">
          <span>Built with Next.js + LangChain + LangGraph + Ollama + FAISS + FastAPI</span>
          <div className="flex items-center gap-3">
            <span>Jun-Long Ye</span>
            <a href="https://github.com/arvin-crypto/ai-lab" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-300 transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

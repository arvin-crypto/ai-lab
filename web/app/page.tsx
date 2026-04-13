"use client";

import { useState, useRef, useEffect } from "react";
import { Radio, TrendingUp, FileText, Bot, Flame, GitBranch, Brain, Wrench, Mic, Sparkles, Newspaper, GraduationCap, Rss, Cpu, Globe, Workflow, Search, MessageSquare, Layers, Activity, Zap, Box } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Message { role: "user" | "assistant"; content: string }
interface GroupedData { [source: string]: { title: string; url: string; description: string; date: string }[] }

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [grouped, setGrouped] = useState<GroupedData>({});
  const [summary, setSummary] = useState("");
  const [totalItems, setTotalItems] = useState(0);
  const [totalSources, setTotalSources] = useState(0);
  const [radarLoading, setRadarLoading] = useState(false);
  const [docCount, setDocCount] = useState(0);
  const [apiStatus, setApiStatus] = useState<"online" | "offline" | "checking">("checking");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { checkHealth(); fetchRadar(); fetchDocCount(); }, []);

  const checkHealth = async () => {
    try { const r = await fetch(`${API_BASE}/health`); setApiStatus(r.ok ? "online" : "offline"); }
    catch { setApiStatus("offline"); }
  };

  const fetchDocCount = async () => {
    try { const r = await fetch(`${API_BASE}/documents`); const d = await r.json(); setDocCount(d.count || 0); }
    catch { /* ignore */ }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    setMessages((p) => [...p, { role: "user", content: input }]);
    setInput(""); setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/ask`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: input }) });
      const d = await r.json();
      setMessages((p) => [...p, { role: "assistant", content: d.answer || "No response." }]);
    } catch { setMessages((p) => [...p, { role: "assistant", content: "API connection failed." }]); }
    setLoading(false);
  };

  const fetchRadar = async () => {
    setRadarLoading(true);
    try {
      const r = await fetch(`${API_BASE}/tech-radar`);
      const d = await r.json();
      setGrouped(d.grouped || {});
      setSummary(d.summary || "");
      setTotalItems(d.total || 0);
      setTotalSources(d.sources || 0);
    } catch { setSummary("Waiting for API..."); }
    setRadarLoading(false);
    fetchDocCount();
  };

  const sourceStyle: Record<string, { dot: string; bg: string; text: string; border: string; icon: React.ReactNode }> = {
    HuggingFace:      { dot: "bg-yellow-400",  bg: "bg-yellow-500/8",  text: "text-yellow-400",  border: "border-yellow-500/15", icon: <Cpu size={14} /> },
    GitHub:           { dot: "bg-zinc-300",     bg: "bg-zinc-500/8",    text: "text-zinc-300",    border: "border-zinc-500/15",   icon: <GitBranch size={14} /> },
    "LangChain Blog": { dot: "bg-emerald-400", bg: "bg-emerald-500/8", text: "text-emerald-400", border: "border-emerald-500/15", icon: <Workflow size={14} /> },
    "Lilian Weng":    { dot: "bg-blue-400",    bg: "bg-blue-500/8",    text: "text-blue-400",    border: "border-blue-500/15",   icon: <Brain size={14} /> },
    "Simon Willison": { dot: "bg-orange-400",  bg: "bg-orange-500/8",  text: "text-orange-400",  border: "border-orange-500/15", icon: <Wrench size={14} /> },
    "Latent Space":   { dot: "bg-pink-400",    bg: "bg-pink-500/8",    text: "text-pink-400",    border: "border-pink-500/15",   icon: <Mic size={14} /> },
    "Anthropic Blog": { dot: "bg-amber-400",   bg: "bg-amber-500/8",   text: "text-amber-400",   border: "border-amber-500/15",  icon: <Sparkles size={14} /> },
    "OpenAI Blog":    { dot: "bg-teal-400",    bg: "bg-teal-500/8",    text: "text-teal-400",    border: "border-teal-500/15",   icon: <Globe size={14} /> },
    "AI News":        { dot: "bg-red-400",     bg: "bg-red-500/8",     text: "text-red-400",     border: "border-red-500/15",    icon: <Newspaper size={14} /> },
    "DeepLearning.AI":{ dot: "bg-cyan-400",    bg: "bg-cyan-500/8",    text: "text-cyan-400",    border: "border-cyan-500/15",   icon: <GraduationCap size={14} /> },
  };
  const defaultStyle = { dot: "bg-purple-400", bg: "bg-purple-500/8", text: "text-purple-400", border: "border-purple-500/15", icon: <Rss size={14} /> };
  const getStyle = (s: string) => sourceStyle[s] || defaultStyle;

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
            <a href="https://github.com/arvin-crypto/ai-lab" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-300 transition-colors hidden sm:block">GitHub</a>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-5 flex-1">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Sources", value: totalSources || "-", sub: "active feeds", color: "text-emerald-400", icon: <Radio size={16} className="text-emerald-400/50" /> },
            { label: "Items Tracked", value: totalItems || "-", sub: "latest trends", color: "text-purple-400", icon: <TrendingUp size={16} className="text-purple-400/50" /> },
            { label: "RAG Documents", value: docCount || "-", sub: "indexed", color: "text-blue-400", icon: <FileText size={16} className="text-blue-400/50" /> },
            { label: "Agent Queries", value: queryCount || "-", sub: "this session", color: "text-yellow-400", icon: <MessageSquare size={16} className="text-yellow-400/50" /> },
          ].map((s) => (
            <div key={s.label} className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-zinc-500 font-medium">{s.label}</span>
                {s.icon}
              </div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-zinc-600 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* AI Summary */}
        <div className="bg-gradient-to-r from-purple-500/[0.06] to-emerald-500/[0.06] border border-zinc-800/40 rounded-xl p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-purple-500/20 flex items-center justify-center"><Sparkles size={10} className="text-purple-400" /></span>
              Tech Radar Summary
            </h2>
            <button onClick={fetchRadar} disabled={radarLoading} className="text-[10px] text-purple-400 hover:text-purple-300 disabled:text-zinc-600 px-3 py-1 border border-purple-500/20 rounded-lg hover:bg-purple-500/10 transition-all">
              {radarLoading ? "scanning..." : "Refresh All"}
            </button>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">{summary || "Loading AI summary..."}</p>
        </div>

        {/* Main: Source Cards Grid + Agent Chat */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Source Cards Grid (9 cols) */}
          <div className="lg:col-span-9">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Object.entries(grouped).length > 0 ? (
                Object.entries(grouped).map(([source, items]) => {
                  const s = getStyle(source);
                  return (
                    <div key={source} className={`${s.bg} border ${s.border} rounded-xl overflow-hidden`}>
                      {/* Card Header */}
                      <div className="px-4 py-3 border-b border-zinc-800/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={s.text}>{s.icon}</span>
                          <span className={`text-xs font-semibold ${s.text}`}>{source}</span>
                        </div>
                        <span className="text-[10px] text-zinc-600">{items.length} items</span>
                      </div>
                      {/* Card Items */}
                      <div className="divide-y divide-zinc-800/20 max-h-[280px] overflow-y-auto">
                        {items.slice(0, 8).map((item, i) => (
                          <a
                            key={i}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-2.5 px-4 py-2.5 hover:bg-white/[0.03] transition-colors group"
                          >
                            <span className={`w-1 h-1 rounded-full ${s.dot} mt-1.5 shrink-0`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] text-zinc-300 group-hover:text-zinc-100 leading-snug truncate transition-colors">
                                {item.title}
                              </p>
                              {item.description && (
                                <p className="text-[9px] text-zinc-600 truncate mt-0.5">{item.description.slice(0, 80)}</p>
                              )}
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                /* Loading skeleton */
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-zinc-900/30 border border-zinc-800/30 rounded-xl h-[200px] animate-pulse" />
                ))
              )}
            </div>

            {/* Tech Stack + Architecture */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
              {/* Tech Stack */}
              <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl p-5">
                <h3 className="text-xs font-semibold text-zinc-500 mb-3 uppercase tracking-wider">Tech Stack</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {techStack.map((t) => (
                    <div key={t.name} className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${t.color === "emerald" ? "bg-emerald-400" : t.color === "blue" ? "bg-blue-400" : t.color === "purple" ? "bg-purple-400" : "bg-yellow-400"}`} />
                      <div>
                        <div className="text-[11px] text-zinc-300 font-medium leading-none">{t.name}</div>
                        <div className="text-[9px] text-zinc-600 leading-none mt-0.5">{t.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Architecture */}
              <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl p-5">
                <h3 className="text-xs font-semibold text-zinc-500 mb-3 uppercase tracking-wider">Architecture</h3>
                <div className="flex flex-col gap-2 text-[10px]">
                  {[
                    { label: "Input", nodes: ["User Query", "Document Upload"] },
                    { label: "API", nodes: ["FastAPI Server"] },
                    { label: "Agent", nodes: ["LangGraph Router", "Tool Selection"] },
                    { label: "Tools", nodes: ["FAISS Search", "Summarizer", "Translator"] },
                    { label: "LLM", nodes: ["Ollama (LLaMA3)"] },
                    { label: "Output", nodes: ["Structured Answer"] },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center gap-2">
                      <span className="text-zinc-600 w-10 text-right shrink-0">{row.label}</span>
                      <span className="text-zinc-700">→</span>
                      <div className="flex gap-1.5 flex-wrap">
                        {row.nodes.map((n) => (
                          <span key={n} className="bg-zinc-800/80 border border-zinc-700/30 rounded px-2 py-0.5 text-zinc-400">{n}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI Agent Chat (3 cols) */}
          <div className="lg:col-span-3">
            <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl flex flex-col lg:sticky lg:top-20" style={{ height: "calc(100vh - 200px)", minHeight: "500px" }}>
              <div className="px-4 py-3 border-b border-zinc-800/40 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center"><Bot size={12} className="text-emerald-400" /></div>
                  <span className="text-sm font-semibold">Agent</span>
                </div>
                <span className="text-[9px] text-zinc-600">RAG + LangGraph</span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full px-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3"><Bot size={20} className="text-emerald-400" /></div>
                    <p className="text-[11px] text-zinc-500 text-center mb-4">Ask about uploaded documents</p>
                    <div className="flex flex-col gap-1.5 w-full">
                      {["What is RAG?", "Summarize MCP protocol", "What are AI Agents?"].map((q) => (
                        <button key={q} onClick={() => setInput(q)} className="w-full px-3 py-2 text-[11px] rounded-lg border border-zinc-800/60 text-zinc-400 hover:border-emerald-500/30 hover:text-emerald-400 hover:bg-emerald-500/5 transition-all text-left">
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[90%] px-3 py-2 rounded-xl text-[11px] leading-relaxed ${msg.role === "user" ? "bg-emerald-500/15 text-emerald-100" : "bg-zinc-800/60 text-zinc-300"}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-zinc-800/60 px-3 py-2 rounded-xl text-[11px] text-zinc-500">
                      <span className="inline-flex gap-0.5"><span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span><span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span><span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span></span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-3 border-t border-zinc-800/40 shrink-0">
                <div className="flex gap-2">
                  <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Ask anything..." className="flex-1 bg-zinc-900/80 border border-zinc-800/60 rounded-lg px-3 py-2 text-[11px] text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/40 transition-colors" />
                  <button onClick={sendMessage} disabled={loading || !input.trim()} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-lg text-[11px] font-medium transition-colors">
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-zinc-800/30 px-4 sm:px-6 py-3 mt-4">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-zinc-600">
          <span>Next.js + LangChain + LangGraph + Ollama + FAISS + FastAPI</span>
          <div className="flex items-center gap-3">
            <span>Jun-Long Ye</span>
            <a href="https://github.com/arvin-crypto/ai-lab" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-300 transition-colors">github.com/arvin-crypto/ai-lab</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

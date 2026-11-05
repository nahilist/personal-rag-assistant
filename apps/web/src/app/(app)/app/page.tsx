"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  UploadCloud,
  FileCheck,
  ArrowRight,
  Clock,
  Sparkles,
  FileText,
  Trash2,
  Plus,
  ArrowUpRight,
  Paperclip,
  Mic,
  Crosshair,
  Lightbulb,
  Clapperboard,
  BarChart3,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { DocumentUploadModal } from "@/components/documents/DocumentUploadModal";
import { api } from "@/lib/api/client";
import { DocumentItem, Conversation } from "@/types";

export default function AssistantHomePage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingConvId, setDeletingConvId] = useState<string | null>(null);

  // Quick query state matching the landing page mobile hero
  const [inputQuery, setInputQuery] = useState("");
  const [modelMode, setModelMode] = useState<"Auto" | "Grounded" | "Deep">("Auto");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const promptSuggestions = [
    { label: "Generate ideas", icon: Lightbulb, query: "Generate ideas for document synthesis and vector indexing" },
    { label: "Motion concept", icon: Clapperboard, query: "Summarize the key architectural principles and pipeline contracts" },
    { label: "Market analysis", icon: BarChart3, query: "Analyze the technical benchmarks and system latency guarantees" },
  ];

  const loadData = () => {
    setIsLoading(true);
    Promise.all([
      api.listDocuments().catch(() => ({ items: [], total: 0 })),
      api.listConversations().catch(() => ({ items: [], total: 0 })),
    ])
      .then(([docRes, convRes]) => {
        setDocuments(Array.isArray(docRes?.items) ? docRes.items : []);
        setConversations(Array.isArray(convRes?.items) ? convRes.items : []);
      })
      .catch(() => {
        setDocuments([]);
        setConversations([]);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartChat = async (initialPrompt?: string, docId?: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const title = initialPrompt
        ? initialPrompt.slice(0, 32) + (initialPrompt.length > 32 ? "..." : "")
        : "Grounded Session";
      const conv = await api.createConversation(title, docId ? [docId] : []);
      if (conv?.id) {
        if (initialPrompt) {
          sessionStorage.setItem(`pending_prompt_${conv.id}`, initialPrompt);
        }
        router.push(`/app/chat/${conv.id}`);
      }
    } catch (err: any) {
      alert(err.message || "Failed to initialize conversation.");
      setIsSubmitting(false);
    }
  };

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;
    handleStartChat(inputQuery.trim());
  };

  const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this conversation? This will permanently remove all chat history and citations.")) {
      return;
    }

    setDeletingConvId(convId);
    try {
      await api.deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
    } catch (err: any) {
      alert(err.message || "Failed to delete conversation.");
    } finally {
      setDeletingConvId(null);
    }
  };

  const readyDocs = Array.isArray(documents)
    ? documents.filter((d) => d.status === "ready")
    : [];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-12">
      
      {/* Hero: Minimalist Atmospheric Mobile App Screen Aesthetic */}
      <div className="relative rounded-[36px] bg-[#090A0F] border border-white/[0.08] p-8 sm:p-14 overflow-hidden text-center shadow-2xl">
        
        {/* Subtle Ambient Spotlight Cone */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 sm:w-96 h-80 spotlight-cone opacity-70 pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Minimal Badge */}
        <div className="relative z-10 flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-medium text-slate-300 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Grounded Knowledge Base · 2026</span>
          </div>
        </div>

        {/* Center Glowing Geometric Bowtie Emblem */}
        <div className="relative z-10 flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-white/25 rounded-full blur-2xl transform scale-125 pointer-events-none" />
            <svg
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-20 h-20 text-white relative z-10 glow-symbol hover:scale-105 transition-transform duration-300"
            >
              <path
                d="M 28 28 L 72 72 L 72 28 L 28 72 Z"
                stroke="white"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Headline & Subtitle */}
        <div className="relative z-10 max-w-2xl mx-auto space-y-3">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            How can I help you today?
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xl mx-auto">
            Ask questions across {readyDocs.length} ready private documents with verifiable chunk citations, zero hallucination, and cryptographic tenant isolation.
          </p>
        </div>

        {/* Interactive Query Input Box (Exact Mobile App UI Spec) */}
        <div className="relative z-10 max-w-2xl mx-auto mt-8">
          <form
            onSubmit={handleHeroSubmit}
            className="rounded-2xl sm:rounded-3xl bg-[#07080B]/90 border border-white/15 p-3 sm:p-4 backdrop-blur-2xl shadow-2xl text-left transition-all focus-within:border-white/30"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="What do you want to know?"
              className="w-full bg-transparent text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none px-2 py-1.5"
            />

            <div className="flex items-center justify-between pt-3 mt-2 border-t border-white/[0.06]">
              {/* Left Controls: Mode & Tools */}
              <div className="flex items-center gap-2">
                {/* Auto Mode Dropdown Pill */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs text-slate-300 transition-all font-medium"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-white/80" />
                    <span>{modelMode}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {isModelDropdownOpen && (
                    <div className="absolute left-0 bottom-full mb-2 w-36 rounded-xl bg-[#090A0F] border border-white/15 p-1 shadow-2xl z-30">
                      {(["Auto", "Grounded", "Deep"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            setModelMode(mode);
                            setIsModelDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${
                            modelMode === mode
                              ? "bg-white text-black font-semibold"
                              : "text-slate-300 hover:bg-white/[0.06]"
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsUploadOpen(true)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors"
                  title="Upload document"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors hidden sm:inline-block"
                  title="Voice input"
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors hidden sm:inline-block"
                  title="Focus mode"
                >
                  <Crosshair className="w-4 h-4" />
                </button>
              </div>

              {/* Submit Action Button */}
              <button
                type="submit"
                disabled={isSubmitting || !inputQuery.trim()}
                className="w-9 h-9 rounded-xl bg-white text-black hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-md active:scale-95"
              >
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </form>

          {/* Quick Prompt Pills (Matching Slide 1 Mobile Spec) */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            {promptSuggestions.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setInputQuery(item.query);
                  handleStartChat(item.query);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-xs text-slate-300 hover:text-white transition-all shadow-sm"
              >
                <item.icon className="w-3.5 h-3.5 text-slate-400" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metric Cards (Matching Slide 1/2 Metadata Card Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-2xl bg-[#090A0F] border border-white/[0.08] p-6 text-left shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Ready Documents</span>
            <FileCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-white tracking-tight">{readyDocs.length}</p>
          <p className="text-xs text-slate-500 mt-1 font-mono">Isolated tenant partitions</p>
        </div>

        <div className="rounded-2xl bg-[#090A0F] border border-white/[0.08] p-6 text-left shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Saved Sessions</span>
            <MessageSquare className="w-4 h-4 text-white/80" />
          </div>
          <p className="text-3xl font-black text-white tracking-tight">{conversations.length}</p>
          <p className="text-xs text-slate-500 mt-1 font-mono">Grounded vector chats</p>
        </div>

        <div className="rounded-2xl bg-[#090A0F] border border-white/[0.08] p-6 text-left shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pipeline Queue</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-black text-white tracking-tight">
            {(Array.isArray(documents) ? documents : []).filter((d) =>
              ["queued", "extracting", "chunking", "embedding"].includes(d.status)
            ).length}
          </p>
          <p className="text-xs text-slate-500 mt-1 font-mono">Background tasks running</p>
        </div>
      </div>

      {/* Recent Conversations Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-white">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">Recent Grounded Conversations</h2>
          </div>
          <Button size="sm" variant="outline" onClick={() => handleStartChat()}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> New Chat
          </Button>
        </div>

        {conversations.length === 0 ? (
          <Card className="text-center py-12 border-dashed border-white/[0.1]">
            <p className="text-sm font-semibold text-white">No active conversations yet</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Query your indexed files with real-time verifiable chunk citations.
            </p>
            <Button size="sm" onClick={() => handleStartChat()}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Start First Conversation
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {conversations.slice(0, 6).map((conv) => (
              <div
                key={conv.id}
                className="group relative rounded-2xl bg-[#090A0F] border border-white/[0.08] hover:border-white/20 p-5 transition-all duration-200 flex flex-col justify-between shadow-lg"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                      ID: {conv.id.slice(0, 6)}
                    </span>
                    <button
                      type="button"
                      disabled={deletingConvId === conv.id}
                      onClick={(e) => handleDeleteConversation(e, conv.id)}
                      className="p-1 text-slate-500 hover:text-red-400 hover:bg-white/[0.06] rounded-md transition-all opacity-0 group-hover:opacity-100"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h4 className="text-sm font-semibold text-white truncate group-hover:text-slate-200 transition-colors">
                    {conv.title || "Untitled Conversation"}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono mt-1">
                    {new Date(conv.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                  <Link
                    href={`/app/chat/${conv.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-white hover:text-slate-300 transition-colors"
                  >
                    <span>Open chat</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Document Library Preview Strip */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-white">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">Document Repository</h2>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="outline" onClick={() => setIsUploadOpen(true)}>
              <UploadCloud className="w-3.5 h-3.5 mr-1.5" /> Upload Document
            </Button>
            <Link
              href="/app/documents"
              className="text-xs font-semibold text-slate-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {documents.length === 0 ? (
          <Card className="text-center py-12 border-dashed border-white/[0.1]">
            <p className="text-sm font-semibold text-white">No documents uploaded yet</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Upload PDF, Word (DOCX), Markdown or Text files to ground your assistant.
            </p>
            <Button size="sm" onClick={() => setIsUploadOpen(true)}>
              <UploadCloud className="w-3.5 h-3.5 mr-1.5" /> Upload First Document
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.slice(0, 4).map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-[#090A0F] border border-white/[0.08] hover:border-white/20 transition-all shadow-md group"
              >
                <div className="space-y-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-white truncate group-hover:text-slate-200 transition-colors">
                      {doc.title}
                    </p>
                    <StatusBadge status={doc.status} />
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {(doc.byte_size / 1024).toFixed(1)} KB • Gen {doc.active_generation}
                  </p>
                </div>
                {doc.status === "ready" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStartChat(undefined, doc.id)}
                  >
                    Chat
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}

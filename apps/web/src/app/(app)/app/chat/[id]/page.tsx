"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Send,
  Square,
  Sparkles,
  Globe,
  Trash2,
  AlertCircle,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  Lightbulb,
  Clapperboard,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessageItem } from "@/components/chat/MessageItem";
import { CitationDrawer } from "@/components/chat/CitationDrawer";
import { api } from "@/lib/api/client";
import { streamChatMessage } from "@/lib/streaming/chatStream";
import { Message, MessageSource, DocumentItem } from "@/types";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params?.id as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [language, setLanguage] = useState<string>("en");
  const [inputText, setInputText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeSource, setActiveSource] = useState<MessageSource | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!conversationId) return;

    // Load initial messages and available ready documents
    api.getConversationMessages(conversationId)
      .then((res) => {
        if (Array.isArray(res?.items)) {
          setMessages(res.items);
          // If no messages and there's a pending prompt from the home hero, auto-send
          if (res.items.length === 0 && typeof window !== "undefined") {
            const pending = sessionStorage.getItem(`pending_prompt_${conversationId}`);
            if (pending) {
              sessionStorage.removeItem(`pending_prompt_${conversationId}`);
              setTimeout(() => {
                handleSendMessage(pending);
              }, 200);
            }
          }
        }
      })
      .catch((err) => setErrorMsg(err.message));

    api.listDocuments()
      .then((res) => {
        const items = Array.isArray(res?.items) ? res.items : [];
        const ready = items.filter((d) => d.status === "ready");
        setDocuments(ready);
      })
      .catch(() => {});
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  const handleSendMessage = async (textToSend?: string) => {
    const queryText = (textToSend || inputText).trim();
    if (!queryText || isStreaming) return;

    setInputText("");
    setErrorMsg(null);

    const clientMsgId = crypto.randomUUID();
    const asstMsgId = crypto.randomUUID();
    const requestKey = crypto.randomUUID();

    // Optimistically append user message
    const userMsg: Message = {
      id: clientMsgId,
      conversation_id: conversationId,
      role: "user",
      content: queryText,
      status: "completed",
      created_at: new Date().toISOString(),
    };

    // Optimistically append streaming assistant placeholder
    const assistantPlaceholder: Message = {
      id: asstMsgId,
      conversation_id: conversationId,
      role: "assistant",
      content: "",
      status: "streaming",
      created_at: new Date().toISOString(),
      sources: [],
    };

    setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
    setIsStreaming(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let accumulatedDelta = "";
    let retrievedSources: MessageSource[] = [];

    await streamChatMessage({
      conversationId,
      requestKey,
      message: queryText,
      documentIds: selectedDocIds.length > 0 ? selectedDocIds : undefined,
      language,
      signal: abortController.signal,
      onDelta: (text) => {
        accumulatedDelta += text;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === asstMsgId ? { ...m, content: accumulatedDelta } : m
          )
        );
      },
      onSources: (sources) => {
        retrievedSources = sources;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === asstMsgId ? { ...m, sources: sources } : m
          )
        );
      },
      onDone: (status) => {
        setIsStreaming(false);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === asstMsgId
              ? {
                  ...m,
                  status: status === "cancelled" ? "cancelled" : "completed",
                  content:
                    status === "cancelled"
                      ? accumulatedDelta + " [Generation Stopped]"
                      : accumulatedDelta,
                  sources: retrievedSources,
                }
              : m
          )
        );
        abortControllerRef.current = null;
      },
      onError: (err) => {
        setIsStreaming(false);
        setErrorMsg(err.message || "Streaming failed.");
        setMessages((prev) =>
          prev.map((m) =>
            m.id === asstMsgId
              ? {
                  ...m,
                  status: "failed",
                  content: "Sorry, an error occurred while generating the answer.",
                }
              : m
          )
        );
        abortControllerRef.current = null;
      },
    });
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleDeleteConversation = async () => {
    if (!confirm("Are you sure you want to permanently delete this conversation and all citations?")) {
      return;
    }
    try {
      await api.deleteConversation(conversationId);
      router.push("/app");
    } catch {
      alert("Failed to delete conversation.");
    }
  };

  const toggleDocScope = (docId: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const samplePrompts = [
    { label: "Generate ideas", icon: Lightbulb, query: "Generate ideas for document synthesis and vector indexing" },
    { label: "Motion concept", icon: Clapperboard, query: "Summarize the key architectural principles and pipeline contracts" },
    { label: "Market analysis", icon: BarChart3, query: "Analyze the technical benchmarks and system latency guarantees" },
  ];

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#07080B] font-sans">
      
      {/* Chat Header */}
      <div className="h-16 px-4 sm:px-6 border-b border-white/[0.08] bg-[#090A0F]/90 backdrop-blur-xl flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/app"
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors shrink-0"
            title="Back to Assistant Home"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          
          <div className="w-8 h-8 rounded-xl bg-white/[0.08] border border-white/20 flex items-center justify-center text-white shrink-0 shadow-sm">
            <svg viewBox="0 0 100 100" fill="none" className="w-4 h-4 text-white">
              <path
                d="M 28 28 L 72 72 L 72 28 L 28 72 Z"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="truncate">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-white text-xs sm:text-sm tracking-tight truncate">
                Grounded Assistant Session
              </h2>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/[0.06] text-slate-300 border border-white/10">
                Vector RAG
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono truncate">
              {selectedDocIds.length > 0
                ? `Scoped to ${selectedDocIds.length} document(s)`
                : `Searching all ${documents.length} ready documents`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Language selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/[0.04] border border-white/10 rounded-xl px-2.5 py-1.5 shadow-sm">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="en" className="bg-[#090A0F] text-white">English</option>
              <option value="hindi" className="bg-[#090A0F] text-white">Hindi</option>
              <option value="hinglish" className="bg-[#090A0F] text-white">Hinglish</option>
            </select>
          </div>

          {/* Delete conversation button */}
          <button
            type="button"
            onClick={handleDeleteConversation}
            className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-white/[0.06] border border-white/10 transition-all"
            title="Delete conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Document Scope Filter Bar */}
      {documents.length > 0 && (
        <div className="px-4 sm:px-6 py-2.5 bg-[#090A0F]/50 border-b border-white/[0.06] flex items-center gap-2 overflow-x-auto text-xs shrink-0">
          <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1 text-[11px]">
            <BookOpen className="w-3.5 h-3.5 text-slate-400" /> Scope:
          </span>
          <button
            onClick={() => setSelectedDocIds([])}
            className={`px-3 py-1 rounded-full text-xs transition-all shrink-0 font-medium ${
              selectedDocIds.length === 0
                ? "bg-white text-black shadow-sm"
                : "bg-white/[0.04] text-slate-400 hover:text-white border border-white/10"
            }`}
          >
            All Ready Documents ({documents.length})
          </button>
          {documents.map((doc) => {
            const isSelected = selectedDocIds.includes(doc.id);
            return (
              <button
                key={doc.id}
                onClick={() => toggleDocScope(doc.id)}
                className={`px-3 py-1 rounded-full text-xs transition-all truncate max-w-[180px] shrink-0 font-medium ${
                  isSelected
                    ? "bg-white text-black shadow-sm"
                    : "bg-white/[0.04] text-slate-400 hover:text-white border border-white/10"
                }`}
                title={doc.title}
              >
                {doc.title}
              </button>
            );
          })}
        </div>
      )}

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-6 py-12 relative select-none">
            
            {/* Subtle Ethereal Spotlight Cone */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 spotlight-cone opacity-60 pointer-events-none" />

            {/* Glowing Brand Emblem */}
            <div className="relative z-10">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl transform scale-125 pointer-events-none" />
              <svg
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-16 h-16 text-white relative z-10 glow-symbol hover:scale-105 transition-transform duration-300"
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

            <div className="space-y-2 relative z-10">
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                How can I help you today?
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
                Ask anything from your private knowledge base. Every factual claim is anchored directly to immutable document chunks with citations.
              </p>
            </div>

            {/* Suggested Prompts Pills */}
            <div className="w-full space-y-2 pt-2 relative z-10">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest text-center">
                Suggested exploration:
              </p>
              <div className="flex flex-col gap-2 max-w-md mx-auto">
                {samplePrompts.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(item.query)}
                    className="w-full text-left p-3.5 rounded-2xl bg-[#090A0F] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/20 text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between group shadow-md"
                  >
                    <span className="flex items-center gap-2">
                      <item.icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
                      <span>{item.query}</span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              onSelectSource={(source) => setActiveSource(source)}
            />
          ))
        )}

        {errorMsg && (
          <div className="flex items-center gap-2.5 p-3.5 bg-red-950/40 border border-red-500/30 rounded-2xl text-red-300 text-xs max-w-2xl mx-auto shadow-lg">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Island Composer Area (Matching Mobile App Bottom Bar) */}
      <div className="p-4 bg-gradient-to-t from-[#07080B] via-[#07080B]/90 to-transparent shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="max-w-4xl mx-auto rounded-3xl bg-[#090A0F]/95 border border-white/15 p-3 sm:p-4 backdrop-blur-2xl shadow-2xl flex items-end gap-3 transition-all focus-within:border-white/30"
        >
          <div className="flex-1 relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="What do you want to know? (Shift+Enter for newline)"
              rows={2}
              className="w-full resize-none p-2 text-xs sm:text-sm bg-transparent text-white placeholder-slate-500 focus:outline-none transition-all font-sans"
            />
          </div>

          {isStreaming ? (
            <button
              type="button"
              onClick={handleStopGeneration}
              className="h-10 px-4 rounded-xl bg-red-600/90 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md active:scale-95 shrink-0"
              title="Stop streaming generation"
            >
              <Square className="w-3.5 h-3.5 mr-1" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-10 h-10 rounded-xl bg-white text-black hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-md active:scale-95 shrink-0"
            >
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </form>
      </div>

      {/* Citation Slide-Out Drawer */}
      <CitationDrawer
        source={activeSource}
        onClose={() => setActiveSource(null)}
      />
    </div>
  );
}

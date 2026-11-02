"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Send,
  Square,
  Sparkles,
  Globe,
  Trash2,
  AlertCircle,
  FileText,
  HelpCircle,
  BookOpen,
  ArrowRight,
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
        if (Array.isArray(res?.items)) setMessages(res.items);
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
    "Summarize the key insights and conclusions across the documents",
    "What are the main requirements and constraints specified?",
    "Extract any risk factors, limits or security policies mentioned",
  ];

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#07090E]">
      {/* Chat Header */}
      <div className="h-16 px-6 border-b border-white/[0.08] bg-[#0C101B]/80 backdrop-blur-xl flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-white text-sm tracking-tight">
                Grounded Assistant Session
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20">
                Vector RAG
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              {selectedDocIds.length > 0
                ? `Scoped to ${selectedDocIds.length} selected document(s)`
                : `Searching all ${documents.length} ready documents`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Language selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/[0.03] border border-white/[0.08] rounded-xl px-2.5 py-1.5">
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="en" className="bg-[#0C101B] text-white">English</option>
              <option value="hindi" className="bg-[#0C101B] text-white">Hindi</option>
              <option value="hinglish" className="bg-[#0C101B] text-white">Hinglish</option>
            </select>
          </div>

          {/* Delete conversation button */}
          <button
            type="button"
            onClick={handleDeleteConversation}
            className="p-2 rounded-xl text-slate-400 hover:text-red-400 bg-white/[0.02] hover:bg-red-500/10 border border-white/[0.08] hover:border-red-500/30 transition-all"
            title="Delete conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Document Scope Filter Bar */}
      {documents.length > 0 && (
        <div className="px-6 py-2.5 bg-white/[0.02] border-b border-white/[0.06] flex items-center gap-2 overflow-x-auto text-xs shrink-0">
          <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1 text-[11px]">
            <BookOpen className="w-3.5 h-3.5 text-blue-400" /> Scope:
          </span>
          <button
            onClick={() => setSelectedDocIds([])}
            className={`px-3 py-1 rounded-full text-xs transition-all shrink-0 ${
              selectedDocIds.length === 0
                ? "bg-blue-600 text-white font-medium shadow-md shadow-blue-600/30 border border-blue-500/40"
                : "bg-white/[0.04] text-slate-400 hover:text-slate-200 border border-white/[0.08]"
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
                className={`px-3 py-1 rounded-full text-xs transition-all truncate max-w-[180px] shrink-0 border ${
                  isSelected
                    ? "bg-blue-600 text-white font-medium shadow-md shadow-blue-600/30 border-blue-500/40"
                    : "bg-white/[0.03] text-slate-400 hover:text-slate-200 border-white/[0.08] hover:border-white/[0.15]"
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
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-6 py-12">
            <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shadow-2xl shadow-blue-500/10">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white tracking-tight">
                Ask anything from your private knowledge base
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
                Every factual assertion is backed by verifiable source citations with similarity scores and page numbers. If evidence is insufficient, the assistant abstains.
              </p>
            </div>

            {/* Prompt Suggestions */}
            <div className="w-full space-y-2 pt-2">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-left px-1">
                Suggested questions:
              </p>
              <div className="grid grid-cols-1 gap-2">
                {samplePrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(prompt)}
                    className="w-full text-left p-3 rounded-2xl bg-[#0C101B]/80 hover:bg-white/[0.06] border border-white/[0.08] hover:border-blue-500/30 text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between group"
                  >
                    <span>{prompt}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
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
          <div className="flex items-center gap-2.5 p-3.5 bg-red-950/30 border border-red-500/30 rounded-2xl text-red-300 text-xs max-w-2xl mx-auto shadow-lg">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer Area */}
      <div className="p-4 bg-[#0C101B]/90 backdrop-blur-xl border-t border-white/[0.08] shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="max-w-4xl mx-auto flex items-end gap-3"
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
              placeholder="Ask a question from your private notes and documents... (Shift+Enter for newline)"
              rows={2}
              className="w-full resize-none p-3.5 text-sm rounded-2xl border border-white/[0.1] bg-white/[0.03] text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/40 transition-all font-sans"
            />
          </div>

          {isStreaming ? (
            <Button
              type="button"
              variant="danger"
              onClick={handleStopGeneration}
              className="h-12 px-5 rounded-2xl"
              title="Stop streaming generation"
            >
              <Square className="w-4 h-4 mr-1.5" /> Stop
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={!inputText.trim()}
              className="h-12 px-6 rounded-2xl"
            >
              <Send className="w-4 h-4" />
            </Button>
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


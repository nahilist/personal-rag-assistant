"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Send,
  Square,
  Sparkles,
  Layers,
  Globe,
  Trash2,
  AlertCircle,
  FileText,
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
      .then((res) => setMessages(res.items))
      .catch((err) => setErrorMsg(err.message));

    api.listDocuments()
      .then((res) => {
        const ready = res.items.filter((d) => d.status === "ready");
        setDocuments(ready);
      })
      .catch(() => {});
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isStreaming) return;

    const queryText = inputText.trim();
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
    if (!confirm("Are you sure you want to delete this conversation?")) return;
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

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Chat Header */}
      <div className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
              Grounded Assistant
            </h2>
            <p className="text-[11px] text-slate-400">
              {selectedDocIds.length > 0
                ? `Scoped to ${selectedDocIds.length} selected document(s)`
                : `Searching all ${documents.length} ready documents`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Language selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="en">English</option>
              <option value="hindi">Hindi</option>
              <option value="hinglish">Hinglish</option>
            </select>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteConversation}
            className="text-slate-400 hover:text-red-600"
            title="Delete conversation"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Document Scope Filter Bar */}
      {documents.length > 0 && (
        <div className="px-6 py-2 bg-slate-100/60 dark:bg-slate-900/40 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-xs shrink-0">
          <span className="text-slate-400 font-semibold shrink-0">Scope:</span>
          <button
            onClick={() => setSelectedDocIds([])}
            className={`px-2.5 py-1 rounded-full text-xs transition-colors shrink-0 ${
              selectedDocIds.length === 0
                ? "bg-blue-600 text-white font-medium"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
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
                className={`px-2.5 py-1 rounded-full text-xs transition-colors truncate max-w-[160px] shrink-0 ${
                  isSelected
                    ? "bg-blue-600 text-white font-medium"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
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
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Ask anything from your documents
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every factual assertion is backed by verifiable source citations. If your documents lack sufficient evidence, the assistant will explicitly abstain.
            </p>
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
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer Area */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
        <form
          onSubmit={handleSendMessage}
          className="max-w-4xl mx-auto flex items-end gap-2"
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
              className="w-full resize-none p-3 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>

          {isStreaming ? (
            <Button
              type="button"
              variant="danger"
              onClick={handleStopGeneration}
              className="h-11 px-4"
              title="Stop streaming generation"
            >
              <Square className="w-4 h-4 mr-1.5" /> Stop
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={!inputText.trim()}
              className="h-11 px-5"
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


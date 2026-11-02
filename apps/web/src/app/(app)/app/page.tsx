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
  ExternalLink,
  Plus,
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

  const handleStartChat = async (docId?: string) => {
    try {
      const conv = await api.createConversation(
        "Grounded Assistant Session",
        docId ? [docId] : []
      );
      if (conv?.id) {
        router.push(`/app/chat/${conv.id}`);
      }
    } catch (err: any) {
      alert(err.message || "Failed to initialize conversation.");
    }
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
    <div className="p-8 max-w-6xl mx-auto space-y-10">
      {/* Welcome Banner */}
      <div className="relative rounded-3xl p-8 glass-panel border border-white/[0.1] overflow-hidden bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-[#0C101B]/80 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 blur-[100px] pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Grounded Synthesis Active
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Private Document Intelligence
            </h1>
            <p className="text-sm text-slate-400 mt-1.5 max-w-xl">
              Ask questions across {readyDocs.length} ready private documents with verifiable chunk citations and zero hallucination.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={() => setIsUploadOpen(true)}>
              <UploadCloud className="w-4 h-4 mr-2 text-blue-400" /> Upload Document
            </Button>
            <Button onClick={() => handleStartChat()}>
              <MessageSquare className="w-4 h-4 mr-2" /> Start New Chat
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex items-center gap-4 hover:border-blue-500/30 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-white">
              {readyDocs.length}
            </p>
            <p className="text-xs text-slate-400 font-medium">Ready Documents</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 hover:border-purple-500/30 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-white">
              {conversations.length}
            </p>
            <p className="text-xs text-slate-400 font-medium">Saved Conversations</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 hover:border-emerald-500/30 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-white">
              {(Array.isArray(documents) ? documents : []).filter((d) =>
                ["queued", "extracting", "chunking", "embedding"].includes(d.status)
              ).length}
            </p>
            <p className="text-xs text-slate-400 font-medium">Processing Pipeline</p>
          </div>
        </Card>
      </div>

      {/* Conversations Section with Delete capability */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-purple-400" />
            <span>Recent Grounded Conversations</span>
          </h2>
          <Button size="sm" variant="outline" onClick={() => handleStartChat()}>
            <Plus className="w-3.5 h-3.5 mr-1 text-purple-400" /> New Chat
          </Button>
        </div>

        {conversations.length === 0 ? (
          <Card className="text-center py-12 border-dashed border-white/[0.12]">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto mb-3">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">No conversations yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4 leading-relaxed">
              Start an interactive session to query your indexed files with real-time verifiable chunk citations.
            </p>
            <Button size="sm" onClick={() => handleStartChat()}>
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Start First Conversation
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {conversations.slice(0, 6).map((conv) => (
              <div
                key={conv.id}
                className="group relative rounded-2xl bg-[#0C101B]/80 border border-white/[0.08] hover:border-purple-500/30 p-4 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <button
                      type="button"
                      disabled={deletingConvId === conv.id}
                      onClick={(e) => handleDeleteConversation(e, conv.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-70 group-hover:opacity-100"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h4 className="text-sm font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                    {conv.title || "Untitled Conversation"}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono mt-1">
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
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    <span>Open chat</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">
                    ID: {conv.id.slice(0, 6)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Document Repository Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Document Repository</span>
          </h2>
          <Link
            href="/app/documents"
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
          >
            View all documents <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {documents.length === 0 ? (
          <Card className="text-center py-16 border-dashed border-white/[0.12]">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto mb-4">
              <UploadCloud className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white">
              No documents uploaded yet
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1.5 mb-6 leading-relaxed">
              Upload PDF, Word (DOCX), Markdown or Text files. They will be partitioned, embedded into pgvector, and grounded with exact citations.
            </p>
            <Button size="md" onClick={() => setIsUploadOpen(true)}>
              <UploadCloud className="w-4 h-4 mr-2" /> Upload Your First Document
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.slice(0, 4).map((doc) => (
              <Card
                key={doc.id}
                className="flex items-center justify-between p-4 hover:border-white/[0.16] transition-all group"
              >
                <div className="space-y-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
                      {doc.title}
                    </p>
                    <StatusBadge status={doc.status} />
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {(doc.byte_size / 1024).toFixed(1)} KB • Gen {doc.active_generation}
                  </p>
                </div>
                {doc.status === "ready" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStartChat(doc.id)}
                  >
                    Chat
                  </Button>
                )}
              </Card>
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

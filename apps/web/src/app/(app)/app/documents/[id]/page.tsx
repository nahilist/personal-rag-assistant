"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MessageSquare, FileText, CheckCircle2, AlertCircle, Sparkles, Hash, Calendar, HardDrive, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { api } from "@/lib/api/client";
import { DocumentItem } from "@/types";

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params?.id as string;

  const [document, setDocument] = useState<DocumentItem | null>(null);
  const [sourceContent, setSourceContent] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!docId) return;

    setIsLoading(true);
    Promise.all([
      api.getDocument(docId),
      api.getDocumentSource(docId).catch(() => null),
    ])
      .then(([doc, src]) => {
        setDocument(doc);
        if (src) setSourceContent(src.content);
      })
      .catch((err) => {
        setErrorMsg(err.message || "Failed to load document details.");
      })
      .finally(() => setIsLoading(false));
  }, [docId]);

  const handleStartChat = async () => {
    if (!document) return;
    try {
      const conv = await api.createConversation(`Chat: ${document.title}`, [document.id]);
      router.push(`/app/chat/${conv.id}`);
    } catch {
      alert("Failed to start chat.");
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (errorMsg || !document) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <Link href="/app/documents" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Documents
        </Link>
        <Card className="p-8 text-center text-red-400 bg-red-950/20 border-red-500/30">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
          <p className="text-sm font-semibold">{errorMsg || "Document not found"}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/app/documents"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Documents
        </Link>
        {document.status === "ready" && (
          <Button onClick={handleStartChat}>
            <MessageSquare className="w-4 h-4 mr-2" /> Chat with this Document
          </Button>
        )}
      </div>

      <Card className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/5">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                {document.title}
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-1">
                ID: {document.id}
              </p>
            </div>
          </div>
          <StatusBadge status={document.status} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/[0.08] text-xs">
          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <span className="text-slate-400 block mb-1 font-mono text-[11px] uppercase">Payload Size</span>
            <span className="font-semibold text-white font-mono">
              {(document.byte_size / 1024).toFixed(1)} KB
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <span className="text-slate-400 block mb-1 font-mono text-[11px] uppercase">Format</span>
            <span className="font-semibold text-white truncate block">
              {document.mime_type.split("/")[1] || document.mime_type}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <span className="text-slate-400 block mb-1 font-mono text-[11px] uppercase">Index Version</span>
            <span className="font-semibold text-blue-400 font-mono">
              v{document.active_generation}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <span className="text-slate-400 block mb-1 font-mono text-[11px] uppercase">Uploaded</span>
            <span className="font-semibold text-white">
              {new Date(document.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </Card>

      {/* Extracted Excerpt / Content Preview */}
      <Card className="space-y-3">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Authoritatively Indexed Text Sample</span>
        </h2>
        <div className="p-5 bg-[#05070B] border border-white/[0.08] rounded-2xl max-h-96 overflow-y-auto">
          <p className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
            {sourceContent || "No extracted excerpt available yet."}
          </p>
        </div>
      </Card>
    </div>
  );
}


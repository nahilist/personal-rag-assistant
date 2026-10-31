"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MessageSquare, FileText, CheckCircle2, AlertCircle } from "lucide-react";
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
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (errorMsg || !document) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <Link href="/app/documents" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4" /> Back to Documents
        </Link>
        <Card className="p-8 text-center text-red-600">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
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
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Documents
        </Link>
        {document.status === "ready" && (
          <Button onClick={handleStartChat}>
            <MessageSquare className="w-4 h-4 mr-2" /> Chat with this Document
          </Button>
        )}
      </div>

      <Card className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {document.title}
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                ID: {document.id}
              </p>
            </div>
          </div>
          <StatusBadge status={document.status} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">File Size</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {(document.byte_size / 1024).toFixed(1)} KB
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">MIME Type</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200 truncate block">
              {document.mime_type}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Index Generation</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              v{document.active_generation}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Uploaded</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {new Date(document.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </Card>

      {/* Extracted Excerpt / Content Preview */}
      <Card className="space-y-3">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          Indexed Content Sample
        </h2>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl max-h-96 overflow-y-auto">
          <p className="text-sm text-slate-700 dark:text-slate-300 font-serif whitespace-pre-wrap leading-relaxed">
            {sourceContent || "No extracted excerpt available yet."}
          </p>
        </div>
      </Card>
    </div>
  );
}

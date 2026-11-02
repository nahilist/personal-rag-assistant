"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  UploadCloud,
  FileText,
  RotateCw,
  Trash2,
  Eye,
  AlertTriangle,
  Layers,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { DocumentUploadModal } from "@/components/documents/DocumentUploadModal";
import { api } from "@/lib/api/client";
import { DocumentItem } from "@/types";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchDocuments = () => {
    setIsLoading(true);
    api.listDocuments()
      .then((res) => setDocuments(Array.isArray(res?.items) ? res.items : []))
      .catch((err) => {
        console.error(err);
        setDocuments([]);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchDocuments();
    // Auto refresh while any document is in an active processing state
    const interval = setInterval(() => {
      setDocuments((prev) => {
        if (!Array.isArray(prev)) return [];
        const hasActive = prev.some((d) =>
          ["queued", "extracting", "chunking", "embedding", "uploading"].includes(d.status)
        );
        if (hasActive) {
          api.listDocuments()
            .then((res) => setDocuments(Array.isArray(res?.items) ? res.items : []))
            .catch(() => {});
        }
        return prev;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleRetry = async (docId: string) => {
    setActionLoadingId(docId);
    try {
      await api.retryDocument(docId);
      fetchDocuments();
    } catch (err: any) {
      alert(err.message || "Retry failed.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document? Search access will be revoked immediately and all indexed vector chunks purged.")) return;
    setActionLoadingId(docId);
    try {
      await api.deleteDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      fetchDocuments();
    } catch (err: any) {
      alert(err.message || "Failed to delete document.");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
            <Layers className="w-3.5 h-3.5" /> Immutable Generations
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Document Repository
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Private, isolated document storage with strict row-level security and durable background vector indexing.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchDocuments}>
            <RotateCw className="w-4 h-4 mr-1.5 text-blue-400" /> Refresh
          </Button>
          <Button onClick={() => setIsUploadOpen(true)}>
            <UploadCloud className="w-4 h-4 mr-2" /> Upload Document
          </Button>
        </div>
      </div>

      {documents.length === 0 && !isLoading ? (
        <Card className="text-center py-16 border-dashed border-white/[0.12]">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto mb-4">
            <UploadCloud className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">
            No documents in repository
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1.5 mb-6 leading-relaxed">
            Upload text-based PDF, DOCX, TXT, or Markdown files. Chunks and pgvector embeddings are generated durably in isolated worker threads.
          </p>
          <Button onClick={() => setIsUploadOpen(true)}>
            <UploadCloud className="w-4 h-4 mr-2" /> Upload Your First Document
          </Button>
        </Card>
      ) : (
        <div className="rounded-3xl bg-[#0C101B]/80 border border-white/[0.08] overflow-hidden shadow-2xl backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03] border-b border-white/[0.06] text-[11px] text-slate-400 uppercase tracking-wider font-mono">
                <tr>
                  <th className="px-6 py-4 font-semibold">Document Title</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Payload Size</th>
                  <th className="px-6 py-4 font-semibold">Gen</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white group-hover:text-blue-400 transition-colors truncate max-w-xs sm:max-w-md">
                            {doc.title}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {doc.id.substring(0, 12)}...
                          </p>
                          {doc.failure_code && (
                            <p className="text-xs text-red-400 flex items-center gap-1.5 mt-1 font-medium">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                              {doc.failure_code === "ocr_required"
                                ? "OCR Required (Scanned or image-only PDF)"
                                : doc.failure_message || doc.failure_code}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                      {(doc.byte_size / 1024).toFixed(1)} KB
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                      v{doc.active_generation}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link href={`/app/documents/${doc.id}`}>
                        <button
                          className="p-2 text-slate-400 hover:text-white bg-white/[0.02] hover:bg-white/[0.08] border border-white/[0.06] rounded-xl transition-all"
                          title="Preview details and source"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </Link>
                      {doc.status === "failed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRetry(doc.id)}
                          isLoading={actionLoadingId === doc.id}
                          title="Retry ingestion"
                        >
                          <RotateCw className="w-3.5 h-3.5 mr-1 text-blue-400" /> Retry
                        </Button>
                      )}
                      <button
                        onClick={() => handleDelete(doc.id)}
                        disabled={actionLoadingId === doc.id}
                        title="Delete document"
                        className="p-2 text-slate-400 hover:text-red-400 bg-white/[0.02] hover:bg-red-500/10 border border-white/[0.06] hover:border-red-500/30 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={fetchDocuments}
      />
    </div>
  );
}


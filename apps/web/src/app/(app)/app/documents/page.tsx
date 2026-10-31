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
  HardDrive,
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
      .then((res) => setDocuments(res.items))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchDocuments();
    // Auto refresh while any document is in an active processing state
    const interval = setInterval(() => {
      setDocuments((prev) => {
        const hasActive = prev.some((d) =>
          ["queued", "extracting", "chunking", "embedding", "uploading"].includes(d.status)
        );
        if (hasActive) {
          api.listDocuments().then((res) => setDocuments(res.items));
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
    if (!confirm("Are you sure you want to delete this document? Search access will be revoked immediately.")) return;
    setActionLoadingId(docId);
    try {
      await api.deleteDocument(docId);
      // Immediately reflect state
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      fetchDocuments();
    } catch (err: any) {
      alert(err.message || "Failed to delete document.");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Document Repository
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Private, isolated document storage and durable vector indexing
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchDocuments}>
            <RotateCw className="w-4 h-4 mr-1.5" /> Refresh
          </Button>
          <Button onClick={() => setIsUploadOpen(true)}>
            <UploadCloud className="w-4 h-4 mr-2" /> Upload Document
          </Button>
        </div>
      </div>

      {documents.length === 0 && !isLoading ? (
        <Card className="text-center py-16">
          <UploadCloud className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            No documents in repository
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-6">
            Upload text-based PDF, DOCX, TXT, or Markdown files. Chunks and embeddings are created durably in the background.
          </p>
          <Button onClick={() => setIsUploadOpen(true)}>
            <UploadCloud className="w-4 h-4 mr-2" /> Upload File
          </Button>
        </Card>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 font-semibold">Document Title</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Size</th>
                  <th className="px-6 py-3 font-semibold">Generation</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {doc.title}
                          </p>
                          <p className="text-xs text-slate-400 font-mono">
                            {doc.id.substring(0, 8)}...
                          </p>
                          {doc.failure_code && (
                            <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1 font-semibold">
                              <AlertTriangle className="w-3.5 h-3.5" />
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
                    <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400 font-mono">
                      {(doc.byte_size / 1024).toFixed(1)} KB
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      v{doc.active_generation}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link href={`/app/documents/${doc.id}`}>
                        <Button variant="ghost" size="sm" title="Preview details and source">
                          <Eye className="w-4 h-4 text-slate-600" />
                        </Button>
                      </Link>
                      {doc.status === "failed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRetry(doc.id)}
                          isLoading={actionLoadingId === doc.id}
                          title="Retry ingestion"
                        >
                          <RotateCw className="w-3.5 h-3.5 mr-1" /> Retry
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(doc.id)}
                        isLoading={actionLoadingId === doc.id}
                        title="Delete document"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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


"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  UploadCloud,
  FileCheck,
  ArrowRight,
  ShieldAlert,
  Clock,
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

  const loadData = () => {
    setIsLoading(true);
    Promise.all([api.listDocuments(), api.listConversations()])
      .then(([docRes, convRes]) => {
        setDocuments(docRes.items);
        setConversations(convRes.items);
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
      router.push(`/app/chat/${conv.id}`);
    } catch (err) {
      alert("Failed to initialize conversation.");
    }
  };

  const readyDocs = documents.filter((d) => d.status === "ready");

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Private Assistant Workspace
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Grounded answers across {readyDocs.length} ready private documents
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setIsUploadOpen(true)}>
            <UploadCloud className="w-4 h-4 mr-2" /> Upload Document
          </Button>
          <Button onClick={() => handleStartChat()}>
            <MessageSquare className="w-4 h-4 mr-2" /> New Grounded Chat
          </Button>
        </div>
      </div>

      {/* Quick Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {readyDocs.length}
            </p>
            <p className="text-xs text-slate-500 font-medium">Ready Documents</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {conversations.length}
            </p>
            <p className="text-xs text-slate-500 font-medium">Saved Conversations</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {documents.filter((d) => ["queued", "extracting", "chunking", "embedding"].includes(d.status)).length}
            </p>
            <p className="text-xs text-slate-500 font-medium">Processing Pipeline</p>
          </div>
        </Card>
      </div>

      {/* Recent Documents Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Document Repository
          </h2>
          <Link
            href="/app/documents"
            className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
          >
            View all documents <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {documents.length === 0 ? (
          <Card className="text-center py-12">
            <UploadCloud className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No documents uploaded yet
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Upload PDF, DOCX, TXT or Markdown files to begin grounded retrieval.
            </p>
            <Button size="sm" onClick={() => setIsUploadOpen(true)}>
              Upload First Document
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.slice(0, 4).map((doc) => (
              <Card
                key={doc.id}
                className="flex items-center justify-between p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className="space-y-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      {doc.title}
                    </p>
                    <StatusBadge status={doc.status} />
                  </div>
                  <p className="text-xs text-slate-400">
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

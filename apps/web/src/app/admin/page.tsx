"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  FileCheck,
  RotateCw,
  AlertTriangle,
  MessageSquare,
  Cpu,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api/client";

export default function AdminMetricsPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = () => {
    setIsLoading(true);
    api.getAdminMetrics()
      .then((data) => setMetrics(data))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 p-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 blur-[130px] pointer-events-none -z-10" />
      <div className="absolute inset-0 bg-grid-pattern opacity-25 pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className="p-2.5 rounded-xl glass-card text-slate-400 hover:text-white border border-white/[0.08] hover:border-white/20 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <Activity className="w-6 h-6 text-blue-400" /> Operational Metrics & Health
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Restricted operational telemetry. No user document content or private prompts exposed.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchMetrics} isLoading={isLoading}>
            <RotateCw className="w-4 h-4 mr-1.5" /> Refresh
          </Button>
        </div>

        {/* Metrics Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="space-y-2 hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
              <span>Ready Documents</span>
              <FileCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-3xl font-black text-white">
              {metrics?.documents?.ready || 0}
            </p>
            <p className="text-[11px] text-slate-500">
              Total uploaded: {metrics?.documents?.total || 0}
            </p>
          </Card>

          <Card className="space-y-2 hover:border-blue-500/30 transition-all">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
              <span>Ingestion Queue Depth</span>
              <RotateCw className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-3xl font-black text-white">
              {metrics?.ingestion?.pending_or_processing || 0}
            </p>
            <p className="text-[11px] text-slate-500">
              Failed jobs: {metrics?.ingestion?.failed || 0}
            </p>
          </Card>

          <Card className="space-y-2 hover:border-purple-500/30 transition-all">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
              <span>Tokens Processed</span>
              <Cpu className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-3xl font-black text-white">
              {(metrics?.chat?.total_tokens_consumed || 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500">
              Across {metrics?.chat?.total_messages || 0} messages
            </p>
          </Card>
        </div>

        {/* System Health Check Details */}
        <Card className="space-y-4">
          <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest">
            Operational Compliance & Isolation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/[0.06] flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">
                  Zero Cross-User Exposure
                </p>
                <p className="text-slate-400 mt-1 leading-relaxed">
                  Composite foreign keys and Supabase RLS enforce tenant boundaries on all reads and mutations.
                </p>
              </div>
            </div>

            <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/[0.06] flex items-start gap-3">
              <Activity className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">
                  Durable Leases & Reconciler
                </p>
                <p className="text-slate-400 mt-1 leading-relaxed">
                  Worker leases prevent duplicate chunk activation; stuck jobs automatically re-enter queue.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

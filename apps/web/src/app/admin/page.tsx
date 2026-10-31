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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Activity className="w-6 h-6 text-blue-600" /> Operational Metrics & Health
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Restricted operational telemetry. No user document content or private prompts exposed.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchMetrics}>
            <RotateCw className="w-4 h-4 mr-1.5" /> Refresh
          </Button>
        </div>

        {/* Metrics Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
              <span>Ready Documents</span>
              <FileCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {metrics?.documents?.ready || 0}
            </p>
            <p className="text-[11px] text-slate-400">
              Total uploaded: {metrics?.documents?.total || 0}
            </p>
          </Card>

          <Card className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
              <span>Ingestion Queue Depth</span>
              <RotateCw className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {metrics?.ingestion?.pending_or_processing || 0}
            </p>
            <p className="text-[11px] text-slate-400">
              Failed jobs: {metrics?.ingestion?.failed || 0}
            </p>
          </Card>

          <Card className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
              <span>Tokens Processed</span>
              <Cpu className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {(metrics?.chat?.total_tokens_consumed || 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-400">
              Across {metrics?.chat?.total_messages || 0} messages
            </p>
          </Card>
        </div>

        {/* System Health Check Details */}
        <Card className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Operational Compliance & Isolation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  Zero Cross-User Exposure
                </p>
                <p className="text-slate-500 mt-0.5">
                  Composite foreign keys and RLS enforce tenant boundaries on all reads and mutations.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-start gap-3">
              <Activity className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  Durable Leases & Reconciler
                </p>
                <p className="text-slate-500 mt-0.5">
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

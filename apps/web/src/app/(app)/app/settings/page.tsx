"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  HardDrive,
  FileText,
  Activity,
  Trash2,
  ShieldAlert,
  Info,
  Globe,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api/client";
import { clearAuthSession } from "@/lib/auth/authStore";
import { MeData } from "@/types";

export default function SettingsPage() {
  const router = useRouter();
  const [meData, setMeData] = useState<MeData | null>(null);
  const [language, setLanguage] = useState("en");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    api.getMe()
      .then((data) => {
        setMeData(data);
        setLanguage(data.user.preferred_language || "en");
      })
      .catch(() => {});
  }, []);

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        "Are you sure you want to permanently delete your account, private documents, and all conversations? This action cannot be undone."
      )
    )
      return;

    setIsDeleting(true);
    try {
      await api.deleteAccount();
      clearAuthSession();
      router.push("/");
    } catch (err: any) {
      alert(err.message || "Failed to delete account.");
      setIsDeleting(false);
    }
  };

  const usage = meData?.usage;
  const storageMB = usage ? (usage.storage_bytes_used / (1024 * 1024)).toFixed(1) : "0.0";
  const limitMB = usage ? (usage.storage_bytes_limit / (1024 * 1024)).toFixed(0) : "200";

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-8 font-sans">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-slate-300 text-xs font-medium mb-2">
          <Settings className="w-3.5 h-3.5 text-white/80" /> Workspace Configuration · 2026
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Account & Quotas
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Manage your assistant preferences, verify tenant resource quotas, and access privacy controls.
        </p>
      </div>

      {/* Quotas & Capacity Breakdown */}
      <Card className="space-y-6">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-white/80" /> Resource Quotas & Isolation
        </h2>

        <div className="space-y-5">
          <div>
            <div className="flex justify-between text-xs font-semibold mb-2 text-slate-300">
              <span>Private File Storage</span>
              <span className="font-mono text-white">
                {storageMB} MB / {limitMB} MB
              </span>
            </div>
            <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-white to-slate-400 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    (Number(storageMB) / Number(limitMB)) * 100 || 5
                  )}%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-2 text-slate-300">
              <span>Indexed Documents</span>
              <span className="font-mono text-white">
                {usage?.document_count || 0} / {usage?.document_limit || 20}
              </span>
            </div>
            <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-white to-slate-400 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    ((usage?.document_count || 0) / (usage?.document_limit || 20)) * 100 || 5
                  )}%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-2 text-slate-300">
              <span>Daily Rate-Limited Queries</span>
              <span className="font-mono text-white">
                {usage?.today_requests || 0} / {usage?.daily_request_limit || 100}
              </span>
            </div>
            <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-white to-slate-400 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    ((usage?.today_requests || 0) / (usage?.daily_request_limit || 100)) * 100 || 5
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Language Preferences */}
      <Card className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Globe className="w-4 h-4 text-white/80" />
          <span>Preferred Assistant Language</span>
        </h2>
        <p className="text-xs text-slate-400">
          The assistant preserves exact factual grounding while translating responses to your preferred dialect.
        </p>
        <div className="max-w-xs">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full p-3 text-xs rounded-xl border border-white/10 bg-[#07080B] text-white focus:outline-none focus:border-white/30"
          >
            <option value="en">English (Default)</option>
            <option value="hindi">Hindi</option>
            <option value="hinglish">Hinglish</option>
          </select>
        </div>
      </Card>

      {/* Privacy and Data Retention Disclosure */}
      <Card className="space-y-3 bg-[#0C101B]/50 border-white/[0.06]">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-blue-400" /> Privacy & Retention Disclosure
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Document search access is revoked immediately upon deletion. Original storage files and derived embeddings are purged asynchronously within 24 hours under the documented deletion SLA. Note that deleting a document does not retroactively rewrite past saved chat messages; to completely clear all document references, delete the associated conversation or your account.
        </p>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-500/20 bg-red-950/15 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-red-400">
              Danger Zone
            </h3>
            <p className="text-xs text-slate-400">
              Permanently delete your account, private documents, and conversation history.
            </p>
          </div>
        </div>

        <div className="pt-2">
          <Button
            variant="danger"
            onClick={handleDeleteAccount}
            isLoading={isDeleting}
          >
            <Trash2 className="w-4 h-4 mr-2" /> Delete My Account
          </Button>
        </div>
      </Card>
    </div>
  );
}


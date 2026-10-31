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
        "Are you sure you want to permanently delete your account and all private documents? This action cannot be undone."
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
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Account & Quotas
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your preferences, view resource limits and privacy controls
        </p>
      </div>

      {/* Quotas & Capacity Breakdown */}
      <Card className="space-y-6">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-blue-600" /> Resource Quotas
        </h2>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
              <span>Private File Storage</span>
              <span>
                {storageMB} MB / {limitMB} MB
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full"
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
            <div className="flex justify-between text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
              <span>Indexed Documents</span>
              <span>
                {usage?.document_count || 0} / {usage?.document_limit || 20}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full"
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
            <div className="flex justify-between text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
              <span>Today's Questions / Requests</span>
              <span>
                {usage?.today_requests || 0} / {usage?.daily_request_limit || 100}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-600 rounded-full"
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
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Preferred Assistant Language
        </h2>
        <p className="text-xs text-slate-500">
          The assistant preserves factual meaning while answering in your preferred dialect.
        </p>
        <div className="max-w-xs">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full p-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="en">English (Default)</option>
            <option value="hindi">Hindi</option>
            <option value="hinglish">Hinglish</option>
          </select>
        </div>
      </Card>

      {/* Privacy and Data Retention Disclosure */}
      <Card className="space-y-3 bg-slate-50/50 dark:bg-slate-900/40">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-500" /> Privacy & Retention Disclosure
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Document search access is revoked immediately upon deletion. Original storage files and derived embeddings are purged asynchronously within 24 hours under the documented deletion SLA. Note that deleting a document does not retroactively rewrite past saved chat messages; to completely clear all document references, delete the associated conversation or your account.
        </p>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-900/60 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-red-600" />
          <div>
            <h3 className="text-base font-bold text-red-600 dark:text-red-400">
              Danger Zone
            </h3>
            <p className="text-xs text-slate-500">
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

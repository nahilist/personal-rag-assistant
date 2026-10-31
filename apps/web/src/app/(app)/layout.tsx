"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  MessageSquare,
  FileText,
  Settings,
  Plus,
  LogOut,
  Database,
  Shield,
  Activity,
  HardDrive,
} from "lucide-react";
import { api } from "@/lib/api/client";
import { getStoredUser, clearAuthSession, getAuthToken } from "@/lib/auth/authStore";
import { Conversation, UserUsage, UserProfile } from "@/types";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setUser(getStoredUser());

    const token = getAuthToken();
    if (!token) {
      router.push("/auth/login");
      return;
    }

    // Load conversations and user profile/usage safely with catch
    api.listConversations()
      .then((res) => {
        if (Array.isArray(res?.items)) {
          setConversations(res.items);
        }
      })
      .catch((err) => {
        if (err.message && (err.message.includes("401") || err.message.includes("authenticated"))) {
          router.push("/auth/login");
        }
      });

    api.getMe()
      .then((data) => {
        if (data?.usage) setUsage(data.usage);
        if (data?.user) setUser(data.user);
      })
      .catch((err) => {
        if (err.message && (err.message.includes("401") || err.message.includes("authenticated"))) {
          router.push("/auth/login");
        }
      });
  }, [pathname, router]);

  const handleSignOut = () => {
    clearAuthSession();
    window.location.href = "/auth/login";
  };

  const handleNewChat = async () => {
    try {
      const conv = await api.createConversation("New Chat");
      if (conv?.id) {
        window.location.href = `/app/chat/${conv.id}`;
      }
    } catch {
      window.location.href = "/app";
    }
  };

  const storageUsedMB = usage ? (usage.storage_bytes_used / (1024 * 1024)).toFixed(1) : "0.0";
  const storageLimitMB = usage ? (usage.storage_bytes_limit / (1024 * 1024)).toFixed(0) : "200";

  return (
    <div className="h-screen flex bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0">
        {/* Brand */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <Link href="/app" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              R
            </div>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              Personal RAG
            </span>
          </Link>
          <button
            onClick={handleNewChat}
            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
            title="Start new conversation"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          <Link
            href="/app"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
              pathname === "/app"
                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Assistant Home
          </Link>
          <Link
            href="/app/documents"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
              pathname.startsWith("/app/documents")
                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <FileText className="w-4 h-4" /> Documents Library
          </Link>
          <Link
            href="/app/settings"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
              pathname === "/app/settings"
                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Settings className="w-4 h-4" /> Settings & Quotas
          </Link>
        </nav>

        {/* Recent Conversations */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 border-t border-slate-100 dark:border-slate-800">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Recent Chats
          </p>
          {conversations.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-400 italic">No conversations yet</p>
          ) : (
            conversations.map((c) => (
              <Link
                key={c.id}
                href={`/app/chat/${c.id}`}
                className={`block px-3 py-2 rounded-lg text-xs truncate transition-colors ${
                  pathname === `/app/chat/${c.id}`
                    ? "bg-slate-100 dark:bg-slate-800 font-medium text-slate-900 dark:text-slate-100"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                }`}
              >
                {c.title || "Untitled Chat"}
              </Link>
            ))
          )}
        </div>

        {/* Quota Meter */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-slate-400" /> Storage
            </span>
            <span>
              {storageUsedMB} / {storageLimitMB} MB
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full"
              style={{
                width: `${Math.min(
                  100,
                  (Number(storageUsedMB) / Number(storageLimitMB)) * 100 || 5
                )}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 dark:text-slate-400">
            <span>Documents</span>
            <span>
              {usage?.document_count || 0} / {usage?.document_limit || 20}
            </span>
          </div>
        </div>

        {/* User Profile / Logout */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between" suppressHydrationWarning>
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0" suppressHydrationWarning>
              {mounted && user?.display_name ? user.display_name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" suppressHydrationWarning>
                {mounted && user?.display_name ? user.display_name : "User"}
              </p>
              <p className="text-[10px] text-slate-400 truncate" suppressHydrationWarning>
                {mounted && user?.email ? user.email : "Signed In"}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

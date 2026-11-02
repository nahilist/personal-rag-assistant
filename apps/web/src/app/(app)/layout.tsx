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
  Bot,
  Sparkles,
  Trash2,
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
      const conv = await api.createConversation("New Grounded Chat");
      if (conv?.id) {
        window.location.href = `/app/chat/${conv.id}`;
      }
    } catch {
      window.location.href = "/app";
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this conversation?")) return;

    try {
      await api.deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (pathname === `/app/chat/${convId}`) {
        router.push("/app");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete conversation.");
    }
  };

  const storageUsedMB = usage ? (usage.storage_bytes_used / (1024 * 1024)).toFixed(1) : "0.0";
  const storageLimitMB = usage ? (usage.storage_bytes_limit / (1024 * 1024)).toFixed(0) : "200";

  return (
    <div className="h-screen flex bg-[#07090E] text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/[0.08] bg-[#0A0E18] flex flex-col shrink-0">
        {/* Brand */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-white/[0.08]">
          <Link href="/app" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-sm tracking-tight">
              Personal RAG
            </span>
          </Link>
          <button
            onClick={handleNewChat}
            className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all"
            title="Start new conversation"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          <Link
            href="/app"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              pathname === "/app"
                ? "bg-blue-500/15 text-blue-300 border border-blue-500/30 shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <MessageSquare className="w-4 h-4 text-blue-400" /> Assistant Home
          </Link>
          <Link
            href="/app/documents"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              pathname.startsWith("/app/documents")
                ? "bg-blue-500/15 text-blue-300 border border-blue-500/30 shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <FileText className="w-4 h-4 text-indigo-400" /> Documents Library
          </Link>
          <Link
            href="/app/settings"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              pathname === "/app/settings"
                ? "bg-blue-500/15 text-blue-300 border border-blue-500/30 shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Settings className="w-4 h-4 text-slate-400" /> Settings & Quotas
          </Link>
        </nav>

        {/* Recent Conversations with Delete Option */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 border-t border-white/[0.06]">
          <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Recent Grounded Chats
          </p>
          {conversations.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-500 italic">No conversations yet</p>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                className={`group flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition-all ${
                  pathname === `/app/chat/${c.id}`
                    ? "bg-white/[0.08] text-white font-medium border border-white/[0.08]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
                }`}
              >
                <Link
                  href={`/app/chat/${c.id}`}
                  className="truncate flex-1 py-0.5 pr-2"
                  title={c.title || "Untitled Chat"}
                >
                  {c.title || "Untitled Chat"}
                </Link>
                <button
                  type="button"
                  onClick={(e) => handleDeleteConversation(e, c.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 hover:bg-white/[0.08] rounded-md transition-all shrink-0"
                  title="Delete conversation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Quota Meter */}
        <div className="p-4 border-t border-white/[0.08] bg-[#080B13]/80 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-blue-400" /> Storage Used
            </span>
            <span className="text-slate-300 font-mono">
              {storageUsedMB} / {storageLimitMB} MB
            </span>
          </div>
          <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
              style={{
                width: `${Math.min(
                  100,
                  (Number(storageUsedMB) / Number(storageLimitMB)) * 100 || 5
                )}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
            <span>Documents Indexed</span>
            <span className="text-slate-300 font-mono">
              {usage?.document_count || 0} / {usage?.document_limit || 20}
            </span>
          </div>
        </div>

        {/* User Profile / Logout */}
        <div className="p-3.5 border-t border-white/[0.08] flex items-center justify-between bg-[#080B13]" suppressHydrationWarning>
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md" suppressHydrationWarning>
              {mounted && user?.display_name ? user.display_name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate" suppressHydrationWarning>
                {mounted && user?.display_name ? user.display_name : "User"}
              </p>
              <p className="text-[10px] text-slate-400 truncate" suppressHydrationWarning>
                {mounted && user?.email ? user.email : "Signed In"}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-white/[0.05] transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#07090E] relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none -z-10" />
        {children}
      </main>
    </div>
  );
}

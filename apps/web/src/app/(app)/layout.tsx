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
  HardDrive,
  Trash2,
  Menu,
  X,
  Sparkles,
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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    setUser(getStoredUser());
    setIsMobileSidebarOpen(false);

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
    <div className="h-screen flex flex-col md:flex-row bg-[#07080B] text-slate-100 overflow-hidden font-sans">
      
      {/* Mobile Top Header (Small Screens Only) */}
      <header className="md:hidden h-14 px-4 bg-[#090A0F] border-b border-white/[0.08] flex items-center justify-between shrink-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white/[0.08] border border-white/20 flex items-center justify-center text-white">
            <svg viewBox="0 0 100 100" fill="none" className="w-3.5 h-3.5 text-white">
              <path
                d="M 28 28 L 72 72 L 72 28 L 28 72 Z"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="font-bold text-white text-xs tracking-tight">Personal RAG</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleNewChat}
            className="p-1.5 rounded-lg bg-white text-black hover:bg-slate-200 text-xs font-semibold flex items-center gap-1 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-sm animate-fade-in"
        />
      )}

      {/* Sidebar (Desktop Fixed + Mobile Slide-Over) */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 md:w-64 border-r border-white/[0.08] bg-[#090A0F] flex flex-col shrink-0 transition-transform duration-300 ease-in-out ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-white/[0.08]">
          <Link href="/app" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-white/[0.08] border border-white/20 flex items-center justify-center text-white group-hover:scale-105 transition-all shadow-md">
              <svg viewBox="0 0 100 100" fill="none" className="w-4 h-4 text-white">
                <path
                  d="M 28 28 L 72 72 L 72 28 L 28 72 Z"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-sm tracking-tight">Personal RAG</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-white/[0.06] text-slate-400 border border-white/10 font-mono">
                2026
              </span>
            </div>
          </Link>
          <button
            onClick={handleNewChat}
            className="p-1.5 rounded-lg bg-white text-black hover:bg-slate-200 transition-all shadow-sm active:scale-95"
            title="Start new conversation"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          <Link
            href="/app"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              pathname === "/app"
                ? "bg-white/[0.08] text-white border border-white/15 shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <MessageSquare className="w-4 h-4 text-white/90" />
            <span>Assistant Home</span>
          </Link>
          <Link
            href="/app/documents"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              pathname.startsWith("/app/documents")
                ? "bg-white/[0.08] text-white border border-white/15 shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <FileText className="w-4 h-4 text-white/90" />
            <span>Documents Library</span>
          </Link>
          <Link
            href="/app/settings"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              pathname === "/app/settings"
                ? "bg-white/[0.08] text-white border border-white/15 shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Settings className="w-4 h-4 text-white/90" />
            <span>Settings & Quotas</span>
          </Link>
        </nav>

        {/* Recent Conversations */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 border-t border-white/[0.06]">
          <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
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
                    ? "bg-white/[0.08] text-white font-medium border border-white/[0.12]"
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
        <div className="p-4 border-t border-white/[0.08] bg-[#07080B] space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-white/70" /> Storage Used
            </span>
            <span className="text-slate-300 font-mono text-[10px]">
              {storageUsedMB} / {storageLimitMB} MB
            </span>
          </div>
          <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-white via-slate-200 to-slate-400 rounded-full"
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
            <span className="text-slate-300 font-mono text-[10px]">
              {usage?.document_count || 0} / {usage?.document_limit || 20}
            </span>
          </div>
        </div>

        {/* User Profile / Logout */}
        <div className="p-3.5 border-t border-white/[0.08] flex items-center justify-between bg-[#07080B]" suppressHydrationWarning>
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-white/[0.1] border border-white/20 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm" suppressHydrationWarning>
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
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#07080B] relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none -z-10" />
        {children}
      </main>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, AlertCircle, Bot, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setAuthSession } from "@/lib/auth/authStore";
import { api } from "@/lib/api/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.login(email || "alice@example.com", password);
      setAuthSession(res.access_token, res.user);
      window.location.href = "/app";
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to sign in.");
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (userId: string, emailStr: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.login(emailStr, undefined, userId);
      setAuthSession(res.access_token, res.user);
      window.location.href = "/app";
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to sign in with demo user.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#07090E] relative overflow-hidden text-slate-100">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-blue-600/20 via-indigo-600/15 to-purple-600/10 blur-[130px] pointer-events-none -z-10" />
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none -z-10" />

      <div className="w-full max-w-md glass-panel border border-white/[0.1] rounded-3xl shadow-2xl p-8 sm:p-10 space-y-7 relative bg-[#0C101B]/85">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <Link href="/" className="inline-block group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold text-xl mx-auto shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform duration-300">
              <Bot className="w-6 h-6 text-white" />
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Welcome Back
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Sign in to access your private documents and citations
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2.5 p-3.5 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-xs animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alice@example.com"
                required
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-white/[0.1] bg-white/[0.04] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Password
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-white/[0.1] bg-white/[0.04] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo separator */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/[0.08]" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wider font-semibold">
            <span className="bg-[#0C101B] px-3 text-slate-500">
              One-Click Demo Access
            </span>
          </div>
        </div>

        {/* Demo Fast Logins */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() =>
              handleDemoLogin("11111111-1111-1111-1111-111111111111", "alice@example.com")
            }
            className="py-2.5 px-3 rounded-xl glass-card border border-white/[0.08] hover:border-blue-500/40 text-xs font-medium text-slate-300 hover:text-white transition-all flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Alice (Demo)</span>
          </button>
          <button
            type="button"
            onClick={() =>
              handleDemoLogin("22222222-2222-2222-2222-222222222222", "bob@example.com")
            }
            className="py-2.5 px-3 rounded-xl glass-card border border-white/[0.08] hover:border-indigo-500/40 text-xs font-medium text-slate-300 hover:text-white transition-all flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Bob (Demo)</span>
          </button>
        </div>

        <p className="text-center text-xs text-slate-400 pt-2">
          Don&apos;t have an account yet?{" "}
          <Link
            href="/auth/signup"
            className="text-blue-400 font-semibold hover:text-blue-300 transition-colors"
          >
            Create account free
          </Link>
        </p>
      </div>
    </div>
  );
}

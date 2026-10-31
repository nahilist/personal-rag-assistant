"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isInvalidToken, setIsInvalidToken] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");
    if (error || searchParams.get("type") === "expired") {
      setIsInvalidToken(true);
      setErrorMsg(errorDescription || "This password recovery link has expired or has already been used.");
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
    }, 600);
  };

  if (isInvalidToken) {
    return (
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8 space-y-4 text-center">
        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/60 text-amber-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Recovery Link Invalid or Expired
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          {errorMsg || "The recovery link is no longer valid. For your security, recovery links can only be used once within a limited window."}
        </p>
        <div className="pt-2">
          <Link href="/auth/forgot-password">
            <Button className="w-full">Request New Recovery Link</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Update Password
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Enter a secure new password for your account
        </p>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isSuccess ? (
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Your password has been successfully updated.
          </p>
          <div className="pt-2">
            <Link href="/auth/login">
              <Button className="w-full">Sign In with New Password</Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Update Password
          </Button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <Suspense fallback={<div className="text-sm text-slate-500">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}

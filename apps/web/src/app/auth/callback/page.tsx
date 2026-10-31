"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const type = searchParams.get("type");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error) {
      router.push(
        `/auth/reset-password?error=${encodeURIComponent(
          error
        )}&error_description=${encodeURIComponent(errorDescription || "")}`
      );
      return;
    }

    if (type === "recovery") {
      router.push("/auth/reset-password");
      return;
    }

    router.push("/app");
  }, [router, searchParams]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-slate-500">Verifying session...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <Suspense fallback={<p className="text-sm text-slate-500">Processing...</p>}>
        <CallbackHandler />
      </Suspense>
    </div>
  );
}

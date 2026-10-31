import Link from "next/link";
import { Shield, FileCheck, Layers, ArrowRight, Database } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Top Navigation */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              R
            </div>
            <span className="font-bold text-lg text-slate-900 dark:text-slate-100">
              Personal RAG
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 px-6 max-w-5xl mx-auto text-center flex-1 flex flex-col justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold mx-auto mb-6">
          <Shield className="w-3.5 h-3.5" /> Strict Multi-User Isolation & Grounded Citations
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
          Your Private Knowledge, <br />
          <span className="text-blue-600 dark:text-blue-500">
            Verifiable Source Answers
          </span>
        </h1>
        <p className="mt-6 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Upload your PDFs, Word documents, and notes. Ask complex questions and get
          streaming answers backed by navigable source citations. Never hallucinated,
          always private.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/app"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md transition-all"
          >
            Open Assistant <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold transition-all"
          >
            System Metrics
          </Link>
        </div>

        {/* Value Proposition Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <FileCheck className="w-8 h-8 text-blue-600 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
              Verifiable Citations
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Every factual claim links directly to authoritatively indexed chunk excerpts with page and section numbers.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <Shield className="w-8 h-8 text-emerald-600 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
              Zero Cross-User Leakage
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Enforced at schema, RLS, and vector query levels. Your documents are inaccessible to other accounts.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <Layers className="w-8 h-8 text-purple-600 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
              Durable Ingestion
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Safe background workers with extraction bounds, scanned PDF detection, and lease reconciliation.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 px-6 text-center text-xs text-slate-500">
        Personal RAG Assistant — Next.js, FastAPI, PostgreSQL & pgvector.
      </footer>
    </main>
  );
}

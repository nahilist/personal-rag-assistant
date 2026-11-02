import React from "react";
import Link from "next/link";
import {
  Shield,
  FileCheck,
  Layers,
  ArrowRight,
  Database,
  Lock,
  Sparkles,
  Cpu,
  FileText,
  Search,
  CheckCircle2,
  Terminal,
  Zap,
  ChevronRight,
  ExternalLink,
  Bot,
  Activity,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Background Decorative Ambient Lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-blue-600/20 via-indigo-600/10 to-transparent blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-[600px] -left-[200px] w-[500px] h-[500px] bg-purple-600/10 blur-[130px] pointer-events-none -z-10" />
      <div className="absolute top-[800px] -right-[200px] w-[600px] h-[600px] bg-blue-500/10 blur-[150px] pointer-events-none -z-10" />
      
      {/* Subtle Matrix Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none -z-10" />

      {/* Top Floating Glass Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#07090E]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                Personal RAG <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">PRO</span>
              </span>
            </div>
          </Link>

          {/* Nav Items */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
            <a href="#security" className="hover:text-white transition-colors">Security</a>
            <Link href="/admin" className="hover:text-white transition-colors flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Metrics</span>
            </Link>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-3 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-semibold rounded-xl group bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <span className="px-4 py-2 rounded-[10px] bg-[#07090E]/20 group-hover:bg-transparent transition-colors flex items-center gap-1.5">
                Get Started Free <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-28 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Dynamic Announcement Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-card border border-white/10 text-xs font-medium text-slate-300 mb-8 shadow-sm hover:border-blue-500/30 transition-all cursor-default">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-400">Enterprise Ready</span>
          <span className="text-white font-semibold">Grounded Citations & Zero Cross-User Leakage</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
        </div>

        {/* Master Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-5xl leading-[1.1] mb-6">
          Your Private Knowledge, <br className="hidden sm:inline" />
          <span className="gradient-text-vibrant">Verifiable Source Answers.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed mb-10 font-normal">
          Upload complex PDFs, Word docs, and technical specifications. Ask complex questions and receive
          real-time streaming answers grounded in authoritative, clickable source citations.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-16">
          <Link
            href="/app"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-xl shadow-blue-600/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 group"
          >
            <Sparkles className="w-4 h-4 text-blue-200" />
            <span>Open Assistant</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/admin"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl glass-card text-slate-300 hover:text-white font-medium text-sm hover:border-white/20 transition-all flex items-center justify-center gap-2"
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>System Telemetry & Health</span>
          </Link>
        </div>

        {/* Supported Technology Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-medium text-slate-500 uppercase tracking-wider mb-20 border-y border-white/[0.05] py-5 w-full max-w-4xl">
          <span className="flex items-center gap-2 hover:text-slate-300 transition-colors">
            <Database className="w-4 h-4 text-blue-400" /> PostgreSQL + pgvector
          </span>
          <span className="flex items-center gap-2 hover:text-slate-300 transition-colors">
            <Shield className="w-4 h-4 text-emerald-400" /> Row-Level Security (RLS)
          </span>
          <span className="flex items-center gap-2 hover:text-slate-300 transition-colors">
            <Zap className="w-4 h-4 text-amber-400" /> FastAPI Async Engine
          </span>
          <span className="flex items-center gap-2 hover:text-slate-300 transition-colors">
            <Lock className="w-4 h-4 text-purple-400" /> Tenant-Isolated Storage
          </span>
        </div>

        {/* The Dribbble Showstopper: Interactive Hero UI Showcase */}
        <div className="w-full max-w-5xl mx-auto relative group">
          {/* Ambient Glow behind the mockup */}
          <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-500/30 via-indigo-500/30 to-purple-500/30 rounded-3xl blur-2xl opacity-60 group-hover:opacity-80 transition duration-700 pointer-events-none" />

          {/* Glass Window Container */}
          <div className="relative rounded-2xl glass-panel border border-white/[0.12] shadow-2xl overflow-hidden text-left bg-[#0B0F19]/90">
            {/* Window Top Navigation Bar */}
            <div className="h-11 px-4 border-b border-white/[0.08] bg-[#0E1322]/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-xs text-slate-400 font-mono">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>personal-rag.internal/app/chat/active</span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium">Session #2904 · Verified Grounding</div>
            </div>

            {/* Application Mockup Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[460px]">
              {/* Left Sidebar Mockup */}
              <div className="hidden md:block md:col-span-4 border-r border-white/[0.08] p-4 bg-[#090D16]/70">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2 flex items-center justify-between">
                  <span>Indexed Documents</span>
                  <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">3 Ready</span>
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-white flex items-start gap-2.5">
                    <FileText className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">Security_Compliance_2026.pdf</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">38 Chunks · SHA-256 Verified</div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl hover:bg-white/[0.03] border border-transparent text-xs text-slate-300 flex items-start gap-2.5 transition-colors">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">Cloud_Architecture_Specs.docx</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">24 Chunks · Ready</div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl hover:bg-white/[0.03] border border-transparent text-xs text-slate-300 flex items-start gap-2.5 transition-colors">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">Disaster_Recovery_Plan.md</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">14 Chunks · Ready</div>
                    </div>
                  </div>
                </div>

                {/* Tenant Security Indicator */}
                <div className="mt-8 p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-300">
                  <div className="font-semibold flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> User Isolation Active
                  </div>
                  <p className="text-[11px] text-emerald-400/80 leading-relaxed">
                    Tenant UUID filter enforced at vector layer. Zero possibility of cross-account data leak.
                  </p>
                </div>
              </div>

              {/* Main Chat Workspace Mockup */}
              <div className="md:col-span-8 p-6 flex flex-col justify-between bg-[#0B0F19]/90">
                <div className="space-y-4">
                  {/* User Question */}
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-blue-600 text-white p-3.5 text-xs sm:text-sm font-medium shadow-md">
                      What are the tenant isolation guarantees and chunk eviction rules described in section 4.2?
                    </div>
                  </div>

                  {/* Assistant Answer with Citations */}
                  <div className="flex justify-start">
                    <div className="max-w-[95%] rounded-2xl rounded-tl-sm glass-card border border-white/[0.08] p-4 text-xs sm:text-sm text-slate-200 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
                        <Bot className="w-4 h-4" />
                        <span>Grounded Assistant Synthesis</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          100% Provenance
                        </span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        According to the architecture standards, tenant data is partitioned cryptographically at three discrete layers:
                      </p>
                      <ul className="space-y-1.5 text-xs text-slate-300 pl-2">
                        <li className="flex items-start gap-1.5">
                          <span className="text-blue-400 font-bold">•</span>
                          <span><strong>Row-Level Security:</strong> Database queries apply verified JWT claims on all operations.</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-blue-400 font-bold">•</span>
                          <span><strong>Vector Indexing:</strong> pgvector ANN similarity scans are strictly bounded by user ownership tokens.</span>
                        </li>
                      </ul>

                      {/* Clickable Citation Pill */}
                      <div className="pt-2 border-t border-white/[0.06] flex flex-wrap items-center gap-2">
                        <span className="text-[11px] text-slate-400 font-medium">Verified Sources:</span>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-mono hover:bg-blue-500/25 transition-colors cursor-pointer">
                          <FileText className="w-3 h-3 text-blue-400" />
                          <span>[1] Security_Compliance_2026.pdf · p. 14, §4.2</span>
                          <span className="text-[10px] text-emerald-400 font-bold">96% Match</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Highlighted Citation Drawer Preview Card */}
                  <div className="p-3 rounded-xl bg-gradient-to-r from-blue-950/30 to-indigo-950/20 border border-blue-500/30 text-xs">
                    <div className="flex items-center justify-between text-blue-300 font-semibold mb-1">
                      <span className="flex items-center gap-1">
                        <Search className="w-3 h-3 text-blue-400" /> Source Inspector Excerpt
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">Chunk #104 · Cosine: 0.961</span>
                    </div>
                    <p className="text-[11px] text-slate-300 italic font-serif leading-relaxed">
                      &ldquo;All extracted chunk embeddings are stored alongside the tenant UUID. Lease reconciler cycles continuously purge orphaned indices within 300 seconds of document removal.&rdquo;
                    </p>
                  </div>
                </div>

                {/* Mock Input Field */}
                <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center gap-2">
                  <div className="flex-1 py-2 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-slate-400 flex items-center justify-between">
                    <span>Ask any question across your uploaded documents...</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] text-[10px] font-mono text-slate-400">↵ Enter</kbd>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white cursor-pointer hover:bg-blue-500 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Bento Grid (Awwwards Style) */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto border-t border-white/[0.08]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-3">Architected For Precision</h2>
          <p className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            Built From First Principles. <br />
            No Hallucinations Allowed.
          </p>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            Standard AI chatbots invent plausible-sounding details. Personal RAG binds every factual claim
            directly to immutable text chunks with exact provenance.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Large Span */}
          <div className="md:col-span-2 rounded-2xl glass-card p-8 border border-white/[0.08] hover:border-blue-500/30 transition-all relative overflow-hidden group">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6">
              <FileCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Verifiable Source Drawer</h3>
            <p className="text-slate-400 text-sm leading-relaxed max-w-lg mb-6">
              Every sentence in generated answers links to an authoritatively extracted chunk. Click any
              citation marker to instantly inspect the original document text, page number, and similarity score.
            </p>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] font-mono text-xs text-slate-300">
              <div className="text-emerald-400 mb-1">$ rag.query(&quot;eviction policy&quot;)</div>
              <div className="text-slate-400">&gt; Candidate Chunks: 5 retrieved (recall@5 = 1.0)</div>
              <div className="text-slate-400">&gt; Verified Grounding: Exact match on Page 14 §4.2</div>
            </div>
          </div>

          {/* Card 2: Security */}
          <div className="rounded-2xl glass-card p-8 border border-white/[0.08] hover:border-emerald-500/30 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Zero Cross-Tenant Leakage</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Enforced across schema design, Supabase Row-Level Security, and vector query filters. Your private
              indices can never be scanned or discovered by another user.
            </p>
          </div>

          {/* Card 3: Formats */}
          <div className="rounded-2xl glass-card p-8 border border-white/[0.08] hover:border-purple-500/30 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Universal Extraction</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Handles text PDFs, Microsoft Word (.docx), Markdown (.md), and plain text. Detects scanned or encrypted
              files with actionable error states.
            </p>
          </div>

          {/* Card 4: Streaming */}
          <div className="md:col-span-2 rounded-2xl glass-card p-8 border border-white/[0.08] hover:border-indigo-500/30 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Ultra-Low Latency SSE Streaming</h3>
            <p className="text-slate-400 text-sm leading-relaxed max-w-lg mb-6">
              Post-fetch Server-Sent Events (SSE) with periodic heartbeats ensure smooth token generation and
              prevent proxy timeouts during complex multi-document reasoning.
            </p>
            <div className="flex flex-wrap gap-4 text-xs font-mono">
              <span className="px-3 py-1.5 rounded-lg bg-white/[0.04] text-slate-300 border border-white/[0.08]">
                TTFT: &lt; 150ms
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-white/[0.04] text-slate-300 border border-white/[0.08]">
                Heartbeat: 15s interval
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-white/[0.04] text-slate-300 border border-white/[0.08]">
                Backpressure: Resilient
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Pipeline Section */}
      <section id="architecture" className="py-20 px-6 max-w-7xl mx-auto border-t border-white/[0.08]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3">System Blueprint</h2>
          <p className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-4">
            How The Grounded RAG Pipeline Works
          </p>
          <p className="text-slate-400 text-sm leading-relaxed">
            From file upload to verifiable token generation, every operation runs inside bounded memory and durable transaction guarantees.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-[#0C101B] border border-white/[0.06] relative">
            <div className="text-xs font-mono text-blue-400 font-bold mb-3">01 / INGESTION</div>
            <h4 className="text-base font-bold text-white mb-2">Upload Reservation</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Client requests server quota reservation. File uploads safely to tenant-isolated storage with SHA-256 validation.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-[#0C101B] border border-white/[0.06] relative">
            <div className="text-xs font-mono text-indigo-400 font-bold mb-3">02 / CHUNKING</div>
            <h4 className="text-base font-bold text-white mb-2">Bounded Chunking</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Background workers divide documents into overlap-optimized sections with page and character-index provenance.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-[#0C101B] border border-white/[0.06] relative">
            <div className="text-xs font-mono text-purple-400 font-bold mb-3">03 / INDEXING</div>
            <h4 className="text-base font-bold text-white mb-2">Vector Embeddings</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Embeddings stored in PostgreSQL with pgvector. Indexed via HNSW / IVFFlat with composite tenant constraints.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-[#0C101B] border border-white/[0.06] relative">
            <div className="text-xs font-mono text-emerald-400 font-bold mb-3">04 / GENERATION</div>
            <h4 className="text-base font-bold text-white mb-2">Grounded Streaming</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Retrieved context injects strictly verified sources. Model streams answer with server-resolvable citation references.
            </p>
          </div>
        </div>
      </section>

      {/* Target Capacity & Benchmark Metrics */}
      <section className="py-16 px-6 max-w-7xl mx-auto border-t border-white/[0.08]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl md:text-5xl font-black text-white tracking-tight mb-1">1,000+</div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Registered Capacity</div>
          </div>
          <div>
            <div className="text-3xl md:text-5xl font-black text-blue-400 tracking-tight mb-1">&lt; 150ms</div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Time To First Token</div>
          </div>
          <div>
            <div className="text-3xl md:text-5xl font-black text-emerald-400 tracking-tight mb-1">100%</div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Verifiable Citations</div>
          </div>
          <div>
            <div className="text-3xl md:text-5xl font-black text-purple-400 tracking-tight mb-1">0%</div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Data Leakage Rate</div>
          </div>
        </div>
      </section>

      {/* Bottom Conversion CTA Banner */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <div className="rounded-3xl bg-gradient-to-br from-blue-900/40 via-indigo-950/30 to-[#07090E] border border-blue-500/30 p-10 md:p-16 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/20 blur-[100px] pointer-events-none" />
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            Start Asking Your Documents.
          </h2>
          <p className="text-slate-300 text-sm md:text-base max-w-xl mx-auto mb-8 leading-relaxed">
            Eliminate hallucinations. Empower your research and document workflows with citations you can always verify.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/signup"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-xl shadow-blue-500/25 transition-all"
            >
              Create Free Account
            </Link>
            <Link
              href="/auth/login"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl glass-card text-slate-300 hover:text-white font-medium text-sm transition-all"
            >
              Sign In Existing Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] py-12 px-6 text-xs text-slate-500 bg-[#06080C]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              R
            </div>
            <span className="font-semibold text-slate-300">Personal RAG Assistant</span>
            <span>—</span>
            <span>Next.js 14, FastAPI, Supabase & pgvector</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              All Systems Operational
            </span>
            <Link href="/admin" className="hover:text-slate-300 transition-colors">Telemetry</Link>
            <Link href="/auth/login" className="hover:text-slate-300 transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

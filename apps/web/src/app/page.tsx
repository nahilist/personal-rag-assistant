"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  FileCheck,
  Layers,
  Database,
  Lock,
  Sparkles,
  Zap,
  ChevronRight,
  ArrowUpRight,
  Paperclip,
  Mic,
  Crosshair,
  Lightbulb,
  Clapperboard,
  BarChart3,
  Search,
  Activity,
  CheckCircle2,
  FileText,
  Bot,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [inputQuery, setInputQuery] = useState("");
  const [modelMode, setModelMode] = useState<"Auto" | "Grounded" | "Deep">("Auto");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  const promptSuggestions = [
    { label: "Generate ideas", icon: Lightbulb, query: "Generate ideas for document synthesis and vector indexing" },
    { label: "Motion concept", icon: Clapperboard, query: "Summarize the animation and UI layout principles in Section 2" },
    { label: "Market analysis", icon: BarChart3, query: "Analyze the technical benchmarks and system latency guarantees" },
  ];

  const handleSelectPrompt = (query: string) => {
    setInputQuery(query);
  };

  const handleSendQuery = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    router.push("/auth/signup");
  };

  return (
    <div className="min-h-screen w-full bg-[#07080B] text-slate-100 selection:bg-white selection:text-black relative overflow-x-hidden flex flex-col justify-between">
      
      {/* Cinematic Top Ambient Glow (Edge to Edge) */}
      <div className="absolute top-0 right-1/4 w-[900px] h-[600px] bg-white/[0.03] blur-[180px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-0 w-[700px] h-[700px] bg-blue-600/[0.025] blur-[180px] pointer-events-none -z-10" />

      {/* Top Floating Glass Navigation Bar (Corner-to-Corner Edge Bleed) */}
      <header className="w-full z-50 border-b border-white/[0.07] bg-[#07080B]/80 backdrop-blur-2xl">
        <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24 h-20 flex items-center justify-between">
          
          {/* Left Corner: Brand Logo */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="w-9 h-9 rounded-xl bg-white/[0.08] border border-white/20 flex items-center justify-center text-white group-hover:scale-105 transition-all shadow-md">
              {/* Minimalist Geometric Vector Emblem */}
              <svg viewBox="0 0 100 100" fill="none" className="w-4 h-4 text-white">
                <path
                  d="M 28 28 L 74 72 L 74 28 L 28 72"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">Personal RAG</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-400 border border-white/10">
                PRO 2026
              </span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-10 text-xs font-semibold tracking-wide text-slate-400 uppercase">
            <a href="#hero" className="hover:text-white transition-colors">Hero</a>
            <a href="#overview" className="hover:text-white transition-colors">Overview</a>
            <Link href="/admin" className="hover:text-white transition-colors flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Metrics</span>
            </Link>
          </nav>

          {/* Right Corner: Auth CTAs */}
          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-xs font-semibold text-slate-300 hover:text-white transition-colors px-3 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-white text-black hover:bg-slate-200 transition-all shadow-xl shadow-white/10 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Get Started</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section: CORNER-TO-CORNER FULL-BLEED Dribbble Presentation */}
      <section id="hero" className="w-full flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-16 xl:px-24 py-8 lg:py-12">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center min-h-[calc(100vh-140px)]">
          
          {/* Left Column: Massive Typography & Corner Metadata Cards (Span 7) */}
          <div className="lg:col-span-7 flex flex-col justify-between h-full py-4 lg:py-8 space-y-10 text-left">
            
            {/* Top Tag & Massive Headlines */}
            <div className="space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-medium text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>AI Assistant</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">Multi-Tenant Grounded Knowledge</span>
              </div>

              {/* Master Headline (Exact Dribbble Styling & Scale) */}
              <div className="space-y-1">
                <h1 className="text-6xl sm:text-7xl md:text-8xl xl:text-9xl 2xl:text-[10rem] font-black text-white tracking-tight leading-[0.95]">
                  AI Assistant
                </h1>
                <h2 className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl 2xl:text-8xl font-light text-slate-400 tracking-tight leading-[1.02]">
                  Mobile App Design
                </h2>
              </div>

              {/* Description Paragraph */}
              <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed font-normal pt-2">
                Turn your private PDFs, technical specs, and notes into an interactive assistant.
                Every factual assertion is grounded in verifiable chunk citations with zero data leakage.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link
                  href="/app"
                  className="px-8 py-4 rounded-2xl bg-white text-black font-bold text-sm hover:bg-slate-200 transition-all flex items-center gap-2.5 shadow-2xl shadow-white/10 group"
                >
                  <span>Launch Assistant</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
                <a
                  href="#overview"
                  className="px-7 py-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/10 font-semibold text-sm transition-all flex items-center gap-2"
                >
                  <span>Explore Overview</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </a>
              </div>
            </div>

            {/* Bottom-Left Corner Metadata Cards (Exact Dribbble Reference Match) */}
            <div className="pt-8">
              <div className="grid grid-cols-3 gap-4 max-w-lg">
                {/* Card 1 */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#0F1117]/85 border border-white/[0.09] backdrop-blur-xl shadow-lg">
                  <span className="text-[11px] text-slate-500 font-mono block mb-1 uppercase tracking-wider">Projects</span>
                  <span className="text-sm sm:text-base font-bold text-white block truncate">AI assistant</span>
                </div>

                {/* Card 2 */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#0F1117]/85 border border-white/[0.09] backdrop-blur-xl shadow-lg">
                  <span className="text-[11px] text-slate-500 font-mono block mb-1 uppercase tracking-wider">Designer</span>
                  <span className="text-sm sm:text-base font-bold text-white block truncate">BlockAI Studio</span>
                </div>

                {/* Card 3 */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#0F1117]/85 border border-white/[0.09] backdrop-blur-xl shadow-lg">
                  <span className="text-[11px] text-slate-500 font-mono block mb-1 uppercase tracking-wider">Year</span>
                  <span className="text-sm sm:text-base font-bold text-white block">2026</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Towering Photorealistic Mobile Device On Matte Pedestal (Span 5) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-end relative h-full pt-8 lg:pt-0">
            
            {/* Ambient Radial Backlight behind the flagship device */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[650px] bg-white/[0.07] rounded-full blur-[140px] pointer-events-none -z-10" />

            {/* Towering Smartphone Chassis Container */}
            <div className="w-[350px] sm:w-[400px] xl:w-[420px] h-[760px] sm:h-[820px] rounded-[56px] p-3.5 bg-gradient-to-b from-[#282A33] via-[#16171E] to-[#090A0E] border border-white/20 shadow-[0_30px_100px_rgba(0,0,0,0.98),0_0_50px_rgba(255,255,255,0.08)] relative ring-1 ring-white/10 z-10">
              
              {/* Screen Inner Display */}
              <div className="w-full h-full rounded-[44px] bg-[#0A0B0F] relative overflow-hidden flex flex-col justify-between p-6 text-white select-none">
                
                {/* Conical Spotlight Radiant Beam Streaming from Dynamic Island */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 sm:w-80 h-96 spotlight-cone pointer-events-none opacity-95" />
                <div className="absolute top-12 left-1/2 -translate-x-1/2 w-52 h-52 bg-white/15 rounded-full blur-3xl pointer-events-none" />

                {/* Top Status Bar */}
                <div className="relative z-10 flex items-center justify-between text-xs font-semibold px-2 pt-1 text-slate-300">
                  <span className="tracking-tight font-sans">9:41</span>
                  {/* Dynamic Island Notch */}
                  <div className="w-24 h-6 bg-black rounded-full flex items-center justify-end px-2 gap-1.5 shadow-inner">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#14151B] border border-white/10" />
                    <div className="w-2 h-2 rounded-full bg-emerald-500/80" />
                  </div>
                  {/* Signal & Battery Icons */}
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.9-1.9C9.33 19.64 10.61 20 12 20c4.97 0 9-4.03 9-9s-4.03-9-9-9z"/>
                    </svg>
                    <div className="w-5 h-2.5 rounded-sm border border-slate-300 p-0.5 flex items-center">
                      <div className="h-full w-full bg-white rounded-2xs" />
                    </div>
                  </div>
                </div>

                {/* Mobile Top App Header */}
                <div className="relative z-10 flex items-center justify-between px-1 mt-4">
                  {/* Menu Button */}
                  <button
                    type="button"
                    className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/[0.12] transition-colors"
                  >
                    <div className="space-y-1 w-4">
                      <span className="block h-0.5 w-full bg-current rounded" />
                      <span className="block h-0.5 w-full bg-current rounded" />
                    </div>
                  </button>

                  {/* Header Title */}
                  <span className="text-base font-semibold text-slate-200">New Chat</span>

                  {/* Add New Chat Button */}
                  <button
                    type="button"
                    className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/[0.12] transition-colors text-lg"
                  >
                    +
                  </button>
                </div>

                {/* Center Hero Spotlight Area: The Radiant Emblem & Headline */}
                <div className="relative z-10 flex flex-col items-center justify-center my-auto text-center space-y-6 pt-6">
                  {/* Glowing Geometric Vector Emblem (Exact replica from Dribbble shot) */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/35 rounded-full blur-2xl transform scale-150 pointer-events-none" />
                    <svg
                      viewBox="0 0 100 100"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-24 h-24 text-white relative z-10 glow-symbol transition-transform duration-500 hover:scale-110"
                    >
                      <path
                        d="M 28 28 L 74 72 L 74 28 L 28 72"
                        stroke="white"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  {/* Headline under emblem */}
                  <div className="space-y-1">
                    <h3 className="text-2xl sm:text-3xl font-light tracking-tight text-white/95">
                      How can i help
                    </h3>
                    <h3 className="text-2xl sm:text-3xl font-light tracking-tight text-white/95">
                      you today?
                    </h3>
                  </div>
                </div>

                {/* Bottom Interactive Area */}
                <div className="relative z-10 space-y-3.5">
                  
                  {/* Floating Translucent Glass Composer Card */}
                  <form
                    onSubmit={handleSendQuery}
                    className="rounded-2xl bg-[#14151D]/90 backdrop-blur-2xl border border-white/15 p-3.5 shadow-2xl transition-all hover:border-white/25"
                  >
                    {/* Input Field */}
                    <input
                      type="text"
                      value={inputQuery}
                      onChange={(e) => setInputQuery(e.target.value)}
                      placeholder="What do you want to know ?"
                      className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none py-1 px-1 font-sans"
                    />

                    {/* Bottom Controls Row */}
                    <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-white/[0.08]">
                      
                      {/* Left: Model Selector Pill */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                          className="px-3 py-1 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-xs font-medium text-slate-300 flex items-center gap-1.5 transition-colors"
                        >
                          <Zap className="w-3.5 h-3.5 text-white" />
                          <span>{modelMode}</span>
                          <span className="text-[10px] text-slate-400">⌵</span>
                        </button>

                        {/* Model Dropdown */}
                        {isModelDropdownOpen && (
                          <div className="absolute bottom-full mb-2 left-0 w-36 rounded-xl bg-[#1A1C24] border border-white/15 p-1 shadow-2xl text-xs space-y-0.5 z-30">
                            <button
                              type="button"
                              onClick={() => { setModelMode("Auto"); setIsModelDropdownOpen(false); }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg ${modelMode === "Auto" ? "bg-white/10 text-white font-semibold" : "text-slate-400 hover:text-white"}`}
                            >
                              Auto (Default)
                            </button>
                            <button
                              type="button"
                              onClick={() => { setModelMode("Grounded"); setIsModelDropdownOpen(false); }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg ${modelMode === "Grounded" ? "bg-white/10 text-white font-semibold" : "text-slate-400 hover:text-white"}`}
                            >
                              Grounded RAG
                            </button>
                            <button
                              type="button"
                              onClick={() => { setModelMode("Deep"); setIsModelDropdownOpen(false); }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg ${modelMode === "Deep" ? "bg-white/10 text-white font-semibold" : "text-slate-400 hover:text-white"}`}
                            >
                              Deep Research
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Right: Tool Icons & Send Button */}
                      <div className="flex items-center gap-2.5">
                        <button type="button" className="text-slate-400 hover:text-white p-1" title="Attach document">
                          <Paperclip className="w-4 h-4" />
                        </button>
                        <button type="button" className="text-slate-400 hover:text-white p-1" title="Vector focus">
                          <Crosshair className="w-4 h-4" />
                        </button>
                        <button type="button" className="text-slate-400 hover:text-white p-1" title="Voice query">
                          <Mic className="w-4 h-4" />
                        </button>
                        
                        {/* Square Send Button with Up-Right Arrow [↗] */}
                        <button
                          type="submit"
                          className="w-8 h-8 rounded-xl bg-white/[0.15] hover:bg-white text-white hover:text-black border border-white/20 flex items-center justify-center transition-all shadow-md active:scale-95"
                          title="Send message"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Horizontal Scrollable Prompt Chips */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-[11px]">
                    {promptSuggestions.map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleSelectPrompt(item.query)}
                          className="px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white whitespace-nowrap flex items-center gap-1.5 transition-colors shrink-0"
                        >
                          <Icon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Matte Pedestal Stage beneath the phone extending down to corner edge */}
            <div className="w-[340px] sm:w-[390px] xl:w-[410px] h-10 bg-gradient-to-b from-[#181922] to-[#07080B] border-t border-white/15 rounded-t-xl -mt-4 shadow-2xl relative z-0" />
            <div className="w-[420px] sm:w-[480px] h-6 bg-gradient-to-b from-[#101116] to-transparent rounded-full blur-xl opacity-90" />
          </div>
        </div>
      </section>

      {/* Overview Presentation Slide (Exact Replica from Dribbble Reference) */}
      <section id="overview" className="w-full min-h-[85vh] flex flex-col justify-between px-6 sm:px-10 lg:px-16 xl:px-24 py-24 sm:py-32 relative overflow-hidden bg-[#07080B] border-t border-white/[0.08]">
        
        {/* Diagonal Volumetric Lighting / Gobo Rays in Bottom Corners */}
        <div className="absolute bottom-0 left-0 w-[550px] h-[400px] volumetric-rays-left pointer-events-none opacity-85 -z-10" />
        <div className="absolute bottom-0 right-0 w-[550px] h-[400px] volumetric-rays-right pointer-events-none opacity-85 -z-10" />

        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-stretch justify-between relative z-10 flex-1">
          
          {/* Left Column: Overview Badge (Top) & Massive Emblem (Bottom) */}
          <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-16 lg:space-y-32 text-left">
            {/* Top: Overview Badge Pill */}
            <div>
              <div className="inline-flex items-center px-6 py-3 rounded-2xl bg-[#12141C]/80 border border-white/15 text-sm font-semibold text-white backdrop-blur-xl shadow-lg">
                Overview
              </div>
            </div>

            {/* Bottom: The Iconic Glowing Geometric Emblem */}
            <div className="pt-8">
              <div className="relative w-fit">
                <div className="absolute inset-0 bg-white/25 rounded-full blur-3xl transform scale-150 pointer-events-none" />
                <svg
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-32 h-32 sm:w-40 sm:h-40 xl:w-48 xl:h-48 text-white relative z-10 glow-symbol hover:scale-105 transition-transform duration-500"
                >
                  <path
                    d="M 28 28 L 74 72 L 74 28 L 28 72"
                    stroke="white"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Right Column: Narrative Copy (Top) & 2x2 Metadata Grid (Bottom) */}
          <div className="lg:col-span-7 flex flex-col justify-between h-full space-y-16 lg:space-y-24 text-left">
            {/* Top Narrative Copy */}
            <p className="text-xl sm:text-2xl lg:text-3xl font-light text-slate-300 leading-relaxed max-w-3xl pt-2">
              This project presents a modern AI assistant web interface designed to deliver a seamless, intelligent, and immersive user experience. The interface focuses on clarity, speed, and interaction, allowing users to generate ideas, explore motion concepts, analyze markets, and ask AI-powered questions from a single unified workspace
            </p>

            {/* Bottom 2x2 Project Specifications Grid */}
            <div className="grid grid-cols-2 gap-x-12 sm:gap-x-20 gap-y-10 max-w-xl pt-10">
              {/* Item 1 */}
              <div>
                <span className="text-xs sm:text-sm text-slate-400 font-medium block">Project Type</span>
                <span className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight mt-1.5 block">AI Chat Bot</span>
              </div>

              {/* Item 2 */}
              <div>
                <span className="text-xs sm:text-sm text-slate-400 font-medium block">Platform Name</span>
                <span className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight mt-1.5 block">AI assistant</span>
              </div>

              {/* Item 3 */}
              <div>
                <span className="text-xs sm:text-sm text-slate-400 font-medium block">Timeline</span>
                <span className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight mt-1.5 block">3-4 Weeks</span>
              </div>

              {/* Item 4 */}
              <div>
                <span className="text-xs sm:text-sm text-slate-400 font-medium block">Year</span>
                <span className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight mt-1.5 block">2026</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer (Full Edge to Edge) */}
      <footer className="w-full border-t border-white/[0.08] py-12 px-6 sm:px-10 lg:px-16 xl:px-24 text-xs text-slate-500 bg-[#06070A]">
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-white/[0.08] border border-white/20 flex items-center justify-center text-white font-bold text-xs">
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

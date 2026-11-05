import React from "react";
import { X, BookOpen, FileText, CheckCircle2 } from "lucide-react";
import { MessageSource } from "@/types";

interface CitationDrawerProps {
  source: MessageSource | null;
  onClose: () => void;
}

export const CitationDrawer: React.FC<CitationDrawerProps> = ({
  source,
  onClose,
}) => {
  if (!source) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#090A0F]/95 backdrop-blur-2xl border-l border-white/[0.1] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 text-slate-100">
      <div className="flex items-center justify-between px-6 py-4.5 border-b border-white/[0.08] bg-[#07080B]/80">
        <div className="flex items-center gap-2.5">
          <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-white/[0.1] text-white border border-white/20 rounded-lg shadow-sm">
            {source.label}
          </span>
          <h3 className="font-bold text-white text-sm tracking-tight flex items-center gap-1.5">
            <span>Source Grounding Truth</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 overflow-y-auto space-y-5 flex-1">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <FileText className="w-4 h-4 text-white/70 shrink-0" />
          <span className="font-medium text-slate-200 truncate">
            {source.document_title || "Document"}
          </span>
          {source.page_start && (
            <span className="bg-white/[0.06] border border-white/[0.08] px-2 py-0.5 rounded-md text-[11px] font-mono text-slate-300">
              Page {source.page_start}
            </span>
          )}
          {source.section && (
            <span className="bg-white/[0.06] border border-white/[0.08] px-2 py-0.5 rounded-md text-[11px] font-mono text-slate-300">
              § {source.section}
            </span>
          )}
        </div>

        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 space-y-2.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Verifiable Document Excerpt
          </p>
          <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed font-serif italic">
            &ldquo;{source.excerpt}&rdquo;
          </p>
        </div>

        {source.similarity != null && (
          <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-slate-300 flex items-center justify-between font-mono">
            <span>Cosine Retrieval Similarity</span>
            <span className="font-bold text-emerald-400">{(source.similarity * 100).toFixed(1)}%</span>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/[0.08] bg-[#07080B] flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.08] text-white hover:bg-white/[0.14] transition-all"
        >
          Dismiss Inspector
        </button>
      </div>
    </div>
  );
};

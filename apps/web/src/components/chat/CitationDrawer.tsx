import React from "react";
import { X, BookOpen, FileText } from "lucide-react";
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
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 rounded">
            {source.label}
          </span>
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
            Source Verification
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 overflow-y-auto space-y-4 flex-1">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <FileText className="w-4 h-4 text-slate-400" />
          <span className="font-medium text-slate-700 dark:text-slate-200 truncate">
            {source.document_title || "Document"}
          </span>
          {source.page_start && (
            <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">
              Page {source.page_start}
            </span>
          )}
          {source.section && (
            <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">
              § {source.section}
            </span>
          )}
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Verifiable Document Excerpt
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-serif">
            "{source.excerpt}"
          </p>
        </div>

        <p className="text-xs text-slate-400 leading-normal">
          This excerpt was authoritatively retrieved from your private index and verified against the generated claim.
        </p>
      </div>
    </div>
  );
};


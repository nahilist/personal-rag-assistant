import React from "react";
import { DocumentStatus } from "@/types";

interface BadgeProps {
  status: DocumentStatus | string;
}

export const StatusBadge: React.FC<BadgeProps> = ({ status }) => {
  const styles: Record<string, string> = {
    ready: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    queued: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    extracting: "bg-blue-500/15 text-blue-300 border-blue-500/30 animate-pulse",
    chunking: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30 animate-pulse",
    embedding: "bg-purple-500/15 text-purple-300 border-purple-500/30 animate-pulse",
    uploading: "bg-slate-500/15 text-slate-300 border-slate-500/30",
    failed: "bg-red-500/15 text-red-300 border-red-500/30",
    deleting: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    deleted: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  };

  const currentStyle =
    styles[status] || "bg-slate-500/15 text-slate-300 border-slate-500/30";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${currentStyle}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      <span className="capitalize">{status}</span>
    </span>
  );
};

import React from "react";
import { User, Bot, AlertCircle } from "lucide-react";
import { Message, MessageSource } from "@/types";

interface MessageItemProps {
  message: Message;
  onSelectSource: (source: MessageSource) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onSelectSource,
}) => {
  const isUser = message.role === "user";

  const renderContentWithCitations = (content: string) => {
    const parts = content.split(/(\[S\d+\])/g);
    return parts.map((part, index) => {
      const match = part.match(/\[(S\d+)\]/);
      if (match) {
        const label = match[1];
        const source = message.sources?.find((s) => s.label === label);
        return (
          <button
            key={index}
            onClick={() => source && onSelectSource(source)}
            className="inline-flex items-center px-1.5 py-0.5 mx-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors cursor-pointer border border-blue-200 dark:border-blue-700"
            title={source ? `View source excerpt from ${source.document_title || "Document"}` : "Source reference"}
          >
            {label}
          </button>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div
      className={`flex gap-3 max-w-3xl ${
        isUser ? "ml-auto flex-row-reverse" : "mr-auto"
      }`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white ${
          isUser
            ? "bg-blue-600"
            : "bg-emerald-600 dark:bg-emerald-700 shadow-sm"
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div className={`space-y-2 ${isUser ? "text-right" : "text-left"}`}>
        <div
          className={`p-4 rounded-2xl inline-block text-sm leading-relaxed ${
            isUser
              ? "bg-blue-600 text-white rounded-tr-none text-left"
              : "bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/60 dark:border-slate-700/60"
          }`}
        >
          <div className="whitespace-pre-wrap">
            {renderContentWithCitations(message.content)}
            {message.status === "streaming" && (
              <span className="inline-block w-1.5 h-4 ml-1 bg-blue-500 animate-pulse align-middle" />
            )}
          </div>
        </div>

        {message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-xs text-slate-400 font-medium mr-1 self-center">
              Sources:
            </span>
            {message.sources.map((s) => (
              <button
                key={s.label}
                onClick={() => onSelectSource(s)}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-md bg-slate-200/70 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {s.label}
                </span>
                <span className="truncate max-w-[120px]">
                  {s.document_title || "Document"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


import React, { useState } from "react";
import { User, Bot, Copy, Check, FileText } from "lucide-react";
import { Message, MessageSource } from "@/types";

interface MessageItemProps {
  message: Message;
  onSelectSource: (source: MessageSource) => void;
}

const renderInlineTokens = (
  text: string,
  sources?: MessageSource[] | null,
  onSelectSource?: (s: MessageSource) => void
): React.ReactNode => {
  // Regex matches [S1], **bold**, or `code`
  const tokenRegex = /(\[S\d+\]|\*\*[^*]+\*\*|`[^`]+`)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;

    // 1. Citation pill [S1], [S2], etc.
    const citeMatch = part.match(/^\[(S\d+)\]$/);
    if (citeMatch) {
      const label = citeMatch[1];
      const source = sources?.find((s) => s.label === label);
      return (
        <button
          key={idx}
          type="button"
          onClick={() => source && onSelectSource && onSelectSource(source)}
          className="inline-flex items-center px-2 py-0.5 mx-0.5 text-xs font-mono font-semibold rounded-md bg-white/[0.08] text-white hover:bg-white/[0.18] transition-all cursor-pointer border border-white/20 shadow-xs"
          title={
            source
              ? `Source: ${source.document_title || "Document"}${
                  source.page_start ? ` (Page ${source.page_start})` : ""
                }`
              : "Verifiable source reference"
          }
        >
          {label}
        </button>
      );
    }

    // 2. Bold **text**
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      const inner = part.slice(2, -2);
      return (
        <strong key={idx} className="font-semibold text-slate-900 dark:text-white">
          {renderInlineTokens(inner, sources, onSelectSource)}
        </strong>
      );
    }

    // 3. Inline code `code`
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      const inner = part.slice(1, -1);
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700"
        >
          {inner}
        </code>
      );
    }

    // Plain text segment
    return <span key={idx}>{part}</span>;
  });
};

const renderFormattedContent = (
  content: string,
  sources?: MessageSource[] | null,
  onSelectSource?: (s: MessageSource) => void
) => {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let currentList: { key: number; text: string }[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="my-2 space-y-1.5 pl-1">
          {currentList.map((item) => (
            <li
              key={item.key}
              className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed"
            >
              <span className="text-blue-500 font-bold leading-5 select-none">•</span>
              <div className="flex-1">
                {renderInlineTokens(item.text, sources, onSelectSource)}
              </div>
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      return;
    }

    // Heading 3: ### Title
    if (trimmed.startsWith("### ")) {
      flushList();
      blocks.push(
        <h3
          key={`h3-${index}`}
          className="text-base font-bold text-slate-900 dark:text-slate-100 mt-2 mb-1.5 tracking-tight flex items-center gap-2"
        >
          {renderInlineTokens(trimmed.slice(4), sources, onSelectSource)}
        </h3>
      );
      return;
    }

    // Heading 4: #### Subtitle
    if (trimmed.startsWith("#### ")) {
      flushList();
      blocks.push(
        <h4
          key={`h4-${index}`}
          className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-3 mb-1"
        >
          {renderInlineTokens(trimmed.slice(5), sources, onSelectSource)}
        </h4>
      );
      return;
    }

    // Bullet items
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      currentList.push({ key: index, text: trimmed.slice(2) });
      return;
    }

    // Standard paragraph
    flushList();
    blocks.push(
      <p
        key={`p-${index}`}
        className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 my-1.5"
      >
        {renderInlineTokens(trimmed, sources, onSelectSource)}
      </p>
    );
  });

  flushList();
  return blocks;
};

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onSelectSource,
}) => {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div
      className={`flex gap-3 max-w-3xl ${
        isUser ? "ml-auto flex-row-reverse" : "mr-auto"
      }`}
    >
      {/* Avatar Icon */}
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-white/20 shadow-md ${
          isUser
            ? "bg-white/[0.12] text-white"
            : "bg-[#090A0F] text-white"
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-slate-200" />
        ) : (
          <svg viewBox="0 0 100 100" fill="none" className="w-4 h-4 text-white">
            <path
              d="M 28 28 L 72 72 L 72 28 L 28 72 Z"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      {/* Bubble & Sources */}
      <div className={`space-y-2 flex-1 max-w-2xl ${isUser ? "text-right" : "text-left"}`}>
        <div
          className={`relative group rounded-2xl text-sm leading-relaxed ${
            isUser
              ? "p-4 bg-white/[0.08] text-white rounded-tr-sm text-left inline-block border border-white/15 shadow-xl"
              : "p-5 bg-[#090A0F] text-slate-100 rounded-tl-sm border border-white/[0.08] shadow-2xl"
          }`}
        >
          {/* Copy button for assistant */}
          {!isUser && message.content && (
            <button
              type="button"
              onClick={handleCopy}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
              title="Copy answer"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {/* Content Rendering */}
          <div className="space-y-1">
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              renderFormattedContent(message.content, message.sources, onSelectSource)
            )}

            {message.status === "streaming" && (
              <span className="inline-block w-2 h-4 ml-1 bg-white animate-pulse align-middle rounded-sm" />
            )}
          </div>
        </div>

        {/* Sources Chips Bar */}
        {message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 pl-1">
            <span className="text-[11px] text-slate-400 font-medium mr-1 flex items-center gap-1">
              <FileText className="w-3 h-3 text-slate-400" /> Sources:
            </span>
            {message.sources.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => onSelectSource(s)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-xl bg-[#090A0F] hover:bg-white/[0.06] text-slate-300 hover:text-white border border-white/10 hover:border-white/20 transition-all shadow-sm"
                title={`Open verified excerpt from ${s.document_title || "Document"}`}
              >
                <span className="font-bold font-mono text-white">
                  {s.label}
                </span>
                <span className="truncate max-w-[130px] font-medium text-slate-400">
                  {s.document_title || "Document"}
                </span>
                {s.page_start && (
                  <span className="text-[10px] text-slate-400 bg-white/[0.06] px-1 py-0.5 rounded border border-white/5">
                    p.{s.page_start}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

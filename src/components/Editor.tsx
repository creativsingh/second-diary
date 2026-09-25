import { useRef, useEffect } from "react";
import { Ic } from "@/components/Icons";
import type { Entry } from "@/types";

interface EditorProps {
  entry: Entry | null;
  onUpdateEntry: (field: "title" | "body", value: string) => void;
  dictating: boolean;
  onToggleDictation: () => void;
  saveStatus?: "idle" | "unsaved" | "saving" | "saved" | "error";
  onDeleteEntry?: (id: string) => void;
}

function formatFullDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  } catch {
    return dateStr;
  }
}

function formatTime(hourFloat: number): string {
  const h = Math.floor(hourFloat);
  const m = Math.floor((hourFloat - h) * 60);
  const period = h >= 12 ? "pm" : "am";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m.toString().padStart(2, "0");
  return `${displayH}:${displayM} ${period}`;
}

function getWordCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export function Editor({
  entry,
  onUpdateEntry,
  dictating,
  onToggleDictation,
  saveStatus = "saved",
  onDeleteEntry,
}: EditorProps) {
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize title textarea as content changes
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = "auto";
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`;
    }
  }, [entry?.title]);

  // Focus title when a newly created or empty entry is selected
  useEffect(() => {
    if (entry && !entry.title && !entry.body && titleRef.current) {
      titleRef.current.focus();
    }
  }, [entry?.id]);

  if (!entry) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#c0bbb4] text-[13px]">
        Select or create an entry to begin writing
      </div>
    );
  }

  const wordCount = getWordCount(entry.body);

  return (
    <div className="flex flex-1 flex-col h-full overflow-hidden bg-[#fdfcfb]">
      {/* Top Toolbar */}
      <div className="px-10 py-3 border-b border-[#ece9e4] flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-[#4a4540]">
            {formatFullDate(entry.date)}
          </span>
          <span className="text-[11px] text-[#c0bbb4]">·</span>
          <span className="text-[11px] text-[#9c9690]">
            {formatTime(entry.hour)}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {entry.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] bg-[#f0ece8] text-[#9c9690] px-2.5 py-1 rounded-full font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
          {onDeleteEntry && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Are you sure you want to delete this entry?")) {
                  onDeleteEntry(entry.id);
                }
              }}
              className="text-[#c0bbb4] hover:text-red-500 p-1 rounded hover:bg-[#f0ece8] transition-colors cursor-pointer"
              title="Delete this entry"
            >
              <Ic.trash />
            </button>
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-y-auto px-12 pt-10 pb-8 max-w-3xl mx-auto w-full">
        {/* Title Textarea */}
        <textarea
          ref={titleRef}
          rows={1}
          value={entry.title}
          onChange={(e) => onUpdateEntry("title", e.target.value)}
          placeholder="Title…"
          className="w-full text-[32px] font-semibold text-[#1c1a18] placeholder:text-[#e0dbd4] leading-tight mb-6 font-serif block outline-none border-none bg-transparent resize-none"
        />

        {/* Body Textarea */}
        <div className="relative">
          <textarea
            ref={bodyRef}
            value={entry.body}
            onChange={(e) => onUpdateEntry("body", e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "r") {
                e.preventDefault();
                onToggleDictation();
              }
            }}
            placeholder="Write your thoughts or press ⌘R to dictate…"
            className="w-full text-[15px] text-[#4a4540] placeholder:text-[#d8d3cc] leading-[1.8] min-h-[50vh] outline-none border-none bg-transparent resize-none block"
          />

          {/* Dictation Listening Indicator */}
          {dictating && (
            <div className="absolute top-1 right-0 flex items-center gap-1.5 text-[11px] text-red-500 animate-pulse pointer-events-none bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
              <Ic.mic />
              <span>Listening…</span>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="px-10 py-2.5 border-t border-[#ece9e4] bg-white flex items-center justify-between shrink-0 select-none text-[11px] text-[#c0bbb4]">
        <div className="flex items-center gap-1.5">
          <span>{wordCount} words</span>
          <span className="text-[#e0dbd4]">·</span>
          <span>
            {saveStatus === "saving"
              ? "Saving…"
              : saveStatus === "unsaved"
              ? "Unsaved changes"
              : saveStatus === "error"
              ? "Save error"
              : "Autosaved"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>Local · Private</span>
        </div>
      </div>
    </div>
  );
}

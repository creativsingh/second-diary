import { useRef, useEffect, useState } from "react";
import { Ic } from "@/components/Icons";
import { AddTagModal } from "@/components/AddTagModal";
import { DeleteModal } from "@/components/DeleteModal";
import type { Entry } from "@/types";

interface EditorProps {
  entry: Entry | null;
  onUpdateEntry: (field: "title" | "body", value: string) => void;
  dictating: boolean;
  onToggleDictation: () => void;
  saveStatus?: "idle" | "unsaved" | "saving" | "saved" | "error";
  onDeleteEntry?: (id: string) => void;
  onOpenFolder?: () => void;
  onRevealFile?: (id: string) => void;
  suggestedTags?: string[];
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

export function syncTagsToBody(body: string, newTags: string[]): string {
  const existingTags = Array.from(
    new Set((body.match(/#([\w-]+)/g) || []).map((t) => t.slice(1)))
  );

  let updated = body;

  // Remove tags that are not in newTags
  for (const oldTag of existingTags) {
    if (!newTags.includes(oldTag)) {
      const re = new RegExp(`(?:\\s*)#${oldTag}\\b`, "g");
      updated = updated.replace(re, "");
    }
  }

  // Add tags from newTags that are not present
  const remainingTags = Array.from(
    new Set((updated.match(/#([\w-]+)/g) || []).map((t) => t.slice(1)))
  );
  const tagsToAdd = newTags.filter((t) => !remainingTags.includes(t));

  if (tagsToAdd.length > 0) {
    const tagString = tagsToAdd.map((t) => `#${t}`).join(" ");
    const trimmed = updated.trimEnd();
    updated = trimmed ? `${trimmed} ${tagString}` : tagString;
  }

  return updated;
}

export function Editor({
  entry,
  onUpdateEntry,
  dictating,
  onToggleDictation,
  saveStatus = "saved",
  onDeleteEntry,
  onOpenFolder,
  onRevealFile,
  suggestedTags = [],
}: EditorProps) {
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Close menu on click outside or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [menuOpen]);

  const handleExportPdf = () => {
    setMenuOpen(false);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleViewInFinder = () => {
    setMenuOpen(false);
    if (onRevealFile && entry) {
      onRevealFile(entry.id);
    } else if (onOpenFolder) {
      onOpenFolder();
    }
  };

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
      {/* Print-Only Formatted Document for PDF Export */}
      <div className="hidden print:block print:w-full print:max-w-2xl print:mx-auto print:py-8 font-serif">
        <div className="text-[12px] text-[#8c867e] mb-3 uppercase tracking-wider font-sans">
          {formatFullDate(entry.date)} · {formatTime(entry.hour)}
        </div>
        <h1 className="text-[28px] font-bold text-[#1c1a18] mb-4 leading-tight">
          {entry.title.trim() || "Untitled Entry"}
        </h1>
        {entry.tags.length > 0 && (
          <div className="flex gap-2 mb-6 text-[11px] text-[#7c6f5b] font-sans">
            {entry.tags.map((t) => (
              <span key={t}>#{t}</span>
            ))}
          </div>
        )}
        <div className="text-[15px] text-[#2c2825] leading-[1.8] whitespace-pre-wrap">
          {entry.body}
        </div>
      </div>

      {/* Top Toolbar */}
      <div className="px-10 py-3 border-b border-[#ece9e4] flex items-center justify-between shrink-0 select-none print:hidden">
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
              <button
                key={tag}
                type="button"
                onClick={() => setTagModalOpen(true)}
                className="text-[11px] bg-[#f0ece8] text-[#9c9690] hover:text-[#7c6f5b] hover:bg-[#e8e3dd] px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer"
                title="Click to edit tags"
              >
                #{tag}
              </button>
            ))}
          </div>

          {/* Entry Options Menu Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                menuOpen
                  ? "bg-[#ece9e4] text-[#1c1a18]"
                  : "text-[#8c867e] hover:text-[#1c1a18] hover:bg-[#f0ece8]"
              }`}
              title="Entry options"
              aria-label="Entry options"
              aria-expanded={menuOpen}
            >
              <Ic.more />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-[#ece9e4] p-1.5 z-50 text-[12px] animate-in fade-in zoom-in-95 duration-100">
                {/* 1. Add Tag (Opens multi-tag modal) */}
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setTagModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-left rounded-lg text-[#4a4540] hover:text-[#1c1a18] hover:bg-[#f7f5f2] transition-colors cursor-pointer"
                >
                  <span className="text-[#8c867e] shrink-0">
                    <Ic.tag />
                  </span>
                  <span>Add Tags…</span>
                </button>

                {/* 2. Export to PDF */}
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-left rounded-lg text-[#4a4540] hover:text-[#1c1a18] hover:bg-[#f7f5f2] transition-colors cursor-pointer"
                >
                  <span className="text-[#8c867e] shrink-0">
                    <Ic.filePdf />
                  </span>
                  <span>Export to PDF</span>
                </button>

                {/* 3. View in Finder */}
                <button
                  type="button"
                  onClick={handleViewInFinder}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-left rounded-lg text-[#4a4540] hover:text-[#1c1a18] hover:bg-[#f7f5f2] transition-colors cursor-pointer"
                >
                  <span className="text-[#8c867e] shrink-0">
                    <Ic.folder />
                  </span>
                  <span>View in Finder</span>
                </button>

                {/* Divider before destructive action */}
                {onDeleteEntry && (
                  <>
                    <div className="my-1 border-t border-[#ece9e4]" />

                    {/* 4. Delete Entry (Opens delete confirmation modal) */}
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setDeleteModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-left rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <span className="text-red-500 shrink-0">
                        <Ic.trash />
                      </span>
                      <span>Delete Entry…</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-y-auto px-12 pt-10 pb-8 max-w-3xl mx-auto w-full print:hidden">
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
      <div className="px-10 py-2.5 border-t border-[#ece9e4] bg-white flex items-center justify-between shrink-0 select-none text-[11px] text-[#c0bbb4] print:hidden">
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
      </div>

      {/* Add & Manage Tags Modal */}
      {entry && (
        <AddTagModal
          isOpen={tagModalOpen}
          onClose={() => setTagModalOpen(false)}
          initialTags={entry.tags}
          onSaveTags={(newTags) => {
            const updatedBody = syncTagsToBody(entry.body || "", newTags);
            onUpdateEntry("body", updatedBody);
          }}
          suggestedTags={suggestedTags}
        />
      )}

      {/* Delete Entry Confirmation Modal */}
      {entry && onDeleteEntry && (
        <DeleteModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={() => onDeleteEntry(entry.id)}
          entryTitle={entry.title}
          entryDate={formatFullDate(entry.date)}
        />
      )}
    </div>
  );
}

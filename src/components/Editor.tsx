import { useRef, useEffect, useState } from "react";
import { Ic } from "@/components/Icons";
import { AddTagModal } from "@/components/AddTagModal";
import { DeleteModal } from "@/components/DeleteModal";
import { FloatingDictateModal } from "@/components/FloatingDictateModal";
import type { Entry } from "@/types";

interface EditorProps {
  entry: Entry | null;
  onUpdateEntry: (field: "title" | "body", value: string) => void;
  dictating?: boolean;
  onToggleDictation?: () => void;
  onStartDictateInline?: () => void;
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

  for (const oldTag of existingTags) {
    if (!newTags.includes(oldTag)) {
      const re = new RegExp(`(?:\\s*)#${oldTag}\\b`, "g");
      updated = updated.replace(re, "");
    }
  }

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
  onStartDictateInline,
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
  const [viewSubMode, setViewSubMode] = useState<"diary" | "conversation" | "raw">("diary");

  // Reset sub-view on entry switch
  useEffect(() => {
    setViewSubMode("diary");
  }, [entry?.id]);

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

  // Focus title when newly created or empty entry selected
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

  const handleAppendFromFloatingDictate = (text: string) => {
    const current = entry.body || "";
    const updated = current.trim() ? `${current}\n\n${text}` : text;
    onUpdateEntry("body", updated);
  };

  const isDictationOrigin = entry.origin === "dictation";
  const isConversationOrigin = entry.origin === "conversation";

  return (
    <div className="flex flex-1 flex-col h-full overflow-hidden bg-[#fdfcfb] relative">
      {/* Print-Only Formatted Document for PDF Export */}
      <div className="hidden print:block print:w-full print:max-w-2xl print:mx-auto print:py-8 font-serif">
        <div className="text-[12px] text-[#8c867e] mb-3 uppercase tracking-wider font-sans">
          {formatFullDate(entry.date)} · {formatTime(entry.hour)}
        </div>
        <h1 className="text-[28px] font-bold text-[#1c1a18] mb-4 leading-tight">
          {entry.title.trim() || "Untitled Entry"}
        </h1>
        <div className="text-[15px] text-[#2c2825] leading-[1.8] whitespace-pre-wrap">
          {entry.body}
        </div>
      </div>

      {/* Top Toolbar (Toolbar: date label on left, Raw/Diary toggle on right for dictation-origin entries) */}
      <div className="px-10 py-3 border-b border-[#ece9e4] flex items-center justify-between shrink-0 select-none print:hidden bg-white/50 backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-[#4a4540]">
            {formatFullDate(entry.date)}
          </span>
          <span className="text-[11px] text-[#c0bbb4]">·</span>
          <span className="text-[11px] text-[#9c9690]">
            {formatTime(entry.hour)}
          </span>
          {entry.origin && (
            <span className="ml-2 text-[10px] text-[#7c6f5b] bg-[#f0ece8] px-2 py-0.5 rounded-full capitalize">
              {entry.origin}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Dictation-Origin entries: Raw / Diary toggle */}
          {isDictationOrigin && (
            <div className="flex items-center bg-[#f7f5f2] rounded-lg p-0.5 border border-[#ece9e4]">
              <button
                type="button"
                onClick={() => setViewSubMode("diary")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium capitalize transition-all cursor-pointer ${
                  viewSubMode === "diary"
                    ? "bg-white text-[#1c1a18] shadow-xs"
                    : "text-[#9c9690] hover:text-[#1c1a18]"
                }`}
              >
                diary
              </button>
              <button
                type="button"
                onClick={() => setViewSubMode("raw")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium capitalize transition-all cursor-pointer ${
                  viewSubMode === "raw"
                    ? "bg-white text-[#1c1a18] shadow-xs"
                    : "text-[#9c9690] hover:text-[#1c1a18]"
                }`}
              >
                raw
              </button>
            </div>
          )}

          {/* Conversation-Origin entries: Diary / Conversation / Raw toggle */}
          {isConversationOrigin && (
            <div className="flex items-center bg-[#f7f5f2] rounded-lg p-0.5 border border-[#ece9e4]">
              {(["diary", "conversation", "raw"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewSubMode(mode)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium capitalize transition-all cursor-pointer ${
                    viewSubMode === mode
                      ? "bg-white text-[#1c1a18] shadow-xs"
                      : "text-[#9c9690] hover:text-[#1c1a18]"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          )}

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

                {onDeleteEntry && (
                  <>
                    <div className="my-1 border-t border-[#ece9e4]" />
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

      {/* Editor Content Area */}
      <div className="flex-1 overflow-y-auto px-12 pt-10 pb-16 max-w-3xl mx-auto w-full print:hidden">
        {viewSubMode === "conversation" && entry.conversation && entry.conversation.length > 0 ? (
          /* Conversation Thread View */
          <div className="space-y-6 max-w-lg mx-auto py-4">
            <div className="text-[12px] font-semibold text-[#8c867e] uppercase tracking-wider mb-4 pb-2 border-b border-[#ece9e4]">
              Recorded Conversation Transcript
            </div>
            {entry.conversation.map((msg, i) => (
              <div key={i} className="space-y-1.5">
                {msg.role === "ai" ? (
                  <>
                    <div className="text-[10px] uppercase font-semibold text-[#7c6f5b] tracking-wider">
                      PRIVATE DIARY
                    </div>
                    <div className="font-serif text-[16px] text-[#1c1a18] leading-[1.7]">
                      &ldquo;{msg.text}&rdquo;
                    </div>
                  </>
                ) : (
                  <div className="pl-4 border-l-2 border-[#ece9e4] text-[15px] font-sans text-[#4a4540] leading-[1.7] my-3">
                    {msg.text}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : viewSubMode === "raw" ? (
          /* Raw Verbatim Transcript View */
          <div className="space-y-4 max-w-2xl mx-auto py-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#ece9e4]">
              <span className="text-[12px] font-semibold text-[#8c867e] uppercase tracking-wider">
                Verbatim Transcript
              </span>
              <span className="text-[11px] text-[#b5afa7]">Raw audio text</span>
            </div>
            <div className="bg-[#faf9f7] rounded-xl p-5 border border-[#ece9e4] font-mono text-[13px] text-[#4a4540] leading-relaxed whitespace-pre-wrap">
              {entry.rawTranscript || entry.body}
            </div>
          </div>
        ) : (
          /* Standard Write View */
          <div>
            {/* Title: Lora serif, 26px, medium weight, placeholder "Untitled" */}
            <textarea
              ref={titleRef}
              rows={1}
              value={entry.title}
              onChange={(e) => onUpdateEntry("title", e.target.value)}
              placeholder="Untitled"
              className="w-full text-[26px] font-medium text-[#1c1a18] placeholder:text-[#d8d3cc] leading-tight mb-4 font-serif block outline-none border-none bg-transparent resize-none"
            />

            {/* Body: Inter, 16px, line-height 1.9, placeholder "Write your thoughts or press ⌘R to dictate" */}
            <div className="relative">
              <textarea
                ref={bodyRef}
                value={entry.body}
                onChange={(e) => onUpdateEntry("body", e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "r") {
                    e.preventDefault();
                    if (onStartDictateInline) {
                      onStartDictateInline();
                    } else if (onToggleDictation) {
                      onToggleDictation();
                    }
                  }
                }}
                placeholder="Write your thoughts or press ⌘R to dictate"
                className="w-full text-[16px] text-[#4a4540] placeholder:text-[#c0bbb4] leading-[1.9] min-h-[50vh] outline-none border-none bg-transparent resize-none block font-sans"
              />

              {dictating && (
                <div className="absolute top-1 right-0 flex items-center gap-1.5 text-[11px] text-red-500 animate-pulse pointer-events-none bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                  <Ic.mic />
                  <span>Listening…</span>
                </div>
              )}
            </div>
          </div>
        )}
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

      {/* Floating Dictate Button on Write Editor Canvas (bottom-right: 40px, 32px) */}
      <FloatingDictateModal onAppendToBody={handleAppendFromFloatingDictate} />

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


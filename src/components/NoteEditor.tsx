import { useRef, useEffect } from "react";
import { Ic } from "@/components/Icons";
import { FloatingDictateModal } from "@/components/FloatingDictateModal";
import type { Note } from "@/types";

interface NoteEditorProps {
  note: Note | null;
  onUpdateNote: (id: string, field: "title" | "body", value: string) => void;
  onDeleteNote: (id: string) => void;
  onCreateNote: () => void;
}

function formatNoteDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

function getWordCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export function NoteEditor({
  note,
  onUpdateNote,
  onDeleteNote,
  onCreateNote,
}: NoteEditorProps) {
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize title
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = "auto";
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`;
    }
  }, [note?.title]);

  // Focus title if new/empty
  useEffect(() => {
    if (note && !note.title && !note.body && titleRef.current) {
      titleRef.current.focus();
    }
  }, [note?.id]);

  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#c0bbb4] text-[13px] select-none bg-[#fdfcfb]">
        <div className="w-12 h-12 rounded-2xl bg-[#f7f5f2] flex items-center justify-center text-[#9c9690] mb-3">
          <Ic.notes />
        </div>
        <p className="mb-3 text-[#9c9690]">Select or create a note to begin writing</p>
        <button
          type="button"
          onClick={onCreateNote}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1c1a18] text-white text-[12px] font-medium hover:bg-[#3a3530] transition-colors cursor-pointer shadow-xs"
        >
          <Ic.plus />
          <span>New Note</span>
        </button>
      </div>
    );
  }

  const wordCount = getWordCount(note.body || "");

  const handleAppendFromFloatingDictate = (text: string) => {
    const current = note.body || "";
    const updated = current.trim() ? `${current}\n\n${text}` : text;
    onUpdateNote(note.id, "body", updated);
  };

  return (
    <div className="flex flex-1 flex-col h-full overflow-hidden bg-[#fdfcfb] relative select-none">
      {/* Top Toolbar */}
      <div className="px-10 py-3 border-b border-[#ece9e4] flex items-center justify-between shrink-0 bg-white/50 backdrop-blur-xs">
        <div className="flex items-center gap-2 text-[12px] text-[#4a4540]">
          <span className="font-medium text-[#7c6f5b]">Note</span>
          <span className="text-[#c0bbb4]">·</span>
          <span className="text-[#9c9690]">
            Last edited {formatNoteDate(note.updatedAt || note.createdAt)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onDeleteNote(note.id)}
          className="p-1.5 rounded-md text-[#9c9690] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          title="Delete note"
        >
          <Ic.trash />
        </button>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 overflow-y-auto px-12 pt-10 pb-16 max-w-3xl mx-auto w-full">
        {/* Title: Lora serif, 26px, medium weight */}
        <textarea
          ref={titleRef}
          rows={1}
          value={note.title}
          onChange={(e) => onUpdateNote(note.id, "title", e.target.value)}
          placeholder="Note title…"
          className="w-full text-[26px] font-medium text-[#1c1a18] placeholder:text-[#d8d3cc] leading-tight mb-4 font-serif block outline-none border-none bg-transparent resize-none"
        />

        {/* Body: Inter, 16px, line-height 1.9 */}
        <textarea
          ref={bodyRef}
          value={note.body}
          onChange={(e) => onUpdateNote(note.id, "body", e.target.value)}
          placeholder="Start typing your note or press ⌘R to dictate…"
          className="w-full text-[16px] text-[#4a4540] placeholder:text-[#c0bbb4] leading-[1.9] min-h-[50vh] outline-none border-none bg-transparent resize-none block font-sans"
        />
      </div>

      {/* Status Bar */}
      <div className="px-10 py-2.5 border-t border-[#ece9e4] bg-white flex items-center justify-between shrink-0 text-[11px] text-[#c0bbb4]">
        <div className="flex items-center gap-1.5">
          <span>{wordCount} words</span>
          <span className="text-[#e0dbd4]">·</span>
          <span>Autosaved</span>
        </div>
      </div>

      {/* Persistent Floating Dictate Button */}
      <FloatingDictateModal onAppendToBody={handleAppendFromFloatingDictate} />
    </div>
  );
}

import { Ic } from "@/components/Icons";
import type { Note } from "@/types";

interface NotesPanelProps {
  notes: Note[];
  selectedId: string | null;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

function formatNoteDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(d);
  } catch {
    return "";
  }
}

export function NotesPanel({
  notes,
  selectedId,
  onSelectNote,
  onCreateNote,
  searchQuery,
  onSearchChange,
}: NotesPanelProps) {
  return (
    <div className="w-[260px] h-full bg-[#fdfcfb] border-r border-[#ece9e4] flex flex-col shrink-0 select-none print:hidden">
      {/* Header */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="font-serif text-[15px] font-medium text-[#1c1a18] tracking-tight">
              Notes
            </span>
            <span className="text-[10px] text-[#9c9690] bg-[#f0ece8] px-1.5 py-0.5 rounded-full font-medium">
              {notes.length}
            </span>
          </div>

          <button
            type="button"
            onClick={onCreateNote}
            className="w-6 h-6 rounded-md bg-[#1c1a18] text-white flex items-center justify-center hover:bg-[#3a3530] transition-colors cursor-pointer shadow-xs"
            title="New Note"
          >
            <Ic.plus />
          </button>
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-2 bg-[#f7f5f2] rounded-lg px-2.5 py-1.5 border border-transparent focus-within:border-[#ece9e4] transition-all">
          <span className="text-[#9c9690] shrink-0">
            <Ic.search />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notes…"
            className="text-[11px] text-[#1c1a18] placeholder:text-[#c0bbb4] w-full bg-transparent outline-none border-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="text-[10px] text-[#9c9690] hover:text-[#1c1a18] cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Note List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#f0ece8]">
        {notes.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <p className="text-[12px] text-[#b5afa7] mb-3">
              {searchQuery ? "No matching notes" : "No notes yet"}
            </p>
            {!searchQuery && (
              <button
                type="button"
                onClick={onCreateNote}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1c1a18] text-white text-[11px] font-medium hover:bg-[#3a3530] transition-colors cursor-pointer shadow-xs"
              >
                <Ic.plus />
                <span>Create a note</span>
              </button>
            )}
          </div>
        ) : (
          notes.map((note) => {
            const isSelected = selectedId === note.id;
            return (
              <button
                key={note.id}
                type="button"
                onClick={() => onSelectNote(note.id)}
                className={`w-full px-4 py-3 text-left transition-colors cursor-pointer border-b border-[#f0ece8] ${
                  isSelected
                    ? "bg-[#f7f5f2] border-l-2 border-l-[#1c1a18]"
                    : "hover:bg-[#faf9f7] border-l-2 border-l-transparent"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-[#b5afa7] mb-0.5">
                  <span>{formatNoteDate(note.updatedAt || note.createdAt)}</span>
                  {note.pinned && (
                    <span className="text-[9px] text-[#7c6f5b] bg-[#f0ece5] px-1 rounded font-medium">
                      Pinned
                    </span>
                  )}
                </div>

                <div className="text-[13px] font-semibold leading-snug mb-1 truncate text-[#1c1a18]">
                  {note.title ? note.title : <span className="text-[#b5afa7] italic">Untitled Note</span>}
                </div>

                {note.body && (
                  <div className="text-[12px] text-[#9c9690] leading-relaxed line-clamp-2">
                    {note.body}
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

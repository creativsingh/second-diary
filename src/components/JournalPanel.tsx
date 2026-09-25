import { useState, useMemo } from "react";
import { Ic } from "@/components/Icons";
import { CalendarView } from "@/components/CalendarView";
import { HighlightedSnippet } from "@/components/HighlightedSnippet";
import type { Entry, SearchResult } from "@/types";

interface JournalPanelProps {
  entries: Entry[];
  selectedId: string | null;
  todayDate: string;
  onSelectEntry: (id: string) => void;
  onNewEntry: (date?: string) => void;
  onSelectDate: (dateStr: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchResults: SearchResult[];
  isSearching: boolean;
  onDeleteEntry?: (id: string) => void;
}

function formatRelativeDate(dateStr: string, today: string): string {
  if (dateStr === today) return "Today";
  const [ty, tm, td] = today.split("-").map(Number);
  const yesterday = new Date(ty, tm - 1, td - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
  if (dateStr === yesterdayStr) return "Yesterday";

  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(new Date(y, m - 1, d));
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

export function JournalPanel({
  entries,
  selectedId,
  todayDate,
  onSelectEntry,
  onNewEntry,
  onSelectDate,
  searchQuery,
  onSearchChange,
  searchResults,
  isSearching,
}: JournalPanelProps) {
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  // Group entries by date for list view (newest date first)
  const groupedEntries = useMemo(() => {
    const groups: { date: string; items: Entry[] }[] = [];
    const dateMap = new Map<string, Entry[]>();

    for (const e of entries) {
      if (!dateMap.has(e.date)) {
        dateMap.set(e.date, []);
      }
      dateMap.get(e.date)!.push(e);
    }

    // Sort entries within each date by hour descending
    dateMap.forEach((items, date) => {
      items.sort((a, b) => b.hour - a.hour);
      groups.push({ date, items });
    });

    // Sort date groups descending
    groups.sort((a, b) => b.date.localeCompare(a.date));
    return groups;
  }, [entries]);

  return (
    <div className="w-[260px] h-full bg-white border-r border-[#ece9e4] flex flex-col shrink-0 select-none">
      {/* Header */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px] font-semibold text-[#1c1a18]">
            Journal
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                setViewMode((m) => (m === "list" ? "calendar" : "list"))
              }
              className="w-6 h-6 rounded flex items-center justify-center text-[#9c9690] hover:bg-[#f0ece8] transition-colors cursor-pointer"
              title={
                viewMode === "list"
                  ? "Switch to Calendar view"
                  : "Switch to List view"
              }
            >
              {viewMode === "list" ? <Ic.calendar /> : <Ic.list />}
            </button>
            <button
              type="button"
              onClick={() => onNewEntry()}
              className="w-6 h-6 rounded-md bg-[#1c1a18] text-white flex items-center justify-center hover:bg-[#3a3530] transition-colors cursor-pointer shadow-xs"
              title="New Entry for Today"
            >
              <Ic.plus />
            </button>
          </div>
        </div>

        {/* Search bar in list view */}
        {viewMode === "list" && (
          <div className="flex items-center gap-2 bg-[#f7f5f2] rounded-lg px-2.5 py-1.5 border border-transparent focus-within:border-[#ece9e4] transition-all">
            <span className="text-[#9c9690] shrink-0">
              <Ic.search />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search entries…"
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
        )}
      </div>

      {/* Panel Body */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === "calendar" ? (
          <CalendarView
            entries={entries}
            selectedId={selectedId}
            todayDate={todayDate}
            onSelectEntry={onSelectEntry}
            onNewEntry={onNewEntry}
            onSelectDate={onSelectDate}
          />
        ) : searchQuery.trim() ? (
          /* FTS5 / Filtered search results view */
          <div className="divide-y divide-[#f0ece8]">
            <div className="px-4 py-2 bg-[#faf9f7] text-[10px] font-semibold text-[#b5afa7] uppercase tracking-wide flex items-center justify-between">
              <span>Results ({searchResults.length})</span>
              {isSearching && (
                <span className="text-[10px] text-[#7c6f5b] lowercase animate-pulse">
                  searching…
                </span>
              )}
            </div>

            {searchResults.length === 0 ? (
              <div className="p-6 text-center text-[12px] text-[#b5afa7]">
                No matching entries found
              </div>
            ) : (
              searchResults.map((result) => {
                const isSelected = selectedId === result.id;
                return (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => onSelectEntry(result.id)}
                    className={`w-full px-4 py-3 text-left transition-colors cursor-pointer border-b border-[#f0ece8] ${
                      isSelected ? "bg-[#f7f5f2]" : "hover:bg-[#faf9f7]"
                    }`}
                  >
                    <div className="text-[10px] text-[#b5afa7] mb-1">
                      {formatRelativeDate(result.date, todayDate)}
                    </div>
                    <div className="text-[12px] leading-snug font-medium text-[#1c1a18] mb-1 truncate">
                      {result.title || "Untitled"}
                    </div>
                    <div className="text-[11px] text-[#9c9690] leading-relaxed line-clamp-2">
                      <HighlightedSnippet snippet={result.snippet} />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        ) : (
          /* Standard grouped list view */
          <div className="divide-y divide-[#f0ece8]">
            {groupedEntries.map((group) => (
              <div key={group.date}>
                {/* Date header */}
                <div className="px-4 py-1.5 bg-[#faf9f7] border-b border-[#f0ece8] text-[10px] font-semibold text-[#b5afa7] uppercase tracking-wide flex items-center justify-between group/header">
                  <span>{formatRelativeDate(group.date, todayDate)}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-[#c0bbb4] font-normal lowercase tracking-normal">
                      {group.items.length} {group.items.length === 1 ? "entry" : "entries"}
                    </span>
                    {group.date <= todayDate && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNewEntry(group.date);
                        }}
                        className="opacity-0 group-hover/header:opacity-100 hover:text-[#1c1a18] p-0.5 rounded hover:bg-[#ece9e4] transition-all cursor-pointer"
                        title={`Add entry for ${formatRelativeDate(group.date, todayDate)}`}
                      >
                        <Ic.plus />
                      </button>
                    )}
                  </div>
                </div>

                {/* Entry rows */}
                {group.items.map((entry) => {
                  const isSelected = selectedId === entry.id;
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => onSelectEntry(entry.id)}
                      className={`w-full px-4 py-3 text-left transition-colors cursor-pointer border-b border-[#f0ece8] ${
                        isSelected ? "bg-[#f7f5f2]" : "hover:bg-[#faf9f7]"
                      }`}
                    >
                      <div className="text-[10px] text-[#b5afa7] mb-0.5">
                        {formatTime(entry.hour)}
                      </div>
                      <div className="text-[12px] leading-snug mb-1">
                        {entry.title ? (
                          <span className="text-[#1c1a18] font-medium">
                            {entry.title}
                          </span>
                        ) : (
                          <span className="text-[#b5afa7] italic">
                            Untitled
                          </span>
                        )}
                      </div>
                      {entry.body && (
                        <div className="text-[11px] text-[#9c9690] leading-relaxed line-clamp-2">
                          {entry.body}
                        </div>
                      )}
                      {entry.tags.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {entry.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] bg-[#f0ece8] text-[#9c9690] px-2 py-0.5 rounded-full font-medium"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

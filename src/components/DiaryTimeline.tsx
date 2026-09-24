import { useState, useMemo, useRef, useEffect } from "react";
import {
  Calendar,
  CalendarDays,
  Search,
  X,
  Loader2,
  FileSearch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  shiftDateString,
  getRelativeDateLabel,
  formatDateShort,
  formatDayOfWeek,
} from "@/db";
import { useDiarySearch } from "@/hooks";
import { HighlightedSnippet } from "@/components/HighlightedSnippet";
import type { Entry } from "@/types";

interface DiaryTimelineProps {
  selectedDate: string;
  todayDate: string;
  allEntries: Entry[];
  onSelectDate: (dateStr: string) => void;
}

export function DiaryTimeline({
  selectedDate,
  todayDate,
  allEntries,
  onSelectDate,
}: DiaryTimelineProps) {
  const [filterMode, setFilterMode] = useState<"all" | "entries">("all");
  const [visibleDaysCount, setVisibleDaysCount] = useState<number>(30);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    clearSearch,
  } = useDiarySearch();

  // Keyboard shortcut to focus search input: Cmd+F or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "f" || e.key === "F" || e.key === "k" || e.key === "K")) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
      if (e.key === "Escape" && searchQuery) {
        clearSearch();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchQuery, clearSearch]);

  // Map of date string -> Entry for fast lookup
  const entriesMap = useMemo(() => {
    const map = new Map<string, Entry>();
    for (const e of allEntries) {
      map.set(e.date, e);
    }
    return map;
  }, [allEntries]);

  // Generate continuous chronological list of dates (descending: newest to oldest)
  const timelineDates = useMemo(() => {
    let maxDate = todayDate;
    if (selectedDate > maxDate) {
      maxDate = selectedDate;
    }

    let minDate = shiftDateString(todayDate, -visibleDaysCount);
    if (selectedDate < minDate) {
      minDate = selectedDate;
    }

    const list: string[] = [];
    let cur = maxDate;
    let iterations = 0;
    while (cur >= minDate && iterations < 365) {
      list.push(cur);
      cur = shiftDateString(cur, -1);
      iterations++;
    }

    if (filterMode === "entries") {
      return list.filter(
        (d) => entriesMap.has(d) || d === todayDate || d === selectedDate
      );
    }

    return list;
  }, [todayDate, selectedDate, visibleDaysCount, filterMode, entriesMap]);

  const hasSearchQuery = searchQuery.trim().length > 0;

  return (
    <aside className="flex h-full w-80 flex-col border-r border-neutral-800/80 bg-neutral-950/70 select-none backdrop-blur-sm">
      {/* Timeline Header & Search Bar */}
      <div className="flex flex-col border-b border-neutral-800/80 p-3.5 gap-2.5 bg-neutral-900/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-emerald-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-200">
              Timeline
            </h3>
            <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] font-mono text-neutral-400 border border-neutral-700/60">
              {allEntries.length} {allEntries.length === 1 ? "entry" : "entries"}
            </span>
          </div>

          {/* Quick jump to Today */}
          {selectedDate !== todayDate && (
            <Button
              variant="outline"
              size="xs"
              onClick={() => onSelectDate(todayDate)}
              className="text-[11px] h-6 px-2 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-300"
              title="Jump to Today (⌘T)"
            >
              Today
            </Button>
          )}
        </div>

        {/* Local FTS5 Full-Text Search Input */}
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 size-3.5 text-neutral-500 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entries (⌘F)..."
            className="w-full rounded-lg bg-neutral-900/90 pl-8 pr-7 py-1.5 text-xs text-neutral-100 placeholder:text-neutral-500 border border-neutral-800 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2 text-neutral-500 hover:text-neutral-300 p-0.5"
              title="Clear search (Esc)"
            >
              <X className="size-3" />
            </button>
          )}
        </div>

        {/* View Mode Filter Tabs (Only shown when not searching) */}
        {!hasSearchQuery && (
          <div className="flex items-center rounded-lg bg-neutral-900 p-0.5 border border-neutral-800 text-[11px]">
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={`flex-1 rounded-md py-1 font-medium transition-all ${
                filterMode === "all"
                  ? "bg-neutral-800 text-neutral-100 shadow-sm"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              All Days
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("entries")}
              className={`flex-1 rounded-md py-1 font-medium transition-all ${
                filterMode === "entries"
                  ? "bg-neutral-800 text-neutral-100 shadow-sm"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Entries Only
            </button>
          </div>
        )}

        {/* Search Results Summary Header */}
        {hasSearchQuery && (
          <div className="flex items-center justify-between text-[11px] text-neutral-400 px-0.5">
            <span className="flex items-center gap-1.5 font-medium text-neutral-300">
              <FileSearch className="size-3.5 text-emerald-400" />
              <span>
                {isSearching ? (
                  "Searching SQLite..."
                ) : (
                  <>
                    {searchResults.length}{" "}
                    {searchResults.length === 1 ? "match" : "matches"} found
                  </>
                )}
              </span>
            </span>
            {isSearching && <Loader2 className="size-3 animate-spin text-neutral-400" />}
          </div>
        )}
      </div>

      {/* Main Content: Search Results OR Chronological Date List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin scrollbar-thumb-neutral-800">
        {hasSearchQuery ? (
          /* Search Results View */
          searchResults.length > 0 ? (
            searchResults.map((result) => {
              const isToday = result.date === todayDate;
              const isSelected = result.date === selectedDate;
              const relativeLabel = getRelativeDateLabel(result.date);
              const dayName = formatDayOfWeek(result.date);
              const shortDate = formatDateShort(result.date);

              return (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => onSelectDate(result.date)}
                  className={`w-full text-left rounded-xl p-3 transition-all group flex flex-col gap-1.5 border ${
                    isSelected
                      ? "bg-neutral-800/90 border-neutral-700 shadow-md ring-1 ring-emerald-500/30"
                      : "bg-neutral-900/40 border-neutral-800/60 hover:bg-neutral-900 hover:border-neutral-700"
                  }`}
                >
                  {/* Matching Date Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`size-2 rounded-full shrink-0 ${
                          isToday ? "bg-emerald-400" : "bg-neutral-400"
                        }`}
                      />
                      <span className="text-xs font-semibold text-neutral-200">
                        {dayName}, {shortDate}
                      </span>
                      <span className="font-mono text-[10px] text-neutral-500">
                        {result.date}
                      </span>
                    </div>

                    {isToday ? (
                      <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-medium text-emerald-400 border border-emerald-500/30">
                        Today
                      </span>
                    ) : relativeLabel ? (
                      <span className="text-[10px] text-neutral-400 font-medium">
                        {relativeLabel}
                      </span>
                    ) : null}
                  </div>

                  {/* Entry Title with highlight */}
                  <div className="text-xs font-medium text-neutral-100">
                    <HighlightedSnippet
                      snippet={result.title || "Untitled entry"}
                    />
                  </div>

                  {/* Contextual Snippet with highlight */}
                  {result.snippet && (
                    <div className="text-[11px] text-neutral-400 leading-snug line-clamp-2 bg-neutral-950/40 rounded p-1.5 border border-neutral-800/40 font-mono text-[10.5px]">
                      <HighlightedSnippet snippet={result.snippet} />
                    </div>
                  )}
                </button>
              );
            })
          ) : !isSearching ? (
            /* No Results Empty State */
            <div className="p-6 text-center text-neutral-500 space-y-2">
              <p className="text-xs">No entries match &ldquo;{searchQuery}&rdquo;</p>
              <Button
                variant="ghost"
                size="xs"
                onClick={clearSearch}
                className="text-xs text-emerald-400 hover:text-emerald-300"
              >
                Clear search
              </Button>
            </div>
          ) : null
        ) : (
          /* Standard Chronological Date List */
          timelineDates.map((dateStr) => {
            const isToday = dateStr === todayDate;
            const isSelected = dateStr === selectedDate;
            const entry = entriesMap.get(dateStr);
            const hasEntry = !!entry;
            const relativeLabel = getRelativeDateLabel(dateStr);
            const dayName = formatDayOfWeek(dateStr);
            const shortDate = formatDateShort(dateStr);

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => onSelectDate(dateStr)}
                className={`w-full text-left rounded-xl p-2.5 transition-all group flex flex-col gap-1 border ${
                  isSelected
                    ? "bg-neutral-800/90 border-neutral-700 shadow-md ring-1 ring-emerald-500/30"
                    : isToday
                    ? "bg-emerald-950/20 border-emerald-500/30 hover:bg-emerald-950/30"
                    : "bg-neutral-900/30 border-transparent hover:bg-neutral-900/80 hover:border-neutral-800"
                }`}
              >
                {/* Date & Badge Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`size-2 rounded-full shrink-0 ${
                        isToday
                          ? "bg-emerald-400 ring-2 ring-emerald-500/20"
                          : hasEntry
                          ? "bg-neutral-400 group-hover:bg-emerald-400"
                          : "bg-neutral-700/60"
                      }`}
                    />
                    <span
                      className={`text-xs font-semibold ${
                        isSelected
                          ? "text-neutral-100"
                          : isToday
                          ? "text-emerald-400"
                          : "text-neutral-300 group-hover:text-neutral-100"
                      }`}
                    >
                      {dayName}, {shortDate}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {isToday ? (
                      <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-medium text-emerald-400 border border-emerald-500/30">
                        Today
                      </span>
                    ) : relativeLabel ? (
                      <span className="text-[10px] text-neutral-400 font-medium">
                        {relativeLabel}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Entry Preview or Empty State */}
                <div className="pl-4">
                  {hasEntry ? (
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-neutral-200 line-clamp-1">
                        {entry.title.trim() || "Untitled entry"}
                      </p>
                      {entry.content.trim() && (
                        <p className="text-[11px] text-neutral-400 line-clamp-1 leading-snug">
                          {entry.content.trim()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-neutral-500 italic">
                      Empty date • Click to write
                    </p>
                  )}
                </div>
              </button>
            );
          })
        )}

        {/* Load more dates button */}
        {!hasSearchQuery && filterMode === "all" && (
          <div className="pt-2 pb-1 text-center">
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setVisibleDaysCount((prev) => prev + 30)}
              className="text-[11px] text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 w-full"
            >
              Load earlier dates...
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Date Jump Tool */}
      <div className="border-t border-neutral-900 p-2.5 bg-neutral-950/90 text-xs flex items-center justify-between text-neutral-400">
        <label className="text-[11px] flex items-center gap-1.5 cursor-pointer text-neutral-400 hover:text-neutral-200">
          <Calendar className="size-3 text-neutral-500" />
          <span>Jump to date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              if (e.target.value) {
                onSelectDate(e.target.value);
              }
            }}
            className="rounded bg-neutral-900 px-1.5 py-0.5 text-[11px] font-mono text-neutral-200 border border-neutral-800 focus:outline-none focus:border-emerald-500"
          />
        </label>
      </div>
    </aside>
  );
}

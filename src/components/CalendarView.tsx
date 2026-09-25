import { useState, useMemo, useEffect } from "react";
import { Ic } from "@/components/Icons";
import type { Entry } from "@/types";

interface CalendarViewProps {
  entries: Entry[];
  selectedId: string | null;
  todayDate: string;
  onSelectEntry: (id: string) => void;
  onNewEntry?: (date?: string) => void;
  onSelectDate?: (dateStr: string) => void;
}

function formatDateHeading(dateStr: string, today: string): string {
  if (dateStr === today) return "Today";
  const [ty, tm, td] = today.split("-").map(Number);
  const yesterday = new Date(ty, tm - 1, td - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(
    yesterday.getMonth() + 1
  ).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
  if (dateStr === yesterdayStr) return "Yesterday";

  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
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

export function CalendarView({
  entries,
  selectedId,
  todayDate,
  onSelectEntry,
  onNewEntry,
  onSelectDate,
}: CalendarViewProps) {
  // Determine initially selected date based on currently active entry or today
  const activeEntryDate = useMemo(() => {
    return entries.find((e) => e.id === selectedId)?.date || todayDate;
  }, [entries, selectedId, todayDate]);

  const [selectedDate, setSelectedDate] = useState<string>(activeEntryDate);

  // Keep selectedDate in sync if an entry is selected from outside
  useEffect(() => {
    if (activeEntryDate) {
      setSelectedDate(activeEntryDate);
    }
  }, [activeEntryDate]);

  // Calendar month view navigation
  const [viewDate, setViewDate] = useState(() => {
    const [y, m] = activeEntryDate.split("-").map(Number);
    return !isNaN(y) && !isNaN(m) ? new Date(y, m - 1, 1) : new Date();
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-indexed

  const monthLabel = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(viewDate);
  }, [viewDate]);

  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  // Build calendar matrix
  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sun
    const totalDays = new Date(year, month + 1, 0).getDate();

    const cells: ({ dayNum: number; dateStr: string } | null)[] = [];
    for (let i = 0; i < firstDay; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        d
      ).padStart(2, "0")}`;
      cells.push({ dayNum: d, dateStr });
    }
    return cells;
  }, [year, month]);

  // Count entries per date
  const entryCountByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of entries) {
      map.set(e.date, (map.get(e.date) || 0) + 1);
    }
    return map;
  }, [entries]);

  // Entries available for the currently selected date, ordered newest first
  const selectedDateEntries = useMemo(() => {
    return entries
      .filter((e) => e.date === selectedDate)
      .sort((a, b) => {
        const timeA =
          a.createdAt instanceof Date
            ? a.createdAt.getTime()
            : a.createdAt
            ? new Date(a.createdAt).getTime()
            : a.hour;
        const timeB =
          b.createdAt instanceof Date
            ? b.createdAt.getTime()
            : b.createdAt
            ? new Date(b.createdAt).getTime()
            : b.hour;
        if (timeB !== timeA) return timeB - timeA;
        return b.hour - a.hour;
      });
  }, [entries, selectedDate]);

  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    onSelectDate?.(dateStr);

    const matching = entries
      .filter((e) => e.date === dateStr)
      .sort((a, b) => {
        const timeA =
          a.createdAt instanceof Date
            ? a.createdAt.getTime()
            : a.createdAt
            ? new Date(a.createdAt).getTime()
            : a.hour;
        const timeB =
          b.createdAt instanceof Date
            ? b.createdAt.getTime()
            : b.createdAt
            ? new Date(b.createdAt).getTime()
            : b.hour;
        if (timeB !== timeA) return timeB - timeA;
        return b.hour - a.hour;
      });

    if (matching.length > 0) {
      onSelectEntry(matching[0].id);
    }
  };

  return (
    <div className="flex flex-col select-none pb-4">
      {/* Calendar Grid Container */}
      <div className="px-4 py-3 border-b border-[#ece9e4]">
        {/* Month Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[12px] font-medium text-[#4a4540]">
            {monthLabel}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 hover:bg-[#f0ece8] rounded text-[#9c9690] transition-colors cursor-pointer"
              title="Previous month"
            >
              <Ic.chevronL />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 hover:bg-[#f0ece8] rounded text-[#9c9690] transition-colors cursor-pointer"
              title="Next month"
            >
              <Ic.chevronR />
            </button>
          </div>
        </div>

        {/* Weekday abbreviations */}
        <div className="grid grid-cols-7 text-center mb-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((dayName, idx) => (
            <span key={idx} className="text-[9px] text-[#c0bbb4] font-medium">
              {dayName}
            </span>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((cell, idx) => {
            if (!cell) {
              return <div key={`empty-${idx}`} className="h-7" />;
            }

            const isToday = cell.dateStr === todayDate;
            const isSelected = cell.dateStr === selectedDate;
            const isFuture = cell.dateStr > todayDate;
            const count = entryCountByDate.get(cell.dateStr) || 0;
            const hasEntry = count > 0;

            let cellClass = "";
            if (isToday) {
              cellClass = isSelected
                ? "bg-[#1c1a18] text-white font-medium shadow-sm ring-2 ring-[#7c6f5b] ring-offset-1"
                : "bg-[#1c1a18] text-white font-medium shadow-sm";
            } else if (isSelected) {
              cellClass = hasEntry
                ? "bg-[#e8e4de] text-[#1c1a18] font-semibold ring-1.5 ring-[#7c6f5b]"
                : "bg-[#f0ece8] text-[#1c1a18] font-medium ring-1 ring-[#d8d3cc]";
            } else if (hasEntry) {
              cellClass = "bg-[#f7f5f2] text-[#4a4540] hover:bg-[#ece9e4]";
            } else if (isFuture) {
              cellClass = "text-[#d8d3cc] hover:bg-[#faf9f7]";
            } else {
              cellClass = "text-[#8c867e] hover:bg-[#faf9f7]";
            }

            return (
              <button
                key={cell.dateStr}
                type="button"
                onClick={() => handleDateClick(cell.dateStr)}
                className={`h-7 rounded-md text-[10px] flex flex-col items-center justify-center relative transition-colors cursor-pointer ${cellClass}`}
                title={
                  count > 0
                    ? `${count} ${count === 1 ? "entry" : "entries"}`
                    : isFuture
                    ? "Future date"
                    : undefined
                }
              >
                <span>{cell.dayNum}</span>
                {count === 1 && !isToday && (
                  <span className="size-1 rounded-full bg-[#7c6f5b] absolute bottom-1" />
                )}
                {count > 1 && !isToday && (
                  <span className="flex gap-0.5 absolute bottom-1">
                    <span className="size-1 rounded-full bg-[#7c6f5b]" />
                    <span className="size-1 rounded-full bg-[#7c6f5b]" />
                  </span>
                )}
                {count > 0 && isToday && (
                  <span className="size-1 rounded-full bg-white/70 absolute bottom-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Entries List Available Beneath Calendar */}
      <div>
        {/* Date header */}
        <div className="px-4 py-2 bg-[#faf9f7] border-b border-[#f0ece8] text-[10px] font-semibold text-[#b5afa7] uppercase tracking-wide flex items-center justify-between group/calheader">
          <span>{formatDateHeading(selectedDate, todayDate)}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-[#c0bbb4] font-normal lowercase tracking-normal">
              {selectedDateEntries.length}{" "}
              {selectedDateEntries.length === 1 ? "entry" : "entries"}
            </span>
            {selectedDate <= todayDate && onNewEntry && (
              <button
                type="button"
                onClick={() => onNewEntry(selectedDate)}
                className="hover:text-[#1c1a18] p-0.5 rounded hover:bg-[#ece9e4] transition-all cursor-pointer"
                title={`Add entry for ${formatDateHeading(selectedDate, todayDate)}`}
              >
                <Ic.plus />
              </button>
            )}
          </div>
        </div>

        {/* Entries for selectedDate */}
        {selectedDateEntries.length === 0 ? (
          <div className="py-7 px-4 text-center">
            {selectedDate > todayDate ? (
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-[#8c867e]">
                  Future date
                </p>
                <p className="text-[10px] text-[#b5afa7]">
                  Entries cannot be created for future dates
                </p>
              </div>
            ) : (
              <>
                <p className="text-[11px] text-[#b5afa7] mb-3">
                  No entries for this date
                </p>
                {onNewEntry && (
                  <button
                    type="button"
                    onClick={() => onNewEntry(selectedDate)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1c1a18] text-white text-[11px] font-medium hover:bg-[#3a3530] transition-colors cursor-pointer shadow-xs"
                  >
                    <Ic.plus />
                    <span>Create entry for this day</span>
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#f0ece8]">
            {selectedDateEntries.map((entry) => {
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
                      <span className="text-[#b5afa7] italic">Untitled</span>
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
        )}
      </div>
    </div>
  );
}

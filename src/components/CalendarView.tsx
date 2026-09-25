import { useState, useMemo } from "react";
import { Ic } from "@/components/Icons";
import type { Entry } from "@/types";

interface CalendarViewProps {
  entries: Entry[];
  todayDate: string;
  onSelectDate: (dateStr: string) => void;
}

export function CalendarView({
  entries,
  todayDate,
  onSelectDate,
}: CalendarViewProps) {
  const [viewDate, setViewDate] = useState(() => new Date());

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

  const entryCountByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of entries) {
      map.set(e.date, (map.get(e.date) || 0) + 1);
    }
    return map;
  }, [entries]);

  return (
    <div className="px-4 py-3 select-none">
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
          const count = entryCountByDate.get(cell.dateStr) || 0;
          const hasEntry = count > 0;

          return (
            <button
              key={cell.dateStr}
              type="button"
              onClick={() => onSelectDate(cell.dateStr)}
              className={`h-7 rounded-md text-[10px] flex flex-col items-center justify-center relative transition-colors cursor-pointer ${
                isToday
                  ? "bg-[#1c1a18] text-white font-medium shadow-sm"
                  : hasEntry
                  ? "bg-[#f7f5f2] text-[#4a4540] hover:bg-[#ece9e4]"
                  : "text-[#c0bbb4] hover:bg-[#faf9f7]"
              }`}
              title={
                count > 0
                  ? `${count} ${count === 1 ? "entry" : "entries"}`
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
            </button>
          );
        })}
      </div>
    </div>
  );
}

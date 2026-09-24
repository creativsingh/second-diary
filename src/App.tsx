import { useState } from "react";
import { BookMarked, ShieldCheck, PanelLeft, PanelLeftClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDiaryEntry } from "@/hooks";
import { DiaryTimeline } from "@/components/DiaryTimeline";
import { TodayScreen } from "@/components/TodayScreen";

export default function App() {
  const [isTimelineOpen, setIsTimelineOpen] = useState<boolean>(true);
  const diary = useDiaryEntry();

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-neutral-950 text-neutral-100 selection:bg-neutral-800">
      {/* Top Window Drag Area / App Header */}
      <header
        data-tauri-drag-region
        className="flex h-11 shrink-0 items-center justify-between border-b border-neutral-800/80 px-4 select-none bg-neutral-900/60 backdrop-blur"
      >
        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setIsTimelineOpen((prev) => !prev)}
            className="text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800"
            title={`${isTimelineOpen ? "Hide" : "Show"} Timeline (⌘\\)`}
          >
            {isTimelineOpen ? (
              <PanelLeftClose className="size-4" />
            ) : (
              <PanelLeft className="size-4" />
            )}
          </Button>

          <div className="flex items-center gap-2">
            <BookMarked className="size-4 text-emerald-400" />
            <span className="text-xs font-semibold tracking-wider text-neutral-200 uppercase">
              Second Diary
            </span>
            <span className="text-[10px] text-neutral-500 font-mono">v0.1.0</span>
          </div>
        </div>

        {/* Center Quick Jump / Mode Indicator */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => diary.goToToday()}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium border transition-all ${
              diary.isToday
                ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/30"
                : "bg-neutral-800/80 text-neutral-300 border-neutral-700/50 hover:bg-neutral-800 hover:text-neutral-100"
            }`}
          >
            <span
              className={`size-1.5 rounded-full ${
                diary.isToday ? "bg-emerald-400" : "bg-neutral-400"
              }`}
            />
            <span>Today's Entry</span>
          </button>
        </div>

        {/* Right Status Badge */}
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <span className="size-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
          <span className="hidden sm:inline text-[11px] font-medium text-neutral-300">
            Offline SQLite
          </span>
          <ShieldCheck className="size-3.5 text-emerald-400" />
        </div>
      </header>

      {/* Main Layout: Timeline Sidebar + Editor Screen */}
      <div className="flex flex-1 overflow-hidden">
        {isTimelineOpen && (
          <DiaryTimeline
            selectedDate={diary.selectedDate}
            todayDate={diary.todayDate}
            allEntries={diary.allEntries}
            onSelectDate={(date) => diary.goToDate(date)}
          />
        )}

        <main className="flex flex-1 flex-col overflow-hidden">
          <TodayScreen
            diary={diary}
            onToggleTimeline={() => setIsTimelineOpen((prev) => !prev)}
            isTimelineOpen={isTimelineOpen}
          />
        </main>
      </div>
    </div>
  );
}

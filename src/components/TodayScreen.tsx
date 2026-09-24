import { useEffect, useRef, useMemo } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  CloudOff,
  Database,
  HardDrive,
  Loader2,
  Save,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTodayEntry } from "@/hooks";
import type { UseDiaryEntryReturn } from "@/hooks";
import {
  formatDateDisplay,
  getRelativeDateLabel,
} from "@/db";

interface TodayScreenProps {
  diary?: UseDiaryEntryReturn;
  onToggleTimeline?: () => void;
  isTimelineOpen?: boolean;
}

export function TodayScreen({
  diary: propDiary,
  onToggleTimeline,
  isTimelineOpen = true,
}: TodayScreenProps) {
  // If diary is provided via props, use it; otherwise fallback to hook
  const defaultDiary = useTodayEntry();
  const diary = propDiary || defaultDiary;

  const {
    selectedDate,
    isToday,
    entry,
    title,
    content,
    isLoading,
    saveStatus,
    lastSavedAt,
    errorMessage,
    setTitle,
    setContent,
    saveNow,
    reload,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    wordCount,
    charCount,
  } = diary;

  const titleInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Formatted date string for user display: e.g. "Wednesday, September 23, 2026"
  const formattedDate = useMemo(() => {
    return formatDateDisplay(selectedDate);
  }, [selectedDate]);

  const relativeLabel = useMemo(() => {
    return getRelativeDateLabel(selectedDate);
  }, [selectedDate]);

  // Formatted time for last saved status
  const formattedLastSaved = useMemo(() => {
    if (!lastSavedAt) return null;
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(lastSavedAt);
  }, [lastSavedAt]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+S or Ctrl+S: Save immediately
      if ((e.metaKey || e.ctrlKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        saveNow();
        return;
      }

      // Cmd+T or Ctrl+T: Jump to Today
      if ((e.metaKey || e.ctrlKey) && (e.key === "t" || e.key === "T")) {
        e.preventDefault();
        goToToday();
        return;
      }

      // Cmd+\ or Ctrl+\: Toggle Timeline sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
        e.preventDefault();
        onToggleTimeline?.();
        return;
      }

      // Previous Day: Alt+ArrowLeft or Cmd+[
      if (
        (e.altKey && e.key === "ArrowLeft") ||
        ((e.metaKey || e.ctrlKey) && e.key === "[")
      ) {
        e.preventDefault();
        goToPreviousDay();
        return;
      }

      // Next Day: Alt+ArrowRight or Cmd+]
      if (
        (e.altKey && e.key === "ArrowRight") ||
        ((e.metaKey || e.ctrlKey) && e.key === "]")
      ) {
        e.preventDefault();
        goToNextDay();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saveNow, goToToday, goToPreviousDay, goToNextDay, onToggleTimeline]);

  // Estimated reading time
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-12 text-neutral-400">
        <Loader2 className="size-8 animate-spin text-emerald-400 mb-3" />
        <p className="text-sm font-medium">Connecting to local SQLite database...</p>
        <span className="text-xs text-neutral-500 mt-1">
          Loading entry for {selectedDate}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-neutral-950 text-neutral-100">
      {/* Top Action Bar / Date Header */}
      <header className="flex flex-wrap items-center justify-between border-b border-neutral-800/80 px-4 py-3 bg-neutral-900/40 backdrop-blur select-none gap-3">
        <div className="flex items-center gap-3">
          {/* Timeline Sidebar Toggle Button */}
          {onToggleTimeline && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onToggleTimeline}
              className="text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800"
              title={`${isTimelineOpen ? "Hide" : "Show"} Timeline (⌘\\)`}
            >
              {isTimelineOpen ? (
                <PanelLeftClose className="size-4" />
              ) : (
                <PanelLeft className="size-4" />
              )}
            </Button>
          )}

          {/* Previous / Next Day Navigation Chevrons */}
          <div className="flex items-center rounded-lg bg-neutral-900/90 p-0.5 border border-neutral-800 shadow-sm">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => goToPreviousDay()}
              className="size-7 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800"
              title="Previous Day (⌥← or ⌘[)"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => goToNextDay()}
              className="size-7 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800"
              title="Next Day (⌥→ or ⌘])"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          {/* Date Information */}
          <div className="flex items-center gap-2.5">
            <div
              className={`flex size-8 items-center justify-center rounded-lg border shadow-inner ${
                isToday
                  ? "bg-emerald-950/50 text-emerald-400 border-emerald-500/40 ring-1 ring-emerald-500/20"
                  : "bg-neutral-800/90 text-neutral-300 border-neutral-700/60"
              }`}
            >
              <Calendar className="size-4" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2
                  className={`text-sm font-semibold tracking-tight ${
                    isToday ? "text-emerald-300" : "text-neutral-200"
                  }`}
                >
                  {formattedDate}
                </h2>

                {/* Relative Badge */}
                {isToday ? (
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
                    Today
                  </span>
                ) : relativeLabel ? (
                  <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] font-medium text-neutral-300 border border-neutral-700">
                    {relativeLabel}
                  </span>
                ) : null}

                {/* Jump to Today Button when viewing other dates */}
                {!isToday && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => goToToday()}
                    className="h-5 px-1.5 text-[10px] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30"
                    title="Jump to Today (⌘T)"
                  >
                    Go to Today
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <span className="font-mono text-[11px] text-neutral-500">
                  {selectedDate}
                </span>
                {entry?.createdAt ? (
                  <>
                    <span>•</span>
                    <span>
                      Created{" "}
                      {new Intl.DateTimeFormat("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      }).format(entry.createdAt)}
                    </span>
                  </>
                ) : (
                  <>
                    <span>•</span>
                    <span className="text-neutral-500 italic">Empty entry</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status and Save Actions */}
        <div className="flex items-center gap-3">
          {/* Save Status Badge */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            {saveStatus === "saving" && (
              <span className="inline-flex items-center gap-1.5 text-amber-400">
                <Loader2 className="size-3 animate-spin" />
                <span>Saving locally...</span>
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="inline-flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="size-3.5" />
                <span>
                  Autosaved {formattedLastSaved ? `at ${formattedLastSaved}` : ""}
                </span>
              </span>
            )}
            {saveStatus === "unsaved" && (
              <span className="inline-flex items-center gap-1.5 text-neutral-400">
                <span className="size-2 rounded-full bg-amber-400/80 animate-pulse" />
                <span>Unsaved changes</span>
              </span>
            )}
            {saveStatus === "idle" && (
              <span className="inline-flex items-center gap-1.5 text-neutral-500">
                <Clock className="size-3" />
                <span>Ready to write</span>
              </span>
            )}
            {saveStatus === "error" && (
              <span className="inline-flex items-center gap-1.5 text-rose-400">
                <AlertCircle className="size-3.5" />
                <span>Save failed</span>
              </span>
            )}
          </div>

          {/* Manual Save Button */}
          <Button
            onClick={() => saveNow()}
            disabled={saveStatus === "saving"}
            variant="secondary"
            size="sm"
            className="border border-neutral-700 bg-neutral-800 text-neutral-200 hover:bg-neutral-700 hover:text-white transition-all shadow-sm"
          >
            <Save className="size-3.5 mr-1" />
            <span>Save</span>
            <kbd className="ml-1.5 hidden sm:inline-block rounded bg-neutral-900 px-1.5 py-0.2 text-[10px] font-mono text-neutral-400 border border-neutral-700">
              ⌘S
            </kbd>
          </Button>
        </div>
      </header>

      {/* Error banner if save or load failed */}
      {errorMessage && (
        <div className="mx-6 mt-3 flex items-center justify-between rounded-lg border border-rose-900/60 bg-rose-950/40 p-3 text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => reload()}
            className="text-rose-300 hover:text-rose-100 hover:bg-rose-900/40"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Journal Entry Editor Area */}
      <div className="flex flex-1 flex-col overflow-hidden px-8 py-6 max-w-4xl w-full mx-auto">
        {/* Title Input */}
        <div className="mb-4">
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              isToday
                ? "Today's Title..."
                : `Title for ${formattedDate}...`
            }
            className="w-full bg-transparent text-2xl sm:text-3xl font-bold tracking-tight text-neutral-100 placeholder:text-neutral-600 focus:outline-none transition-colors border-b border-transparent focus:border-neutral-800 pb-2"
          />
        </div>

        {/* Content Textarea */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              entry
                ? "Write your thoughts... Autosaves locally on every keystroke."
                : `No entry for this date yet. Start writing your thoughts for ${formattedDate}... Autosaves locally in SQLite.`
            }
            className="flex-1 w-full resize-none bg-transparent font-sans text-base text-neutral-200 placeholder:text-neutral-600 focus:outline-none leading-relaxed selection:bg-neutral-800 scrollbar-thin scrollbar-thumb-neutral-800"
          />
        </div>
      </div>

      {/* Bottom Footer Status Bar */}
      <footer className="flex flex-wrap items-center justify-between border-t border-neutral-900 bg-neutral-950/80 px-6 py-2.5 text-xs text-neutral-500 select-none gap-2">
        {/* Metrics */}
        <div className="flex items-center gap-3">
          <span>
            {wordCount} {wordCount === 1 ? "word" : "words"}
          </span>
          <span>•</span>
          <span>{charCount} characters</span>
          {wordCount > 0 && (
            <>
              <span>•</span>
              <span>{readingTimeMinutes} min read</span>
            </>
          )}
        </div>

        {/* Keyboard shortcut tips */}
        <div className="hidden md:flex items-center gap-3 text-[11px] text-neutral-500 font-mono">
          <span>⌥← Prev Day</span>
          <span>•</span>
          <span>⌥→ Next Day</span>
          <span>•</span>
          <span>⌘T Today</span>
          <span>•</span>
          <span>⌘\ Timeline</span>
        </div>

        {/* Privacy & Storage Guarantee */}
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-emerald-400/90">
            <Database className="size-3" />
            <span>SQLite Local File</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-neutral-400">
            <CloudOff className="size-3" />
            <span>Zero Cloud Network Requests</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-neutral-400">
            <HardDrive className="size-3" />
            <span>Mac Application Support</span>
          </span>
        </div>
      </footer>
    </div>
  );
}

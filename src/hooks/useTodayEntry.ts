import { useState, useEffect, useRef, useCallback } from "react";
import {
  getEntryByDate,
  saveEntry,
  getAllEntries,
  getTodayDateString,
  shiftDateString,
} from "@/db";
import type { DbEntry } from "@/types";

export type SaveStatus = "idle" | "unsaved" | "saving" | "saved" | "error";

export interface UseDiaryEntryReturn {
  selectedDate: string;
  todayDate: string;
  isToday: boolean;
  entry: DbEntry | null;
  title: string;
  content: string;
  isLoading: boolean;
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
  errorMessage: string | null;
  allEntries: DbEntry[];
  setTitle: (title: string) => void;
  setContent: (content: string) => void;
  saveNow: () => Promise<void>;
  reload: () => Promise<void>;
  goToDate: (dateStr: string) => Promise<void>;
  goToPreviousDay: () => Promise<void>;
  goToNextDay: () => Promise<void>;
  goToToday: () => Promise<void>;
  wordCount: number;
  charCount: number;
}

export type UseTodayEntryReturn = UseDiaryEntryReturn;

export function useTodayEntry(initialDate?: string): UseDiaryEntryReturn {
  const [todayDate] = useState<string>(() => getTodayDateString());
  const [selectedDate, setSelectedDate] = useState<string>(
    () => initialDate || getTodayDateString()
  );
  const [entry, setEntry] = useState<DbEntry | null>(null);
  const [title, setTitleState] = useState<string>("");
  const [content, setContentState] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [allEntries, setAllEntries] = useState<DbEntry[]>([]);

  // References to keep latest values across async timeouts and callbacks
  const stateRef = useRef({
    title: "",
    content: "",
    entry: null as DbEntry | null,
    saveStatus: "idle" as SaveStatus,
    selectedDate,
    todayDate,
  });

  stateRef.current = {
    title,
    content,
    entry,
    saveStatus,
    selectedDate,
    todayDate,
  };

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refresh all chronological entries from SQLite
  const refreshAllEntries = useCallback(async () => {
    try {
      const list = await getAllEntries();
      setAllEntries(list);
    } catch (e) {
      console.warn("[useTodayEntry] Failed to refresh all entries:", e);
    }
  }, []);

  // Load entry for the currently selected date
  const loadEntryForDate = useCallback(
    async (targetDate: string) => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const existing = await getEntryByDate(targetDate);
        if (existing) {
          setEntry(existing);
          setTitleState(existing.title);
          setContentState(existing.content);
          setLastSavedAt(existing.updatedAt);
          setSaveStatus("saved");
        } else {
          setEntry(null);
          setTitleState("");
          setContentState("");
          setLastSavedAt(null);
          setSaveStatus("idle");
        }
      } catch (err: any) {
        console.error(`[useTodayEntry] Failed to load entry for ${targetDate}:`, err);
        setErrorMessage(err?.message || "Failed to load entry from SQLite");
        setSaveStatus("error");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Effect to load entry when selectedDate changes and initialize allEntries
  useEffect(() => {
    loadEntryForDate(selectedDate);
    refreshAllEntries();
  }, [selectedDate, loadEntryForDate, refreshAllEntries]);

  // Saves current title and content for the currently selected date to SQLite
  const executeSave = useCallback(
    async (targetTitle: string, targetContent: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      setSaveStatus("saving");
      setErrorMessage(null);

      try {
        const saved = await saveEntry({
          id: stateRef.current.entry?.id,
          date: stateRef.current.selectedDate,
          title: targetTitle,
          content: targetContent,
        });

        setEntry(saved);
        setLastSavedAt(saved.updatedAt);
        setSaveStatus("saved");
        // Update all entries list so timeline updates in real time
        refreshAllEntries();
      } catch (err: any) {
        console.error("[useTodayEntry] Save failed:", err);
        setErrorMessage(err?.message || "Failed to save entry locally");
        setSaveStatus("error");
      }
    },
    [refreshAllEntries]
  );

  // Debounced autosave (750ms)
  const scheduleAutosave = useCallback(
    (newTitle: string, newContent: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      setSaveStatus("unsaved");

      debounceTimerRef.current = setTimeout(() => {
        executeSave(newTitle, newContent);
      }, 750);
    },
    [executeSave]
  );

  const setTitle = useCallback(
    (newTitle: string) => {
      setTitleState(newTitle);
      scheduleAutosave(newTitle, stateRef.current.content);
    },
    [scheduleAutosave]
  );

  const setContent = useCallback(
    (newContent: string) => {
      setContentState(newContent);
      scheduleAutosave(stateRef.current.title, newContent);
    },
    [scheduleAutosave]
  );

  const saveNow = useCallback(async () => {
    await executeSave(stateRef.current.title, stateRef.current.content);
  }, [executeSave]);

  // Navigate to a specific date, flushing any unsaved changes before switching
  const goToDate = useCallback(
    async (targetDate: string) => {
      if (targetDate === stateRef.current.selectedDate) return;

      // Flush unsaved edits for the outgoing date immediately
      if (stateRef.current.saveStatus === "unsaved") {
        await executeSave(stateRef.current.title, stateRef.current.content);
      } else if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      setSelectedDate(targetDate);
    },
    [executeSave]
  );

  const goToPreviousDay = useCallback(async () => {
    const prev = shiftDateString(stateRef.current.selectedDate, -1);
    await goToDate(prev);
  }, [goToDate]);

  const goToNextDay = useCallback(async () => {
    const next = shiftDateString(stateRef.current.selectedDate, 1);
    await goToDate(next);
  }, [goToDate]);

  const goToToday = useCallback(async () => {
    await goToDate(todayDate);
  }, [goToDate, todayDate]);

  // Flush unsaved changes on window unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (stateRef.current.saveStatus === "unsaved") {
        executeSave(stateRef.current.title, stateRef.current.content);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [executeSave]);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const isToday = selectedDate === todayDate;

  return {
    selectedDate,
    todayDate,
    isToday,
    entry,
    title,
    content,
    isLoading,
    saveStatus,
    lastSavedAt,
    errorMessage,
    allEntries,
    setTitle,
    setContent,
    saveNow,
    reload: () => loadEntryForDate(selectedDate),
    goToDate,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    wordCount,
    charCount,
  };
}

export { useTodayEntry as useDiaryEntry };

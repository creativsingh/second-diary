import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  getAllEntries,
  saveEntry,
  deleteEntry,
  searchEntries,
  getTodayDateString,
  openMarkdownFolder,
  revealMarkdownFile,
} from "@/db";
import type { Entry, SearchResult } from "@/types";

// Initial seed entries from the UI specification (used if SQLite is empty on first run)
const INITIAL_SEEDS = [
  {
    date: getTodayDateString(),
    hour: 9.2,
    title: "Morning coffee & the hum of the city",
    body: "The espresso machine hissed alive at 6:45. From the fourth-floor window, the street was already awake in that quiet, purposeful way Tuesday mornings always are. A bicyclist with a yellow rain jacket crossed the intersection, then a delivery truck whose brakes chirped at the stop sign.\n\nI sat with my journal for forty minutes without touching my phone. It felt like reclaiming a piece of myself that the week usually tries to borrow.",
    tags: ["morning", "reflection"],
    mood: "calm",
    origin: "dictation" as const,
    originTime: "9:12 AM",
    rawTranscript:
      "so the espresso machine hissed alive around six forty-five and from the fourth floor window the street was already awake in that quiet purposeful way Tuesday mornings always are... a bicyclist in a yellow jacket crossed the intersection then a delivery truck whose brakes chirped. I sat with my journal for forty minutes without looking at my phone.",
  },
  {
    date: getTodayDateString(),
    hour: 15.5,
    title: "Afternoon thoughts on local memory",
    body: "A brief pause between focused writing blocks. Tea on the desk, steam curling upward. Realized how important it is to capture different textures of the same day—the sharp clarity of morning versus the relaxed synthesis of the afternoon.\n\nAllowing multiple entries per day turns a journal from a daily chore into an open canvas for spontaneous thoughts.",
    tags: ["reflection", "ideas"],
    mood: "reflective",
  },
  {
    date: shiftDate(getTodayDateString(), -1),
    hour: 21.4,
    title: "On building things that last",
    body: "Spent the evening reading old architecture essays—not software, physical architecture. Christopher Alexander on the 'quality without a name.' There's a resonance there with how we should approach software tools: not as disposable feeds designed to capture attention, but as quiet, durable furniture for the mind.",
    tags: ["ideas", "projects"],
    mood: "focused",
  },
  {
    date: shiftDate(getTodayDateString(), -3),
    hour: 15.0,
    title: "Walk through the arboretum",
    body: "The maples are starting to turn early this year. Sharp crimson at the edges of leaves that are otherwise still summer-green. The path by the creek was damp from yesterday's rain, and the air smelled like wet stone and decaying pine needles.\n\nWalked 7 kilometers without music. Ideas flow so much better when the auditory channel isn't occupied.",
    tags: ["nature", "life"],
    mood: "energized",
  },
  {
    date: shiftDate(getTodayDateString(), -6),
    hour: 11.7,
    title: "Conversation with Marcus",
    body: "Met Marcus at the bookstore cafe. He's thinking about leaving academia to build an educational tool. We debated whether tools should shape thought or simply reflect it. He argued that the interface is the pedagogy; I argued that great tools get out of the way.\n\nProbably both are true depending on the domain.",
    tags: ["people", "ideas"],
    mood: "inspired",
    origin: "conversation" as const,
    originTime: "11:42 AM",
    conversation: [
      { role: "ai" as const, text: "How are you feeling about the tools you spend your day with?" },
      {
        role: "user" as const,
        text: "Marcus and I debated whether tools should shape thought or just get out of the way.",
      },
      { role: "ai" as const, text: "What conclusion felt most truthful to you?" },
      {
        role: "user" as const,
        text: "Probably both—the interface is the pedagogy, but the best tools quietly recede.",
      },
    ],
    rawTranscript: JSON.stringify(
      [
        { role: "ai", text: "How are you feeling about the tools you spend your day with?" },
        {
          role: "user",
          text: "Marcus and I debated whether tools should shape thought or just get out of the way.",
        },
        { role: "ai", text: "What conclusion felt most truthful to you?" },
        {
          role: "user",
          text: "Probably both—the interface is the pedagogy, but the best tools quietly recede.",
        },
      ],
      null,
      2
    ),
  },
  {
    date: shiftDate(getTodayDateString(), -10),
    hour: 8.5,
    title: "Notes on Calvino's Six Memos",
    body: "Lightness, Quickness, Exactitude, Visibility, Multiplicity. He never got to finish Consistency. I keep coming back to 'Exactitude'—the well-defined, calculated plan, evoking clear, memorable images. How rare that is in modern writing, where vagueness is often mistaken for depth.",
    tags: ["reading", "books"],
    mood: "contemplative",
  },
  {
    date: shiftDate(getTodayDateString(), -14),
    hour: 18.2,
    title: "Reflections on a quiet weekend",
    body: "No social commitments. Cooked braised lentils with carrots and thyme. Fixed the latch on the pantry door that has been sticking since March. Read eighty pages of the biography. Sometimes the best weekends are the ones where nothing happened that would make for an interesting story.",
    tags: ["life", "reflection"],
    mood: "peaceful",
  },
  {
    date: shiftDate(getTodayDateString(), -19),
    hour: 14.1,
    title: "Initial thoughts on personal memory",
    body: "Brainstorming ways to connect memories like atoms in a molecular web. Linear timelines are wonderful for chronology, but human recollection functions through associative leaps—people, places, recurring themes, and serendipitous tags.",
    tags: ["ideas", "projects"],
    mood: "curious",
  },
];

function shiftDate(dateStr: string, offsetDays: number): string {
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + offsetDays);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return dateStr;
  }
}

function parseTags(text: string): string[] {
  const match = text.match(/#([\w-]+)/g);
  return match ? Array.from(new Set(match.map((t) => t.slice(1)))) : [];
}

export function useDiary() {
  const todayDate = useMemo(() => getTodayDateString(), []);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "unsaved" | "saving" | "saved" | "error">("saved");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestEntryRef = useRef<Entry | null>(null);

  // Load entries from SQLite on mount
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setIsLoading(true);
        const loadedEntries = await getAllEntries();

        if (cancelled) return;

        if (loadedEntries.length === 0) {
          // Empty on first launch: Seed initial entries
          const createdList: Entry[] = [];
          for (const seed of INITIAL_SEEDS) {
            const [y, m, d] = seed.date.split("-").map(Number);
            const seedHour = Math.floor(seed.hour);
            const seedMinute = Math.floor((seed.hour - seedHour) * 60);
            const seedCreated = new Date(y, m - 1, d, seedHour, seedMinute);
            const saved = await saveEntry({
              date: seed.date,
              title: seed.title,
              content: seed.body,
              createdAt: seedCreated,
              hour: seed.hour,
            });
            createdList.push({
              ...saved,
              tags: seed.tags,
              mood: (seed as any).mood,
              origin: (seed as any).origin,
              originTime: (seed as any).originTime,
              rawTranscript: (seed as any).rawTranscript,
              conversation: (seed as any).conversation,
            });
          }
          if (!cancelled) {
            setEntries(createdList);
            setSelectedId(createdList[0]?.id ?? null);
          }
        } else {
          if (!cancelled) {
            setEntries(loadedEntries);
            // Select today's entry or first entry
            const todayMatch = loadedEntries.find((e) => e.date === todayDate);
            setSelectedId(todayMatch ? todayMatch.id : loadedEntries[0]?.id ?? null);
          }
        }
      } catch (err) {
        console.error("[useDiary] Failed to load entries:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [todayDate]);

  // Selected entry object
  const selectedEntry = useMemo(() => {
    if (!selectedId) return entries[0] || null;
    return entries.find((e) => e.id === selectedId) || null;
  }, [entries, selectedId]);

  latestEntryRef.current = selectedEntry;

  // Persist entry to SQLite with debounce
  const triggerDebouncedSave = useCallback((entryToSave: Entry) => {
    setSaveStatus("unsaved");
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setSaveStatus("saving");
        await saveEntry({
          id: entryToSave.id,
          date: entryToSave.date,
          title: entryToSave.title,
          content: entryToSave.body,
        });
        setSaveStatus("saved");
      } catch (err) {
        console.error("[useDiary] Save failed:", err);
        setSaveStatus("error");
      }
    }, 600);
  }, []);

  // Update multiple fields on selected entry
  const updateCurrentEntryFields = useCallback(
    (fields: Partial<Entry>) => {
      if (!selectedId) return;

      setEntries((prev) =>
        prev.map((e) => {
          if (e.id !== selectedId) return e;
          const updated = { ...e, ...fields };
          if (fields.body !== undefined) {
            updated.tags = parseTags(fields.body);
          }
          triggerDebouncedSave(updated);
          return updated;
        })
      );
    },
    [selectedId, triggerDebouncedSave]
  );

  // Update single field on selected entry
  const updateCurrentEntry = useCallback(
    (field: "title" | "body", value: string) => {
      updateCurrentEntryFields({ [field]: value });
    },
    [updateCurrentEntryFields]
  );

  // Create new empty entry for a date (or today). If forceNew is false, select existing entry if found.
  const createEntryForDate = useCallback(
    async (
      targetDate: string = todayDate,
      forceNew: boolean = false,
      initialData?: {
        title?: string;
        body?: string;
        origin?: "dictation" | "conversation";
        originTime?: string;
        rawTranscript?: string;
        conversation?: { role: "user" | "ai"; text: string }[];
        mood?: string;
      }
    ) => {
      // Disallow creating entries for future dates
      if (targetDate > todayDate) {
        console.warn(`[useDiary] Cannot create entry for future date: ${targetDate}`);
        return null;
      }

      // If not forcing a new entry, select the most recent existing entry for that date
      if (!forceNew) {
        const existing = entries.find((e) => e.date === targetDate);
        if (existing) {
          setSelectedId(existing.id);
          return existing.id;
        }
      }

      // Flush pending save for outgoing entry if needed
      if (saveTimeoutRef.current && latestEntryRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
        saveEntry({
          id: latestEntryRef.current.id,
          date: latestEntryRef.current.date,
          title: latestEntryRef.current.title,
          content: latestEntryRef.current.body,
        }).catch((err) => console.error("[useDiary] Flush save failed:", err));
      }

      const now = new Date();
      const hour = now.getHours() + now.getMinutes() / 60;
      const title = initialData?.title || "";
      const body = initialData?.body || "";
      const tags = parseTags(body);

      const newEntry: Entry = {
        id: crypto.randomUUID(),
        date: targetDate,
        title,
        body,
        hour: Math.round(hour * 10) / 10,
        tags,
        mood: initialData?.mood || (initialData?.origin === "conversation" ? "inspired" : initialData?.origin === "dictation" ? "calm" : undefined),
        origin: initialData?.origin,
        originTime: initialData?.originTime || `${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, "0")} ${now.getHours() >= 12 ? "PM" : "AM"}`,
        rawTranscript: initialData?.rawTranscript,
        conversation: initialData?.conversation,
        createdAt: now,
        updatedAt: now,
      };

      setEntries((prev) => [newEntry, ...prev]);
      setSelectedId(newEntry.id);

      try {
        await saveEntry({
          id: newEntry.id,
          date: newEntry.date,
          title: newEntry.title,
          content: newEntry.body,
          createdAt: newEntry.createdAt,
        });
      } catch (err) {
        console.error("[useDiary] Failed to save new entry:", err);
      }

      return newEntry.id;
    },
    [entries, todayDate]
  );

  // Delete an entry by ID (or delete currently selected entry)
  const deleteEntryById = useCallback(
    async (idToDelete?: string) => {
      const targetId = idToDelete || selectedId;
      if (!targetId) return;

      try {
        await deleteEntry(targetId);
        setEntries((prev) => {
          const next = prev.filter((e) => e.id !== targetId);
          if (selectedId === targetId) {
            setSelectedId(next[0]?.id ?? null);
          }
          return next;
        });
      } catch (err) {
        console.error("[useDiary] Failed to delete entry:", err);
      }
    },
    [selectedId]
  );

  // FTS5 Search across SQLite database
  useEffect(() => {
    let active = true;
    const query = searchQuery.trim();

    if (!query) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchEntries(query);
        if (active) {
          setSearchResults(results);
        }
      } catch (err) {
        console.error("[useDiary] Search failed:", err);
      } finally {
        if (active) setIsSearching(false);
      }
    }, 150);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Filter entries by active tag
  const filteredEntries = useMemo(() => {
    if (!activeTag) return entries;
    return entries.filter((e) => e.tags.includes(activeTag));
  }, [entries, activeTag]);

  // Extract top tags from all entries
  const topTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of entries) {
      for (const t of e.tags) {
        counts.set(t, (counts.get(t) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);
  }, [entries]);

  return {
    entries: filteredEntries,
    allEntries: entries,
    selectedEntry,
    selectedId,
    setSelectedId,
    todayDate,
    activeTag,
    setActiveTag: (tag: string) =>
      setActiveTag((prev) => (prev === tag ? null : tag)),
    topTags,
    saveStatus,
    isLoading,
    updateCurrentEntry,
    updateCurrentEntryFields,
    createEntryForDate,
    createNewEntry: (
      targetDate: string = todayDate,
      initialData?: {
        title?: string;
        body?: string;
        origin?: "dictation" | "conversation";
        originTime?: string;
        rawTranscript?: string;
        conversation?: { role: "user" | "ai"; text: string }[];
        mood?: string;
      }
    ) => {
      if (targetDate > todayDate) {
        console.warn(`[useDiary] Cannot create entry for future date: ${targetDate}`);
        return Promise.resolve(null);
      }
      setActiveTag(null);
      setSearchQuery("");
      return createEntryForDate(targetDate, true, initialData);
    },
    deleteEntry: deleteEntryById,
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    openMarkdownFolder,
    revealMarkdownFile,
  };
}

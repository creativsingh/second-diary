import { useState, useMemo, useRef, useEffect, useCallback } from "react";

// ============================================================================
// Types
// ============================================================================
type NavItem = "journal" | "ai";

type Entry = {
  id: string;
  date: string; // YYYY-MM-DD
  hour: number; // 0–23.9, time of day written
  title: string;
  body: string;
  tags: string[];
  mood?: string; // emoji, kept in data but not shown in UI
};

// ============================================================================
// Helpers & Date Utilities
// ============================================================================
function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftDays(dateStr: string, offsetDays: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dayNum = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dayNum}`;
}

function formatFullDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  } catch {
    return dateStr;
  }
}

function formatRelativeDate(dateStr: string, todayStr: string): string {
  if (dateStr === todayStr) return "Today";
  if (dateStr === shiftDays(todayStr, -1)) return "Yesterday";
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
  } catch {
    return dateStr;
  }
}

function formatTime(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.floor((hour - h) * 60);
  const period = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = String(m).padStart(2, "0");
  return `${displayH}:${displayM} ${period}`;
}

function getWordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

// ============================================================================
// Seed Data (7 entries spanning today back ~20 days)
// ============================================================================
const today = getTodayString();

const INITIAL_ENTRIES: Entry[] = [
  {
    id: "entry-1",
    date: today,
    hour: 9.3,
    title: "Morning coffee & architecture reflections",
    body: "Woke up early and brewed a pour-over. Contemplating local-first design patterns and how personal software should feel like a physical notebook rather than a corporate cloud service. The morning light hitting the desk feels calm and inspiring.",
    tags: ["morning", "reflection", "ideas"],
    mood: "☕",
  },
  {
    id: "entry-2",
    date: shiftDays(today, -1),
    hour: 21.4,
    title: "Evening solitude after focused work",
    body: "Wrapped up the local engine improvements. There is quiet satisfaction in software that runs entirely on device with zero telemetry and instant response times. Read a chapter of Calvino before turning the lights out.",
    tags: ["reflection", "reading", "books"],
    mood: "🌙",
  },
  {
    id: "entry-3",
    date: shiftDays(today, -4),
    hour: 14.8,
    title: "Walk along the coastal trail",
    body: "Took an afternoon walk by the cliffs. The ocean breeze was crisp and clear. Watched pelicans gliding in tight formation over the surf. It reminded me how essential it is to unplug from screens and let the mind wander among nature.",
    tags: ["nature", "life", "reflection"],
    mood: "🌊",
  },
  {
    id: "entry-4",
    date: shiftDays(today, -8),
    hour: 11.2,
    title: "Design ideas for personal memory webs",
    body: "Brainstorming ways to connect memories like atoms in a molecular web. Linear timelines are wonderful for chronology, but human recollection functions through associative leaps—people, places, recurring themes, and serendipitous tags.",
    tags: ["ideas", "projects"],
    mood: "💡",
  },
  {
    id: "entry-5",
    date: shiftDays(today, -12),
    hour: 17.6,
    title: "Dinner with old friends",
    body: "Caught up with Maya and David over homemade pasta. We talked about how fast the years pass, career pivots, and finding quiet joy in everyday routines. Truly grateful for people who know you deeply.",
    tags: ["people", "life"],
    mood: "🍝",
  },
  {
    id: "entry-6",
    date: shiftDays(today, -16),
    hour: 7.7,
    title: "Early morning reading session",
    body: "Finished Borges' Labyrinths. His fascination with infinity, mirrors, and libraries always sparks strange creative energy. Need to organize my book notes into a coherent personal archive.",
    tags: ["morning", "reading", "books"],
    mood: "📖",
  },
  {
    id: "entry-7",
    date: shiftDays(today, -20),
    hour: 16.3,
    title: "Refining local storage guarantees",
    body: "Tested local disk persistence and index benchmarks. No paid APIs, no servers to maintain, and zero vendor lock-in. A private diary should outlive any SaaS startup.",
    tags: ["projects", "reflection"],
    mood: "🛠️",
  },
];

// ============================================================================
// Custom SVG Icons (Ic object)
// ============================================================================
const Ic = {
  journal: () => (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    >
      <rect x="2" y="2" width="11" height="11" rx="2" />
      <line x1="4.5" y1="5.5" x2="10.5" y2="5.5" />
      <line x1="4.5" y1="7.5" x2="10.5" y2="7.5" />
      <line x1="4.5" y1="9.5" x2="8.5" y2="9.5" />
    </svg>
  ),
  timeline: () => (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    >
      <path d="M2.5 2.5v10h10" />
      <path d="M10.5 10.5l2 2-2 2" />
      <circle cx="5.5" cy="8.5" r="1" fill="currentColor" />
      <circle cx="8" cy="5.5" r="1" fill="currentColor" />
      <circle cx="10.5" cy="7.5" r="1" fill="currentColor" />
    </svg>
  ),
  memories: () => (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    >
      <circle cx="7.5" cy="7.5" r="2" fill="none" />
      <circle cx="3.5" cy="3.5" r="1" fill="currentColor" />
      <circle cx="11.5" cy="3.5" r="1" fill="currentColor" />
      <circle cx="3.5" cy="11.5" r="1" fill="currentColor" />
      <circle cx="11.5" cy="11.5" r="1" fill="currentColor" />
      <line x1="4.5" y1="4.5" x2="6" y2="6" />
      <line x1="10.5" y1="4.5" x2="9" y2="6" />
      <line x1="4.5" y1="10.5" x2="6" y2="9" />
      <line x1="10.5" y1="10.5" x2="9" y2="9" />
    </svg>
  ),
  ai: () => (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    >
      <path d="M12.5 7.5A5 5 0 0 0 3.5 5.5c0 1.2.4 2.3 1.2 3.1L3.5 12l3.4-1.2c.8.4 1.7.7 2.6.7a5 5 0 0 0 3-4z" />
    </svg>
  ),
  tag: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 13 13"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    >
      <path d="M2 2h4.5l5 5-4.5 4.5-5-5V2z" />
      <circle cx="4.25" cy="4.25" r="0.75" fill="currentColor" />
    </svg>
  ),
  plus: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 13 13"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <line x1="6.5" y1="2.5" x2="6.5" y2="10.5" />
      <line x1="2.5" y1="6.5" x2="10.5" y2="6.5" />
    </svg>
  ),
  sparkle: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 13 13"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    >
      <line x1="6.5" y1="1" x2="6.5" y2="3" />
      <line x1="6.5" y1="10" x2="6.5" y2="12" />
      <line x1="1" y1="6.5" x2="3" y2="6.5" />
      <line x1="10" y1="6.5" x2="12" y2="6.5" />
      <line x1="2.6" y1="2.6" x2="4" y2="4" />
      <line x1="9" y1="9" x2="10.4" y2="10.4" />
      <line x1="2.6" y1="10.4" x2="4" y2="9" />
      <line x1="9" y1="4" x2="10.4" y2="2.6" />
      <circle cx="6.5" cy="6.5" r="1.2" fill="currentColor" />
    </svg>
  ),
  send: () => (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor">
      <path d="M1.5 2.2l9.8 4.3-9.8 4.3 1.2-4.3h4.8v-0.8h-4.8z" />
    </svg>
  ),
  mic: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    >
      <rect x="4.5" y="2" width="5" height="6.5" rx="2.5" />
      <path d="M2.5 6.5a4.5 4.5 0 0 0 9 0" />
      <line x1="7" y1="11" x2="7" y2="12.5" />
      <line x1="4.5" y1="12.5" x2="9.5" y2="12.5" />
    </svg>
  ),
  chevronL: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    >
      <path d="M8.5 3.5l-3.5 3.5 3.5 3.5" />
    </svg>
  ),
  chevronR: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    >
      <path d="M5.5 3.5l3.5 3.5-3.5 3.5" />
    </svg>
  ),
  calendar: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    >
      <rect x="2" y="3" width="10" height="9" rx="1.5" />
      <line x1="2" y1="6" x2="12" y2="6" />
      <line x1="4.5" y1="1.5" x2="4.5" y2="3.5" />
      <line x1="9.5" y1="1.5" x2="9.5" y2="3.5" />
    </svg>
  ),
  list: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    >
      <line x1="2.5" y1="4.5" x2="11.5" y2="4.5" />
      <line x1="2.5" y1="7.5" x2="11.5" y2="7.5" />
      <line x1="2.5" y1="10.5" x2="8.5" y2="10.5" />
    </svg>
  ),
  link: () => (
    <svg
      width="13"
      height="13"
      viewBox="0 0 13 13"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    >
      <path d="M5 7.5L4 8.5a2 2 0 1 1-2.8-2.8l1-1a2 2 0 0 1 2.8 0" />
      <path d="M8 5.5l1-1a2 2 0 1 1 2.8 2.8l-1 1a2 2 0 0 1-2.8 0" />
      <line x1="4.5" y1="8.5" x2="8.5" y2="4.5" />
    </svg>
  ),
  sidebar: () => (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    >
      <rect x="2" y="2" width="11" height="11" rx="2" />
      <line x1="6" y1="2" x2="6" y2="13" />
    </svg>
  ),
  search: () => (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    >
      <circle cx="5" cy="5" r="3.5" />
      <line x1="7.5" y1="7.5" x2="10.5" y2="10.5" />
    </svg>
  ),
};





// ============================================================================
// CalendarView Component (Month Grid)
// ============================================================================
function CalendarView({
  entries,
  onSelectDate,
}: {
  entries: Entry[];
  onSelectDate: (dateStr: string) => void;
}) {
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

  const entriesDateSet = useMemo(() => {
    return new Set(entries.map((e) => e.date));
  }, [entries]);

  const todayStr = getTodayString();

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
            className="p-1 hover:bg-[#f0ece8] rounded text-[#9c9690] transition-colors"
          >
            <Ic.chevronL />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1 hover:bg-[#f0ece8] rounded text-[#9c9690] transition-colors"
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

          const isToday = cell.dateStr === todayStr;
          const hasEntry = entriesDateSet.has(cell.dateStr);

          return (
            <button
              key={cell.dateStr}
              type="button"
              onClick={() => onSelectDate(cell.dateStr)}
              className={`h-7 rounded-md text-[10px] flex flex-col items-center justify-center relative transition-colors ${
                isToday
                  ? "bg-[#1c1a18] text-white font-medium shadow-sm"
                  : hasEntry
                  ? "bg-[#f7f5f2] text-[#4a4540] hover:bg-[#ece9e4]"
                  : "text-[#c0bbb4] hover:bg-[#faf9f7]"
              }`}
            >
              <span>{cell.dayNum}</span>
              {hasEntry && !isToday && (
                <span className="size-1 rounded-full bg-[#7c6f5b] absolute bottom-1" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Main Application Component
// ============================================================================
export default function App() {
  const [entries, setEntries] = useState<Entry[]>(() => {
    try {
      const saved = localStorage.getItem("second_diary_entries_spec");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_ENTRIES;
  });

  const [selectedId, setSelectedId] = useState<string>(
    () => entries[0]?.id || "entry-1"
  );
  const [nav, setNav] = useState<NavItem>("journal");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [journalView, setJournalView] = useState<"list" | "calendar">("list");
  const [aiQuery, setAiQuery] = useState<string>("");
  const [aiHistory, setAiHistory] = useState<{ q: string; a: string }[]>([]);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [dictating, setDictating] = useState<boolean>(false);

  const titleRef = useRef<HTMLTextAreaElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem("second_diary_entries_spec", JSON.stringify(entries));
    } catch {
      // ignore
    }
  }, [entries]);

  // Selected entry
  const selectedEntry = useMemo(() => {
    return entries.find((e) => e.id === selectedId) || entries[0] || null;
  }, [entries, selectedId]);

  // Unique tags for sidebar (max 5)
  const topTags = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of entries) {
      for (const t of e.tags) {
        counts[t] = (counts[t] || 0) + 1;
      }
    }
    return Object.keys(counts)
      .sort((a, b) => counts[b] - counts[a])
      .slice(0, 5);
  }, [entries]);

  // Filtered entries for middle panel
  const filteredEntries = useMemo(() => {
    return entries
      .filter((e) => {
        if (activeTag && !e.tags.includes(activeTag)) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchTitle = e.title.toLowerCase().includes(q);
          const matchBody = e.body.toLowerCase().includes(q);
          if (!matchTitle && !matchBody) return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [entries, activeTag, search]);

  // Grouped entries by date for list view
  const groupedEntries = useMemo(() => {
    const groups: { date: string; items: Entry[] }[] = [];
    let curDate = "";
    let curList: Entry[] = [];

    for (const e of filteredEntries) {
      if (e.date !== curDate) {
        if (curList.length > 0) {
          groups.push({ date: curDate, items: curList });
        }
        curDate = e.date;
        curList = [e];
      } else {
        curList.push(e);
      }
    }
    if (curList.length > 0) {
      groups.push({ date: curDate, items: curList });
    }
    return groups;
  }, [filteredEntries]);

  // Create new entry
  const handleNewEntry = useCallback(() => {
    const todayStr = getTodayString();
    const newEntry: Entry = {
      id: `entry-${Date.now()}`,
      date: todayStr,
      hour: new Date().getHours() + new Date().getMinutes() / 60,
      title: "",
      body: "",
      tags: ["reflection"],
      mood: "📝",
    };
    setEntries((prev) => [newEntry, ...prev]);
    setSelectedId(newEntry.id);
    setNav("journal");
    setJournalView("list");
    setTimeout(() => {
      titleRef.current?.focus();
    }, 50);
  }, []);

  // Update entry field
  const updateCurrentEntry = (field: "title" | "body", value: string) => {
    if (!selectedEntry) return;
    setEntries((prev) =>
      prev.map((e) => (e.id === selectedEntry.id ? { ...e, [field]: value } : e))
    );
  };

  // Auto-expand textarea
  const adjustTextareaHeight = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    adjustTextareaHeight(titleRef.current);
    adjustTextareaHeight(bodyRef.current);
  }, [selectedEntry?.id, selectedEntry?.title, selectedEntry?.body]);

  // Speech dictation via Web Speech API
  const toggleDictation = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser environment.");
      return;
    }

    if (dictating) {
      recognitionRef.current?.stop();
      setDictating(false);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onstart = () => {
        setDictating(true);
      };

      rec.onresult = (event: any) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript && selectedEntry) {
          const currentBody = selectedEntry.body;
          const separator =
            currentBody.length > 0 && !currentBody.endsWith(" ") ? " " : "";
          updateCurrentEntry("body", currentBody + separator + finalTranscript);
        }
      };

      rec.onerror = () => {
        setDictating(false);
      };

      rec.onend = () => {
        setDictating(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (e) {
      console.warn("Dictation start error:", e);
      setDictating(false);
    }
  }, [dictating, selectedEntry]);

  // AI submit response logic
  const handleAiSubmit = (promptText?: string) => {
    const query = (promptText || aiQuery).trim();
    if (!query || aiLoading) return;

    setAiLoading(true);
    setAiQuery("");

    setTimeout(() => {
      let answer = "";
      const lower = query.toLowerCase();

      if (lower.includes("theme") || lower.includes("recurring")) {
        answer =
          "Looking across your journal entries, the most prominent recurring themes are quiet morning reflection, local-first computing ethics, and restorative walks in nature. You consistently find peace in unplugging and reading physical books.";
      } else if (lower.includes("energiz") || lower.includes("recent")) {
        answer =
          "Your writing radiates the most energy during early mornings with coffee, brisk cliffside walks by the ocean, and deep discussions with close friends about life trajectories.";
      } else if (lower.includes("nature") || lower.includes("walk")) {
        answer =
          "In your coastal trail entry, you wrote that observing pelicans gliding over the surf and feeling the crisp ocean breeze helped you unplug from screen fatigue and restored mental clarity.";
      } else {
        answer = `Reflecting on your entries related to "${query}": Your journal emphasizes deliberate living, creative independence, and keeping your personal thoughts 100% private and offline on your own device.`;
      }

      setAiHistory((prev) => [...prev, { q: query, a: answer }]);
      setAiLoading(false);
    }, 900);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#fdfcfb] text-[#1c1a18] select-none">
      {/* =================================================================== */}
      {/* COLUMN 1 — Nav Sidebar (52px ↔ 200px)                               */}
      {/* =================================================================== */}
      <nav
        style={{
          width: sidebarOpen ? 200 : 52,
          transition: "width 0.22s ease",
        }}
        className="h-full bg-[#f7f5f2] border-r border-[#ece9e4] flex flex-col justify-between py-5 shrink-0 overflow-hidden"
      >
        <div className="px-3">
          {/* Logo / collapse toggle */}
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            className="flex items-center gap-2.5 mb-8 w-full text-left outline-none cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-[#1c1a18] flex items-center justify-center text-white shrink-0 group-hover:bg-[#3a3530] transition-colors shadow-sm">
              <Ic.sidebar />
            </div>
            {sidebarOpen && (
              <span className="text-[13px] font-semibold text-[#1c1a18] tracking-tight whitespace-nowrap">
                Second Diary
              </span>
            )}
          </button>

          {/* Navigation Items */}
          <div className="space-y-1">
            {[
              { id: "journal", label: "Journal", icon: <Ic.journal /> },
              {
                id: "ai",
                label: "Ask Diary",
                icon: <Ic.ai />,
                badge: "AI",
              },
            ].map((item) => {
              const isActive = nav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setNav(item.id as NavItem)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-all cursor-pointer ${
                    isActive
                      ? "bg-white text-[#1c1a18] font-medium shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                      : "text-[#8c867e] hover:text-[#1c1a18] hover:bg-white/60"
                  }`}
                >
                  <span
                    className="shrink-0 flex items-center justify-center w-4"
                    style={{ border: "none", outline: "none" }}
                  >
                    {item.icon}
                  </span>
                  {sidebarOpen && (
                    <span className="whitespace-nowrap flex-1 text-left">
                      {item.label}
                    </span>
                  )}
                  {sidebarOpen && item.badge && (
                    <span className="text-[9px] bg-[#e8f4f0] text-[#4a9e87] px-1.5 py-0.5 rounded-full font-medium ml-auto">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tags section (visible only when sidebar expanded) */}
          {sidebarOpen && topTags.length > 0 && (
            <div className="border-t border-[#ece9e4] pt-3 mt-3">
              <div className="text-[9px] font-semibold text-[#b5afa7] tracking-widest uppercase mb-1.5 px-1">
                Tags
              </div>
              <div className="space-y-0.5">
                {topTags.map((tag) => {
                  const isTagActive = activeTag === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        setActiveTag((prev) => (prev === tag ? null : tag))
                      }
                      className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] transition-colors cursor-pointer ${
                        isTagActive
                          ? "bg-white text-[#7c6f5b] font-medium shadow-xs"
                          : "text-[#9c9690] hover:text-[#4a4540]"
                      }`}
                    >
                      <span className="shrink-0">
                        <Ic.tag />
                      </span>
                      <span className="truncate">#{tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* User Block */}
        <div className="border-t border-[#ece9e4] pt-3 px-3 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#d4c8b8] to-[#a89880] text-white text-[11px] font-medium flex items-center justify-center shrink-0 shadow-xs">
            Y
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden whitespace-nowrap">
              <div className="text-[11px] font-medium text-[#4a4540] leading-none mb-0.5">
                You
              </div>
              <div className="text-[10px] text-[#b5afa7] leading-none">
                Private · Local
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* =================================================================== */}
      {/* COLUMN 2 — Middle Panel (260px, only for 'journal' or 'ai')         */}
      {/* =================================================================== */}
      {(nav === "journal" || nav === "ai") && (
        <aside className="w-[260px] h-full bg-white border-r border-[#ece9e4] flex flex-col shrink-0 overflow-hidden select-none">
          {nav === "journal" ? (
            <>
              {/* Journal Middle Panel Header */}
              <div className="px-4 pt-5 pb-3">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[13px] font-semibold text-[#1c1a18]">
                    Journal
                  </h2>
                  <div className="flex items-center gap-1.5">
                    {/* View Toggle Button */}
                    <button
                      type="button"
                      onClick={() =>
                        setJournalView((v) =>
                          v === "list" ? "calendar" : "list"
                        )
                      }
                      className="p-1.5 rounded-md hover:bg-[#f0ece8] text-[#9c9690] transition-colors cursor-pointer"
                      title={
                        journalView === "list"
                          ? "Switch to calendar view"
                          : "Switch to list view"
                      }
                    >
                      {journalView === "list" ? (
                        <Ic.calendar />
                      ) : (
                        <Ic.list />
                      )}
                    </button>

                    {/* New Entry Button */}
                    <button
                      type="button"
                      onClick={handleNewEntry}
                      className="p-1.5 rounded-md bg-[#1c1a18] text-white hover:bg-[#3a3530] transition-colors cursor-pointer shadow-xs"
                      title="New Entry"
                    >
                      <Ic.plus />
                    </button>
                  </div>
                </div>

                {/* Search Bar (List Mode) */}
                {journalView === "list" && (
                  <div className="flex items-center gap-2 bg-[#f7f5f2] rounded-lg px-3 py-2">
                    <span className="text-[#9c9690] shrink-0">
                      <Ic.search />
                    </span>
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search…"
                      className="w-full text-[12px] text-[#1c1a18] placeholder:text-[#c0bbb4] bg-transparent outline-none border-none"
                    />
                  </div>
                )}
              </div>

              {/* Middle Panel Body: Calendar or List */}
              <div className="flex-1 overflow-y-auto">
                {journalView === "calendar" ? (
                  <CalendarView
                    entries={entries}
                    onSelectDate={(dateStr) => {
                      const match = entries.find((e) => e.date === dateStr);
                      if (match) {
                        setSelectedId(match.id);
                      } else {
                        // Create empty entry for that date
                        const newEntry: Entry = {
                          id: `entry-${Date.now()}`,
                          date: dateStr,
                          hour: 12.0,
                          title: "",
                          body: "",
                          tags: ["reflection"],
                          mood: "📝",
                        };
                        setEntries((prev) => [newEntry, ...prev]);
                        setSelectedId(newEntry.id);
                      }
                      setJournalView("list");
                    }}
                  />
                ) : (
                  groupedEntries.map((group) => (
                    <div key={group.date}>
                      {/* Date Header */}
                      <div className="px-4 py-1.5 bg-[#faf9f7] border-b border-[#f0ece8] text-[10px] font-semibold text-[#b5afa7] uppercase tracking-wide">
                        {formatRelativeDate(group.date, today)}
                      </div>

                      {/* Entry Rows */}
                      {group.items.map((entry) => {
                        const isSelected = selectedId === entry.id;
                        return (
                          <button
                            key={entry.id}
                            type="button"
                            onClick={() => setSelectedId(entry.id)}
                            className={`w-full px-4 py-3 border-b border-[#f0ece8] text-left transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-[#f7f5f2]"
                                : "hover:bg-[#faf9f7]"
                            }`}
                          >
                            <div className="text-[10px] text-[#b5afa7] mb-1">
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
                            {entry.body.trim() && (
                              <p className="text-[11px] text-[#9c9690] leading-relaxed line-clamp-2">
                                {entry.body}
                              </p>
                            )}
                            {entry.tags.length > 0 && (
                              <div className="flex gap-1 mt-1.5 flex-wrap">
                                {entry.tags.map((t) => (
                                  <span
                                    key={t}
                                    className="text-[10px] bg-[#f0ece8] text-[#9c9690] px-2 py-0.5 rounded-full"
                                  >
                                    #{t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            /* nav === 'ai' Middle Panel */
            <div className="px-4 pt-5 pb-3 flex flex-col h-full">
              <div className="mb-4">
                <h2 className="text-[13px] font-semibold text-[#1c1a18]">
                  Ask your diary
                </h2>
                <p className="text-[11px] text-[#b5afa7] mt-0.5">
                  Search memories with AI
                </p>
              </div>

              <div className="text-[11px] text-[#b5afa7] mb-2 font-medium">
                Try asking:
              </div>

              <div className="space-y-2">
                {[
                  "What recurring themes appear in my writing?",
                  "When did I feel most energized recently?",
                  "Summarize my thoughts on nature and walks",
                ].map((promptText, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setAiQuery(promptText);
                      handleAiSubmit(promptText);
                    }}
                    className="w-full text-left text-[11px] text-[#7c6f5b] bg-[#f7f5f2] rounded-lg px-3 py-2 hover:bg-[#ece9e4] leading-relaxed transition-colors cursor-pointer"
                  >
                    &ldquo;{promptText}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>
      )}

      {/* =================================================================== */}
      {/* COLUMN 3 — Main Content Area                                        */}
      {/* =================================================================== */}
      <main className="flex-1 bg-[#fdfcfb] flex flex-col h-full overflow-hidden">
        {nav === "journal" && selectedEntry && (
          <div className="flex flex-1 flex-col h-full overflow-hidden">
            {/* Toolbar */}
            <div className="px-10 py-3 border-b border-[#ece9e4] flex items-center justify-between shrink-0 select-none">
              <div className="text-[11px] text-[#c0bbb4] font-medium">
                {formatFullDate(selectedEntry.date)}
              </div>
              <div className="flex gap-1.5 items-center">
                {selectedEntry.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] bg-[#f0ece8] text-[#9c9690] px-2.5 py-1 rounded-full font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-y-auto px-12 pt-10 pb-8 max-w-3xl mx-auto w-full">
              {/* Title Textarea */}
              <textarea
                ref={titleRef}
                rows={1}
                value={selectedEntry.title}
                onChange={(e) => updateCurrentEntry("title", e.target.value)}
                placeholder="Title…"
                className="w-full text-[32px] font-semibold text-[#1c1a18] placeholder:text-[#e0dbd4] leading-tight mb-6 font-serif block outline-none border-none bg-transparent resize-none"
              />

              {/* Body Textarea */}
              <div className="relative">
                <textarea
                  ref={bodyRef}
                  value={selectedEntry.body}
                  onChange={(e) => updateCurrentEntry("body", e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      (e.metaKey || e.ctrlKey) &&
                      e.key.toLowerCase() === "r"
                    ) {
                      e.preventDefault();
                      toggleDictation();
                    }
                  }}
                  placeholder="Write your thoughts or press ⌘R to dictate…"
                  className="w-full text-[15px] text-[#4a4540] placeholder:text-[#d8d3cc] leading-[1.8] min-h-[50vh] outline-none border-none bg-transparent resize-none block"
                />

                {/* Dictation Listening Indicator */}
                {dictating && (
                  <div className="absolute top-1 right-0 flex items-center gap-1.5 text-[11px] text-red-500 animate-pulse pointer-events-none bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                    <Ic.mic />
                    <span>Listening…</span>
                  </div>
                )}
              </div>
            </div>

            {/* Status bar */}
            <div className="px-10 py-2.5 border-t border-[#ece9e4] bg-white flex items-center justify-between shrink-0 select-none text-[11px] text-[#c0bbb4]">
              <div className="flex items-center gap-1.5">
                <span>{getWordCount(selectedEntry.body)} words</span>
                <span className="text-[#e0dbd4]">·</span>
                <span>Autosaved</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>Local · Private</span>
              </div>
            </div>
          </div>
        )}



        {nav === "ai" && (
          <div className="flex flex-1 flex-col h-full overflow-hidden">
            {aiHistory.length === 0 ? (
              /* Empty State */
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center max-w-sm mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-[#e8f4f0] flex items-center justify-center text-[#4a9e87] mb-4 shadow-sm">
                  <Ic.sparkle />
                </div>
                <h2 className="text-[18px] font-semibold text-[#1c1a18] font-serif mb-1.5">
                  Ask your diary anything
                </h2>
                <p className="text-[13px] text-[#b5afa7] leading-relaxed">
                  Discover patterns, retrieve forgotten thoughts, and explore
                  personal reflections.
                </p>
              </div>
            ) : (
              /* Message Thread */
              <div className="flex-1 overflow-y-auto px-6 py-6 max-w-lg mx-auto w-full space-y-6">
                {aiHistory.map((item, idx) => (
                  <div key={idx} className="space-y-4">
                    {/* User message */}
                    <div className="flex justify-end">
                      <div className="bg-[#1c1a18] text-white text-[13px] rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%] leading-relaxed shadow-sm">
                        {item.q}
                      </div>
                    </div>

                    {/* AI response */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#e8f4f0] text-[#4a9e87] flex items-center justify-center shrink-0 mt-0.5">
                        <Ic.sparkle />
                      </div>
                      <div className="bg-white border border-[#ece9e4] rounded-2xl rounded-tl-sm px-4 py-3 text-[13px] text-[#4a4540] shadow-[0_1px_4px_rgba(0,0,0,0.04)] leading-relaxed max-w-[85%]">
                        {item.a}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {aiLoading && (
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#e8f4f0] text-[#4a9e87] flex items-center justify-center shrink-0 mt-0.5">
                      <Ic.sparkle />
                    </div>
                    <div className="bg-white border border-[#ece9e4] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4a9e87] animate-bounce" />
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-[#4a9e87] animate-bounce"
                        style={{ animationDelay: "0.15s" }}
                      />
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-[#4a9e87] animate-bounce"
                        style={{ animationDelay: "0.3s" }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AI Input Bar */}
            <div className="px-10 pb-8 shrink-0">
              <div className="max-w-lg mx-auto border border-[#ece9e4] rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex items-end gap-3 px-4 py-3">
                <textarea
                  rows={1}
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAiSubmit();
                    }
                  }}
                  placeholder="What do you want to know about your diary?"
                  className="text-[13px] text-[#1c1a18] placeholder:text-[#c0bbb4] leading-relaxed flex-1 outline-none border-none bg-transparent resize-none max-h-24"
                />
                <button
                  type="button"
                  disabled={!aiQuery.trim() || aiLoading}
                  onClick={() => handleAiSubmit()}
                  className={`w-8 h-8 rounded-xl bg-[#1c1a18] text-white flex items-center justify-center shrink-0 transition-opacity cursor-pointer shadow-xs ${
                    !aiQuery.trim() || aiLoading
                      ? "opacity-30 cursor-not-allowed"
                      : "hover:bg-[#3a3530]"
                  }`}
                  title="Send message"
                >
                  <Ic.send />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

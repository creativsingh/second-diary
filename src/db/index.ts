import { isTauri, invoke } from "@tauri-apps/api/core";
import type { Entry, SearchResult } from "@/types";

export interface MarkdownEntryRow {
  id: string;
  date: string;
  hour: number;
  title: string;
  content: string;
  tags: VecStringOrArray;
  createdAt: string;
  updatedAt: string;
}

type VecStringOrArray = string[];

/**
 * Returns today's local date string formatted as YYYY-MM-DD.
 */
export function getTodayDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Shifts a YYYY-MM-DD date string by a given number of days in local time.
 */
export function shiftDateString(dateStr: string, offsetDays: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + offsetDays);
  return getTodayDateString(date);
}

/**
 * Returns a user-friendly relative label ("Today", "Yesterday", "Tomorrow") or null.
 */
export function getRelativeDateLabel(dateStr: string): string | null {
  const today = getTodayDateString();
  if (dateStr === today) return "Today";
  if (dateStr === shiftDateString(today, -1)) return "Yesterday";
  if (dateStr === shiftDateString(today, 1)) return "Tomorrow";
  return null;
}

/**
 * Formats a YYYY-MM-DD date into full readable text: e.g. "Wednesday, September 23, 2026".
 */
export function formatDateDisplay(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
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

/**
 * Formats a YYYY-MM-DD date into short text: e.g. "Sep 23".
 */
export function formatDateShort(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Formats day of the week: e.g. "Wed".
 */
export function formatDayOfWeek(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
    }).format(date);
  } catch {
    return "";
  }
}

/**
 * Sanitizes search queries by stripping special characters.
 */
export function formatSearchQuery(rawQuery: string): string {
  return rawQuery.trim().replace(/[^\w\s-]/g, " ").trim();
}

/**
 * Parses #tags from Markdown text content.
 */
export function parseTags(content: string): string[] {
  const match = content.match(/#([\w-]+)/g);
  return match ? Array.from(new Set(match.map((t) => t.slice(1)))) : [];
}

/**
 * In-memory / localStorage fallback storage for running in a web browser or unit tests.
 * Maintains 100% offline isolation and parity with Markdown files.
 */
class BrowserMarkdownStore {
  private storageKey = "second_diary_markdown_entries";

  getEntries(): Entry[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return parsed.map((item: any) => ({
        ...item,
        createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
        updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
      }));
    } catch {
      return [];
    }
  }

  saveEntries(entries: Entry[]) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(entries));
    } catch (e) {
      console.warn("[BrowserMarkdownStore] Failed to save entries:", e);
    }
  }

  saveEntry(entry: Entry): Entry {
    const list = this.getEntries();
    const existingIndex = list.findIndex((e) => e.id === entry.id);
    let updated: Entry[];

    if (existingIndex >= 0) {
      updated = [...list];
      updated[existingIndex] = { ...entry, updatedAt: new Date() };
    } else {
      updated = [entry, ...list];
    }

    this.saveEntries(updated);
    return entry;
  }

  deleteEntry(id: string): boolean {
    const list = this.getEntries();
    const filtered = list.filter((e) => e.id !== id);
    if (filtered.length !== list.length) {
      this.saveEntries(filtered);
      return true;
    }
    return false;
  }

  search(query: string): SearchResult[] {
    const list = this.getEntries();
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const tokens = q.split(/\s+/).filter(Boolean);
    const results: SearchResult[] = [];

    for (const item of list) {
      const titleLower = (item.title || "").toLowerCase();
      const bodyLower = (item.body || "").toLowerCase();
      const tagsJoined = (item.tags || []).join(" ").toLowerCase();

      const allMatch = tokens.every(
        (t) =>
          titleLower.includes(t) ||
          bodyLower.includes(t) ||
          tagsJoined.includes(t)
      );

      if (allMatch) {
        let snippet = "";
        const firstToken = tokens[0];
        const pos = bodyLower.indexOf(firstToken);

        if (pos >= 0) {
          const start = Math.max(0, pos - 30);
          const end = Math.min(item.body.length, pos + firstToken.length + 60);
          const raw = item.body.slice(start, end);
          const prefix = start > 0 ? "..." : "";
          const suffix = end < item.body.length ? "..." : "";
          const regex = new RegExp(`(${firstToken})`, "gi");
          snippet = `${prefix}${raw.replace(regex, "<mark>$1</mark>")}${suffix}`;
        } else if (item.body) {
          snippet = `${item.body.slice(0, 80)}...`;
        } else {
          snippet = `Matched in title: ${item.title}`;
        }

        results.push({
          id: item.id,
          date: item.date,
          title: item.title,
          snippet,
          rank: titleLower.includes(q) ? 1 : 2,
        });
      }
    }

    results.sort((a, b) => a.rank - b.rank);
    return results;
  }
}

const browserStore = new BrowserMarkdownStore();

/**
 * Fetches all saved entries from local Markdown files in ~/Documents/Second Diary/,
 * ordered chronologically (newest date first, then newest hour).
 */
export async function getAllEntries(): Promise<Entry[]> {
  if (isTauri()) {
    try {
      const rows = await invoke<MarkdownEntryRow[]>("read_all_markdown_entries");
      return rows.map((r) => {
        const createdDate = r.createdAt ? new Date(r.createdAt) : new Date();
        const updatedDate = r.updatedAt ? new Date(r.updatedAt) : new Date();
        return {
          id: r.id,
          date: r.date,
          hour: r.hour,
          title: r.title,
          body: r.content,
          tags: r.tags || parseTags(r.content),
          createdAt: createdDate,
          updatedAt: updatedDate,
        };
      });
    } catch (e) {
      console.error("[Second Diary] Failed to read markdown entries from disk:", e);
      return [];
    }
  }

  // Web / non-Tauri fallback
  return browserStore.getEntries();
}

/**
 * Saves (creates or updates) a diary entry directly as a Markdown (.md) file
 * with YAML frontmatter in ~/Documents/Second Diary/.
 */
export async function saveEntry(data: {
  id?: string;
  date: string;
  title: string;
  content: string;
  createdAt?: Date;
  hour?: number;
}): Promise<Entry> {
  const now = new Date();
  const entryId = data.id || crypto.randomUUID();
  const entryCreatedAt = data.createdAt || now;
  const entryHour =
    data.hour !== undefined
      ? data.hour
      : Math.round((entryCreatedAt.getHours() + entryCreatedAt.getMinutes() / 60) * 10) / 10;
  const tags = parseTags(data.content);

  const entry: Entry = {
    id: entryId,
    date: data.date,
    title: data.title,
    body: data.content,
    hour: entryHour,
    tags,
    createdAt: entryCreatedAt,
    updatedAt: now,
  };

  if (isTauri()) {
    const hours = String(entryCreatedAt.getHours()).padStart(2, "0");
    const minutes = String(entryCreatedAt.getMinutes()).padStart(2, "0");
    const timeStr = `${hours}:${minutes}`;

    try {
      await invoke<string>("save_markdown_entry", {
        id: entry.id,
        date: entry.date,
        timeStr,
        title: entry.title,
        content: entry.body,
        tags: entry.tags,
        createdAt: entryCreatedAt.toISOString(),
        updatedAt: now.toISOString(),
      });
    } catch (e) {
      console.error("[Second Diary] Failed to save markdown entry:", e);
      throw e;
    }
  } else {
    browserStore.saveEntry(entry);
  }

  return entry;
}

/**
 * Deletes a diary entry by removing its .md file from ~/Documents/Second Diary/.
 */
export async function deleteEntry(id: string): Promise<boolean> {
  if (isTauri()) {
    try {
      return await invoke<boolean>("delete_markdown_entry", { id });
    } catch (e) {
      console.error("[Second Diary] Failed to delete markdown entry:", e);
      return false;
    }
  }
  return browserStore.deleteEntry(id);
}

/**
 * Searches Markdown entries with contextual snippets and <mark> highlights.
 */
export async function searchEntries(query: string): Promise<SearchResult[]> {
  const sanitized = formatSearchQuery(query);
  if (!sanitized) return [];

  if (isTauri()) {
    try {
      return await invoke<SearchResult[]>("search_markdown_entries", {
        query: sanitized,
      });
    } catch (e) {
      console.error("[Second Diary] Failed to search markdown entries:", e);
      return [];
    }
  }

  return browserStore.search(sanitized);
}

/**
 * Opens the Second Diary folder in macOS Finder (~/Documents/Second Diary/).
 */
export async function openMarkdownFolder(): Promise<string | null> {
  if (!isTauri()) {
    console.info("[Second Diary] Markdown folder is in ~/Documents/Second Diary/");
    return null;
  }
  try {
    return await invoke<string>("open_markdown_folder");
  } catch (e) {
    console.warn("[Second Diary] Failed to open markdown folder:", e);
    return null;
  }
}

/**
 * Highlights the specific .md file in macOS Finder.
 */
export async function revealMarkdownFile(id: string): Promise<string | null> {
  if (!isTauri()) {
    return openMarkdownFolder();
  }
  try {
    return await invoke<string>("reveal_markdown_file", { id });
  } catch (e) {
    console.warn("[Second Diary] Failed to reveal markdown file:", e);
    return openMarkdownFolder();
  }
}

/**
 * Pure Markdown architecture: entries already exist natively as .md files!
 */
export async function syncAllEntriesToMarkdown(): Promise<void> {
  // No-op: all entries are pure Markdown files directly in ~/Documents/Second Diary/
}

export type { SearchResult };

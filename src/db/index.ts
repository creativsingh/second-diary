import Database from "@tauri-apps/plugin-sql";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import { eq, desc } from "drizzle-orm";
import { isTauri } from "@tauri-apps/api/core";
import * as schema from "./schema";
import type { Entry } from "./schema";
import type { SearchResult } from "@/types";

export const DB_NAME = "sqlite:second_diary.db";

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;
let rawDb: Database | null = null;
let initPromise: Promise<ReturnType<typeof drizzle<typeof schema>>> | null = null;
let fallbackDbInstance: BrowserFallbackDb | null = null;

/**
 * Sanitizes and formats user input into a safe SQLite FTS5 query with prefix matching.
 */
export function formatFtsQuery(rawQuery: string): string {
  const trimmed = rawQuery.trim();
  if (!trimmed) return "";

  // If wrapped in double quotes, treat as exact phrase search
  if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length > 2) {
    const inner = trimmed.slice(1, -1).replace(/[^\w\s]/g, " ").trim();
    return inner ? `"${inner}"` : "";
  }

  // Remove characters that conflict with FTS5 syntax
  const sanitized = trimmed.replace(/[^\w\s]/g, " ").trim();
  if (!sanitized) return "";

  const tokens = sanitized.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return "";

  // Suffix each token with wildcard * for prefix matching
  return tokens.map((t) => `${t}*`).join(" ");
}

/**
 * Fallback local storage implementation for testing or running in a standard web browser outside Tauri.
 * Ensures the app functions seamlessly in web preview and tests while maintaining 100% offline isolation.
 */
class BrowserFallbackDb {
  private storageKey = "second_diary_browser_entries";

  private getEntries(): Entry[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return parsed.map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      }));
    } catch {
      return [];
    }
  }

  private saveEntries(entries: Entry[]) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(entries));
    } catch (e) {
      console.warn("Failed to persist browser fallback entry:", e);
    }
  }

  async select<T = any>(sql: string, params: unknown[] = []): Promise<T> {
    const list = this.getEntries();
    const lower = sql.toLowerCase();
    if (lower.includes("where")) {
      if (lower.includes("id =") || lower.includes("id=")) {
        const targetId = String(params[0] ?? "");
        const match = list.find((e) => e.id === targetId);
        return (match ? [match] : []) as unknown as T;
      }
      if (lower.includes("date =") || lower.includes("date=")) {
        const targetDate = String(params[0] ?? "");
        const matches = list.filter((e) => e.date === targetDate);
        return matches.sort((a, b) => {
          const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
          const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
          return timeB - timeA;
        }) as unknown as T;
      }
    }
    // Return chronologically descending (newest date first, then newest createdAt first)
    const sorted = [...list].sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date);
      if (dateCmp !== 0) return dateCmp;
      const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
      const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
      return timeB - timeA;
    });
    return sorted as unknown as T;
  }

  async execute(sql: string, params: unknown[] = []) {
    const list = this.getEntries();
    const lower = sql.toLowerCase();

    if (lower.startsWith("insert")) {
      const newEntry: Entry = {
        id: String(params[0]),
        date: String(params[1]),
        title: String(params[2] ?? ""),
        content: String(params[3] ?? ""),
        createdAt: new Date((Number(params[4]) || Math.floor(Date.now() / 1000)) * 1000),
        updatedAt: new Date((Number(params[5]) || Math.floor(Date.now() / 1000)) * 1000),
      };
      const filtered = list.filter((e) => e.id !== newEntry.id);
      this.saveEntries([...filtered, newEntry]);
      return { rowsAffected: 1, lastInsertId: 1 };
    }

    if (lower.startsWith("update")) {
      const title = String(params[0] ?? "");
      const content = String(params[1] ?? "");
      const updatedAt = new Date((Number(params[2]) || Math.floor(Date.now() / 1000)) * 1000);
      const targetId = String(params[params.length - 1]);

      let changed = false;
      const updated = list.map((e) => {
        if (e.id === targetId) {
          changed = true;
          return { ...e, title, content, updatedAt };
        }
        return e;
      });
      if (changed) {
        this.saveEntries(updated);
      }
      return { rowsAffected: changed ? 1 : 0, lastInsertId: undefined };
    }

    if (lower.startsWith("delete")) {
      const targetId = String(params[0] ?? "");
      const before = list.length;
      const filtered = list.filter((e) => e.id !== targetId);
      this.saveEntries(filtered);
      return { rowsAffected: before - filtered.length, lastInsertId: undefined };
    }

    return { rowsAffected: 0, lastInsertId: undefined };
  }

  searchEntries(query: string): SearchResult[] {
    const list = this.getEntries();
    const clean = query.toLowerCase().trim();
    if (!clean) return [];

    const matches: SearchResult[] = [];
    for (const entry of list) {
      const titleLower = entry.title.toLowerCase();
      const contentLower = entry.content.toLowerCase();
      const inTitle = titleLower.includes(clean);
      const inContent = contentLower.includes(clean);

      if (inTitle || inContent) {
        let snippetText = "";
        if (inContent) {
          const idx = contentLower.indexOf(clean);
          const start = Math.max(0, idx - 30);
          const end = Math.min(entry.content.length, idx + clean.length + 30);
          const prefix = start > 0 ? "..." : "";
          const suffix = end < entry.content.length ? "..." : "";
          const matchSlice = entry.content.slice(idx, idx + clean.length);
          snippetText = `${prefix}${entry.content.slice(start, idx)}<mark>${matchSlice}</mark>${entry.content.slice(idx + clean.length, end)}${suffix}`;
        } else {
          snippetText = entry.title.replace(
            new RegExp(`(${clean})`, "gi"),
            "<mark>$1</mark>"
          );
        }

        matches.push({
          id: entry.id,
          date: entry.date,
          title: entry.title || "Untitled entry",
          snippet: snippetText,
          rank: 0,
        });
      }
    }
    return matches;
  }
}

/**
 * Initializes and returns the local SQLite database client bridged through Tauri 2.
 * Stores data locally in macOS Application Support with zero cloud dependency.
 */
export async function getDb(): Promise<ReturnType<typeof drizzle<typeof schema>>> {
  if (dbInstance) {
    return dbInstance;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const runningInTauri = isTauri();

    if (runningInTauri) {
      rawDb = await Database.load(DB_NAME);

      // Execute schema initialization: base table, unique index, FTS5 table, and triggers
      const ddlStatements = [
        `CREATE TABLE IF NOT EXISTS entries (
          id TEXT PRIMARY KEY NOT NULL,
          date TEXT NOT NULL,
          title TEXT NOT NULL DEFAULT '',
          content TEXT NOT NULL DEFAULT '',
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );`,
        `DROP INDEX IF EXISTS entries_date_unique;`,
        `CREATE INDEX IF NOT EXISTS entries_date_idx ON entries (date);`,
        `CREATE VIRTUAL TABLE IF NOT EXISTS entries_fts USING fts5(
          id UNINDEXED,
          date UNINDEXED,
          title,
          content
        );`,
        `CREATE TRIGGER IF NOT EXISTS entries_ai AFTER INSERT ON entries BEGIN
          INSERT INTO entries_fts(id, date, title, content) VALUES (new.id, new.date, new.title, new.content);
        END;`,
        `CREATE TRIGGER IF NOT EXISTS entries_au AFTER UPDATE ON entries BEGIN
          DELETE FROM entries_fts WHERE id = old.id;
          INSERT INTO entries_fts(id, date, title, content) VALUES (new.id, new.date, new.title, new.content);
        END;`,
        `CREATE TRIGGER IF NOT EXISTS entries_ad AFTER DELETE ON entries BEGIN
          DELETE FROM entries_fts WHERE id = old.id;
        END;`,
        `INSERT INTO entries_fts(id, date, title, content)
         SELECT id, date, title, content FROM entries
         WHERE id NOT IN (SELECT id FROM entries_fts);`,
      ];

      for (const ddl of ddlStatements) {
        try {
          await rawDb.execute(ddl);
        } catch (e) {
          console.warn("[Second Diary] DDL execution warning:", e);
        }
      }

      dbInstance = drizzle<typeof schema>(
        async (sql, params, method) => {
          if (!rawDb) throw new Error("SQLite database not loaded");

          if (method === "all" || method === "values") {
            const rows = await rawDb.select<Record<string, any>[]>(sql, params);
            return { rows: rows.map((row) => Object.values(row)) };
          }

          if (method === "get") {
            const rows = await rawDb.select<Record<string, any>[]>(sql, params);
            return { rows: (rows.length > 0 ? Object.values(rows[0]) : undefined) as any };
          }

          const result = await rawDb.execute(sql, params);
          return {
            rows: [],
            rowsAffected: result.rowsAffected,
            lastInsertId: result.lastInsertId,
          };
        },
        { schema }
      );
    } else {
      console.info("[Second Diary] Running outside Tauri: Using local browser fallback storage.");
      fallbackDbInstance = new BrowserFallbackDb();

      dbInstance = drizzle<typeof schema>(
        async (sql, params, method) => {
          if (!fallbackDbInstance) throw new Error("Fallback database not loaded");

          if (method === "all" || method === "values") {
            const rows = await fallbackDbInstance.select<Record<string, any>[]>(sql, params);
            return { rows: rows.map((row) => Object.values(row)) };
          }

          if (method === "get") {
            const rows = await fallbackDbInstance.select<Record<string, any>[]>(sql, params);
            return { rows: (rows.length > 0 ? Object.values(rows[0]) : undefined) as any };
          }

          const result = await fallbackDbInstance.execute(sql, params);
          return {
            rows: [],
            rowsAffected: result.rowsAffected,
            lastInsertId: result.lastInsertId,
          };
        },
        { schema }
      );
    }

    return dbInstance;
  })();

  return initPromise;
}

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
 * Fetches the most recent entry for a date (YYYY-MM-DD) from the local SQLite database.
 */
export async function getEntryByDate(dateStr: string): Promise<Entry | null> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.entries)
    .where(eq(schema.entries.date, dateStr))
    .orderBy(desc(schema.entries.createdAt));

  return rows.length > 0 ? rows[0] : null;
}

/**
 * Fetches an entry by its ID from the local SQLite database.
 */
export async function getEntryById(id: string): Promise<Entry | null> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.entries)
    .where(eq(schema.entries.id, id));

  return rows.length > 0 ? rows[0] : null;
}

/**
 * Fetches all entries for a specific date (YYYY-MM-DD), ordered by newest createdAt first.
 */
export async function getEntriesByDate(dateStr: string): Promise<Entry[]> {
  const db = await getDb();
  return db
    .select()
    .from(schema.entries)
    .where(eq(schema.entries.date, dateStr))
    .orderBy(desc(schema.entries.createdAt));
}

/**
 * Saves (inserts or updates) a diary entry in the local SQLite database via Drizzle ORM.
 */
export async function saveEntry(data: {
  id?: string;
  date: string;
  title: string;
  content: string;
  createdAt?: Date;
}): Promise<Entry> {
  const db = await getDb();
  const now = new Date();

  let existing: Entry | null = null;
  if (data.id) {
    existing = await getEntryById(data.id);
  }

  if (existing) {
    await db
      .update(schema.entries)
      .set({
        title: data.title,
        content: data.content,
        updatedAt: now,
      })
      .where(eq(schema.entries.id, existing.id));

    return {
      ...existing,
      title: data.title,
      content: data.content,
      updatedAt: now,
    };
  } else {
    const entryId = data.id || crypto.randomUUID();
    const entryCreatedAt = data.createdAt || now;
    const newEntry: Entry = {
      id: entryId,
      date: data.date,
      title: data.title,
      content: data.content,
      createdAt: entryCreatedAt,
      updatedAt: now,
    };

    await db.insert(schema.entries).values(newEntry);
    return newEntry;
  }
}

/**
 * Deletes an entry by its ID from the local SQLite database.
 */
export async function deleteEntry(id: string): Promise<boolean> {
  await getDb();
  if (isTauri() && rawDb) {
    await rawDb.execute("DELETE FROM entries WHERE id = ?;", [id]);
    return true;
  } else if (fallbackDbInstance) {
    await fallbackDbInstance.execute("DELETE FROM entries WHERE id = ?", [id]);
    return true;
  } else if (dbInstance) {
    await dbInstance.delete(schema.entries).where(eq(schema.entries.id, id));
    return true;
  }
  return false;
}

/**
 * Fetches all saved entries from the local database, ordered chronologically (newest date first, then newest createdAt).
 */
export async function getAllEntries(): Promise<Entry[]> {
  const db = await getDb();
  return db
    .select()
    .from(schema.entries)
    .orderBy(desc(schema.entries.date), desc(schema.entries.createdAt));
}

/**
 * Executes a full-text search across entry titles and content using SQLite FTS5.
 * Returns matching records with ranked relevance and contextual snippets with highlight marks.
 * 100% offline with zero cloud or vector DB dependencies.
 */
export async function searchEntries(query: string): Promise<SearchResult[]> {
  const ftsQuery = formatFtsQuery(query);
  if (!ftsQuery) return [];

  await getDb(); // Ensure database and FTS5 tables are initialized

  if (isTauri() && rawDb) {
    const sql = `
      SELECT
        id,
        date,
        title,
        snippet(entries_fts, -1, '<mark>', '</mark>', '...', 16) AS snippet,
        bm25(entries_fts) AS rank
      FROM entries_fts
      WHERE entries_fts MATCH ?
      ORDER BY rank;
    `;
    const rows = await rawDb.select<SearchResult[]>(sql, [ftsQuery]);
    return rows;
  } else if (fallbackDbInstance) {
    return fallbackDbInstance.searchEntries(query);
  }

  return [];
}

export { schema };
export type { SearchResult };

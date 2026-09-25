import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { eq, desc } from "drizzle-orm";

// Define the exact schema as specified in requirement 3
const entries = sqliteTable("entries", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  title: text("title").notNull().default(""),
  content: text("content").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

const TEST_DB_PATH = path.join(process.cwd(), "tests", "test_second_diary.db");

// FTS query sanitizer mirroring src/db/index.ts
function formatFtsQuery(rawQuery) {
  const trimmed = rawQuery.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length > 2) {
    const inner = trimmed.slice(1, -1).replace(/[^\w\s]/g, " ").trim();
    return inner ? `"${inner}"` : "";
  }

  const sanitized = trimmed.replace(/[^\w\s]/g, " ").trim();
  if (!sanitized) return "";

  const tokens = sanitized.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return "";

  return tokens.map((t) => `${t}*`).join(" ");
}

// Helper to simulate Tauri plugin-sql bridge over a real SQLite database file
function createDrizzleBridge(dbFilePath) {
  const rawDb = new DatabaseSync(dbFilePath);

  // Initialize schema with FTS5 virtual table and triggers
  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY NOT NULL,
      date TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    DROP INDEX IF EXISTS entries_date_unique;
    CREATE INDEX IF NOT EXISTS entries_date_idx ON entries (date);

    CREATE VIRTUAL TABLE IF NOT EXISTS entries_fts USING fts5(
      id UNINDEXED,
      date UNINDEXED,
      title,
      content
    );

    CREATE TRIGGER IF NOT EXISTS entries_ai AFTER INSERT ON entries BEGIN
      INSERT INTO entries_fts(id, date, title, content) VALUES (new.id, new.date, new.title, new.content);
    END;

    CREATE TRIGGER IF NOT EXISTS entries_au AFTER UPDATE ON entries BEGIN
      DELETE FROM entries_fts WHERE id = old.id;
      INSERT INTO entries_fts(id, date, title, content) VALUES (new.id, new.date, new.title, new.content);
    END;

    CREATE TRIGGER IF NOT EXISTS entries_ad AFTER DELETE ON entries BEGIN
      DELETE FROM entries_fts WHERE id = old.id;
    END;
  `);

  // Same proxy mapping used in src/db/index.ts
  const db = drizzle(
    async (sql, params, method) => {
      if (method === "all" || method === "values") {
        const stmt = rawDb.prepare(sql);
        const rows = stmt.all(...params);
        return { rows: rows.map((r) => Object.values(r)) };
      }

      if (method === "get") {
        const stmt = rawDb.prepare(sql);
        const row = stmt.get(...params);
        return { rows: row ? Object.values(row) : undefined };
      }

      const stmt = rawDb.prepare(sql);
      const info = stmt.run(...params);
      return {
        rows: [],
        rowsAffected: Number(info.changes),
        lastInsertId: Number(info.lastInsertRowid),
      };
    },
    { schema: { entries } }
  );

  return {
    db,
    search: (query) => {
      const ftsQuery = formatFtsQuery(query);
      if (!ftsQuery) return [];
      const stmt = rawDb.prepare(`
        SELECT
          id,
          date,
          title,
          snippet(entries_fts, -1, '<mark>', '</mark>', '...', 16) AS snippet,
          bm25(entries_fts) AS rank
        FROM entries_fts
        WHERE entries_fts MATCH ?
        ORDER BY rank;
      `);
      return stmt.all(ftsQuery);
    },
    close: () => rawDb.close(),
  };
}

// Date helpers mirroring src/db/index.ts
function shiftDateString(dateStr, offsetDays) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + offsetDays);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getRelativeDateLabel(dateStr, today) {
  if (dateStr === today) return "Today";
  if (dateStr === shiftDateString(today, -1)) return "Yesterday";
  if (dateStr === shiftDateString(today, 1)) return "Tomorrow";
  return null;
}

test("Diary Lifecycle & FTS5 Full-Text Search Verification", async (t) => {
  // Clean up any old test database
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }

  const todayDate = "2026-09-23";
  const entryId = "entry-uuid-today-1";
  const initialTitle = "First Morning in Second Diary";
  const initialContent = "Starting my personal private journal locally on my Mac with SQLite.";
  const createdDate = new Date("2026-09-23T08:00:00Z");

  // Step 1: Open session 1 (App launched for the first time)
  await t.test("Step 1 & 2: Create today's entry and save to SQLite via Drizzle", async () => {
    const session1 = createDrizzleBridge(TEST_DB_PATH);

    // Verify today's entry does not exist yet
    const existing = await session1.db
      .select()
      .from(entries)
      .where(eq(entries.date, todayDate));
    assert.equal(existing.length, 0, "Initially today's entry should not exist");

    // Create today's entry
    await session1.db.insert(entries).values({
      id: entryId,
      date: todayDate,
      title: initialTitle,
      content: initialContent,
      createdAt: createdDate,
      updatedAt: createdDate,
    });

    // Read back to confirm initial save
    const saved = await session1.db
      .select()
      .from(entries)
      .where(eq(entries.date, todayDate));

    assert.equal(saved.length, 1);
    assert.equal(saved[0].id, entryId);
    assert.equal(saved[0].date, todayDate);
    assert.equal(saved[0].title, initialTitle);
    assert.equal(saved[0].content, initialContent);

    // Edit and save again (simulate autosave / edits)
    const updatedContent =
      "Starting my personal private journal locally on my Mac with SQLite. Added evening reflections about cryptography!";
    const updatedTitle = "First Day in Second Diary (Reflections)";
    const updatedDate = new Date("2026-09-23T18:30:00Z");

    await session1.db
      .update(entries)
      .set({
        title: updatedTitle,
        content: updatedContent,
        updatedAt: updatedDate,
      })
      .where(eq(entries.id, entryId));

    const updated = await session1.db
      .select()
      .from(entries)
      .where(eq(entries.date, todayDate));

    assert.equal(updated.length, 1);
    assert.equal(updated[0].title, updatedTitle);
    assert.equal(updated[0].content, updatedContent);

    session1.close();
  });

  // Step 3: Verify the database file physically exists on disk
  await t.test("Step 3: Database file exists on disk", () => {
    assert.ok(fs.existsSync(TEST_DB_PATH), "SQLite database file must exist on disk");
    const stats = fs.statSync(TEST_DB_PATH);
    assert.ok(stats.size > 0, "SQLite database file must not be empty");
  });

  // Step 4: Open session 2 (Reopen the application)
  await t.test(
    "Step 4 & 5: Reopen application, connect to SQLite file, read saved entry",
    async () => {
      const session2 = createDrizzleBridge(TEST_DB_PATH);

      const rows = await session2.db
        .select()
        .from(entries)
        .where(eq(entries.date, todayDate));

      assert.equal(rows.length, 1, "Must find exactly 1 entry for today's date upon reopening");
      const todayEntry = rows[0];

      assert.equal(todayEntry.id, entryId);
      assert.equal(todayEntry.date, todayDate);
      assert.equal(todayEntry.title, "First Day in Second Diary (Reflections)");
      assert.equal(
        todayEntry.content,
        "Starting my personal private journal locally on my Mac with SQLite. Added evening reflections about cryptography!"
      );
      assert.ok(todayEntry.createdAt instanceof Date, "createdAt must be deserialized as Date");
      assert.ok(todayEntry.updatedAt instanceof Date, "updatedAt must be deserialized as Date");

      session2.close();
    }
  );

  // Step 5: Timeline chronological queries & empty date navigation
  await t.test(
    "Timeline: Chronological order, empty date navigation, and past entries",
    async () => {
      const session = createDrizzleBridge(TEST_DB_PATH);

      const pastDate1 = shiftDateString(todayDate, -3); // 2026-09-20
      await session.db.insert(entries).values({
        id: "entry-past-3",
        date: pastDate1,
        title: "Weekend Trip to Yosemite",
        content: "Went hiking through the redwood groves and took magnificent photos.",
        createdAt: new Date("2026-09-20T10:00:00Z"),
        updatedAt: new Date("2026-09-20T10:00:00Z"),
      });

      const pastDate2 = shiftDateString(todayDate, -5); // 2026-09-18
      await session.db.insert(entries).values({
        id: "entry-past-5",
        date: pastDate2,
        title: "Rust and Tauri Architecture",
        content: "Configured local environment and verified zero telemetry policy.",
        createdAt: new Date("2026-09-18T10:00:00Z"),
        updatedAt: new Date("2026-09-18T10:00:00Z"),
      });

      const allChronological = await session.db
        .select()
        .from(entries)
        .orderBy(desc(entries.date));

      assert.equal(allChronological.length, 3);
      assert.equal(allChronological[0].date, "2026-09-23", "Newest (today) must be first");
      assert.equal(allChronological[1].date, "2026-09-20", "Middle entry must be second");
      assert.equal(allChronological[2].date, "2026-09-18", "Oldest entry must be third");

      // Verify empty date navigation
      const yesterdayDate = shiftDateString(todayDate, -1);
      const yesterdayEntry = await session.db
        .select()
        .from(entries)
        .where(eq(entries.date, yesterdayDate));

      assert.equal(yesterdayEntry.length, 0, "Yesterday should be navigable as an empty date");

      session.close();
    }
  );

  // Step 6: SQLite FTS5 Full-Text Search Verification
  await t.test("SQLite FTS5: Title search, content search, snippets, and prefix matching", async () => {
    const session = createDrizzleBridge(TEST_DB_PATH);

    // 1. Search matching in title: "Yosemite"
    const titleResults = session.search("Yosemite");
    assert.equal(titleResults.length, 1);
    assert.equal(titleResults[0].date, "2026-09-20");
    assert.ok(titleResults[0].snippet.includes("<mark>Yosemite</mark>"));

    // 2. Search matching in content: "cryptography"
    const contentResults = session.search("cryptography");
    assert.equal(contentResults.length, 1);
    assert.equal(contentResults[0].date, "2026-09-23");
    assert.ok(contentResults[0].snippet.includes("<mark>cryptography</mark>"));

    // 3. Search with prefix matching: "telemetr" matching "telemetry"
    const prefixResults = session.search("telemetr");
    assert.equal(prefixResults.length, 1);
    assert.equal(prefixResults[0].date, "2026-09-18");
    assert.ok(prefixResults[0].snippet.includes("<mark>telemetry</mark>"));

    // 4. Search matching across multiple words: "redwood hiking"
    const multiWordResults = session.search("redwood hiking");
    assert.equal(multiWordResults.length, 1);
    assert.equal(multiWordResults[0].date, "2026-09-20");

    // 5. Query sanitization: special symbols do not crash or error
    const specialResults = session.search("??? --- ((++)) !!!");
    assert.equal(specialResults.length, 0, "Invalid query tokens should safely return empty");

    // 6. Search when no match: "quantum supercomputer"
    const noResults = session.search("quantum supercomputer");
    assert.equal(noResults.length, 0);

    // 7. Verify update synchronization: update an entry and re-search
    await session.db
      .update(entries)
      .set({
        title: "Weekend Trip to Tahoe",
        content: "Changed plans and drove up to Lake Tahoe instead of the mountains.",
        updatedAt: new Date(),
      })
      .where(eq(entries.id, "entry-past-3"));

    // Old term Yosemite should now yield 0 results
    const oldResults = session.search("Yosemite");
    assert.equal(oldResults.length, 0, "Old content should be unindexed after update");

    // New term Tahoe should yield 1 result
    const newResults = session.search("Tahoe");
    assert.equal(newResults.length, 1);
    assert.equal(newResults[0].date, "2026-09-20");
    assert.ok(newResults[0].snippet.includes("<mark>Tahoe</mark>"));

    session.close();
  });

  // Step 7: Multiple Entries Per Day Verification
  await t.test("Multiple entries per day: create multiple entries for the same date, verify isolation, order, and FTS5 search", async () => {
    const session = createDrizzleBridge(TEST_DB_PATH);

    const testDay = "2026-09-24";
    const entryMorningId = "entry-same-day-morning";
    const entryAfternoonId = "entry-same-day-afternoon";
    const entryNightId = "entry-same-day-night";

    // 1. Insert morning entry
    await session.db.insert(entries).values({
      id: entryMorningId,
      date: testDay,
      title: "Morning Sunrise Run",
      content: "Ran 5 kilometers at 7am before breakfast. Cold morning breeze along the bay.",
      createdAt: new Date("2026-09-24T07:00:00Z"),
      updatedAt: new Date("2026-09-24T07:00:00Z"),
    });

    // 2. Insert afternoon entry on the SAME day
    await session.db.insert(entries).values({
      id: entryAfternoonId,
      date: testDay,
      title: "Afternoon Coffee & Sketching",
      content: "Designed the new journal timeline layout. Drank pour-over Ethiopian beans.",
      createdAt: new Date("2026-09-24T14:30:00Z"),
      updatedAt: new Date("2026-09-24T14:30:00Z"),
    });

    // 3. Insert evening entry on the SAME day
    await session.db.insert(entries).values({
      id: entryNightId,
      date: testDay,
      title: "Night Stargazing",
      content: "Clear autumn sky. Mars was visible just above the horizon.",
      createdAt: new Date("2026-09-24T21:15:00Z"),
      updatedAt: new Date("2026-09-24T21:15:00Z"),
    });

    // 4. Query all entries for this date
    const dayEntries = await session.db
      .select()
      .from(entries)
      .where(eq(entries.date, testDay))
      .orderBy(desc(entries.createdAt));

    assert.equal(dayEntries.length, 3, "Must have exactly 3 entries on the same date");
    assert.equal(dayEntries[0].id, entryNightId, "Night entry (21:15) should be first");
    assert.equal(dayEntries[1].id, entryAfternoonId, "Afternoon entry (14:30) should be second");
    assert.equal(dayEntries[2].id, entryMorningId, "Morning entry (07:00) should be third");

    // 5. Update only the afternoon entry and verify isolation
    await session.db
      .update(entries)
      .set({
        title: "Afternoon Coffee & Drizzle Refactoring",
        content: "Refactored multi-entry schema constraints and verified offline database durability.",
        updatedAt: new Date("2026-09-24T15:00:00Z"),
      })
      .where(eq(entries.id, entryAfternoonId));

    const morningEntry = await session.db
      .select()
      .from(entries)
      .where(eq(entries.id, entryMorningId));
    assert.equal(morningEntry[0].title, "Morning Sunrise Run", "Morning entry should remain unchanged");

    const updatedAfternoon = await session.db
      .select()
      .from(entries)
      .where(eq(entries.id, entryAfternoonId));
    assert.equal(updatedAfternoon[0].title, "Afternoon Coffee & Drizzle Refactoring");

    // 6. Verify full-text search finds both independent entries on that date
    const runResults = session.search("breakfast");
    assert.equal(runResults.length, 1);
    assert.equal(runResults[0].id, entryMorningId);
    assert.equal(runResults[0].date, testDay);

    const refactorResults = session.search("Refactoring");
    assert.equal(refactorResults.length, 1);
    assert.equal(refactorResults[0].id, entryAfternoonId);
    assert.equal(refactorResults[0].date, testDay);

    session.close();
  });

  // Step 8: Main CTA Multiple Entries Per Day Workflow Verification
  await t.test("Main CTA: Sequential creation of multiple entries on the same day", async () => {
    const session = createDrizzleBridge(TEST_DB_PATH);
    const today = "2026-09-26";

    // Simulate in-memory list and creation function matching useDiary
    let entriesList = [];
    let selectedId = null;

    async function handleMainCta(targetDate = today) {
      // If there is already an empty, unedited entry for this targetDate, reuse it
      const existingEmpty = entriesList.find(
        (e) => e.date === targetDate && !e.title.trim() && !e.body.trim()
      );
      if (existingEmpty) {
        selectedId = existingEmpty.id;
        return existingEmpty.id;
      }

      const now = new Date();
      const newEntry = {
        id: `cta-entry-${entriesList.length + 1}-${Date.now()}`,
        date: targetDate,
        title: "",
        body: "",
        createdAt: now,
        updatedAt: now,
      };

      entriesList = [newEntry, ...entriesList];
      selectedId = newEntry.id;

      await session.db.insert(entries).values({
        id: newEntry.id,
        date: newEntry.date,
        title: newEntry.title,
        content: newEntry.body,
        createdAt: newEntry.createdAt,
        updatedAt: newEntry.updatedAt,
      });

      return newEntry.id;
    }

    // 1. User clicks main CTA for the first time on today
    const firstId = await handleMainCta(today);
    assert.ok(firstId, "First entry must be created");
    assert.equal(entriesList.length, 1);

    // 2. User types in first entry
    entriesList[0].title = "Morning Coffee & Notes";
    entriesList[0].body = "First entry written from main CTA.";
    await session.db
      .update(entries)
      .set({ title: entriesList[0].title, content: entriesList[0].body })
      .where(eq(entries.id, firstId));

    // 3. User clicks main CTA a second time on the SAME day
    const secondId = await handleMainCta(today);
    assert.notEqual(firstId, secondId, "Second entry must have a distinct unique ID");
    assert.equal(entriesList.length, 2, "List must now contain 2 entries for today");

    // 4. User types in second entry
    entriesList[0].title = "Afternoon Standup Thoughts";
    entriesList[0].body = "Second entry written from main CTA on the same day.";
    await session.db
      .update(entries)
      .set({ title: entriesList[0].title, content: entriesList[0].body })
      .where(eq(entries.id, secondId));

    // 5. User clicks main CTA a third time on the SAME day
    const thirdId = await handleMainCta(today);
    assert.notEqual(secondId, thirdId);
    assert.equal(entriesList.length, 3, "List must now contain 3 entries for today");

    // 6. User clicks main CTA again WITHOUT typing anything in the 3rd entry
    const fourthAttemptId = await handleMainCta(today);
    assert.equal(fourthAttemptId, thirdId, "Clicking main CTA with an empty entry should reuse it rather than duplicate");
    assert.equal(entriesList.length, 3, "Length must remain 3");

    // 7. Verify all entries are persisted in SQLite under today's date
    const dbEntriesToday = await session.db
      .select()
      .from(entries)
      .where(eq(entries.date, today));

    assert.equal(dbEntriesToday.length, 3, "Database must store all 3 entries under today's date");

    const savedFirst = dbEntriesToday.find((e) => e.id === firstId);
    const savedSecond = dbEntriesToday.find((e) => e.id === secondId);
    assert.equal(savedFirst.title, "Morning Coffee & Notes");
    assert.equal(savedSecond.title, "Afternoon Standup Thoughts");

    session.close();
  });

  // Step 9: Calendar View Selection & Future Date Rejection Verification
  await t.test("Calendar View: Date click does not create entry, future dates blocked, explicit button creates entry", async () => {
    const session = createDrizzleBridge(TEST_DB_PATH);
    const today = "2026-09-26";
    const futureDate = "2026-09-30";
    const pastEmptyDate = "2026-09-15";

    let entriesList = [];
    let selectedId = null;
    let calendarSelectedDate = today;

    // Calendar date click behavior: DOES NOT CREATE ENTRY
    function handleCalendarDateClick(dateStr) {
      calendarSelectedDate = dateStr;
      const matching = entriesList.filter((e) => e.date === dateStr);
      if (matching.length > 0) {
        selectedId = matching[0].id;
      }
      // If no matching entries, do nothing to entriesList or DB
    }

    // Explicit create button behavior: GUARDS AGAINST FUTURE DATES
    async function handleExplicitCreateEntry(dateStr) {
      if (dateStr > today) {
        // Disallowed
        return null;
      }

      const newEntry = {
        id: `cal-entry-${Date.now()}`,
        date: dateStr,
        title: "",
        content: "",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      entriesList.push(newEntry);
      selectedId = newEntry.id;

      await session.db.insert(entries).values(newEntry);
      return newEntry.id;
    }

    // 1. User clicks an empty past date in calendar view
    handleCalendarDateClick(pastEmptyDate);
    assert.equal(calendarSelectedDate, pastEmptyDate);
    assert.equal(entriesList.length, 0, "Clicking an empty date must NEVER create an entry");

    // 2. User attempts to create an entry for a FUTURE date
    const futureResult = await handleExplicitCreateEntry(futureDate);
    assert.equal(futureResult, null, "Creating entry for future date must be rejected");
    assert.equal(entriesList.length, 0, "No entry must be created for future date");

    const futureDbCheck = await session.db
      .select()
      .from(entries)
      .where(eq(entries.date, futureDate));
    assert.equal(futureDbCheck.length, 0, "Database must have 0 entries for future date");

    // 3. User clicks the explicit '+ Create entry for this day' button on past date
    const createdPastId = await handleExplicitCreateEntry(pastEmptyDate);
    assert.ok(createdPastId, "Must create entry when explicit button is clicked");
    assert.equal(entriesList.length, 1);
    assert.equal(entriesList[0].date, pastEmptyDate);

    // 4. Verify entry persisted in SQLite
    const pastDbCheck = await session.db
      .select()
      .from(entries)
      .where(eq(entries.date, pastEmptyDate));
    assert.equal(pastDbCheck.length, 1);
    assert.equal(pastDbCheck[0].id, createdPastId);

    // 5. Clicking on the date again now selects the existing entry without creating another
    handleCalendarDateClick(pastEmptyDate);
    assert.equal(selectedId, createdPastId);
    assert.equal(entriesList.length, 1, "Length remains 1; no duplicate entry created");

    session.close();
  });

  // Cleanup
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
});

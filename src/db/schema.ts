import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * Entries table schema for Second Diary.
 * Strictly local SQLite storage with zero network dependencies.
 */
export const entries = sqliteTable("entries", {
  id: text("id").primaryKey(),
  date: text("date").notNull(), // Format: YYYY-MM-DD in local time (allows multiple entries per day)
  title: text("title").notNull().default(""),
  content: text("content").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type Entry = typeof entries.$inferSelect;
export type NewEntry = typeof entries.$inferInsert;

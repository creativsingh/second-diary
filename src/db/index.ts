import Database from "@tauri-apps/plugin-sql";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import * as schema from "./schema";

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;
let rawDb: Database | null = null;

export const DB_NAME = "sqlite:second_diary.db";

/**
 * Initializes and returns the local SQLite database client bridged through Tauri 2.
 * Stores data locally in the application data directory with zero cloud dependency.
 */
export async function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  rawDb = await Database.load(DB_NAME);

  dbInstance = drizzle<typeof schema>(
    async (sql, params, method) => {
      if (!rawDb) throw new Error("Database not loaded");

      if (method === "all" || method === "values") {
        const rows = await rawDb.select<any[]>(sql, params);
        return { rows: method === "values" ? rows.map(Object.values) : rows };
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

  return dbInstance;
}

export { schema };

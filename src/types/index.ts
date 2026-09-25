import type { Entry as DbEntry, NewEntry } from "@/db/schema";

export type { DbEntry, NewEntry };

export type NavItem = "journal" | "ai";

export interface Entry {
  id: string;
  date: string; // YYYY-MM-DD
  hour: number; // 0–23.9, time of day written
  title: string;
  body: string;
  tags: string[];
  mood?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DiaryMetadata {
  appName: string;
  version: string;
  storageType: "local-sqlite";
}

export interface SearchResult {
  id: string;
  date: string;
  title: string;
  snippet: string;
  rank: number;
}

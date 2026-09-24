export type { Entry, NewEntry } from "@/db/schema";

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

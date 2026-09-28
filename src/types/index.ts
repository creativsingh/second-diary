export type NavItem = "journal" | "notes" | "brain";

export type EntryMode =
  | "write"
  | "empty"
  | "dictate-rec"
  | "dictate-proc"
  | "talk-conv"
  | "talk-complete";

export interface Note {
  id: string;
  title: string;
  body: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
}

export interface Entry {
  id: string;
  date: string; // YYYY-MM-DD
  hour: number; // decimal hour (e.g. 14.5 = 2:30pm)
  title: string;
  body: string;
  tags: string[];
  mood?: string;
  origin?: "dictation" | "conversation";
  originTime?: string; // e.g. "2:30 PM"
  rawTranscript?: string;
  conversation?: { role: "user" | "ai"; text: string }[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DiaryMetadata {
  appName: string;
  version: string;
  storageType: "local-markdown";
}

export interface SearchResult {
  id: string;
  date: string;
  title: string;
  snippet: string;
  rank: number;
}


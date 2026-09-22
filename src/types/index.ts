export type { Entry, NewEntry, Tag } from "@/db/schema";

export interface DiaryMetadata {
  appName: string;
  version: string;
  storageType: "local-sqlite";
}

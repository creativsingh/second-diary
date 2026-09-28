import { useState, useEffect, useMemo, useCallback } from "react";
import type { Note } from "@/types";

const NOTES_STORAGE_KEY = "second_diary_notes_data";

const INITIAL_SEED_NOTES: Note[] = [
  {
    id: "note-1",
    title: "Architecture & Pedagogy Reading Notes",
    body: "Christopher Alexander's *The Timeless Way of Building*: patterns as living structures that resolve tensions.\n\nKey insight: Software interfaces teach users how to think in the exact same way buildings shape physical movements. The interface is never neutral—it is always a silent pedagogy.\n\nTo explore:\n- Pattern languages for personal thought tools\n- Calm technology principles (Weiser & Brown)",
    tags: ["reading", "architecture", "ideas"],
    createdAt: "2026-09-26T09:00:00.000Z",
    updatedAt: "2026-09-27T14:30:00.000Z",
    pinned: true,
  },
  {
    id: "note-2",
    title: "Second Brain & Memory Architecture",
    body: "Core vision: A tool that does not just log past days, but serves as quiet furniture for the mind.\n\nTwo fundamental pillars:\n1. Episodic Diary (Memory): Chronological flow, sensory moments, morning thoughts, emotional rhythms.\n2. Semantic Knowledge (Notes): Structured concepts, working outlines, quotes, project plans.\n\nThe Second Brain brings them together: asking a question synthesizes both lived experience and distilled notes.",
    tags: ["projects", "ideas"],
    createdAt: "2026-09-27T11:00:00.000Z",
    updatedAt: "2026-09-28T08:15:00.000Z",
    pinned: true,
  },
  {
    id: "note-3",
    title: "Morning Focus & Uninterrupted Intervals",
    body: "- Guard 8:30 AM to 9:30 AM as an input-free zone. No email, no browser tabs, tea only.\n- Keep an analog notebook open beside mechanical keyboard.\n- Afternoon walk (5-7km) without headphones to let subconscious processing do the work.",
    tags: ["habits", "focus"],
    createdAt: "2026-09-28T07:45:00.000Z",
    updatedAt: "2026-09-28T09:20:00.000Z",
  },
];

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem(NOTES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("[useNotes] Error reading notes from localStorage:", e);
    }
    return INITIAL_SEED_NOTES;
  });

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(() => {
    return notes[0]?.id ?? null;
  });

  const [searchQuery, setSearchQuery] = useState("");

  // Persist notes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
    } catch (e) {
      console.warn("[useNotes] Error saving notes to localStorage:", e);
    }
  }, [notes]);

  const selectedNote = useMemo(() => {
    if (!selectedNoteId) return notes[0] || null;
    return notes.find((n) => n.id === selectedNoteId) || null;
  }, [notes, selectedNoteId]);

  const createNote = useCallback(() => {
    const now = new Date().toISOString();
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: "",
      body: "",
      tags: [],
      createdAt: now,
      updatedAt: now,
    };
    setNotes((prev) => [newNote, ...prev]);
    setSelectedNoteId(newNote.id);
    return newNote;
  }, []);

  const updateNote = useCallback((id: string, field: "title" | "body", value: string) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n;
        return {
          ...n,
          [field]: value,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => {
      const next = prev.filter((n) => n.id !== id);
      if (selectedNoteId === id) {
        setSelectedNoteId(next[0]?.id ?? null);
      }
      return next;
    });
  }, [selectedNoteId]);

  // Filter notes by search query
  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) => {
      const titleMatch = (n.title || "").toLowerCase().includes(q);
      const bodyMatch = (n.body || "").toLowerCase().includes(q);
      const tagMatch = (n.tags || []).some((t) => t.toLowerCase().includes(q));
      return titleMatch || bodyMatch || tagMatch;
    });
  }, [notes, searchQuery]);

  return {
    notes: filteredNotes,
    allNotes: notes,
    selectedNoteId,
    setSelectedNoteId,
    selectedNote,
    createNote,
    updateNote,
    deleteNote,
    searchQuery,
    setSearchQuery,
  };
}

import { useState, useRef, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { JournalPanel } from "@/components/JournalPanel";
import { Editor } from "@/components/Editor";
import { AiPanel, AiChatView } from "@/components/AiChat";
import { DictateInline } from "@/components/DictateInline";
import { TalkItOut } from "@/components/TalkItOut";
import { NotesPanel } from "@/components/NotesPanel";
import { NoteEditor } from "@/components/NoteEditor";
import { useDiary } from "@/hooks/useDiary";
import { useNotes } from "@/hooks/useNotes";
import type { NavItem, EntryMode } from "@/types";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [nav, setNav] = useState<NavItem>("journal");
  const [entryMode, setEntryMode] = useState<EntryMode>("write");
  const [journalViewMode, setJournalViewMode] = useState<"list" | "calendar">("list");
  const [dictating, setDictating] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // Diary entries persistence & search hook
  const {
    entries,
    selectedEntry,
    selectedId,
    setSelectedId,
    todayDate,
    activeTag,
    setActiveTag,
    topTags,
    saveStatus,
    updateCurrentEntry,
    updateCurrentEntryFields,
    createNewEntry,
    deleteEntry,
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    openMarkdownFolder,
    revealMarkdownFile,
  } = useDiary();

  // Notes state & persistence hook
  const {
    notes,
    selectedNoteId,
    setSelectedNoteId,
    selectedNote,
    createNote,
    updateNote,
    deleteNote,
    searchQuery: noteSearchQuery,
    setSearchQuery: setNoteSearchQuery,
  } = useNotes();

  const handleCreateNewEntry = async (date?: string, mode?: EntryMode) => {
    setNav("journal");
    if (!date) {
      setJournalViewMode("list");
    }
    const chosenMode = mode || "write";
    setEntryMode(chosenMode);

    if (chosenMode === "write") {
      await createNewEntry(date || todayDate);
    } else if (chosenMode === "dictate-rec") {
      await createNewEntry(date || todayDate, { origin: "dictation" });
    } else if (chosenMode === "talk-conv") {
      await createNewEntry(date || todayDate, { origin: "conversation" });
    }
  };

  const handleSelectEntry = (id: string) => {
    setSelectedId(id);
    if (entryMode !== "write") {
      setEntryMode("write");
    }
  };

  // Global shortcut: ⌘N / Ctrl+N to trigger main CTA
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        if (nav === "notes") {
          createNote();
        } else {
          handleCreateNewEntry(todayDate, "write");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nav, todayDate, createNote]);

  // Second Brain (AI Chat) state
  const [aiHistory, setAiHistory] = useState<{ q: string; a: string }[]>([]);
  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Speech Recognition (Dictation) Toggle
  const toggleDictation = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this environment.");
      return;
    }

    if (dictating) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setDictating(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => setDictating(true);
      recognition.onend = () => setDictating(false);
      recognition.onerror = () => setDictating(false);

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript;
          }
        }
        if (transcript.trim() && selectedEntry) {
          const currentBody = selectedEntry.body || "";
          updateCurrentEntry(
            "body",
            currentBody ? `${currentBody} ${transcript}` : transcript
          );
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error("[SpeechRecognition] Error:", e);
      setDictating(false);
    }
  };

  const handleAiSubmit = (promptOverride?: string) => {
    const q = promptOverride ?? aiQuery;
    if (!q.trim()) return;

    const userQ = q.trim();
    setAiQuery("");
    setAiLoading(true);

    setTimeout(() => {
      let answer = "";
      const lower = userQ.toLowerCase();

      if (lower.includes("recurring") || lower.includes("themes")) {
        answer =
          "Across your diary entries (memory) and notes, the most prominent recurring themes are:\n\n1. Quiet Mornings & Cognitive Boundaries: Protecting your first hour from digital input (captured in your 'Morning Focus' note and your morning coffee diary entries).\n2. Tool Pedagogy & Architecture: How software interfaces quietly shape human thought (detailed in your 'Architecture & Pedagogy' note and your conversation with Marcus).\n3. Sensory Grounding: Daily walks without headphones to enable subconscious synthesis and creative clarity.";
      } else if (
        lower.includes("architecture") ||
        lower.includes("pedagogy") ||
        lower.includes("tool")
      ) {
        answer =
          "In your note 'Architecture & Pedagogy Reading Notes', you noted that 'the interface is never neutral—it is always a silent pedagogy.' In your diary reflection (Conversation with Marcus), you debated whether tools shape thought or get out of the way, concluding that the best tools recede to let depth and reflection take center stage.";
      } else if (lower.includes("energized") || lower.includes("focus")) {
        answer =
          "You felt most energized during your 7-kilometer autumn walk along the arboretum creek (diary memory) and your quiet morning interval with tea by the window. Your note on 'Morning Focus' confirms that blocking 8:30–9:30 AM with zero screen notifications is your highest-yield state for deep creative work.";
      } else if (lower.includes("nature") || lower.includes("walk")) {
        answer =
          "From your diary memories: You frequently record sensory details—wet stone, decaying pine needles, and crisp autumn air along the canal. Your notes complement this by establishing an explicit habit rule: walking 5–7km without headphones every afternoon to give your subconscious mind space to consolidate ideas.";
      } else {
        answer = `Synthesizing across your diary (memory) and notes regarding "${userQ}": You consistently prioritize tactile simplicity, protected morning boundaries, and intentional pacing in both personal reflections and working project notes.`;
      }

      setAiHistory((prev) => [...prev, { q: userQ, a: answer }]);
      setAiLoading(false);
    }, 700);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#fdfcfb] text-[#1c1a18] select-none">
      {/* COLUMN 1 — Nav Sidebar (52px ↔ 200px) */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((o) => !o)}
        nav={nav}
        onSelectNav={(item) => {
          setNav(item);
          if (item === "journal" && entryMode !== "write") {
            setEntryMode("write");
          }
        }}
        activeTag={activeTag}
        onSelectTag={setActiveTag}
        topTags={topTags}
        onOpenFolder={openMarkdownFolder}
      />

      {/* COLUMN 2 — Middle Panel (260px) */}
      {nav === "brain" ? (
        <AiPanel
          onSelectPrompt={(promptText) => {
            setAiQuery(promptText);
            handleAiSubmit(promptText);
          }}
        />
      ) : nav === "notes" ? (
        <NotesPanel
          notes={notes}
          selectedId={selectedNoteId}
          onSelectNote={setSelectedNoteId}
          onCreateNote={createNote}
          searchQuery={noteSearchQuery}
          onSearchChange={setNoteSearchQuery}
        />
      ) : (
        <JournalPanel
          entries={entries}
          selectedId={selectedId}
          todayDate={todayDate}
          onSelectEntry={handleSelectEntry}
          onNewEntry={handleCreateNewEntry}
          onSelectDate={(d) => {
            const matching = entries.find((e) => e.date === d);
            if (matching) {
              handleSelectEntry(matching.id);
            }
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchResults={searchResults}
          isSearching={isSearching}
          onDeleteEntry={deleteEntry}
          viewMode={journalViewMode}
          onViewModeChange={setJournalViewMode}
        />
      )}

      {/* COLUMN 3 — Main Content Area (flex-1) */}
      <main className="flex-1 bg-white flex flex-col h-full overflow-hidden">
        {nav === "brain" ? (
          <AiChatView
            history={aiHistory}
            loading={aiLoading}
            query={aiQuery}
            onQueryChange={setAiQuery}
            onSubmit={handleAiSubmit}
          />
        ) : nav === "notes" ? (
          <NoteEditor
            note={selectedNote}
            onUpdateNote={updateNote}
            onDeleteNote={deleteNote}
            onCreateNote={createNote}
          />
        ) : entryMode === "dictate-rec" || entryMode === "dictate-proc" ? (
          <DictateInline
            phase={entryMode}
            onStopRecording={() => setEntryMode("dictate-proc")}
            onFinishProcessing={(cleanBody, rawTranscript, title) => {
              updateCurrentEntryFields({
                title: title || selectedEntry?.title || "Untitled Dictation",
                body: cleanBody,
                origin: "dictation",
                rawTranscript,
              });
              setEntryMode("write");
            }}
            onCancel={() => setEntryMode("write")}
          />
        ) : entryMode === "talk-conv" || entryMode === "talk-complete" ? (
          <TalkItOut
            initialPhase={entryMode}
            onFinishTalk={(title, body, messages, rawTranscript) => {
              updateCurrentEntryFields({
                title,
                body,
                origin: "conversation",
                conversation: messages,
                rawTranscript,
              });
              setEntryMode("write");
            }}
            onCancel={() => setEntryMode("write")}
          />
        ) : (
          <Editor
            entry={selectedEntry}
            onUpdateEntry={updateCurrentEntry}
            onStartDictateInline={() => setEntryMode("dictate-rec")}
            dictating={dictating}
            onToggleDictation={toggleDictation}
            saveStatus={saveStatus}
            onDeleteEntry={deleteEntry}
            onOpenFolder={openMarkdownFolder}
            onRevealFile={revealMarkdownFile}
            suggestedTags={topTags}
          />
        )}
      </main>
    </div>
  );
}

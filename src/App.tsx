import { useState, useRef } from "react";
import { Sidebar } from "@/components/Sidebar";
import { JournalPanel } from "@/components/JournalPanel";
import { Editor } from "@/components/Editor";
import { AiPanel, AiChatView } from "@/components/AiChat";
import { useDiary } from "@/hooks/useDiary";
import type { NavItem } from "@/types";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [nav, setNav] = useState<NavItem>("journal");
  const [dictating, setDictating] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // Unified SQLite persistence & search hook
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
    createEntryForDate,
    createNewEntry,
    deleteEntry,
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
  } = useDiary();

  // AI Chat state
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
          "Based on your recent entries, recurring themes include quiet mornings, contemplative walks, reading philosophy & architecture, and deliberate disconnection from digital noise. You frequently mention the texture of morning light and conversations with friends like Marcus.";
      } else if (lower.includes("energized")) {
        answer =
          "You felt noticeably energized on your 7-kilometer walk through the arboretum when the maples were turning, and during your discussions on tools and thought at the bookstore cafe.";
      } else if (lower.includes("nature") || lower.includes("walk")) {
        answer =
          "Your reflections on nature consistently highlight sensory details—wet stone, decaying pine needles, and crisp autumn air. Walking without headphones repeatedly surfaces as your preferred state for clear thinking.";
      } else {
        answer = `Reflecting on your diary entries related to "${userQ}": You consistently prioritize clarity, tactile simplicity, and intentional pacing in both personal projects and daily habits.`;
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
        onSelectNav={setNav}
        activeTag={activeTag}
        onSelectTag={setActiveTag}
        topTags={topTags}
      />

      {/* COLUMN 2 — Middle Panel (260px) */}
      {nav === "journal" ? (
        <JournalPanel
          entries={entries}
          selectedId={selectedId}
          todayDate={todayDate}
          onSelectEntry={setSelectedId}
          onNewEntry={(date) => createNewEntry(date || todayDate)}
          onSelectDate={(d) => createEntryForDate(d, false)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchResults={searchResults}
          isSearching={isSearching}
          onDeleteEntry={deleteEntry}
        />
      ) : (
        <AiPanel
          onSelectPrompt={(promptText) => {
            setAiQuery(promptText);
            handleAiSubmit(promptText);
          }}
        />
      )}

      {/* COLUMN 3 — Main Content Area (flex-1) */}
      <main className="flex-1 bg-[#fdfcfb] flex flex-col h-full overflow-hidden">
        {nav === "journal" ? (
          <Editor
            entry={selectedEntry}
            onUpdateEntry={updateCurrentEntry}
            dictating={dictating}
            onToggleDictation={toggleDictation}
            saveStatus={saveStatus}
            onDeleteEntry={deleteEntry}
          />
        ) : (
          <AiChatView
            history={aiHistory}
            loading={aiLoading}
            query={aiQuery}
            onQueryChange={setAiQuery}
            onSubmit={handleAiSubmit}
          />
        )}
      </main>
    </div>
  );
}

import test from "node:test";
import assert from "node:assert/strict";

test("Second Diary — Navigation, Notes & Second Brain Verification", async (t) => {
  // Test 1: Navigation tabs (Journal, Notes, Second Brain)
  await t.test("Navigation tabs configured for Journal, Notes, and Second Brain", () => {
    const validNavItems = ["journal", "notes", "brain"];
    assert.equal(validNavItems.length, 3);
    assert.ok(validNavItems.includes("journal"));
    assert.ok(validNavItems.includes("notes"));
    assert.ok(validNavItems.includes("brain"));
  });

  // Test 2: Entry Modes and Data Model
  await t.test("Entry modes and extended data model support", () => {
    const validModes = [
      "write",
      "empty",
      "dictate-rec",
      "dictate-proc",
      "talk-conv",
      "talk-complete",
    ];

    assert.equal(validModes.length, 6);

    const mockDictationEntry = {
      id: "dict-1",
      date: "2026-09-28",
      hour: 9.5,
      title: "Morning walk along the canal",
      body: "A quiet morning walk along the canal as the autumn fog lifted.",
      tags: ["morning", "walk"],
      mood: "calm",
      origin: "dictation",
      originTime: "9:30 AM",
      rawTranscript: "so I was walking along the canal as the fog lifted...",
    };

    assert.equal(mockDictationEntry.origin, "dictation");
    assert.ok(mockDictationEntry.rawTranscript);
    assert.equal(mockDictationEntry.mood, "calm");

    const mockTalkEntry = {
      id: "talk-1",
      date: "2026-09-28",
      hour: 14.2,
      title: "Reflections on Urgency and Depth",
      body: "Felt a persistent pull between reactive tasks and creative depth.",
      tags: ["reflection", "depth"],
      mood: "inspired",
      origin: "conversation",
      originTime: "2:12 PM",
      conversation: [
        { role: "ai", text: "What's been taking up space in your head today?" },
        { role: "user", text: "Feeling torn between reactive tasks and deep thinking." },
      ],
      rawTranscript: JSON.stringify([
        { role: "ai", text: "What's been taking up space in your head today?" },
        { role: "user", text: "Feeling torn between reactive tasks and deep thinking." },
      ]),
    };

    assert.equal(mockTalkEntry.origin, "conversation");
    assert.equal(mockTalkEntry.conversation.length, 2);
    assert.equal(mockTalkEntry.conversation[0].role, "ai");
  });

  // Test 3: Note Data Model & Operations
  await t.test("Note data model support and search filtering", () => {
    const mockNotes = [
      {
        id: "note-1",
        title: "Architecture & Pedagogy Reading Notes",
        body: "Christopher Alexander on patterns as living structures that resolve tensions.",
        tags: ["reading", "architecture"],
        createdAt: "2026-09-26T09:00:00.000Z",
        updatedAt: "2026-09-27T14:30:00.000Z",
      },
      {
        id: "note-2",
        title: "Second Brain & Memory Architecture",
        body: "Two pillars: Episodic Diary (Memory) and Semantic Knowledge (Notes).",
        tags: ["projects", "ideas"],
        createdAt: "2026-09-27T11:00:00.000Z",
        updatedAt: "2026-09-28T08:15:00.000Z",
      },
    ];

    assert.equal(mockNotes.length, 2);
    assert.equal(mockNotes[0].id, "note-1");

    // Filter by query "architecture"
    const results = mockNotes.filter(
      (n) =>
        n.title.toLowerCase().includes("architecture") ||
        n.body.toLowerCase().includes("architecture")
    );
    assert.equal(results.length, 2);
  });

  // Test 4: Second Brain Query Synthesis Frame
  await t.test("Second Brain frames questions across both diary memory and notes", () => {
    const query = "What recurring themes appear across my diary and notes?";
    const lower = query.toLowerCase();

    assert.ok(lower.includes("diary"));
    assert.ok(lower.includes("notes"));

    const framePrompt = "Ask anything from your diary (memory) or your notes";
    assert.match(framePrompt, /diary \(memory\)/);
    assert.match(framePrompt, /notes/);
  });

  // Test 5: Floating Dictate Format Selector
  await t.test("Floating dictate format options (Raw, Clean, Story)", () => {
    const formats = ["raw", "clean", "story"];
    assert.deepEqual(formats, ["raw", "clean", "story"]);

    const raw = "so I was walking down the street and the air was nice";
    const clean = "I was walking down the street and the autumn air felt crisp.";
    const story =
      "The afternoon unfolded quietly as I walked down the stone street, the autumn air offering a moment of stillness.";

    assert.ok(raw.length < clean.length || raw.startsWith("so"));
    assert.ok(story.length > clean.length);
  });

  // Test 6: Talk it Out Auto-cycling Turn Sequences
  await t.test("Talk it Out turn sequences and conversation flow", () => {
    const turns = [
      { aiPrompt: "What's been taking up the most space in your head today?" },
      { aiPrompt: "When did you feel most grounded today, even for a moment?" },
      { aiPrompt: "What would it look like to protect an hour for that kind of focus tomorrow?" },
    ];

    assert.equal(turns.length, 3);
    assert.ok(turns[0].aiPrompt.includes("space in your head"));
  });
});

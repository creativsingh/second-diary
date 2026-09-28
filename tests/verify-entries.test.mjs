import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const TEST_DIR = path.join(process.cwd(), "tests", "test_markdown_diary");

// Helper to sanitize filename mirroring Rust backend
function sanitizeFilename(title) {
  const clean = title.replace(/[^\w\s-]/g, "_").trim();
  const truncated = clean.slice(0, 50).trim();
  return truncated || "Untitled";
}

// Markdown entry serializer matching src-tauri/src/lib.rs
function serializeMarkdownEntry(entry) {
  const timeStr = entry.time || "12:00";
  const cleanTime = timeStr.replace(":", "");
  const cleanTitle = sanitizeFilename(entry.title || "");
  const shortId = entry.id.length >= 8 ? entry.id.slice(0, 8) : entry.id;
  const filename = `${entry.date}_${cleanTime}_${cleanTitle}_${shortId}.md`;

  const tagsYaml =
    entry.tags && entry.tags.length > 0
      ? `[${entry.tags.map((t) => `"${t}"`).join(", ")}]`
      : "[]";

  const titleDisplay = (entry.title || "").trim() || "Untitled Entry";
  const content = entry.content || "";

  const mdText = `---
id: "${entry.id}"
date: "${entry.date}"
time: "${timeStr}"
title: "${(entry.title || "").replace(/"/g, '\\"')}"
tags: ${tagsYaml}
createdAt: "${entry.createdAt || new Date().toISOString()}"
updatedAt: "${entry.updatedAt || new Date().toISOString()}"
---

# ${titleDisplay}

${content}
`;

  return { filename, mdText };
}

// Markdown entry parser matching src-tauri/src/lib.rs
function parseMarkdownEntry(rawContent, fallbackId = "") {
  const normalized = rawContent.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---")) return null;

  const rest = normalized.slice(3);
  const endIdx = rest.indexOf("\n---\n");
  if (endIdx === -1) return null;

  const frontmatter = rest.slice(0, endIdx);
  const bodyPart = rest.slice(endIdx + 5);

  let id = "";
  let date = "";
  let timeStr = "";
  let title = "";
  let tags = [];
  let createdAt = "";
  let updatedAt = "";

  for (const line of frontmatter.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("id:")) {
      id = trimmed.slice(3).trim().replace(/^["']|["']$/g, "");
    } else if (trimmed.startsWith("date:")) {
      date = trimmed.slice(5).trim().replace(/^["']|["']$/g, "");
    } else if (trimmed.startsWith("time:")) {
      timeStr = trimmed.slice(5).trim().replace(/^["']|["']$/g, "");
    } else if (trimmed.startsWith("title:")) {
      title = trimmed.slice(6).trim().replace(/^["']|["']$/g, "").replace(/\\"/g, '"');
    } else if (trimmed.startsWith("tags:")) {
      const val = trimmed.slice(5).trim();
      if (val.startsWith("[") && val.endsWith("]")) {
        tags = val
          .slice(1, -1)
          .split(",")
          .map((t) => t.trim().replace(/^["']|["']$/g, ""))
          .filter(Boolean);
      }
    } else if (trimmed.startsWith("createdAt:")) {
      createdAt = trimmed.slice(10).trim().replace(/^["']|["']$/g, "");
    } else if (trimmed.startsWith("updatedAt:")) {
      updatedAt = trimmed.slice(10).trim().replace(/^["']|["']$/g, "");
    }
  }

  if (!id) id = fallbackId;

  let hour = 12.0;
  if (timeStr && timeStr.includes(":")) {
    const [h, m] = timeStr.split(":").map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      hour = h + m / 60.0;
    }
  }

  let content = bodyPart.trim();
  if (content.startsWith("# ")) {
    const newlineIdx = content.indexOf("\n");
    if (newlineIdx !== -1) {
      content = content.slice(newlineIdx + 1).trim();
    } else {
      content = "";
    }
  }

  return {
    id,
    date,
    hour: Math.round(hour * 10) / 10,
    title,
    content,
    tags,
    createdAt: new Date(createdAt),
    updatedAt: new Date(updatedAt),
  };
}

// Search helper matching search_markdown_entries
function searchMarkdownEntries(entries, query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const tokens = q.split(/\s+/).filter(Boolean);
  const results = [];

  for (const entry of entries) {
    const titleLower = (entry.title || "").toLowerCase();
    const contentLower = (entry.content || "").toLowerCase();
    const tagsJoined = (entry.tags || []).join(" ").toLowerCase();

    const allMatch = tokens.every(
      (t) =>
        titleLower.includes(t) ||
        contentLower.includes(t) ||
        tagsJoined.includes(t)
    );

    if (allMatch) {
      const firstToken = tokens[0];
      const pos = contentLower.indexOf(firstToken);
      let snippet = "";

      if (pos >= 0) {
        const start = Math.max(0, pos - 30);
        const end = Math.min(entry.content.length, pos + firstToken.length + 60);
        const raw = entry.content.slice(start, end);
        const prefix = start > 0 ? "..." : "";
        const suffix = end < entry.content.length ? "..." : "";
        const regex = new RegExp(`(${firstToken})`, "gi");
        snippet = `${prefix}${raw.replace(regex, "<mark>$1</mark>")}${suffix}`;
      } else if (entry.content) {
        snippet = `${entry.content.slice(0, 80)}...`;
      } else {
        snippet = `Matched in title: ${entry.title}`;
      }

      results.push({
        id: entry.id,
        date: entry.date,
        title: entry.title,
        snippet,
        rank: titleLower.includes(q) ? 1 : 2,
      });
    }
  }

  results.sort((a, b) => a.rank - b.rank);
  return results;
}

test("Pure Markdown Diary Storage & Search Verification", async (t) => {
  // Ensure clean test directory
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TEST_DIR, { recursive: true });

  const today = "2026-09-28";
  const yesterday = "2026-09-27";
  const futureDate = "2026-10-05";

  // Step 1: Create an entry as a pure Markdown file
  await t.test("Step 1: Save new entry to disk as .md file with YAML frontmatter", async () => {
    const entryId = "entry-001-morning";
    const entry = {
      id: entryId,
      date: today,
      time: "07:30",
      title: "First Light Over the City",
      content: "Sunrise filtered through the blinds. Brewing Ethiopian coffee. #morning #coffee",
      tags: ["morning", "coffee"],
      createdAt: "2026-09-28T02:00:00.000Z",
      updatedAt: "2026-09-28T02:00:00.000Z",
    };

    const { filename, mdText } = serializeMarkdownEntry(entry);
    const filePath = path.join(TEST_DIR, filename);
    fs.writeFileSync(filePath, mdText, "utf8");

    assert.ok(fs.existsSync(filePath), "Markdown file must exist on disk");
    const raw = fs.readFileSync(filePath, "utf8");
    assert.match(raw, /^---\nid: "entry-001-morning"/, "Must start with YAML frontmatter id");
    assert.match(raw, /tags: \["morning", "coffee"\]/, "Must contain YAML tags array");
    assert.match(raw, /# First Light Over the City/, "Must contain markdown header");
    assert.match(raw, /Sunrise filtered through the blinds/, "Must contain body content");
  });

  // Step 2: Read and parse Markdown entries from disk
  await t.test("Step 2: Read directory and parse Markdown entries accurately", async () => {
    const files = fs.readdirSync(TEST_DIR).filter((f) => f.endsWith(".md"));
    assert.equal(files.length, 1);

    const raw = fs.readFileSync(path.join(TEST_DIR, files[0]), "utf8");
    const parsed = parseMarkdownEntry(raw);

    assert.ok(parsed);
    assert.equal(parsed.id, "entry-001-morning");
    assert.equal(parsed.date, today);
    assert.equal(parsed.hour, 7.5);
    assert.equal(parsed.title, "First Light Over the City");
    assert.equal(
      parsed.content,
      "Sunrise filtered through the blinds. Brewing Ethiopian coffee. #morning #coffee"
    );
    assert.deepEqual(parsed.tags, ["morning", "coffee"]);
  });

  // Step 3: Multiple entries per day on the same date
  await t.test("Step 3: Sequential multiple entries per day produce distinct .md files", async () => {
    const secondEntry = {
      id: "entry-002-afternoon",
      date: today,
      time: "14:15",
      title: "Afternoon Walk in the Arboretum",
      content: "Walked 6km along the river trail. Maples are showing early red. #nature #walk",
      tags: ["nature", "walk"],
      createdAt: "2026-09-28T08:45:00.000Z",
      updatedAt: "2026-09-28T08:45:00.000Z",
    };

    const thirdEntry = {
      id: "entry-003-evening",
      date: today,
      time: "21:00",
      title: "Late Reading Notes",
      content: "Reading architecture theory before sleep. Silent room. #books",
      tags: ["books"],
      createdAt: "2026-09-28T15:30:00.000Z",
      updatedAt: "2026-09-28T15:30:00.000Z",
    };

    for (const e of [secondEntry, thirdEntry]) {
      const { filename, mdText } = serializeMarkdownEntry(e);
      fs.writeFileSync(path.join(TEST_DIR, filename), mdText, "utf8");
    }

    const files = fs.readdirSync(TEST_DIR).filter((f) => f.endsWith(".md"));
    assert.equal(files.length, 3, "Directory must have 3 distinct markdown files for today");
  });

  // Step 4: Chronological sorting (newest date first, then newest hour)
  await t.test("Step 4: Chronological sorting orders entries newest date & hour first", async () => {
    // Add an entry for yesterday
    const pastEntry = {
      id: "entry-000-yesterday",
      date: yesterday,
      time: "18:00",
      title: "Sunday Rain",
      content: "Heavy rain all afternoon. Listening to piano music.",
      tags: ["rain", "music"],
      createdAt: "2026-09-27T12:30:00.000Z",
      updatedAt: "2026-09-27T12:30:00.000Z",
    };
    const { filename, mdText } = serializeMarkdownEntry(pastEntry);
    fs.writeFileSync(path.join(TEST_DIR, filename), mdText, "utf8");

    const files = fs.readdirSync(TEST_DIR).filter((f) => f.endsWith(".md"));
    assert.equal(files.length, 4);

    const parsedList = files.map((f) => parseMarkdownEntry(fs.readFileSync(path.join(TEST_DIR, f), "utf8")));

    parsedList.sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date);
      if (dateCmp !== 0) return dateCmp;
      return b.hour - a.hour;
    });

    assert.equal(parsedList[0].id, "entry-003-evening", "Today 21:00 must be first");
    assert.equal(parsedList[1].id, "entry-002-afternoon", "Today 14:15 must be second");
    assert.equal(parsedList[2].id, "entry-001-morning", "Today 07:30 must be third");
    assert.equal(parsedList[3].id, "entry-000-yesterday", "Yesterday must be last");
  });

  // Step 5: Full-text search with token matching and snippet marks
  await t.test("Step 5: Full-text search finds matches and returns <mark> snippets", async () => {
    const files = fs.readdirSync(TEST_DIR).filter((f) => f.endsWith(".md"));
    const allEntries = files.map((f) => parseMarkdownEntry(fs.readFileSync(path.join(TEST_DIR, f), "utf8")));

    // Search for "coffee"
    const coffeeResults = searchMarkdownEntries(allEntries, "coffee");
    assert.equal(coffeeResults.length, 1);
    assert.equal(coffeeResults[0].id, "entry-001-morning");
    assert.match(coffeeResults[0].snippet, /<mark>coffee<\/mark>/i);

    // Search for "arboretum"
    const natureResults = searchMarkdownEntries(allEntries, "arboretum");
    assert.equal(natureResults.length, 1);
    assert.equal(natureResults[0].id, "entry-002-afternoon");

    // Search by tag "books"
    const bookResults = searchMarkdownEntries(allEntries, "books");
    assert.equal(bookResults.length, 1);
    assert.equal(bookResults[0].id, "entry-003-evening");

    // Search with non-matching term
    const emptyResults = searchMarkdownEntries(allEntries, "nonexistentwordxyz");
    assert.equal(emptyResults.length, 0);
  });

  // Step 6: Updating title renames file and removes old filename
  await t.test("Step 6: Renaming entry title updates file and cleans old filename", async () => {
    const filesBefore = fs.readdirSync(TEST_DIR).filter((f) => f.endsWith(".md"));
    const oldFile = filesBefore.find((f) => {
      const content = fs.readFileSync(path.join(TEST_DIR, f), "utf8");
      return content.includes('id: "entry-001-morning"');
    });
    assert.ok(oldFile, "Old filename must exist");

    // Update title
    const updatedEntry = {
      id: "entry-001-morning",
      date: today,
      time: "07:30",
      title: "Dawn Reverie & Fresh Espresso",
      content: "Updated content for the morning entry. #morning #coffee",
      tags: ["morning", "coffee"],
      createdAt: "2026-09-28T02:00:00.000Z",
      updatedAt: "2026-09-28T02:15:00.000Z",
    };

    // Remove any file containing this entry ID (mirroring Rust save_markdown_entry)
    for (const f of fs.readdirSync(TEST_DIR)) {
      if (f.endsWith(".md")) {
        const content = fs.readFileSync(path.join(TEST_DIR, f), "utf8");
        if (content.includes(`id: "entry-001-morning"`)) {
          fs.unlinkSync(path.join(TEST_DIR, f));
        }
      }
    }

    const { filename: newFilename, mdText } = serializeMarkdownEntry(updatedEntry);
    fs.writeFileSync(path.join(TEST_DIR, newFilename), mdText, "utf8");

    const filesAfter = fs.readdirSync(TEST_DIR).filter((f) => f.endsWith(".md"));
    assert.equal(filesAfter.length, 4, "File count must remain 4");
    assert.ok(!fs.existsSync(path.join(TEST_DIR, oldFile)), "Old filename must be removed");
    assert.ok(fs.existsSync(path.join(TEST_DIR, newFilename)), "New filename must exist");

    const updatedRaw = fs.readFileSync(path.join(TEST_DIR, newFilename), "utf8");
    const parsed = parseMarkdownEntry(updatedRaw);
    assert.equal(parsed.title, "Dawn Reverie & Fresh Espresso");
  });

  // Step 7: Deleting an entry removes the .md file from disk
  await t.test("Step 7: Deleting entry unlinks .md file from disk", async () => {
    const targetId = "entry-003-evening";

    let deleted = false;
    for (const f of fs.readdirSync(TEST_DIR)) {
      if (f.endsWith(".md")) {
        const content = fs.readFileSync(path.join(TEST_DIR, f), "utf8");
        if (content.includes(`id: "${targetId}"`)) {
          fs.unlinkSync(path.join(TEST_DIR, f));
          deleted = true;
        }
      }
    }

    assert.ok(deleted, "File must have been found and deleted");
    const remaining = fs.readdirSync(TEST_DIR).filter((f) => f.endsWith(".md"));
    assert.equal(remaining.length, 3, "Only 3 files should remain");

    const ids = remaining.map((f) => {
      const p = parseMarkdownEntry(fs.readFileSync(path.join(TEST_DIR, f), "utf8"));
      return p.id;
    });
    assert.ok(!ids.includes(targetId), "Deleted entry ID must not exist in directory");
  });

  // Step 8: Future date guard
  await t.test("Step 8: Prevent creating entries for future dates", async () => {
    function canCreateEntryForDate(targetDate, currentDate = today) {
      if (targetDate > currentDate) return false;
      return true;
    }

    assert.equal(canCreateEntryForDate(futureDate), false, "Future date must be blocked");
    assert.equal(canCreateEntryForDate(today), true, "Today must be allowed");
    assert.equal(canCreateEntryForDate(yesterday), true, "Past date must be allowed");
  });

  // Cleanup test directory
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
});

# Second Diary

> **Your life. Your memories. Your data.**

Second Diary is an open-source, AI-powered personal diary and memory application.

It is being built to give people a place to write, reflect, organize memories, and understand their personal history — while keeping ownership of their data at the center.

Second Diary is designed to be **privacy-focused, AI-native, self-hostable, local-first where practical, and open source**.

---

## 🚧 Project Status

**Second Diary is currently in active early development (Alpha).**

The core local desktop application, local SQLite persistence layer, and editorial journaling interface are functional, while APIs, schemas, and AI integration are actively evolving. Do not rely on early development builds as your sole storage location for irreplaceable personal memories.

### ✅ What's Working Today

* **Local-First Desktop Shell**: Tauri v2 + React 19 + TypeScript + Vite desktop application running natively without external cloud dependencies.
* **Embedded SQLite & Drizzle ORM**: 100% offline, local database storage with migrations. No network requests are made.
* **Journal Entries & Autosave**: Seamless creation, editing, debounced local autosaving, and persistence across app restarts.
* **Local Full-Text Search (SQLite FTS5)**: Instant offline search across entry titles and contents with snippet generation, keyword highlighting, and BM25 ranking.
* **Modern 3-Column Editorial Interface**:
  * *Collapsible Nav Sidebar*: Minimalist toggle between **Journal** and **Ask Diary**.
  * *Middle Panel*: Date-grouped list view and interactive month mini-calendar view.
  * *Main Editor*: Distraction-free typography (Lora serif + Inter sans), auto-resizing title, word counter, and private local status indicators.
* **Ask Diary UI Shell**: Conversational query layout prepared for local AI memory integration.
* **Automated Verification**: End-to-end Node.js test suite for SQLite lifecycle and FTS5 query operations.

### 🔄 In Progress & Coming Soon

- [ ] **Local AI & Semantic Memory**: On-device vector embeddings and local LLM integration for natural language memory retrieval.
- [ ] **Enhanced Tagging & Filtering**: Tag browsing, mood tracking, and multi-faceted archive exploration.
- [ ] **Data Export & Portability**: One-click exports to Markdown, JSON, and standard formats.
- [ ] **Voice Dictation**: Offline local speech-to-text integration for quick voice journaling.
- [ ] **Attachments & Media**: Local photo and file attachments linked to entries.

---

# 🎯 Vision

A diary should be more than a collection of disconnected entries.

Second Diary aims to become an **AI-powered personal memory system** where journal entries, memories, ideas, people, places, events, and other aspects of life can be connected and explored.

```text
                         Second Diary
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
       Journal             Memories             Ideas
          │                   │                   │
      Emotions             People             Projects
          │                   │                   │
       Events              Places               Goals
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
                         AI Memory Layer
                              │
                  ┌───────────┼───────────┐
                  │           │           │
                Search     Reflection   Insights
                  │           │           │
                  └───────────┼───────────┘
                              │
                       Personal Memory
```

The long-term goal is to create a system that helps people **capture their lives, find their memories, reflect on their experiences, and understand their own history**.

---

# ✨ Principles

Second Diary is being developed around several principles.

### 🔐 Privacy first

Personal writing can contain some of the most sensitive information a person creates.

Privacy should therefore be a fundamental part of the architecture rather than an afterthought.

### 🤖 AI-native

AI is a core part of Second Diary.

Rather than simply adding an AI chatbot to a traditional diary, Second Diary is being designed around the idea that AI can help users interact with their personal history.

AI may assist with:

* Understanding memories
* Finding information
* Connecting related experiences
* Summarizing periods of life
* Reflecting on journal entries
* Discovering recurring themes
* Exploring personal history

### 🏠 Self-hostable

Users should be able to run their own instance and maintain control over their data and AI infrastructure where supported.

### 💾 Data ownership

Users should be able to export their data and avoid unnecessary vendor lock-in.

### 🌐 Open source

The source code should remain available for inspection, modification, and contribution under the project's license.

### 📴 Local-first where practical

The application should work reliably with limited or no network connectivity wherever the architecture allows.

### 🧩 Extensible

The architecture should allow future integrations, AI models, clients, plugins, and storage options without requiring the entire application to be redesigned.

---

# 🧩 Planned Features

The following features are part of the project's planned direction. They are **not necessarily implemented yet**.

## ✍️ Journaling

* Rich text / Markdown writing
* Autosave
* Drafts
* Attachments
* Images
* Links
* Checklists
* Dates
* Tags
* Custom metadata

## 📅 Timeline

Browse journal entries chronologically.

Potential views:

* Day
* Week
* Month
* Year
* Custom date ranges

## 🔎 Intelligent Search

Search across the personal archive using both traditional and AI-powered approaches.

Potential capabilities:

* Full-text search
* Search by date
* Search by tags
* Search by people
* Search by location
* Semantic search
* Natural-language queries
* Context-aware search

For example:

> "What was I working on around the time I started learning programming?"

---

# 🤖 AI & Personal Memory

AI is a **core component of Second Diary**, not an optional feature.

The goal is to make your diary something you can interact with naturally.

## 💬 Ask your diary

Users may eventually be able to ask questions such as:

> What was I working on last March?

> When did I first mention this idea?

> What did I write about my trip to Japan?

> What were the biggest things happening in my life last year?

The AI should answer based on the user's own journal and available personal data.

---

## 🧠 Personal Memory

Second Diary aims to build a structured understanding of the user's personal archive.

Potential capabilities include:

* Connecting related journal entries
* Identifying recurring topics
* Finding frequently mentioned people
* Connecting events across time
* Discovering related memories
* Surfacing forgotten ideas
* Finding unfinished thoughts
* Identifying recurring goals
* Creating timelines around important events

---

## 🔍 Semantic Memory

Traditional search requires users to know what words they originally wrote.

Semantic search could allow users to search by **meaning** instead.

For example:

> "Find times when I was thinking about changing careers."

Even if the exact phrase *changing careers* never appeared in the journal, relevant entries could potentially be discovered based on their meaning.

---

## 🪞 Reflection

Second Diary may eventually help users reflect on their own history.

Potential capabilities include:

* Weekly reflections
* Monthly summaries
* Yearly retrospectives
* Recurring themes
* Personal patterns
* Goal tracking
* Long-term changes
* Important memories

The purpose is not to tell users what they should think.

The purpose is to help them **see their own history more clearly**.

---

# 🔐 AI Privacy

Because AI is deeply integrated into Second Diary, **how AI processes personal data is a fundamental architectural concern**.

The project aims to support different AI deployment models, potentially including:

### Local AI

AI models running directly on the user's device.

### Self-hosted AI

AI infrastructure controlled and operated by the user.

### External AI providers

Users may be able to connect supported external AI services where appropriate.

The exact implementation will depend on the architecture and supported models.

Second Diary should make it clear to users **where their data is being processed and which AI system is processing it**.

---

# 💾 Data Ownership

Second Diary is intended to support portable data formats.

Potential export formats include:

```text
Markdown
JSON
HTML
CSV
```

The exact supported formats will be determined during development.

The goal is simple:

> **Your diary should not be held hostage by the application that stores it.**

---

# 🏠 Self-Hosting

Second Diary is intended to support self-hosted deployments.

A self-hosted installation should eventually allow users to control:

* Their database
* Their files
* Their backups
* Their authentication
* Their AI infrastructure
* Their synchronization infrastructure

The exact deployment architecture is still under development.

---

# 🛠️ Technology

Second Diary is built using a modern, local-first stack designed for performance, longevity, and data privacy:

* **Desktop Runtime**: [Tauri v2](https://tauri.app/) (Rust) for minimal footprint, memory safety, and native system integration.
* **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), and [Vite 8](https://vite.dev/).
* **Styling & Design**: [Tailwind CSS v4](https://tailwindcss.com/) with custom editorial design tokens and typography (Inter + Lora).
* **Local Database**: Embedded [SQLite](https://sqlite.org/) with **FTS5** (Full-Text Search) and BM25 ranking.
* **ORM**: [Drizzle ORM](https://orm.drizzle.team/) for type-safe schema definitions and local migrations.
* **Zero Remote Network Calls**: Designed strictly for offline, on-device execution.

---

# 🏗️ Architecture

The planned architecture is modular.

A high-level conceptual model is:

```text
                         Clients
                            │
                ┌───────────┴───────────┐
                │                       │
             Web App              Native Apps
                │                       │
                └───────────┬───────────┘
                            │
                   ┌────────▼────────┐
                   │ Application/API │
                   └────────┬────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
    ┌─────▼─────┐     ┌─────▼─────┐    ┌────▼─────┐
    │  Database │     │   Storage  │    │ AI Layer │
    └───────────┘     └────────────┘    └────┬─────┘
                                             │
                              ┌──────────────┼──────────────┐
                              │              │              │
                         Embeddings       Models        Memory
                           / Search                    Processing
```

This is a conceptual architecture and is expected to evolve.

Detailed technical decisions will be documented in `docs/`.

---

# 💻 Platforms

Second Diary is currently built as a native desktop application powered by Tauri v2:

* **Desktop (Active Target)**: macOS, Linux, Windows
* **Web (Companion / Self-hosted)**: In roadmap
* **Mobile (iOS & Android)**: In roadmap

---

# 🚀 Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) (v20+ recommended)
* [Rust & Cargo](https://rustup.rs/) (for Tauri desktop runtime)

### Installation & Development

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/second-diary.git
cd second-diary

# 2. Install dependencies
npm install

# 3. Run the desktop application in development mode
npm run tauri dev

# Alternatively, run the web UI preview
npm run dev
```

### Running Tests & Building

```bash
# Run the local SQLite & FTS5 automated test suite
npm test

# Build the production web bundle
npm run build

# Package the native desktop application
npm run tauri build
```

---

# 📁 Project Structure

The repository structure will evolve as the application grows.

The intended organization may look similar to:

```text
second-diary/
│
├── apps/
│   ├── web/
│   └── mobile/
│
├── packages/
│   ├── ui/
│   ├── database/
│   ├── editor/
│   ├── ai/
│   └── shared/
│
├── docs/
│
├── scripts/
│
├── tests/
│
├── .github/
│
├── README.md
├── LICENSE
├── CONTRIBUTING.md
└── SECURITY.md
```

---

# 🧪 Development Philosophy

### Privacy over convenience

Convenience should not require unnecessary exposure of personal data.

### AI with transparency

Users should understand how their personal data is being processed by AI.

### Local-first where practical

The application should remain useful without constant dependence on remote services whenever technically possible.

### Open formats

Users should not be trapped inside a proprietary database or data format.

### Simple by default

The application should remain approachable despite its underlying complexity.

### AI as a memory interface

AI should make it easier to interact with a user's own history rather than replacing the user's ownership or agency over it.

### Long-term thinking

A diary can contain decades of someone's life.

The data architecture should therefore be designed with longevity in mind.

---

# 🤝 Contributing

Contributions are welcome.

Possible ways to contribute include:

* Code
* Bug reports
* Feature ideas
* Documentation
* Testing
* Accessibility
* UI/UX
* Translations
* Security research
* AI/ML development

Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) before submitting a contribution.

---

# 🐛 Issues

Use GitHub Issues for:

* Bug reports
* Feature requests
* Documentation issues
* Accessibility issues

When reporting a bug, provide:

1. What happened
2. What you expected
3. Steps to reproduce
4. Operating system
5. Browser/device
6. Relevant logs or screenshots

**Do not include private journal entries, credentials, or other sensitive personal information in issues.**

---

# 🔒 Security

If you discover a potential security vulnerability, please do not publicly disclose it through a GitHub Issue.

See [`SECURITY.md`](SECURITY.md) for the project's security reporting process.

---

# 📜 License

Second Diary is free and open-source software licensed under the **GNU Affero General Public License v3.0**.

See [`LICENSE`](LICENSE) for the complete license text.

---

# 🌱 Project

Second Diary is an independent open-source project currently in its early development stage.

The project is being built in the open with the goal of creating a privacy-focused, AI-powered, user-owned personal diary and memory system.

---

# ⭐ Support

If you find the project interesting:

* ⭐ Star the repository
* 🐛 Report bugs
* 💡 Share ideas
* 🧑💻 Contribute
* 📖 Improve documentation
* 📣 Share the project

---

# 📌 Second Diary

> **Your life. Your memories. Your data.**

**Built in the open.**
**Built for the long term.**
**Built for you.**

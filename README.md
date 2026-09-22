# Second Diary

> **Your life. Your memories. Your data.**

Second Diary is an open-source, AI-powered personal diary and memory application.

It is being built to give people a place to write, reflect, organize memories, and understand their personal history — while keeping ownership of their data at the center.

Second Diary is designed to be **privacy-focused, AI-native, self-hostable, local-first where practical, and open source**.

---

## 🚧 Project Status

**Second Diary is currently in early development.**

The project is not yet ready for production use.

The architecture, APIs, database schema, AI systems, and user experience may change significantly during development.

Do not use early development versions as the only storage location for important or irreplaceable personal data.

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

The technology stack is currently being established.

The project prioritizes technologies that are:

* Free to use
* Open source
* Self-hostable
* Well maintained
* Widely supported
* Suitable for long-term development

The final stack and architecture will be documented as implementation progresses.

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

Development will initially focus on the **web application**.

Future platforms may include:

* Web
* macOS
* Windows
* Linux
* iOS
* Android

Platform priorities may change as development progresses.

---

# 🚀 Getting Started

Second Diary is currently under active development.

Detailed installation instructions will be added once the initial development environment and application architecture are established.

For now:

```bash
git clone https://github.com/YOUR_USERNAME/second-diary.git
cd second-diary
```

> Installation and development commands will be documented here as the project reaches a usable development state.

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

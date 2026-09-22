import {
  BookMarked,
  ShieldCheck,
  Cpu,
  Database,
  Mic,
  FolderLock,
  HardDrive,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-neutral-100 selection:bg-neutral-800">
      {/* Top Window Drag Area / Header */}
      <header
        data-tauri-drag-region
        className="flex h-12 items-center justify-between border-b border-neutral-800/80 px-4 select-none bg-neutral-900/40 backdrop-blur"
      >
        <div className="flex items-center gap-2">
          <BookMarked className="size-4 text-emerald-400" />
          <span className="text-xs font-semibold tracking-wider text-neutral-300 uppercase">
            Second Diary
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-neutral-400">
          <span className="size-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
          <span>Local Storage Active</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <div className="max-w-2xl space-y-8">
          {/* Logo Badge */}
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900 shadow-xl shadow-black/40">
            <FolderLock className="size-8 text-emerald-400" />
          </div>

          {/* Title & Description */}
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl text-neutral-100">
              Your Thoughts. 100% Yours.
            </h1>
            <p className="text-base text-neutral-400 leading-relaxed max-w-lg mx-auto">
              Second Diary is an open-source, local-first personal journal.
              No cloud tracking, no mandatory backend, and no third-party data access.
            </p>
          </div>

          {/* Core Architectural Pillars */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-left pt-2">
            <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/50 p-4 transition-colors hover:border-neutral-700">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-neutral-800/80 text-emerald-400">
                  <Database className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-neutral-200">Local SQLite & Drizzle</h3>
                  <p className="text-xs text-neutral-400">Encrypted on-device database storage</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/50 p-4 transition-colors hover:border-neutral-700">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-neutral-800/80 text-blue-400">
                  <Cpu className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-neutral-200">Local AI with Ollama</h3>
                  <p className="text-xs text-neutral-400">Private insights without sending data to servers</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/50 p-4 transition-colors hover:border-neutral-700">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-neutral-800/80 text-amber-400">
                  <Mic className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-neutral-200">Local Speech-to-Text</h3>
                  <p className="text-xs text-neutral-400">Whisper transcription on Apple Silicon</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/50 p-4 transition-colors hover:border-neutral-700">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-neutral-800/80 text-purple-400">
                  <ShieldCheck className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-neutral-200">No Paid APIs or Lock-in</h3>
                  <p className="text-xs text-neutral-400">Open source with optional BYOK cloud AI</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              className="w-full sm:w-auto bg-neutral-100 text-neutral-900 hover:bg-neutral-200 font-medium px-5 cursor-default"
            >
              <HardDrive className="size-4 mr-1.5" />
              Project Ready for Features
            </Button>
            <span className="text-xs text-neutral-500 font-mono">
              Tauri 2 • React • TypeScript • Vite • Tailwind • SQLite
            </span>
          </div>
        </div>
      </main>

      {/* Footer Status Bar */}
      <footer className="flex h-8 items-center justify-between border-t border-neutral-900 px-4 text-[11px] text-neutral-500 select-none">
        <div className="flex items-center gap-2">
          <span>Second Diary v0.1.0</span>
          <span>•</span>
          <span>Zero Telemetry</span>
        </div>
        <div>macOS Desktop Build</div>
      </footer>
    </div>
  );
}

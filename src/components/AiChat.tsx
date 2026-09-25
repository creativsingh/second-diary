import { Ic } from "@/components/Icons";

interface AiMessage {
  q: string;
  a: string;
}

interface AiPanelProps {
  onSelectPrompt: (prompt: string) => void;
}

export function AiPanel({ onSelectPrompt }: AiPanelProps) {
  const PRESET_PROMPTS = [
    "What recurring themes appear in my writing?",
    "When did I feel most energized recently?",
    "Summarize my thoughts on nature and walks",
  ];

  return (
    <div className="w-[260px] h-full bg-white border-r border-[#ece9e4] flex flex-col shrink-0 px-4 pt-5 pb-3 select-none">
      <div className="mb-4">
        <h2 className="text-[13px] font-semibold text-[#1c1a18]">
          Ask your diary
        </h2>
        <p className="text-[11px] text-[#b5afa7] mt-0.5">
          Search memories with AI
        </p>
      </div>

      <div className="text-[11px] text-[#b5afa7] mb-2 font-medium">
        Try asking:
      </div>

      <div className="space-y-2">
        {PRESET_PROMPTS.map((promptText, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelectPrompt(promptText)}
            className="w-full text-left text-[11px] text-[#7c6f5b] bg-[#f7f5f2] rounded-lg px-3 py-2 hover:bg-[#ece9e4] leading-relaxed transition-colors cursor-pointer"
          >
            &ldquo;{promptText}&rdquo;
          </button>
        ))}
      </div>
    </div>
  );
}

interface AiChatViewProps {
  history: AiMessage[];
  loading: boolean;
  query: string;
  onQueryChange: (q: string) => void;
  onSubmit: (prompt?: string) => void;
}

export function AiChatView({
  history,
  loading,
  query,
  onQueryChange,
  onSubmit,
}: AiChatViewProps) {
  return (
    <div className="flex flex-1 flex-col h-full overflow-hidden bg-[#fdfcfb]">
      {history.length === 0 ? (
        /* Empty State */
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center max-w-sm mx-auto select-none">
          <div className="w-12 h-12 rounded-2xl bg-[#e8f4f0] flex items-center justify-center text-[#4a9e87] mb-4 shadow-sm">
            <Ic.sparkle />
          </div>
          <h2 className="text-[18px] font-semibold text-[#1c1a18] font-serif mb-1.5">
            Ask your diary anything
          </h2>
          <p className="text-[13px] text-[#b5afa7] leading-relaxed">
            Discover patterns, retrieve forgotten thoughts, and explore personal
            reflections.
          </p>
        </div>
      ) : (
        /* Message Thread */
        <div className="flex-1 overflow-y-auto px-6 py-6 max-w-lg mx-auto w-full space-y-6">
          {history.map((item, idx) => (
            <div key={idx} className="space-y-4">
              {/* User message */}
              <div className="flex justify-end">
                <div className="bg-[#1c1a18] text-white text-[13px] rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%] leading-relaxed shadow-sm">
                  {item.q}
                </div>
              </div>

              {/* AI response */}
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#e8f4f0] text-[#4a9e87] flex items-center justify-center shrink-0 mt-0.5">
                  <Ic.sparkle />
                </div>
                <div className="bg-white border border-[#ece9e4] rounded-2xl rounded-tl-sm px-4 py-3 text-[13px] text-[#4a4540] shadow-[0_1px_4px_rgba(0,0,0,0.04)] leading-relaxed max-w-[85%]">
                  {item.a}
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#e8f4f0] text-[#4a9e87] flex items-center justify-center shrink-0 mt-0.5">
                <Ic.sparkle />
              </div>
              <div className="bg-white border border-[#ece9e4] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4a9e87] animate-bounce" />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#4a9e87] animate-bounce"
                  style={{ animationDelay: "0.15s" }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#4a9e87] animate-bounce"
                  style={{ animationDelay: "0.3s" }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Input Bar */}
      <div className="px-10 pb-8 shrink-0">
        <div className="max-w-lg mx-auto border border-[#ece9e4] rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex items-end gap-3 px-4 py-3">
          <textarea
            rows={1}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit();
              }
            }}
            placeholder="What do you want to know about your diary?"
            className="text-[13px] text-[#1c1a18] placeholder:text-[#c0bbb4] leading-relaxed flex-1 outline-none border-none bg-transparent resize-none max-h-24"
          />
          <button
            type="button"
            disabled={!query.trim() || loading}
            onClick={() => onSubmit()}
            className={`w-8 h-8 rounded-xl bg-[#1c1a18] text-white flex items-center justify-center shrink-0 transition-opacity cursor-pointer shadow-xs ${
              !query.trim() || loading
                ? "opacity-30 cursor-not-allowed"
                : "hover:bg-[#3a3530]"
            }`}
            title="Send query"
          >
            <Ic.send />
          </button>
        </div>
      </div>
    </div>
  );
}

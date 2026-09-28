import { useState, useEffect, useRef } from "react";
import { Ic } from "@/components/Icons";

interface FloatingDictateModalProps {
  onAppendToBody: (text: string) => void;
}

type FormatOption = "raw" | "clean" | "story";

const MOCK_SNIPPETS = {
  raw: "so I was thinking earlier today about how we structure our mornings and honestly if you don't carve out that first hour it just gets eaten up by small tasks and notifications",
  clean: "I've been thinking about the structure of my mornings. If I don't intentionally protect the first hour, it quickly gets consumed by small tasks and notifications.",
  story: "The morning has a fragile quiet that disappears the moment notifications intrude. Looking back on today, protecting that initial hour before work begins felt less like a luxury and more like a quiet necessity for clear thought.",
};

export function FloatingDictateModal({ onAppendToBody }: FloatingDictateModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [phase, setPhase] = useState<"recording" | "processing">("recording");
  const [format, setFormat] = useState<FormatOption>("clean");
  const [seconds, setSeconds] = useState(0);
  const [transcriptProgress, setTranscriptProgress] = useState(0);
  const wordsRef = useRef<string[]>([]);

  useEffect(() => {
    wordsRef.current = MOCK_SNIPPETS.raw.split(" ");
  }, []);

  // Timer while recording
  useEffect(() => {
    if (!isOpen || phase !== "recording") return;
    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, phase]);

  // Word-by-word streaming live transcript
  useEffect(() => {
    if (!isOpen || phase !== "recording") return;
    const interval = setInterval(() => {
      setTranscriptProgress((p) => Math.min(p + 1, wordsRef.current.length));
    }, 300);
    return () => clearInterval(interval);
  }, [isOpen, phase]);

  const handleOpen = () => {
    setIsOpen(true);
    setPhase("recording");
    setSeconds(0);
    setTranscriptProgress(1);
    setFormat("clean");
  };

  const handleClose = () => {
    setIsOpen(false);
    setPhase("recording");
  };

  const handleStopAndProcess = () => {
    setPhase("processing");
  };

  const handleAdd = () => {
    const textToAdd = MOCK_SNIPPETS[format];
    onAppendToBody(textToAdd);
    handleClose();
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const currentTranscript = wordsRef.current.slice(0, transcriptProgress).join(" ");

  if (!isOpen) {
    return (
      <div className="fixed bottom-[40px] right-[32px] z-50 select-none">
        <button
          type="button"
          onClick={handleOpen}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#1c1a18] text-white text-[13px] font-medium shadow-[0_4px_16px_rgba(0,0,0,0.18)] hover:bg-[#3a3530] transition-all cursor-pointer hover:scale-105 active:scale-95"
          title="Dictate to entry"
        >
          <Ic.mic />
          <span>Dictate</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-[40px] right-[32px] z-50 w-[320px] bg-white rounded-2xl border border-[#ece9e4] shadow-[0_12px_40px_rgba(0,0,0,0.14)] p-4 select-none animate-expand-float">
      {phase === "recording" ? (
        <div className="space-y-3.5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[12px] font-semibold text-[#1c1a18]">
                Dictating…
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-[#8c867e]">
                {formatTimer(seconds)}
              </span>
              <button
                type="button"
                onClick={handleClose}
                className="text-[#9c9690] hover:text-[#1c1a18] p-1 rounded-md hover:bg-[#f7f5f2] transition-colors cursor-pointer"
                title="Close"
              >
                <Ic.x />
              </button>
            </div>
          </div>

          {/* Pulsing Orb (48px) */}
          <div className="relative flex items-center justify-center py-2">
            <div className="absolute w-20 h-20 rounded-full bg-[#1c1a18]/15 animate-pulse-ring pointer-events-none" />
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#1c1a18] to-[#7c6f5b] text-white flex items-center justify-center shadow-md animate-breathe z-10">
              <Ic.mic />
            </div>
          </div>

          {/* Live transcript text (scrollable, 11px, muted) */}
          <div className="h-16 overflow-y-auto bg-[#faf9f7] rounded-xl p-2.5 border border-[#ece9e4]/70 text-[11px] text-[#4a4540] italic leading-relaxed">
            {currentTranscript || "Listening for speech…"}
            <span className="inline-block w-1 h-3 bg-[#7c6f5b] ml-0.5 animate-pulse" />
          </div>

          {/* Format selector: three pills — Raw | Clean | Story (default: Clean) */}
          <div className="flex items-center justify-between bg-[#f7f5f2] p-1 rounded-lg">
            {(["raw", "clean", "story"] as FormatOption[]).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setFormat(fmt)}
                className={`flex-1 py-1 rounded-md text-[11px] font-medium capitalize transition-all cursor-pointer ${
                  format === fmt
                    ? "bg-white text-[#1c1a18] shadow-xs"
                    : "text-[#9c9690] hover:text-[#1c1a18]"
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>

          {/* Stop & Process button */}
          <button
            type="button"
            onClick={handleStopAndProcess}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#1c1a18] text-white text-[12px] font-medium hover:bg-[#3a3530] transition-colors cursor-pointer shadow-xs active:scale-98"
          >
            <Ic.stop />
            <span>Stop & Process</span>
          </button>
        </div>
      ) : (
        /* Processing phase */
        <div className="py-3 text-center space-y-4">
          <div className="flex items-center justify-center gap-1.5 pt-2">
            <span className="w-2 h-2 rounded-full bg-[#1c1a18] animate-bounce" />
            <span
              className="w-2 h-2 rounded-full bg-[#1c1a18] animate-bounce"
              style={{ animationDelay: "0.15s" }}
            />
            <span
              className="w-2 h-2 rounded-full bg-[#1c1a18] animate-bounce"
              style={{ animationDelay: "0.3s" }}
            />
          </div>

          <div>
            <div className="text-[13px] font-medium text-[#1c1a18] font-serif">
              Turning your words into a diary entry…
            </div>
            <div className="text-[11px] text-[#9c9690] mt-1 capitalize">
              Formatted as {format}
            </div>
          </div>

          {/* Preview of text to add */}
          <div className="bg-[#faf9f7] rounded-xl p-2.5 border border-[#ece9e4]/70 text-[11px] text-[#4a4540] text-left max-h-20 overflow-y-auto leading-relaxed">
            &ldquo;{MOCK_SNIPPETS[format]}&rdquo;
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2 rounded-xl border border-[#ece9e4] text-[#8c867e] hover:text-[#1c1a18] text-[12px] font-medium hover:bg-[#f7f5f2] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              className="flex-1 py-2 rounded-xl bg-[#1c1a18] text-white text-[12px] font-medium hover:bg-[#3a3530] transition-colors cursor-pointer shadow-xs"
            >
              Add to entry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { Ic } from "@/components/Icons";

interface DictateInlineProps {
  phase: "dictate-rec" | "dictate-proc";
  onStopRecording: (rawTranscript: string) => void;
  onFinishProcessing: (cleanBody: string, rawTranscript: string, title?: string) => void;
  onCancel: () => void;
}

const MOCK_WORDS = (
  "Today felt different from the very start. I walked down toward the canal just as the morning fog was lifting. " +
  "The autumn air was crisp, and the stillness cut through the usual mental noise. " +
  "I realized how important it is to protect these quiet intervals before looking at screens or checking messages. " +
  "Walking without headphones is quickly becoming my most essential daily anchor."
).split(" ");

export function DictateInline({
  phase,
  onStopRecording,
  onFinishProcessing,
  onCancel,
}: DictateInlineProps) {
  const [seconds, setSeconds] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const rawTranscriptRef = useRef("");

  // Timer interval for recording
  useEffect(() => {
    if (phase !== "dictate-rec") return;
    const timer = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  // Word-by-word live mock transcript (350ms interval)
  useEffect(() => {
    if (phase !== "dictate-rec") return;
    const interval = setInterval(() => {
      setWordIndex((prev) => {
        const next = (prev + 1) % MOCK_WORDS.length;
        rawTranscriptRef.current = MOCK_WORDS.slice(0, next + 1).join(" ");
        return next;
      });
    }, 350);
    return () => clearInterval(interval);
  }, [phase]);

  // Auto-resolve processing after 2 seconds
  useEffect(() => {
    if (phase !== "dictate-proc") return;
    const timer = setTimeout(() => {
      const raw =
        rawTranscriptRef.current ||
        "Today felt different from the start. I walked down toward the canal just as the morning fog was lifting. The autumn air was crisp, and the stillness cut through the usual mental noise.";
      const clean =
        "A morning walk along the canal as the autumn fog lifted. The cold air provided a welcome break from digital noise, reinforcing the value of quiet time before opening screens. Walking in silence has quickly become an essential ritual.";
      const title = "Morning walk along the canal";
      onFinishProcessing(clean, raw, title);
    }, 2000);
    return () => clearTimeout(timer);
  }, [phase, onFinishProcessing]);

  const currentTranscript = MOCK_WORDS.slice(0, wordIndex + 1).join(" ");

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#fdfcfb] h-full select-none relative animate-in fade-in duration-200">
      {/* Cancel button in top right */}
      <button
        type="button"
        onClick={onCancel}
        className="absolute top-6 right-8 text-[12px] text-[#9c9690] hover:text-[#1c1a18] px-3 py-1.5 rounded-lg hover:bg-[#f7f5f2] transition-colors cursor-pointer"
      >
        Cancel
      </button>

      {phase === "dictate-rec" ? (
        <div className="flex flex-col items-center max-w-lg w-full text-center">
          {/* Pulsing Orb with Pulse Ring */}
          <div className="relative flex items-center justify-center mb-8">
            {/* Pulse ring animation behind orb (1.4s) */}
            <div className="absolute w-36 h-36 rounded-full bg-gradient-to-tr from-[#1c1a18]/25 to-[#7c6f5b]/20 animate-pulse-ring pointer-events-none" />
            <div className="absolute w-28 h-28 rounded-full bg-[#1c1a18]/10 animate-ping pointer-events-none opacity-40" />

            {/* Pulsing orb (breathe keyframe, 3s) */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1c1a18] via-[#2f2b27] to-[#7c6f5b] text-white flex items-center justify-center shadow-lg animate-breathe z-10">
              <span className="scale-125">
                <Ic.mic />
              </span>
            </div>
          </div>

          {/* Timer counter (seconds) below orb */}
          <div className="font-mono text-[14px] text-[#8c867e] mb-5 tracking-wider">
            {formatTimer(seconds)}
          </div>

          {/* Live mock transcript below orb */}
          <div className="min-h-[90px] px-6 py-4 rounded-2xl bg-[#faf9f7] border border-[#ece9e4] mb-8 w-full flex items-center justify-center">
            <p className="text-[15px] font-serif italic text-[#3a3530] leading-relaxed transition-all duration-150">
              &ldquo;{currentTranscript}&rdquo;
              <span className="inline-block w-1.5 h-3.5 bg-[#7c6f5b] ml-1 animate-pulse align-middle" />
            </p>
          </div>

          {/* Stop recording button */}
          <button
            type="button"
            onClick={() => onStopRecording(rawTranscriptRef.current || currentTranscript)}
            className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#1c1a18] text-white text-[13px] font-medium hover:bg-[#3a3530] transition-all cursor-pointer shadow-md active:scale-95"
          >
            <Ic.stop />
            <span>Stop recording</span>
          </button>
        </div>
      ) : (
        /* Processing Phase */
        <div className="flex flex-col items-center max-w-sm w-full text-center">
          {/* Spinner animation */}
          <div className="w-14 h-14 rounded-full border-2 border-[#ece9e4] border-t-[#1c1a18] animate-spin mb-6" />

          <h3 className="font-serif text-[18px] font-medium text-[#1c1a18] mb-2">
            Turning your voice into words…
          </h3>
          <p className="text-[13px] text-[#9c9690] leading-relaxed">
            Polishing grammar, removing filler words, and shaping your diary prose.
          </p>
        </div>
      )}
    </div>
  );
}

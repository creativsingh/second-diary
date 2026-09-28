import { useState, useEffect, useRef } from "react";
import { Ic } from "@/components/Icons";

interface ConversationMessage {
  role: "ai" | "user";
  text: string;
}

interface TalkItOutProps {
  initialPhase?: "talk-conv" | "talk-complete";
  onFinishTalk: (
    title: string,
    body: string,
    messages: ConversationMessage[],
    rawTranscript: string
  ) => void;
  onCancel: () => void;
}

const CONVERSATION_TURNS = [
  {
    aiPrompt: "What's been taking up the most space in your head today?",
    userResponse:
      "I've been feeling torn between getting through an endless list of reactive tasks and wanting space to think deeply about what actually matters.",
  },
  {
    aiPrompt:
      "That friction between urgency and depth is so familiar. When did you feel most grounded today, even for a moment?",
    userResponse:
      "Late morning, when I sat by the window with a cup of tea and sketched out ideas on paper without looking at my screen.",
  },
  {
    aiPrompt:
      "That quiet sketch sounds like a genuine anchor. What would it look like to protect an hour for that kind of focus tomorrow?",
    userResponse:
      "I think I need to block out 9:00 to 10:00 AM completely—no notifications or email, just uninterrupted creative reflection.",
  },
];

export function TalkItOut({ initialPhase = "talk-conv", onFinishTalk, onCancel }: TalkItOutProps) {
  const [scene, setScene] = useState<"talk-conv" | "talk-complete">(initialPhase);
  const [cycleState, setCycleState] = useState<"idle" | "listening" | "responding" | "pause">(
    "idle"
  );
  const [turnIndex, setTurnIndex] = useState(0);
  const [messages, setMessages] = useState<ConversationMessage[]>([
    { role: "ai", text: CONVERSATION_TURNS[0].aiPrompt },
  ]);
  const [liveTranscript, setLiveTranscript] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, liveTranscript, cycleState]);

  // Handle Cycling
  useEffect(() => {
    if (scene !== "talk-conv") return;

    if (cycleState === "listening") {
      const turn = CONVERSATION_TURNS[turnIndex];
      const words = turn.userResponse.split(" ");
      let wordIdx = 0;
      setLiveTranscript(words[0]);

      // Stream words over 2.6s
      const wordInterval = setInterval(() => {
        wordIdx++;
        if (wordIdx < words.length) {
          setLiveTranscript(words.slice(0, wordIdx + 1).join(" "));
        }
      }, Math.max(80, Math.floor(2600 / words.length)));

      const listeningTimer = setTimeout(() => {
        clearInterval(wordInterval);
        // Commit user response
        setMessages((prev) => [...prev, { role: "user", text: turn.userResponse }]);
        setLiveTranscript("");
        setCycleState("responding");
      }, 2600);

      return () => {
        clearInterval(wordInterval);
        clearTimeout(listeningTimer);
      };
    }

    if (cycleState === "responding") {
      // 1.4s AI typing indicator before posting response
      const respondingTimer = setTimeout(() => {
        const nextTurn = turnIndex + 1;
        if (nextTurn < CONVERSATION_TURNS.length) {
          setMessages((prev) => [
            ...prev,
            { role: "ai", text: CONVERSATION_TURNS[nextTurn].aiPrompt },
          ]);
          setTurnIndex(nextTurn);
          setCycleState("pause");
        } else {
          // Exhausted turns -> transition to talk-complete
          setScene("talk-complete");
        }
      }, 1400);

      return () => clearTimeout(respondingTimer);
    }

    if (cycleState === "pause") {
      // 1.1s brief pause before auto re-entering listening
      const pauseTimer = setTimeout(() => {
        setCycleState("listening");
      }, 1100);

      return () => clearTimeout(pauseTimer);
    }
  }, [cycleState, scene, turnIndex]);

  const handleStartSpeaking = () => {
    setCycleState("listening");
  };

  const handleEndConversation = () => {
    if (liveTranscript) {
      setMessages((prev) => [...prev, { role: "user", text: liveTranscript }]);
      setLiveTranscript("");
    }
    setScene("talk-complete");
  };

  const handleCreateEntry = () => {
    const title = "Reflections on Urgency, Depth & Morning Boundaries";
    const diaryProse =
      "Felt a persistent pull between reactive daily tasks and the need for deeper creative thought today. " +
      "The most grounded moment came late morning—sitting by the window with hot tea, sketching on paper without screen distraction. " +
      "Decided to establish a protected hour tomorrow from 9:00 to 10:00 AM with all notifications muted, preserving quiet focus before the day's noise begins.";
    const rawTranscript = JSON.stringify(messages, null, 2);
    onFinishTalk(title, diaryProse, messages, rawTranscript);
  };

  if (scene === "talk-complete") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#fdfcfb] h-full select-none text-center relative animate-in fade-in duration-200">
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-6 right-8 text-[12px] text-[#9c9690] hover:text-[#1c1a18] px-3 py-1.5 rounded-lg hover:bg-[#f7f5f2] transition-colors cursor-pointer"
        >
          Close
        </button>

        <div className="max-w-md w-full flex flex-col items-center pb-8">
          {/* Small gradient orb */}
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#1c1a18] via-[#7c6f5b] to-[#4a9e87] flex items-center justify-center text-white shadow-md mb-6 animate-breathe">
            <Ic.sparkle />
          </div>

          <h2 className="font-serif text-[22px] font-medium text-[#1c1a18] mb-2">
            Conversation complete
          </h2>
          <p className="text-[13px] text-[#9c9690] mb-8">
            I think we uncovered a few things worth keeping.
          </p>

          {/* Primary CTA */}
          <button
            type="button"
            onClick={handleCreateEntry}
            className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-2xl bg-[#1c1a18] text-white text-[13px] font-medium hover:bg-[#3a3530] transition-all cursor-pointer shadow-md hover:scale-[1.01] active:scale-[0.99] mb-4"
          >
            <span>✨ Create diary entry</span>
          </button>

          {/* Secondary links */}
          <div className="flex items-center gap-6 text-[12px] text-[#7c6f5b]">
            <button
              type="button"
              onClick={() => {
                setScene("talk-conv");
                setCycleState("idle");
              }}
              className="hover:text-[#1c1a18] hover:underline cursor-pointer"
            >
              View conversation
            </button>
            <span className="text-[#ece9e4]">·</span>
            <button
              type="button"
              onClick={() => {
                setScene("talk-conv");
                setCycleState("listening");
              }}
              className="hover:text-[#1c1a18] hover:underline cursor-pointer"
            >
              Continue talking
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Conversation Scene (talk-conv)
  const isListening = cycleState === "listening";
  const isResponding = cycleState === "responding";

  const companionLabel = isListening
    ? "Listening to you…"
    : isResponding
    ? "Thinking…"
    : "Private Diary / Here to listen";

  return (
    <div className="flex flex-1 flex-col h-full overflow-hidden bg-[#fdfcfb] select-none">
      {/* AI Companion Header */}
      <div className="px-8 py-4 border-b border-[#ece9e4] flex items-center justify-between shrink-0 bg-white/60 backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-7 h-7">
            {isListening && (
              <div className="absolute inset-0 rounded-full bg-[#4a9e87]/30 animate-pulse-ring" />
            )}
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] shadow-xs ${
                isListening
                  ? "bg-[#4a9e87] animate-breathe"
                  : isResponding
                  ? "bg-[#7c6f5b] animate-pulse"
                  : "bg-gradient-to-tr from-[#1c1a18] to-[#7c6f5b]"
              }`}
            >
              <Ic.sparkle />
            </div>
          </div>
          <div>
            <div className="text-[12px] font-semibold text-[#1c1a18] tracking-tight">
              {companionLabel}
            </div>
            <div className="text-[10px] text-[#b5afa7]">AI-guided reflection</div>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="text-[12px] text-[#9c9690] hover:text-[#1c1a18] px-2.5 py-1 rounded-md hover:bg-[#f0ece8] transition-colors cursor-pointer"
        >
          Exit
        </button>
      </div>

      {/* Messages Stream: Clean editorial list, max-w-lg */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-lg mx-auto space-y-6">
          {messages.map((msg, index) => {
            if (msg.role === "ai") {
              return (
                <div key={index} className="space-y-1.5 animate-in fade-in duration-200">
                  <div className="text-[10px] uppercase font-semibold text-[#7c6f5b] tracking-wider font-sans">
                    PRIVATE DIARY
                  </div>
                  <div className="font-serif text-[16px] text-[#1c1a18] leading-[1.7]">
                    &ldquo;{msg.text}&rdquo;
                  </div>
                </div>
              );
            } else {
              return (
                <div
                  key={index}
                  className="pl-4 border-l-2 border-[#ece9e4] text-[15px] font-sans text-[#4a4540] leading-[1.7] my-3 animate-in fade-in duration-200"
                >
                  {msg.text}
                </div>
              );
            }
          })}

          {/* Live Transcript Bubble during listening */}
          {isListening && liveTranscript && (
            <div className="pl-4 border-l-2 border-[#ece9e4] text-[15px] font-sans italic text-[#8c867e] leading-[1.7] opacity-80 animate-in fade-in duration-100">
              {liveTranscript}…
            </div>
          )}

          {/* AI Typing Indicator during responding */}
          {isResponding && (
            <div className="flex items-center gap-1.5 pt-2 text-[#7c6f5b]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7c6f5b] animate-dot-bounce" />
              <span
                className="w-1.5 h-1.5 rounded-full bg-[#7c6f5b] animate-dot-bounce"
                style={{ animationDelay: "0.15s" }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-[#7c6f5b] animate-dot-bounce"
                style={{ animationDelay: "0.3s" }}
              />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="px-8 py-5 border-t border-[#ece9e4] bg-white shrink-0">
        <div className="max-w-lg mx-auto">
          {cycleState === "idle" ? (
            /* Idle (before first tap) */
            <button
              type="button"
              onClick={handleStartSpeaking}
              className="w-full py-3.5 px-4 rounded-xl border border-[#ece9e4] bg-[#faf9f7] hover:bg-[#f0ece8] text-[#1c1a18] text-[13px] font-medium flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-99"
            >
              <span>🎙</span>
              <span>Tap to start speaking</span>
            </button>
          ) : (
            /* Cycling state: status label with pulsing dot + End conversation link */
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2 text-[12px] font-medium text-[#4a4540]">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isListening ? "bg-[#4a9e87] animate-ping" : "bg-[#7c6f5b]"
                  }`}
                />
                <span>{isListening ? "Listening…" : "Responding…"}</span>
              </div>
              <button
                type="button"
                onClick={handleEndConversation}
                className="text-[12px] text-[#8c867e] hover:text-[#1c1a18] font-medium hover:underline cursor-pointer"
              >
                End conversation
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { Ic } from "@/components/Icons";

interface AddTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTags: string[];
  onSaveTags: (tags: string[]) => void;
  suggestedTags?: string[];
}

export function AddTagModal({
  isOpen,
  onClose,
  initialTags,
  onSaveTags,
  suggestedTags = [],
}: AddTagModalProps) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setTags(initialTags);
      setInputValue("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, initialTags]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanTag = (text: string): string => {
    return text
      .trim()
      .replace(/^#+/, "")
      .replace(/[^\w-]/g, "-")
      .replace(/-+/g, "-")
      .toLowerCase();
  };

  const addTagTokens = (tokens: string[]) => {
    const cleaned = tokens
      .map(cleanTag)
      .filter((t) => t.length > 0 && !tags.includes(t));
    if (cleaned.length > 0) {
      setTags((prev) => [...prev, ...cleaned]);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (inputValue.trim()) {
        const parts = inputValue.split(/[, ]+/);
        addTagTokens(parts);
        setInputValue("");
      }
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      e.preventDefault();
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteText = e.clipboardData.getData("text");
    const parts = pasteText.split(/[, \n\t]+/);
    addTagTokens(parts);
  };

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleSave = () => {
    // Also include any leftover text in input if present
    let finalTags = [...tags];
    if (inputValue.trim()) {
      const parts = inputValue.split(/[, ]+/).map(cleanTag).filter((t) => t.length > 0 && !finalTags.includes(t));
      finalTags = [...finalTags, ...parts];
    }
    onSaveTags(finalTags);
    onClose();
  };

  const availableSuggestions = suggestedTags.filter(
    (st) => !tags.includes(st.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-[#ece9e4] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 text-[#1c1a18]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-tags-title"
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-[#ece9e4] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#f7f5f2] border border-[#ece9e4] flex items-center justify-center text-[#7c6f5b]">
              <Ic.tag />
            </div>
            <div>
              <h2 id="add-tags-title" className="text-[14px] font-semibold text-[#1c1a18]">
                Add & Manage Tags
              </h2>
              <p className="text-[11px] text-[#9c9690]">
                Add multiple tags in one go using commas, spaces, or Enter
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[#9c9690] hover:text-[#1c1a18] hover:bg-[#f7f5f2] transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <Ic.x />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4">
          {/* Tag Container / Pill Input */}
          <div>
            <label className="block text-[11px] font-medium text-[#4a4540] uppercase tracking-wider mb-2">
              Entry Tags
            </label>
            <div
              onClick={() => inputRef.current?.focus()}
              className="min-h-[96px] p-2.5 rounded-xl border border-[#ece9e4] bg-[#fdfcfb] focus-within:border-[#7c6f5b] focus-within:bg-white transition-all flex flex-wrap gap-1.5 items-start cursor-text"
            >
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#f0ece8] text-[#7c6f5b] group"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTag(tag);
                    }}
                    className="text-[#9c9690] hover:text-red-500 rounded-full transition-colors cursor-pointer"
                    title={`Remove #${tag}`}
                  >
                    <Ic.x />
                  </button>
                </span>
              ))}

              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleInputKeyDown}
                onPaste={handlePaste}
                placeholder={
                  tags.length === 0
                    ? "Type tags (e.g. morning, ideas, travel) and press Enter…"
                    : "Add more tags…"
                }
                className="flex-1 min-w-[140px] text-[12px] text-[#1c1a18] placeholder:text-[#c0bbb4] outline-none border-none bg-transparent py-1 px-1"
              />
            </div>
            <p className="text-[11px] text-[#b5afa7] mt-1.5">
              Separate tags with a <kbd className="px-1 py-0.5 bg-[#f7f5f2] border border-[#ece9e4] rounded text-[10px]">Comma</kbd>, <kbd className="px-1 py-0.5 bg-[#f7f5f2] border border-[#ece9e4] rounded text-[10px]">Space</kbd>, or <kbd className="px-1 py-0.5 bg-[#f7f5f2] border border-[#ece9e4] rounded text-[10px]">Enter</kbd>
            </p>
          </div>

          {/* Quick Add Suggestions */}
          {availableSuggestions.length > 0 && (
            <div>
              <span className="block text-[11px] font-medium text-[#8c867e] mb-1.5">
                Suggested from your Diary
              </span>
              <div className="flex flex-wrap gap-1.5">
                {availableSuggestions.slice(0, 6).map((suggested) => (
                  <button
                    key={suggested}
                    type="button"
                    onClick={() => addTagTokens([suggested])}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-[#f7f5f2] text-[#8c867e] hover:text-[#1c1a18] hover:bg-[#ece9e4] transition-colors cursor-pointer border border-[#ece9e4]"
                  >
                    <span className="text-[#b5afa7]">+</span>
                    <span>#{suggested}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-[#fcfbfa] border-t border-[#ece9e4] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-[12px] font-medium text-[#8c867e] hover:text-[#1c1a18] hover:bg-[#f0ece8] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg text-[12px] font-medium bg-[#1c1a18] text-white hover:bg-[#3a3530] transition-colors cursor-pointer shadow-xs"
          >
            Save Tags
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef } from "react";
import { Ic } from "@/components/Icons";

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  entryTitle?: string;
  entryDate?: string;
}

export function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  entryTitle,
  entryDate,
}: DeleteModalProps) {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  // Focus cancel button on open for safety against accidental enter
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => cancelBtnRef.current?.focus(), 50);
    }
  }, [isOpen]);

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

  const displayTitle = entryTitle?.trim() || "Untitled Entry";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-[#ece9e4] w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-150 text-[#1c1a18]"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <div className="p-6">
          <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">
            <Ic.alert />
          </div>

          <h2
            id="delete-dialog-title"
            className="text-[15px] font-semibold text-[#1c1a18] mb-1.5"
          >
            Delete diary entry?
          </h2>

          <p
            id="delete-dialog-description"
            className="text-[12px] text-[#706a64] leading-relaxed mb-1"
          >
            Are you sure you want to permanently delete{" "}
            <span className="font-medium text-[#1c1a18]">"{displayTitle}"</span>
            {entryDate && <span> from {entryDate}</span>}?
          </p>

          <p className="text-[11px] text-[#a39c94] mt-2">
            This will remove the entry from your SQLite database and delete its corresponding Markdown (.md) file from Finder. This action cannot be undone.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-[#fcfbfa] border-t border-[#ece9e4] flex items-center justify-end gap-2">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-[12px] font-medium text-[#706a64] hover:text-[#1c1a18] hover:bg-[#f0ece8] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-medium bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer shadow-xs"
          >
            <Ic.trash />
            <span>Delete Entry</span>
          </button>
        </div>
      </div>
    </div>
  );
}

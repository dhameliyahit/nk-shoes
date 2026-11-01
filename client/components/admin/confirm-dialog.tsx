import React from "react";
import { RiAlertLine, RiCloseLine } from "react-icons/ri";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  confirmLabel?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText,
  confirmLabel,
  cancelText = "Cancel",
  isDestructive = true,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const finalConfirmText = confirmLabel || confirmText || "Confirm";
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 transition-opacity"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative bg-white w-full max-w-md border-2 border-[#111111] p-6 shadow-2xl z-10 font-sans"
      >
        <div className="flex items-start justify-between pb-3 border-b border-[#ECEFF1]">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 flex items-center justify-center shrink-0 ${
                isDestructive ? "bg-[#FEF2F2] text-[#B91C1C]" : "bg-[#F3F4F6] text-[#111111]"
              }`}
            >
              <RiAlertLine className="text-lg" />
            </div>
            <h3 className="text-base font-extrabold text-[#111111] uppercase tracking-wide">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="text-[#6B7280] hover:text-black cursor-pointer p-1"
          >
            <RiCloseLine className="text-xl" />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-[#4B5563] mt-4 leading-relaxed">
          {message}
        </p>

        <div className="mt-6 pt-4 border-t border-[#ECEFF1] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#374151] hover:bg-[#F3F4F6] border border-[#D1D5DB] transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2 text-xs font-bold uppercase tracking-wider text-white transition-all cursor-pointer ${
              isDestructive
                ? "bg-[#B91C1C] hover:bg-[#991B1B]"
                : "bg-[#111111] hover:bg-black"
            } disabled:opacity-50`}
          >
            {isLoading ? "Processing..." : finalConfirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;

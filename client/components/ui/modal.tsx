"use client";

import React, { useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { RiCloseLine } from "react-icons/ri";
import { cn } from "@/lib/utils";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  showCloseButton?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
  maxWidth = "3xl",
  showCloseButton = true,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !mounted) return null;

  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
  }[maxWidth];

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      {/* BACKDROP */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity duration-200 nk-fade-in"
      />

      {/* MODAL CONTAINER */}
      <div
        className={cn(
          "relative z-10 w-full bg-white shadow-2xl border border-black/10 overflow-hidden my-auto transition-transform duration-200 nk-modal-scale max-h-[92vh] flex flex-col font-sans",
          maxWidthClass,
          className
        )}
      >
        {/* HEADER BAR */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#f0f0f0] shrink-0 bg-white">
          <h3
            id="modal-title"
            className="text-xs font-bold tracking-[0.14em] text-[#777777] uppercase"
          >
            {title || "Quick Preview"}
          </h3>

          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#111111] hover:bg-[#f4f4f4] transition-colors cursor-pointer"
            >
              <RiCloseLine className="text-xl" />
            </button>
          )}
        </div>

        {/* MODAL BODY */}
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

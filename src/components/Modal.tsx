"use client";

import { useEffect, useRef } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pb-[env(safe-area-inset-bottom)]">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[min(92dvh,900px)] overflow-y-auto overscroll-contain"
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 shrink-0">
          <h2
            id="modal-title"
            className="text-lg sm:text-xl font-bold font-headline text-on-background pr-2"
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

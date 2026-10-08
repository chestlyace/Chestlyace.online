"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

// A native <dialog> for the comments' sign-in and confirmations (design.md §13.23,
// §13.36): focus is trapped and returns to the control that opened it, Escape
// closes it. Render it only while it is open.
export function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) ref.current?.close();
      }}
      className="confirm-dialog m-auto w-[min(30rem,calc(100vw-2rem))] rounded-xl border-0 bg-surface-raised p-6 text-foreground shadow-float-lifted"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <h2 id={titleId} className="text-h3">
          {title}
        </h2>
        <button
          type="button"
          aria-label="Close"
          onClick={() => ref.current?.close()}
          className="-mt-1 -mr-2 grid size-10 place-items-center rounded-full text-foreground transition-colors duration-150 hover:bg-tile"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>
      {children}
    </dialog>
  );
}

"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { IconButton } from "@/components/shared/IconButton";

// The frame of the DEV dialogs (design.md §13.49, §13.23's frame, wide): a native
// <dialog>, so focus is trapped and returns to where it was, and Escape closes.
// Render it only while it is open; it shows itself when it mounts.
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
      className="confirm-dialog m-auto max-h-[calc(100dvh-2rem)] w-[min(42rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border-0 bg-surface-raised p-6 text-foreground shadow-float-lifted"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <h2 id={titleId} className="text-h3">
          {title}
        </h2>
        <IconButton
          label="Close"
          iconKey="close"
          onClick={() => ref.current?.close()}
          className="-mt-2 -mr-2"
        >
          <X className="size-5" />
        </IconButton>
      </div>
      {children}
    </dialog>
  );
}

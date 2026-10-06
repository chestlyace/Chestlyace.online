"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Button } from "@/components/shared/Button";

type Ask = {
  title: string;
  text: string;
  confirmLabel: string;
  /** `destructive` for deleting, `primary` for discarding changes. */
  tone?: "destructive" | "primary";
};

const ConfirmContext = createContext<(ask: Ask) => Promise<boolean>>(
  async () => false,
);

export const useConfirm = () => useContext(ConfirmContext);

// "Delete this?", "Leave without saving?" (design.md §13.23): a native <dialog>,
// so focus is trapped and returns to where it was, and Escape cancels. Cancel
// has focus first. `await confirm({…})` answers true or false.
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const resolver = useRef<((answer: boolean) => void) | null>(null);
  const [ask, setAsk] = useState<Ask | null>(null);
  const titleId = useId();
  const textId = useId();

  const confirm = useCallback((request: Ask) => {
    setAsk(request);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  useEffect(() => {
    if (ask && dialog.current && !dialog.current.open)
      dialog.current.showModal();
  }, [ask]);

  const settle = (answer: boolean) => {
    resolver.current?.(answer);
    resolver.current = null;
    dialog.current?.close();
  };

  const value = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        aria-describedby={textId}
        onClose={() => {
          // Escape or the browser closing it counts as "no".
          resolver.current?.(false);
          resolver.current = null;
          setAsk(null);
        }}
        onClick={(event) => {
          if (event.target === dialog.current) settle(false);
        }}
        className="confirm-dialog m-auto w-[min(27.5rem,calc(100vw-2rem))] rounded-xl border-0 bg-surface-raised p-6 text-foreground shadow-float-lifted"
      >
        {ask && (
          <>
            <h2 id={titleId} className="text-h3">
              {ask.title}
            </h2>
            <p id={textId} className="mt-2 text-body text-muted">
              {ask.text}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="secondary"
                magnetic={false}
                autoFocus
                onClick={() => settle(false)}
              >
                Cancel
              </Button>
              <Button
                variant={ask.tone ?? "destructive"}
                magnetic={false}
                onClick={() => settle(true)}
              >
                {ask.confirmLabel}
              </Button>
            </div>
          </>
        )}
      </dialog>
    </ConfirmContext.Provider>
  );
}

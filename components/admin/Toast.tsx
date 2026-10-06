"use client";

import { CircleAlert, CircleCheck, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { IconButton } from "@/components/shared/IconButton";
import { EASE_OUT } from "@/lib/motion";

type ToastItem = { id: number; tone: "success" | "error"; message: string };
type Toasts = {
  success: (message: string) => void;
  error: (message: string) => void;
};

const ToastContext = createContext<Toasts>({
  success: () => {},
  error: () => {},
});

export const useToast = () => useContext(ToastContext);

const MAX = 3;
const SUCCESS_MS = 4000;

// Short feedback after an action (design.md §13.24): bottom-centre; successes
// last 4 seconds, errors stay until dismissed; hovering or focusing a toast
// pauses its timer; at most three show.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const next = useRef(1);
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    window.clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const arm = useCallback(
    (id: number) => {
      window.clearTimeout(timers.current.get(id));
      timers.current.set(
        id,
        window.setTimeout(() => dismiss(id), SUCCESS_MS),
      );
    },
    [dismiss],
  );

  const push = useCallback(
    (tone: ToastItem["tone"], message: string) => {
      const id = next.current++;
      setItems((current) => [...current, { id, tone, message }].slice(-MAX));
      if (tone === "success") arm(id);
    },
    [arm],
  );

  const api = useMemo<Toasts>(
    () => ({
      success: (message) => push("success", message),
      error: (message) => push("error", message),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 lg:bottom-24">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              role={item.tone === "error" ? "alert" : "status"}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
              onPointerEnter={() => {
                window.clearTimeout(timers.current.get(item.id));
              }}
              onPointerLeave={() => item.tone === "success" && arm(item.id)}
              onFocus={() => window.clearTimeout(timers.current.get(item.id))}
              onBlur={() => item.tone === "success" && arm(item.id)}
              className="material pointer-events-auto flex max-w-[26.25rem] items-center gap-3 rounded-lg border border-border/60 py-3 pr-4 pl-4 shadow-float"
            >
              {item.tone === "success" ? (
                <CircleCheck
                  className="size-5 shrink-0 text-secondary"
                  aria-hidden="true"
                />
              ) : (
                <CircleAlert
                  className="size-5 shrink-0 text-danger"
                  aria-hidden="true"
                />
              )}
              <p className="text-body text-foreground">{item.message}</p>
              {item.tone === "error" && (
                <IconButton
                  label="Dismiss"
                  iconKey="x"
                  onClick={() => dismiss(item.id)}
                  className="-mr-2 size-8"
                >
                  <X className="size-4" />
                </IconButton>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

type Guard = {
  /** Does the screen being edited have unsaved changes? */
  isDirty: () => boolean;
  /** The visitor chose to leave: stop asking. */
  clear: () => void;
  /** Used by the editor. */
  set: (dirty: boolean) => void;
};

const GuardContext = createContext<Guard | null>(null);

// Whether the screen being edited has unsaved changes. A ref, not state: links
// in the sidebar only need to read it when clicked.
export function UnsavedProvider({ children }: { children: ReactNode }) {
  const dirty = useRef(false);
  const guard = useMemo<Guard>(
    () => ({
      isDirty: () => dirty.current,
      clear: () => {
        dirty.current = false;
      },
      set: (value) => {
        dirty.current = value;
      },
    }),
    [],
  );
  return (
    <GuardContext.Provider value={guard}>{children}</GuardContext.Provider>
  );
}

export function useUnsavedGuard() {
  return useContext(GuardContext);
}

// An editor calls this with whether it has changes: the browser warns before
// the tab closes or the page reloads, and the shell's links ask first.
export function useUnsavedChanges(dirty: boolean) {
  const guard = useContext(GuardContext);

  useEffect(() => {
    guard?.set(dirty);
    return () => guard?.set(false);
  }, [dirty, guard]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
}

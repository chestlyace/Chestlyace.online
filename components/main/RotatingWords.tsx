"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { usePrefersReducedMotion } from "@/lib/media";

const INTERVAL_MS = 2800;
const LEAVE_MS = 500;
const STAGGER_MS = 30;

type WordState = "active" | "leaving" | "idle";

// The hero's outlined line (design.md §14.1, step 2): every 2.8s the current
// word's letters roll up out of the clip and the next word's roll in from below,
// 30ms apart. Pauses while the tab is hidden, the hero is off-screen, or the
// pointer rests on the line; with reduced motion it stays on the first word.
// The first word is in the server HTML and enters with the page's CSS entrance.
export function RotatingWords({ words }: { words: readonly string[] }) {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLSpanElement>(null);
  const paused = useRef({ hidden: false, offscreen: false, pointer: false });
  const [state, setState] = useState({ current: 0, leaving: -1, cycle: 0 });
  const count = words.length;
  const rotates = count > 1 && !reduced;

  useEffect(() => {
    if (!rotates) return;
    const root = rootRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(([entry]) => {
      paused.current.offscreen = !entry.isIntersecting;
    });
    observer.observe(root);

    const onVisibility = () => {
      paused.current.hidden = document.visibilityState === "hidden";
    };
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);

    let leaveTimer: number | undefined;
    const timer = window.setInterval(() => {
      const { hidden, offscreen, pointer } = paused.current;
      if (hidden || offscreen || pointer) return;
      setState((previous) => ({
        current: (previous.current + 1) % count,
        leaving: previous.current,
        cycle: previous.cycle + 1,
      }));
      window.clearTimeout(leaveTimer);
      leaveTimer = window.setTimeout(
        () => setState((previous) => ({ ...previous, leaving: -1 })),
        LEAVE_MS + longestWord(words) * STAGGER_MS,
      );
    }, INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
      window.clearTimeout(leaveTimer);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [rotates, count, words]);

  if (count === 0) return null;

  return (
    <span
      ref={rootRef}
      className="hero-rotor"
      onPointerEnter={() => (paused.current.pointer = true)}
      onPointerLeave={() => (paused.current.pointer = false)}
    >
      {words.map((word, index) => {
        const wordState: WordState =
          index === state.current
            ? "active"
            : index === state.leaving
              ? "leaving"
              : "idle";
        // Only the very first appearance waits for the headline's entrance.
        const base = state.cycle === 0 && index === 0 ? "450ms" : "0ms";
        return (
          <span
            key={word}
            className="hero-rotor-word"
            data-state={wordState}
            style={{ "--base": base } as CSSProperties}
          >
            {Array.from(`& ${word}`).map((char, i) => (
              <span
                key={i}
                className="hero-rotor-char"
                style={{ "--i": i } as CSSProperties}
              >
                {char}
              </span>
            ))}
          </span>
        );
      })}
    </span>
  );
}

function longestWord(words: readonly string[]): number {
  return Math.max(...words.map((word) => word.length + 2));
}

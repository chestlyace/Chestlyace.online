"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// A clock for the typing blocks (design.md §13.41, §13.44): the milliseconds
// elapsed since they started, running while `playing`. The block's state is a
// pure function of this number (lib/blog/typing.ts), so skipping is setting it
// past the end and replaying is setting it to 0.
export function useClock(total: number) {
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const base = useRef(0);

  useEffect(() => {
    if (!playing) return;
    const origin = performance.now() - base.current;
    let frame = 0;
    const tick = (now: number) => {
      const time = now - origin;
      base.current = time;
      if (time >= total) {
        setElapsed(total + 1);
        setPlaying(false);
        return;
      }
      setElapsed(time);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, total]);

  const start = useCallback(() => setPlaying(true), []);
  const skip = useCallback(() => {
    setPlaying(false);
    setElapsed(Number.MAX_SAFE_INTEGER);
  }, []);
  const replay = useCallback(() => {
    base.current = 0;
    setElapsed(0);
    setPlaying(true);
  }, []);

  return { elapsed, playing, start, skip, replay };
}

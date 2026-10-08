"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// A clock for the session replay (design.md §13.47): the milliseconds elapsed,
// advancing while `playing` at 1× or 2×, and settable, so Previous, Next and the
// progress bar are just a different number. Like useClock, the replay's state is a
// pure function of it (lib/blog/replay.ts).
export function useReplayClock(total: number) {
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<1 | 2>(1);
  const time = useRef(0);
  const rate = useRef(1);

  useEffect(() => {
    rate.current = speed;
  }, [speed]);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      time.current += (now - last) * rate.current;
      last = now;
      if (time.current >= total) {
        time.current = total;
        setElapsed(total);
        setPlaying(false);
        return;
      }
      setElapsed(time.current);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, total]);

  const seek = useCallback((to: number) => {
    time.current = to;
    setElapsed(to);
  }, []);
  const play = useCallback(() => setPlaying(true), []);
  const pause = useCallback(() => setPlaying(false), []);

  return { elapsed, playing, speed, setSpeed, seek, play, pause };
}

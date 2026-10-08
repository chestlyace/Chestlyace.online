// The timeline of an agent session's replay (design.md §13.47), as pure functions
// of the time elapsed, like lib/blog/typing.ts: playing, pausing, skipping to a
// turn and the speed toggle are all just a different number.

export const REPLAY = {
  /** A prompt types at 22ms a character (§13.47)... */
  charMs: 22,
  /** ...but never takes longer than this, so a long prompt doesn't stall it. */
  maxPromptMs: 4000,
  /** Before the first turn, and between turns. */
  leadMs: 300,
  gapMs: 400,
  /** A reply appears in a moment and holds for its lines before the next part. */
  textMs: 160,
  lineMs: 45,
  maxTextMs: 1400,
  thinkingMs: 200,
  toolMs: 260,
  /** Turns shown before Play (§13.47). */
  initialTurns: 6,
} as const;

/** What the timeline needs to know about a turn. */
export type TurnShape = {
  promptLength: number;
  parts: { kind: "text" | "thinking" | "tool"; lines: number }[];
};

const promptMs = (turn: TurnShape) =>
  Math.min(turn.promptLength * REPLAY.charMs, REPLAY.maxPromptMs);

const partMs = (part: TurnShape["parts"][number]) =>
  part.kind === "text"
    ? Math.min(REPLAY.textMs + part.lines * REPLAY.lineMs, REPLAY.maxTextMs)
    : part.kind === "thinking"
      ? REPLAY.thinkingMs
      : REPLAY.toolMs;

export type Timeline = {
  /** When each turn begins, and how long its own content takes (no gap). */
  starts: number[];
  durations: number[];
  /** When the last turn's content is done. */
  total: number;
};

export function buildTimeline(turns: readonly TurnShape[]): Timeline {
  const starts: number[] = [];
  const durations: number[] = [];
  let clock = REPLAY.leadMs;
  for (const turn of turns) {
    starts.push(clock);
    const duration =
      promptMs(turn) + turn.parts.reduce((sum, p) => sum + partMs(p), 0);
    durations.push(duration);
    clock += duration + REPLAY.gapMs;
  }
  return { starts, durations, total: clock - REPLAY.gapMs };
}

export type ReplayState = {
  /** Turns on screen: the last may still be going. */
  shown: number;
  /** For the last turn on screen: the prompt's typed characters and how many replies and tool calls have appeared. `done` when it is all there. */
  chars: number;
  parts: number;
  done: boolean;
};

export function replayState(
  turns: readonly TurnShape[],
  timeline: Timeline,
  elapsed: number,
): ReplayState {
  let shown = 0;
  for (let i = 0; i < turns.length; i++) {
    if (elapsed >= timeline.starts[i]) shown = i + 1;
    else break;
  }
  if (shown === 0) return { shown: 0, chars: 0, parts: 0, done: false };

  const index = shown - 1;
  const turn = turns[index];
  const t = elapsed - timeline.starts[index];
  if (t >= timeline.durations[index])
    return {
      shown,
      chars: turn.promptLength,
      parts: turn.parts.length,
      done: true,
    };

  const typing = promptMs(turn);
  if (t < typing) {
    const chars = Math.floor((t / typing) * turn.promptLength);
    return { shown, chars, parts: 0, done: false };
  }
  let clock = typing;
  let parts = 0;
  for (const part of turn.parts) {
    if (t < clock) break;
    parts += 1;
    clock += partMs(part);
  }
  return { shown, chars: turn.promptLength, parts, done: false };
}

/** The time at which `count` turns are on screen and finished (0 turns: the start). */
export function timeAfterTurns(timeline: Timeline, count: number): number {
  if (count <= 0) return 0;
  const index = Math.min(count, timeline.starts.length) - 1;
  return timeline.starts[index] + timeline.durations[index];
}

/** How many turns are on screen and finished at a time (a turn still going isn't counted). */
export function finishedTurns(
  turns: readonly TurnShape[],
  timeline: Timeline,
  elapsed: number,
): number {
  const state = replayState(turns, timeline, elapsed);
  return state.done ? state.shown : Math.max(0, state.shown - 1);
}

const MARK = "[redacted]";

/**
 * The first `chars` characters of a prompt, counting a `[redacted]` mark as one
 * piece so it never shows half typed.
 */
export function typedPrefix(text: string, chars: number): string {
  if (chars >= text.length) return text;
  let end = Math.max(0, chars);
  for (
    let at = text.indexOf(MARK);
    at !== -1;
    at = text.indexOf(MARK, at + 1)
  ) {
    if (end > at && end < at + MARK.length) {
      end = at + MARK.length;
      break;
    }
  }
  return text.slice(0, end);
}

/** The pieces of a text, with the redaction marks apart. */
export function splitRedacted(
  text: string,
): { text: string; hidden: boolean }[] {
  const pieces: { text: string; hidden: boolean }[] = [];
  let from = 0;
  for (let at = text.indexOf(MARK); at !== -1; at = text.indexOf(MARK, from)) {
    if (at > from) pieces.push({ text: text.slice(from, at), hidden: false });
    pieces.push({ text: MARK, hidden: true });
    from = at + MARK.length;
  }
  if (from < text.length)
    pieces.push({ text: text.slice(from), hidden: false });
  return pieces;
}

/** The turns `from`–`to` (1-based, inclusive) of a session, clamped to what exists. */
export function turnWindow(
  count: number,
  from: number | null,
  to: number | null,
): { start: number; end: number } | null {
  const start = Math.max(1, from ?? 1);
  const end = Math.min(count, to ?? count);
  return start > end ? null : { start: start - 1, end };
}

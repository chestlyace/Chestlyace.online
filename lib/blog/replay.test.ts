import { describe, expect, it } from "vitest";
import {
  REPLAY,
  buildTimeline,
  finishedTurns,
  replayState,
  splitRedacted,
  timeAfterTurns,
  turnWindow,
  typedPrefix,
  type TurnShape,
} from "./replay";

const turn = (
  promptLength: number,
  ...kinds: TurnShape["parts"][number]["kind"][]
) => ({
  promptLength,
  parts: kinds.map((kind) => ({ kind, lines: 2 })),
});
const turns = [turn(10, "text", "tool"), turn(5, "tool"), turn(0)];
const timeline = buildTimeline(turns);

describe("buildTimeline", () => {
  it("starts after the lead, then follows each turn's own length and a gap", () => {
    const first =
      10 * REPLAY.charMs + (REPLAY.textMs + 2 * REPLAY.lineMs) + REPLAY.toolMs;
    expect(timeline.starts[0]).toBe(REPLAY.leadMs);
    expect(timeline.durations[0]).toBe(first);
    expect(timeline.starts[1]).toBe(REPLAY.leadMs + first + REPLAY.gapMs);
    expect(timeline.total).toBe(timeline.starts[2] + timeline.durations[2]);
  });

  it("never types a long prompt for longer than the cap", () => {
    const long = buildTimeline([turn(5000)]);
    expect(long.durations[0]).toBe(REPLAY.maxPromptMs);
  });

  it("is empty for no turns", () => {
    expect(buildTimeline([]).total).toBeLessThanOrEqual(0);
  });
});

describe("replayState", () => {
  const at = (ms: number) => replayState(turns, timeline, ms);

  it("shows nothing before the first turn", () => {
    expect(at(0)).toEqual({ shown: 0, chars: 0, parts: 0, done: false });
  });

  it("types the prompt, then reveals the replies and tool calls one by one", () => {
    const start = timeline.starts[0];
    expect(at(start)).toMatchObject({
      shown: 1,
      chars: 0,
      parts: 0,
      done: false,
    });
    expect(at(start + 5 * REPLAY.charMs)).toMatchObject({
      shown: 1,
      chars: 5,
      parts: 0,
    });
    const typed = start + 10 * REPLAY.charMs;
    expect(at(typed)).toMatchObject({ shown: 1, chars: 10, parts: 1 });
    expect(at(typed + REPLAY.textMs + 2 * REPLAY.lineMs)).toMatchObject({
      parts: 2,
      done: false,
    });
    expect(at(start + timeline.durations[0])).toMatchObject({
      shown: 1,
      parts: 2,
      done: true,
    });
  });

  it("keeps the finished turn while the gap passes, then starts the next", () => {
    const gap = timeline.starts[0] + timeline.durations[0] + REPLAY.gapMs / 2;
    expect(at(gap)).toMatchObject({ shown: 1, done: true });
    expect(at(timeline.starts[1])).toMatchObject({
      shown: 2,
      chars: 0,
      done: false,
    });
  });

  it("ends with every turn shown and done", () => {
    expect(at(timeline.total)).toMatchObject({ shown: 3, done: true });
    expect(at(timeline.total + 99999)).toMatchObject({ shown: 3, done: true });
  });

  it("is a turn with no prompt text and no parts: done at once", () => {
    expect(at(timeline.starts[2])).toMatchObject({ shown: 3, done: true });
  });
});

describe("seeking", () => {
  it("is on the turn's finished state for a number of turns", () => {
    expect(timeAfterTurns(timeline, 0)).toBe(0);
    for (const count of [1, 2, 3]) {
      const time = timeAfterTurns(timeline, count);
      expect(finishedTurns(turns, timeline, time)).toBe(count);
      expect(replayState(turns, timeline, time)).toMatchObject({
        shown: count,
        done: true,
      });
    }
    expect(timeAfterTurns(timeline, 99)).toBe(timeline.total);
  });

  it("counts a turn still going as not finished", () => {
    expect(finishedTurns(turns, timeline, timeline.starts[1] + 1)).toBe(1);
    expect(finishedTurns(turns, timeline, 0)).toBe(0);
  });
});

describe("redaction marks", () => {
  it("types a mark whole, never half", () => {
    const text = "key [redacted] ok";
    expect(typedPrefix(text, 3)).toBe("key");
    expect(typedPrefix(text, 4)).toBe("key ");
    expect(typedPrefix(text, 5)).toBe("key [redacted]");
    expect(typedPrefix(text, 10)).toBe("key [redacted]");
    expect(typedPrefix(text, 99)).toBe(text);
    expect(typedPrefix(text, -2)).toBe("");
  });

  it("splits a text into pieces and marks", () => {
    expect(splitRedacted("a [redacted] b [redacted]")).toEqual([
      { text: "a ", hidden: false },
      { text: "[redacted]", hidden: true },
      { text: " b ", hidden: false },
      { text: "[redacted]", hidden: true },
    ]);
    expect(splitRedacted("plain")).toEqual([{ text: "plain", hidden: false }]);
    expect(splitRedacted("")).toEqual([]);
  });
});

describe("turnWindow", () => {
  it("clamps the range to the turns there are", () => {
    expect(turnWindow(10, null, null)).toEqual({ start: 0, end: 10 });
    expect(turnWindow(10, 3, 5)).toEqual({ start: 2, end: 5 });
    expect(turnWindow(10, 8, 99)).toEqual({ start: 7, end: 10 });
    expect(turnWindow(10, 11, null)).toBeNull();
    expect(turnWindow(0, null, null)).toBeNull();
  });
});

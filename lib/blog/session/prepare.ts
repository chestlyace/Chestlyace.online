import { redactText, redactTurns, chooseTurns } from "./redact";
import { SESSION_LIMITS, toolCount, type SessionTurn } from "./types";

// What the editor sends once the author has chosen turns and reviewed what is
// hidden (design.md §13.48). Pure, so the choices can be tested without a page.

/** The title a session starts with: the first prompt, cut to a short line. */
export function defaultTitle(turns: readonly SessionTurn[]): string {
  const line = (turns[0]?.prompt ?? "").replace(/\s+/g, " ").trim();
  if (!line) return "Agent session";
  return line.length > 60 ? `${line.slice(0, 57).trimEnd()}…` : line;
}

/** The turn numbers from `from` to `to` (1-based, both included) as indexes. */
export function turnRange(
  from: number,
  to: number,
  count: number,
): Set<number> {
  const picked = new Set<number>();
  for (let n = Math.max(1, from); n <= Math.min(count, to); n++)
    picked.add(n - 1);
  return picked;
}

export type Payload = {
  title: string;
  turns: SessionTurn[];
  tools: number;
};

// The title and turns to store: only the picked turns, thinking only if asked,
// and every hidden value replaced — the title too.
export function buildPayload(
  turns: readonly SessionTurn[],
  options: {
    picked: ReadonlySet<number>;
    includeThinking: boolean;
    hide: readonly string[];
    title: string;
  },
): Payload {
  const chosen = chooseTurns(turns, options.picked, options.includeThinking);
  const redacted = redactTurns(chosen, options.hide);
  return {
    title: redactText(options.title.trim(), options.hide).slice(
      0,
      SESSION_LIMITS.title,
    ),
    turns: redacted,
    tools: toolCount(redacted),
  };
}

/** Why a payload can't be sent, in words for the author; null when it can. */
export function payloadProblem(payload: Payload): string | null {
  if (payload.turns.length === 0) return "Pick at least one turn.";
  if (payload.turns.length > SESSION_LIMITS.turns)
    return `Pick at most ${SESSION_LIMITS.turns} turns.`;
  if (!payload.title) return "Give the session a title.";
  if (JSON.stringify(payload.turns).length > SESSION_LIMITS.bytes)
    return "That is too much text for one session. Pick fewer turns.";
  return null;
}

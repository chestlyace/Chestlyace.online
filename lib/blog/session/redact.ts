import { REDACTED, type SessionPart, type SessionTurn } from "./types";

// What the editor hides before a session is stored (design.md §13.48): API keys
// and tokens, `.env` values, email addresses, the home folder's path, and anything
// the author adds. Pure and the same in the browser and in tests.

export type RuleId = "token" | "env" | "email" | "home" | "custom";

export const RULES: Record<RuleId, { label: string; help: string }> = {
  token: {
    label: "Keys and tokens",
    help: "API keys, access tokens, passwords",
  },
  env: { label: "Environment values", help: "Values from .env-style lines" },
  email: { label: "Email addresses", help: "Anything shaped like a@b.c" },
  home: { label: "Home folder", help: "The path to your home folder" },
  custom: {
    label: "Added by you",
    help: "Words and phrases you asked to hide",
  },
};

export type Finding = {
  /** Stable for a rule and value, so a switch survives a re-scan. */
  id: string;
  rule: RuleId;
  /** The text that will be hidden, wherever it appears. */
  value: string;
  count: number;
  /** A short stretch of text around the first place it appears. */
  context: string;
};

const TOKENS: RegExp[] = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
  /\bsk-[A-Za-z0-9][A-Za-z0-9_-]{19,}/g,
  /\bgh[pousr]_[A-Za-z0-9]{30,}/g,
  /\bgithub_pat_[A-Za-z0-9_]{30,}/g,
  /\bxox[abprs]-[A-Za-z0-9-]{10,}/g,
  /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g,
  /\bAIza[0-9A-Za-z_-]{35}\b/g,
  /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g,
  /\bre_[A-Za-z0-9]{16,}/g,
  /\b(?:pk|sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}/g,
  /\bnpm_[A-Za-z0-9]{30,}/g,
  /\b[a-z][a-z0-9+.-]*:\/\/[^\s:@/]+:[^\s@/]+@[^\s/]+/gi, // user:password@host
];

// `Bearer abc…` and `password = "abc…"`: only the value is hidden.
const TOKEN_VALUES: RegExp[] = [
  /\bBearer\s+([A-Za-z0-9._~+/=-]{16,})/g,
  /\b(?:api[_-]?key|secret|token|password|passwd|auth)[\w-]*["']?\s*[=:]\s*["']?([^\s"',;]{8,})/gi,
];

// A line of an environment file, or an `export`: only a sensitive-looking name's
// value is hidden, so `NODE_ENV=production` stays readable.
const ENV_LINE =
  /^[ \t]*(?:export[ \t]+)?[A-Z][A-Z0-9_]*(?:KEY|SECRET|TOKEN|PASSWORD|PASS|URL|DSN|AUTH|CREDENTIAL|ID)[ \t]*=[ \t]*["']?([^\s"'#]{4,})/gm;

const EMAIL =
  /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;

const HOME: RegExp[] = [
  /\/(?:home|Users)\/[^/\s"'`:]+/g,
  /[A-Za-z]:\\Users\\[^\\\s"'`]+/g,
];

// Every piece of text in a turn, so the same scan and replace cover it all.
function* texts(turn: SessionTurn): Generator<string> {
  yield turn.prompt;
  for (const part of turn.parts) {
    if (part.kind === "tool") {
      yield part.summary;
      yield part.input;
      yield part.output;
      if (part.edit) {
        yield part.edit.before;
        yield part.edit.after;
      }
    } else yield part.text;
  }
}

// A short stretch of text around a match, kept to its own line.
const snippet = (text: string, at: number, length: number): string => {
  const lineStart = text.lastIndexOf("\n", at - 1) + 1;
  const newline = text.indexOf("\n", at + length);
  const lineEnd = newline === -1 ? text.length : newline;
  const from = Math.max(lineStart, at - 24);
  const to = Math.min(lineEnd, at + length + 24);
  return `${from > lineStart ? "…" : ""}${text.slice(from, to)}${to < lineEnd ? "…" : ""}`;
};

const hash = (text: string): string => {
  let h = 5381;
  for (let i = 0; i < text.length; i++)
    h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
};

// What the scan finds in the chosen turns. A value that appears many times is one
// finding with a count; hiding it hides it everywhere.
export function findSecrets(
  turns: readonly SessionTurn[],
  options: { extra?: readonly string[]; cwd?: string | null } = {},
): Finding[] {
  const found = new Map<string, Finding>();
  const add = (rule: RuleId, value: string, text: string, at: number) => {
    if (value.length < 3) return;
    const id = `${rule}:${hash(value)}`;
    const known = found.get(id);
    if (known) known.count += 1;
    else
      found.set(id, {
        id,
        rule,
        value,
        count: 1,
        context: snippet(text, at, value.length),
      });
  };
  const scan = (rule: RuleId, pattern: RegExp, group: number, text: string) => {
    for (const m of text.matchAll(pattern)) {
      const value = m[group];
      if (value) add(rule, value, text, (m.index ?? 0) + m[0].indexOf(value));
    }
  };

  const home =
    options.cwd?.match(HOME[0])?.[0] ?? options.cwd?.match(HOME[1])?.[0];
  const terms = (options.extra ?? []).map((t) => t.trim()).filter(Boolean);

  for (const turn of turns) {
    for (const text of texts(turn)) {
      if (!text) continue;
      for (const pattern of TOKENS) scan("token", pattern, 0, text);
      for (const pattern of TOKEN_VALUES) scan("token", pattern, 1, text);
      scan("env", ENV_LINE, 1, text);
      scan("email", EMAIL, 0, text);
      for (const pattern of HOME) scan("home", pattern, 0, text);
      if (home) {
        for (
          let at = text.indexOf(home);
          at !== -1;
          at = text.indexOf(home, at + 1)
        )
          add("home", home, text, at);
      }
      for (const term of terms) {
        const lower = text.toLowerCase();
        const needle = term.toLowerCase();
        for (
          let at = lower.indexOf(needle);
          at !== -1;
          at = lower.indexOf(needle, at + 1)
        )
          add("custom", text.slice(at, at + term.length), text, at);
      }
    }
  }
  // A value hidden as a token isn't also listed as an environment value.
  const claimed = new Set(
    [...found.values()].filter((f) => f.rule === "token").map((f) => f.value),
  );
  return [...found.values()].filter(
    (f) => f.rule !== "env" || !claimed.has(f.value),
  );
}

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Replaces every value in a text, the longest first so one inside another can't
// leave a piece of it behind. Custom terms match without regard to case.
export function redactText(text: string, values: readonly string[]): string {
  if (!text || values.length === 0) return text;
  const pattern = [...new Set(values)]
    .sort((a, b) => b.length - a.length)
    .map(escape)
    .join("|");
  return text.replace(new RegExp(pattern, "gi"), REDACTED);
}

export function redactTurns(
  turns: readonly SessionTurn[],
  values: readonly string[],
): SessionTurn[] {
  const hide = (text: string) => redactText(text, values);
  return turns.map((turn) => ({
    ...turn,
    prompt: hide(turn.prompt),
    parts: turn.parts.map((part): SessionPart => {
      if (part.kind !== "tool") return { ...part, text: hide(part.text) };
      return {
        ...part,
        summary: hide(part.summary),
        input: hide(part.input),
        output: hide(part.output),
        ...(part.edit
          ? {
              edit: {
                before: hide(part.edit.before),
                after: hide(part.edit.after),
              },
            }
          : {}),
      };
    }),
  }));
}

// The turns as chosen: only those, and the agent's thinking only if asked.
export function chooseTurns(
  turns: readonly SessionTurn[],
  picked: ReadonlySet<number>,
  includeThinking: boolean,
): SessionTurn[] {
  return turns
    .filter((_, index) => picked.has(index))
    .map((turn) => ({
      ...turn,
      parts: includeThinking
        ? turn.parts
        : turn.parts.filter((part) => part.kind !== "thinking"),
    }));
}

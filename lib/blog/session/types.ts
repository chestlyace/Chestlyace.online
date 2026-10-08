// An agent session as the blog keeps it (docs/content-schema.md §4, design.md
// §13.47): turns of text and tool calls, already redacted. Pure data, shared by the
// parser, the redaction, the editor and the replay.

export type SessionTool = {
  /** The tool's name: `Edit`, `Bash`, `Read`… */
  name: string;
  /** One line for the collapsed row: `proxy.ts · +12 −3`, `pnpm test`. */
  summary: string;
  /** The command, path or pattern the agent gave the tool. */
  input: string;
  /** What came back, cut to a readable length. */
  output: string;
  failed: boolean;
  /** For an edit: the text before and after, shown as a diff. */
  edit?: { before: string; after: string };
};

export type SessionPart =
  | { kind: "text"; text: string }
  | { kind: "thinking"; text: string }
  | ({ kind: "tool" } & SessionTool);

export type SessionTurn = {
  /** What the person asked. */
  prompt: string;
  /** The agent's replies and tool calls, in order. */
  parts: SessionPart[];
  /** When the prompt was sent (ISO), if the file says. */
  at: string | null;
};

export type ParsedSession = {
  turns: SessionTurn[];
  startedAt: string | null;
  /** The folder the session ran in, used to find the home folder. */
  cwd: string | null;
};

/** What is written in place of a hidden value. */
export const REDACTED = "[redacted]";

// Limits shared by the browser (so it can say what is too much) and the API.
export const SESSION_LIMITS = {
  turns: 400,
  parts: 1000,
  text: 20_000,
  toolText: 8_000,
  title: 120,
  bytes: 1_500_000,
} as const;

export const toolCount = (turns: readonly SessionTurn[]): number =>
  turns.reduce(
    (sum, turn) => sum + turn.parts.filter((p) => p.kind === "tool").length,
    0,
  );

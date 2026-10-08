import {
  SESSION_LIMITS,
  type ParsedSession,
  type SessionPart,
  type SessionTool,
  type SessionTurn,
} from "./types";

// Reads a Claude Code session file (`.jsonl`, one JSON event per line) into turns
// (design.md §13.48). A turn is a prompt you typed plus everything the agent did
// until your next prompt. The format isn't a published contract, so this reads
// what it recognises and skips the rest; a line that isn't JSON is skipped too.

type Block = Record<string, unknown>;
type Event = Record<string, unknown>;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const str = (value: unknown): string =>
  typeof value === "string" ? value : "";

// A tool result's content is a string or a list of text blocks.
function resultText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((part) =>
      isObject(part) && part.type === "text"
        ? str(part.text)
        : isObject(part) && part.type === "image"
          ? "[image]"
          : "",
    )
    .filter(Boolean)
    .join("\n");
}

export function cut(text: string, max: number): string {
  if (text.length <= max) return text;
  const hidden = text.length - max;
  return `${text.slice(0, max)}\n… (${hidden.toLocaleString("en-US")} more characters)`;
}

const lines = (text: string) => (text ? text.split("\n").length : 0);

const base = (path: string) =>
  path.split(/[\\/]/).filter(Boolean).pop() ?? path;

// The one-line description of a tool call, and what it gives the tool.
function describe(
  name: string,
  input: Record<string, unknown>,
): Pick<SessionTool, "summary" | "input" | "edit"> {
  const path =
    str(input.file_path) || str(input.path) || str(input.notebook_path);
  const first = (text: string) => text.split("\n")[0].trim();
  switch (name) {
    case "Edit": {
      const before = str(input.old_string);
      const after = str(input.new_string);
      return {
        summary: `${base(path)} · +${lines(after)} −${lines(before)}`,
        input: path,
        edit: { before, after },
      };
    }
    case "MultiEdit": {
      const edits = Array.isArray(input.edits)
        ? input.edits.filter(isObject)
        : [];
      const before = edits.map((e) => str(e.old_string)).join("\n…\n");
      const after = edits.map((e) => str(e.new_string)).join("\n…\n");
      return {
        summary: `${base(path)} · ${edits.length} edits`,
        input: path,
        edit: { before, after },
      };
    }
    case "Write":
      return {
        summary: `${base(path)} · ${lines(str(input.content))} lines`,
        input: path,
        edit: { before: "", after: str(input.content) },
      };
    case "Read":
      return { summary: base(path), input: path };
    case "Bash":
      return {
        summary: first(str(input.description) || str(input.command)),
        input: str(input.command),
      };
    case "Grep":
    case "Glob":
      return { summary: str(input.pattern), input: str(input.pattern) };
    case "WebFetch":
      return { summary: str(input.url), input: str(input.url) };
    case "WebSearch":
      return { summary: str(input.query), input: str(input.query) };
    case "Task":
    case "Agent":
      return {
        summary: str(input.description),
        input: str(input.prompt) || str(input.description),
      };
    case "TodoWrite": {
      const todos = Array.isArray(input.todos) ? input.todos : [];
      return {
        summary: `${todos.length} items`,
        input: todos
          .filter(isObject)
          .map((todo) => `- ${str(todo.content)}`)
          .join("\n"),
      };
    }
    default: {
      // Another tool: its first text argument tells what it did.
      const value = Object.values(input).find((v) => typeof v === "string");
      return {
        summary: first(typeof value === "string" ? value : ""),
        input: Object.entries(input)
          .map(
            ([key, v]) =>
              `${key}: ${typeof v === "string" ? v : JSON.stringify(v)}`,
          )
          .join("\n"),
      };
    }
  }
}

// What the program wraps around the prompts it didn't get from a person.
const NOT_A_PROMPT =
  /^\s*<(command-name|command-message|command-args|local-command-stdout|local-command-caveat|system-reminder|bash-input|bash-stdout|bash-stderr|user-prompt-submit-hook)\b/;

function promptText(content: unknown): string | null {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return null;
  if (content.some((part) => isObject(part) && part.type === "tool_result"))
    return null;
  const text = content
    .map((part) =>
      isObject(part) && part.type === "text" ? str(part.text) : "",
    )
    .filter(Boolean)
    .join("\n");
  return text || null;
}

export function parseSession(file: string): ParsedSession {
  const turns: SessionTurn[] = [];
  const tools = new Map<string, SessionTool>();
  let current: SessionTurn | null = null;
  let startedAt: string | null = null;
  let cwd: string | null = null;

  for (const line of file.split("\n")) {
    if (!line.trim()) continue;
    let event: Event;
    try {
      const value: unknown = JSON.parse(line);
      if (!isObject(value)) continue;
      event = value;
    } catch {
      continue;
    }
    // Sub-agents' own conversations and the program's notes aren't part of it.
    if (event.isSidechain === true || event.isMeta === true) continue;
    if (event.type !== "user" && event.type !== "assistant") continue;
    const message = event.message;
    if (!isObject(message)) continue;
    const stamp = Date.parse(str(event.timestamp));
    const at = Number.isNaN(stamp) ? null : new Date(stamp).toISOString();
    cwd ??= str(event.cwd) || null;

    if (event.type === "user") {
      const text = promptText(message.content);
      if (text !== null) {
        if (!text.trim() || NOT_A_PROMPT.test(text)) continue;
        current = {
          prompt: cut(text.trim(), SESSION_LIMITS.text),
          parts: [],
          at,
        };
        turns.push(current);
        startedAt ??= at;
        continue;
      }
      // The results of tool calls, matched to the calls by id.
      for (const part of message.content as unknown[]) {
        if (!isObject(part) || part.type !== "tool_result") continue;
        const tool = tools.get(str(part.tool_use_id));
        if (!tool) continue;
        tool.output = cut(resultText(part.content), SESSION_LIMITS.toolText);
        tool.failed = part.is_error === true;
      }
      continue;
    }

    // An assistant event: text, thinking and tool calls.
    if (!current) continue;
    const content = Array.isArray(message.content)
      ? message.content
      : typeof message.content === "string"
        ? [{ type: "text", text: message.content }]
        : [];
    for (const part of content as Block[]) {
      if (!isObject(part)) continue;
      let next: SessionPart | null = null;
      if (part.type === "text" && str(part.text).trim()) {
        next = {
          kind: "text",
          text: cut(str(part.text).trim(), SESSION_LIMITS.text),
        };
      } else if (part.type === "thinking" && str(part.thinking).trim()) {
        next = {
          kind: "thinking",
          text: cut(str(part.thinking).trim(), SESSION_LIMITS.text),
        };
      } else if (part.type === "tool_use") {
        const name = str(part.name) || "Tool";
        const described = describe(
          name,
          isObject(part.input) ? part.input : {},
        );
        const tool: SessionTool = {
          name,
          summary: cut(described.summary, 200).split("\n")[0],
          input: cut(described.input, SESSION_LIMITS.toolText),
          output: "",
          failed: false,
          ...(described.edit
            ? {
                edit: {
                  before: cut(described.edit.before, SESSION_LIMITS.toolText),
                  after: cut(described.edit.after, SESSION_LIMITS.toolText),
                },
              }
            : {}),
        };
        next = { kind: "tool", ...tool };
        // The part and the lookup share one object, so the result fills the part.
        tools.set(str(part.id), next);
      }
      if (next && current.parts.length < SESSION_LIMITS.parts)
        current.parts.push(next);
    }
  }
  return { turns, startedAt, cwd };
}

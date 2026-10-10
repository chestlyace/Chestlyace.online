import type { z } from "zod";
import type { Database } from "@/lib/db";
import type { Scope } from "./scopes";

// How a tool is described (docs/mcp.md §5, §6). Each tool names the scope it needs; the
// server lists a tool only to a token that has it, and wraps every call to rate-limit,
// run and log it. A tool returns data (shown to the agent as JSON) and a one-line summary
// (shown in the Activity screen); a refusal is a `ToolError`, whose message is written for
// the agent: what went wrong and what to send instead.

export type Caller = { id: number; name: string; scopes: readonly string[] };

export type ToolContext = { db: Database; caller: Caller };

export type ToolOutput = {
  /** What the agent gets back (JSON-serialisable). */
  data: unknown;
  /** One line for the Activity screen: "Created project acme". */
  summary: string;
};

export class ToolError extends Error {
  /** Field → message, when a form-like validation failed. */
  readonly fields?: Record<string, string>;
  constructor(message: string, fields?: Record<string, string>) {
    super(message);
    this.name = "ToolError";
    this.fields = fields;
  }
}

export type ToolDef<Shape extends z.ZodRawShape = z.ZodRawShape> = {
  name: string;
  title: string;
  description: string;
  /** The scope a token needs to see and call it. */
  scope: Scope;
  /** Counts against the token's write limit (anything that changes something). */
  write: boolean;
  /** Further scopes a call needs on top of `scope` (e.g. `write` + `media`). */
  alsoNeeds?: readonly Scope[];
  input: Shape;
  hints?: { readOnly?: boolean; destructive?: boolean; idempotent?: boolean };
  run: (
    args: z.infer<z.ZodObject<Shape>>,
    context: ToolContext,
  ) => Promise<ToolOutput>;
};

/** Type-checks a tool's arguments against its own input shape. */
export function defineTool<Shape extends z.ZodRawShape>(
  tool: ToolDef<Shape>,
): ToolDef<Shape> {
  return tool;
}

/** A tool of any shape, for lists (its arguments are checked by its own `input`). */
export type AnyTool = Omit<ToolDef, "run" | "input"> & {
  input: z.ZodRawShape;
  run: (args: never, context: ToolContext) => Promise<ToolOutput>;
};

/** Turns an admin-logic failure into a refusal written for the agent. */
export function refuse(
  failure: { status: 404 } | { status: 422; fields: Record<string, string> },
  what: string,
): never {
  if (failure.status === 404)
    throw new ToolError(
      `No ${what} with that id. Use ${what}_list to see them.`,
    );
  throw new ToolError(
    `That ${what} was not saved. Fix these and try again:`,
    failure.fields,
  );
}

/** A delete must repeat the item's name (docs/mcp.md §4). */
export function requireConfirm(
  confirm: string,
  expected: string,
  what: string,
) {
  if (confirm.trim() !== expected)
    throw new ToolError(
      `Not deleted. To delete this ${what}, send confirm: "${expected}" exactly.`,
    );
}

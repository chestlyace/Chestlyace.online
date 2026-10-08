import { describe, expect, it } from "vitest";
import { parseSession } from "./parse";
import {
  buildPayload,
  defaultTitle,
  payloadProblem,
  turnRange,
} from "./prepare";
import { chooseTurns, findSecrets, redactText, redactTurns } from "./redact";
import { REDACTED, SESSION_LIMITS, toolCount, type SessionTurn } from "./types";

const line = (value: unknown) => JSON.stringify(value);
const at = (n: number) => `2026-10-07T10:0${n}:00.000Z`;

const FILE = [
  line({ type: "summary", summary: "ignored" }),
  "not json at all",
  line({
    type: "user",
    timestamp: at(0),
    cwd: "/home/ada/shop",
    message: { role: "user", content: "Fix the proxy" },
  }),
  line({
    type: "assistant",
    timestamp: at(1),
    message: {
      role: "assistant",
      content: [
        { type: "thinking", thinking: "Let me look." },
        { type: "text", text: "I'll read it first." },
        {
          type: "tool_use",
          id: "t1",
          name: "Read",
          input: { file_path: "/home/ada/shop/proxy.ts" },
        },
      ],
    },
  }),
  line({
    type: "user",
    timestamp: at(2),
    message: {
      role: "user",
      content: [
        {
          type: "tool_result",
          tool_use_id: "t1",
          content: "export const x = 1;",
        },
      ],
    },
  }),
  line({
    type: "assistant",
    timestamp: at(3),
    message: {
      role: "assistant",
      content: [
        {
          type: "tool_use",
          id: "t2",
          name: "Edit",
          input: {
            file_path: "/home/ada/shop/proxy.ts",
            old_string: "x = 1",
            new_string: "x = 2\ny = 3",
          },
        },
        {
          type: "tool_use",
          id: "t3",
          name: "Bash",
          input: { command: "pnpm test\nmore", description: "Run tests" },
        },
      ],
    },
  }),
  line({
    type: "user",
    message: {
      role: "user",
      content: [
        {
          type: "tool_result",
          tool_use_id: "t3",
          content: [{ type: "text", text: "1 failed" }],
          is_error: true,
        },
      ],
    },
  }),
  // not prompts: the program's own notes, a sub-agent's conversation
  line({
    type: "user",
    message: { role: "user", content: "<command-name>/clear</command-name>" },
  }),
  line({
    type: "user",
    isMeta: true,
    message: { role: "user", content: "meta" },
  }),
  line({
    type: "assistant",
    isSidechain: true,
    message: { role: "assistant", content: [{ type: "text", text: "side" }] },
  }),
  line({
    type: "user",
    timestamp: at(5),
    message: { role: "user", content: [{ type: "text", text: "Thanks!" }] },
  }),
  line({
    type: "assistant",
    message: { role: "assistant", content: "You're welcome." },
  }),
].join("\n");

describe("parseSession", () => {
  const parsed = parseSession(FILE);

  it("makes a turn of each prompt and what the agent did after it", () => {
    expect(parsed.turns.map((t) => t.prompt)).toEqual([
      "Fix the proxy",
      "Thanks!",
    ]);
    expect(parsed.turns[0].parts.map((p) => p.kind)).toEqual([
      "thinking",
      "text",
      "tool",
      "tool",
      "tool",
    ]);
    expect(parsed.turns[1].parts).toEqual([
      { kind: "text", text: "You're welcome." },
    ]);
    expect(parsed.startedAt).toBe(at(0));
    expect(parsed.cwd).toBe("/home/ada/shop");
  });

  it("matches tool results to their calls and describes each call", () => {
    const tools = parsed.turns[0].parts.filter((p) => p.kind === "tool");
    expect(tools[0]).toMatchObject({
      name: "Read",
      summary: "proxy.ts",
      output: "export const x = 1;",
      failed: false,
    });
    expect(tools[1]).toMatchObject({
      name: "Edit",
      summary: "proxy.ts · +2 −1",
      edit: { before: "x = 1", after: "x = 2\ny = 3" },
    });
    expect(tools[2]).toMatchObject({
      name: "Bash",
      summary: "Run tests",
      input: "pnpm test\nmore",
      output: "1 failed",
      failed: true,
    });
  });

  it("cuts long text and gives nothing for a file that isn't a session", () => {
    const long = parseSession(
      line({
        type: "user",
        message: { content: "x".repeat(SESSION_LIMITS.text + 50) },
      }),
    );
    expect(long.turns[0].prompt.length).toBeLessThan(SESSION_LIMITS.text + 60);
    expect(long.turns[0].prompt).toContain("more characters");
    expect(parseSession("hello\n{}\n[]").turns).toEqual([]);
    expect(parseSession("").turns).toEqual([]);
  });
});

const turn = (prompt: string, ...texts: string[]): SessionTurn => ({
  prompt,
  at: null,
  parts: texts.map((text) => ({ kind: "text" as const, text })),
});

describe("findSecrets", () => {
  const rules = (text: string, cwd?: string) =>
    findSecrets([turn(text)], { cwd }).map((f) => [f.rule, f.value]);

  it("finds API keys and tokens", () => {
    const key = "sk-ant-api03-abcdefghijklmnopqrstuvwxyz";
    const gh = "ghp_abcdefghijklmnopqrstuvwxyz0123456789";
    expect(rules(`use ${key} and ${gh}`)).toEqual([
      ["token", key],
      ["token", gh],
    ]);
    expect(rules("Authorization: Bearer abcdefghijklmnop1234")).toContainEqual([
      "token",
      "abcdefghijklmnop1234",
    ]);
    expect(rules('password = "hunter2hunter2"')).toContainEqual([
      "token",
      "hunter2hunter2",
    ]);
    expect(rules("postgres://ada:s3cretpw@db.example/shop")).toContainEqual([
      "token",
      "postgres://ada:s3cretpw@db.example",
    ]);
  });

  it("finds the values of sensitive environment lines, not the harmless ones", () => {
    const found = rules(
      "NODE_ENV=production\nRESEND_API_KEY=abc12345\nexport DB_URL=zzzz9999",
    );
    expect(found).toContainEqual(["env", "abc12345"]);
    expect(found).toContainEqual(["env", "zzzz9999"]);
    expect(found.some(([, value]) => value === "production")).toBe(false);
  });

  it("finds emails and the home folder", () => {
    expect(rules("write to ada@example.com")).toEqual([
      ["email", "ada@example.com"],
    ]);
    expect(rules("see /home/ada/shop/a.ts and C:\\Users\\Ada\\x.ts")).toEqual([
      ["home", "/home/ada"],
      ["home", "C:\\Users\\Ada"],
    ]);
    // the session's own folder counts even where the text doesn't say /home
    expect(rules("in ~/shop under /srv/ada/shop", "/srv/ada")).toEqual([]);
  });

  it("counts a value once however often it appears, and adds the author's own terms", () => {
    const found = findSecrets(
      [turn("a@b.co and a@b.co", "Acme Corp, acme corp")],
      {
        extra: ["acme corp"],
      },
    );
    expect(found.find((f) => f.rule === "email")).toMatchObject({ count: 2 });
    expect(found.find((f) => f.rule === "custom")).toMatchObject({
      value: "Acme Corp",
    });
    expect(
      found.filter((f) => f.rule === "custom").reduce((n, f) => n + f.count, 0),
    ).toBe(2);
  });

  it("gives a context with the value inside it, and ids that survive a re-scan", () => {
    const a = findSecrets([turn("mail ada@example.com now")])[0];
    const b = findSecrets([turn("other mail ada@example.com later")])[0];
    expect(a.context).toContain("ada@example.com");
    expect(a.id).toBe(b.id);
  });

  it("reads tool calls too", () => {
    const t: SessionTurn = {
      prompt: "x",
      at: null,
      parts: [
        {
          kind: "tool",
          name: "Bash",
          summary: "",
          input: "cat .env",
          output: "STRIPE_SECRET_KEY=sk_live_abcdefghijklmnop1234",
          failed: false,
        },
      ],
    };
    expect(findSecrets([t]).map((f) => f.rule)).toContain("token");
  });
});

describe("redaction", () => {
  it("replaces every value, the longest first, in any case", () => {
    expect(redactText("a /home/ada/x /HOME/ADA", ["/home/ada", "ada"])).toBe(
      `a ${REDACTED}/x ${REDACTED}`,
    );
    expect(redactText("nothing", [])).toBe("nothing");
    expect(redactText("a.b", ["a.b"])).toBe(REDACTED);
    expect(redactText("axb", ["a.b"])).toBe("axb");
  });

  it("reaches every field of a turn", () => {
    const t: SessionTurn = {
      prompt: "my key is SECRET",
      at: null,
      parts: [
        { kind: "text", text: "SECRET" },
        { kind: "thinking", text: "SECRET" },
        {
          kind: "tool",
          name: "Edit",
          summary: "SECRET",
          input: "SECRET",
          output: "SECRET",
          failed: false,
          edit: { before: "SECRET", after: "SECRET" },
        },
      ],
    };
    expect(JSON.stringify(redactTurns([t], ["SECRET"]))).not.toContain(
      "SECRET",
    );
    expect(JSON.stringify(t)).toContain("SECRET"); // the original is untouched
  });

  it("chooses turns and drops thinking unless asked", () => {
    const t: SessionTurn = {
      prompt: "p",
      at: null,
      parts: [
        { kind: "thinking", text: "hm" },
        { kind: "text", text: "ok" },
      ],
    };
    const picked = new Set([1]);
    expect(chooseTurns([turn("a"), t], picked, false)[0].parts).toEqual([
      { kind: "text", text: "ok" },
    ]);
    expect(chooseTurns([turn("a"), t], picked, true)[0].parts).toHaveLength(2);
    expect(chooseTurns([turn("a"), t], new Set(), true)).toEqual([]);
  });
});

describe("preparing a session to save", () => {
  const turns = [
    turn("Fix the proxy for ada@example.com please"),
    turn("Thanks"),
    turn("Bye"),
  ];

  it("titles from the first prompt, cut short", () => {
    expect(defaultTitle(turns)).toBe(
      "Fix the proxy for ada@example.com please",
    );
    expect(defaultTitle([turn("x".repeat(100))])).toHaveLength(58);
    expect(defaultTitle([])).toBe("Agent session");
  });

  it("picks a range of turns", () => {
    expect([...turnRange(2, 3, 3)]).toEqual([1, 2]);
    expect([...turnRange(0, 99, 2)]).toEqual([0, 1]);
    expect([...turnRange(3, 2, 3)]).toEqual([]);
  });

  it("keeps only the chosen turns, redacted, with a redacted title", () => {
    const payload = buildPayload(turns, {
      picked: new Set([0, 2]),
      includeThinking: false,
      hide: ["ada@example.com"],
      title: " Fix for ada@example.com ",
    });
    expect(payload.title).toBe(`Fix for ${REDACTED}`);
    expect(payload.turns.map((t) => t.prompt)).toEqual([
      `Fix the proxy for ${REDACTED} please`,
      "Bye",
    ]);
    expect(payload.tools).toBe(toolCount(payload.turns));
    expect(payloadProblem(payload)).toBeNull();
  });

  it("says what stops a session from being saved", () => {
    const base = { includeThinking: false, hide: [], title: "T" };
    expect(
      payloadProblem(buildPayload(turns, { ...base, picked: new Set() })),
    ).toBe("Pick at least one turn.");
    expect(
      payloadProblem(
        buildPayload(turns, { ...base, picked: new Set([0]), title: "  " }),
      ),
    ).toBe("Give the session a title.");
    const many = Array.from({ length: SESSION_LIMITS.turns + 1 }, () =>
      turn("a"),
    );
    expect(
      payloadProblem(
        buildPayload(many, { ...base, picked: new Set(many.map((_, i) => i)) }),
      ),
    ).toMatch(/at most/);
    const heavy = [turn("a", "x".repeat(SESSION_LIMITS.text))];
    const repeated = Array.from({ length: 100 }, () => heavy[0]);
    expect(
      payloadProblem(
        buildPayload(repeated, {
          ...base,
          picked: new Set(repeated.map((_, i) => i)),
        }),
      ),
    ).toMatch(/too much text/);
  });
});

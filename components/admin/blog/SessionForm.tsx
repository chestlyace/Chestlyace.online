"use client";

import { FileUp, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Button } from "@/components/shared/Button";
import { FormField } from "@/components/shared/FormField";
import type { SessionInfo } from "@/lib/admin/sessionsApi";
import type { EditorBlock } from "@/lib/blog/editor";
import { parseSession } from "@/lib/blog/session/parse";
import {
  buildPayload,
  defaultTitle,
  payloadProblem,
  turnRange,
} from "@/lib/blog/session/prepare";
import {
  chooseTurns,
  findSecrets,
  RULES,
  type Finding,
  type RuleId,
} from "@/lib/blog/session/redact";
import {
  SESSION_LIMITS,
  type ParsedSession,
  type SessionTurn,
} from "@/lib/blog/session/types";
import { cn } from "@/lib/cn";
import { Switch } from "../Switch";
import { TextInput, inputClass } from "./formParts";

// The agent session block's form (design.md §13.48): upload a Claude Code session
// file, choose its turns, review what is hidden, save. The file is read in the
// browser; only the turns kept, already redacted, are sent.

type Block = Extract<EditorBlock, { type: "session" }>;

const MAX_FILE = 100 * 1024 * 1024;
const RULE_ORDER: RuleId[] = ["token", "env", "email", "home"];

type Loaded = { id: string; info: SessionInfo } | { id: string; info: null };

// What the stored session is called, and how long, for the block's summary.
function useSessionInfo(id: string): SessionInfo | null | "loading" {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  useEffect(() => {
    if (!id) return;
    let live = true;
    fetch(`/api/admin/blog/sessions/${id}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { item?: SessionInfo } | null) => {
        if (live) setLoaded({ id, info: data?.item ?? null });
      })
      .catch(() => {
        if (live) setLoaded({ id, info: null });
      });
    return () => {
      live = false;
    };
  }, [id]);
  if (!id) return null;
  return loaded?.id === id ? loaded.info : "loading";
}

export function SessionForm({
  block,
  onChange,
}: {
  block: Block;
  onChange: (next: Block) => void;
}) {
  const info = useSessionInfo(block.sessionId);
  const [uploading, setUploading] = useState(!block.sessionId);

  if (uploading) {
    return (
      <SessionUpload
        onCancel={block.sessionId ? () => setUploading(false) : undefined}
        onSaved={(saved) => {
          onChange({
            ...block,
            sessionId: saved.id,
            title: saved.title,
            from: null,
            to: null,
          });
          setUploading(false);
        }}
      />
    );
  }

  const total = info && info !== "loading" ? info.turnCount : null;
  const setTurn = (key: "from" | "to", value: string) => {
    const n = Number(value);
    onChange({
      ...block,
      [key]: value === "" || !Number.isInteger(n) || n < 1 ? null : n,
    });
  };

  return (
    <div className="grid gap-4">
      <div className="rounded-lg bg-surface p-4">
        {info === "loading" ? (
          <p className="text-sm text-muted">Loading the session…</p>
        ) : info === null ? (
          <p className="text-sm text-danger" role="alert">
            This session can&rsquo;t be found any more. Upload it again.
          </p>
        ) : (
          <>
            <p className="font-medium text-foreground">{info.title}</p>
            <p className="mt-1 text-sm text-muted">
              {info.turnCount} turns · {info.toolCallCount} tool calls
              {block.from != null || block.to != null
                ? ` · showing turns ${block.from ?? 1}–${block.to ?? info.turnCount}`
                : ""}
            </p>
          </>
        )}
      </div>
      <TextInput
        label="Title"
        value={block.title}
        onChange={(title) => onChange({ ...block, title })}
        helper="Shown in the replay's header."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id={`${block.id}-from`}
          label="First turn shown"
          optional
          helper={total ? `Of ${total}. Empty means the first.` : undefined}
        >
          <input
            id={`${block.id}-from`}
            type="number"
            min={1}
            max={total ?? undefined}
            inputMode="numeric"
            value={block.from ?? ""}
            onChange={(event) => setTurn("from", event.target.value)}
            className={inputClass}
          />
        </FormField>
        <FormField
          id={`${block.id}-to`}
          label="Last turn shown"
          optional
          helper={total ? `Of ${total}. Empty means the last.` : undefined}
        >
          <input
            id={`${block.id}-to`}
            type="number"
            min={1}
            max={total ?? undefined}
            inputMode="numeric"
            value={block.to ?? ""}
            onChange={(event) => setTurn("to", event.target.value)}
            className={inputClass}
          />
        </FormField>
      </div>
      <div>
        <Button
          variant="secondary"
          size="sm"
          magnetic={false}
          onClick={() => setUploading(true)}
        >
          Replace with another session
        </Button>
      </div>
    </div>
  );
}

// ---- upload ----------------------------------------------------------------------

function SessionUpload({
  onSaved,
  onCancel,
}: {
  onSaved: (info: SessionInfo) => void;
  onCancel?: () => void;
}) {
  const fileId = useId();
  const [parsed, setParsed] = useState<ParsedSession | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [thinking, setThinking] = useState(false);
  const [extra, setExtra] = useState<string[]>([]);
  const [shown, setShown] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState("");

  const read = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    if (file.size > MAX_FILE) {
      setError("That file is over 100 MB. Pick a smaller session.");
      return;
    }
    const result = parseSession(await file.text());
    if (result.turns.length === 0) {
      setParsed(null);
      setError(
        "No turns found in that file. Pick a Claude Code session (a .jsonl file from ~/.claude/projects/).",
      );
      return;
    }
    setParsed(result);
    setFileName(file.name);
    setPicked(new Set(result.turns.map((_, index) => index)));
    setTitle(defaultTitle(result.turns));
    setExtra([]);
    setShown(new Set());
    setThinking(false);
  };

  // What the scan finds in the turns as chosen (thinking only if included).
  const chosen = useMemo(
    () => (parsed ? chooseTurns(parsed.turns, picked, thinking) : []),
    [parsed, picked, thinking],
  );
  const findings = useMemo(
    () => findSecrets(chosen, { extra, cwd: parsed?.cwd }),
    [chosen, extra, parsed],
  );
  const automatic = findings.filter((f) => f.rule !== "custom");
  const hide = [
    ...automatic.filter((f) => !shown.has(f.id)).map((f) => f.value),
    ...extra,
  ];

  const payload = parsed
    ? buildPayload(parsed.turns, {
        picked,
        includeThinking: thinking,
        hide,
        title,
      })
    : null;
  const problem = payload ? payloadProblem(payload) : null;

  const save = async () => {
    if (!payload || problem) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/blog/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: payload.title, turns: payload.turns }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        item?: SessionInfo;
      };
      if (!response.ok || !data.item) {
        setError("The session couldn’t be saved. Try again.");
        return;
      }
      onSaved(data.item);
    } catch {
      setError("The session couldn’t be saved. Check your connection.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-5 [&>*]:min-w-0">
      <div className="grid gap-2 [&>*]:min-w-0">
        <p className="text-sm text-muted">
          Pick a Claude Code session file (a <code>.jsonl</code> in{" "}
          <code>~/.claude/projects/</code>). It is read in your browser and
          never leaves it: only the turns you keep, with the hidden values
          removed, are saved.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <label
            htmlFor={fileId}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary-hover has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary"
          >
            <FileUp className="size-4" aria-hidden="true" />
            {parsed ? "Choose another file" : "Upload a session"}
            <input
              id={fileId}
              type="file"
              accept=".jsonl,.json,.txt,application/json,text/plain"
              className="sr-only"
              onChange={(event) => {
                void read(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </label>
          {fileName ? (
            <span className="text-sm text-muted">{fileName}</span>
          ) : null}
          {onCancel ? (
            <Button
              variant="ghost"
              size="sm"
              magnetic={false}
              onClick={onCancel}
            >
              Keep the current session
            </Button>
          ) : null}
        </div>
        {error ? (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      {parsed && payload ? (
        <>
          <TurnPicker
            turns={parsed.turns}
            picked={picked}
            onChange={setPicked}
            thinking={thinking}
            onThinking={setThinking}
          />
          <RedactionReview
            findings={automatic}
            shown={shown}
            onShown={setShown}
            extra={extra}
            onExtra={setExtra}
            custom={findings.filter((f) => f.rule === "custom")}
          />
          <section className="grid gap-3 [&>*]:min-w-0" aria-label="Save">
            <TextInput
              label="Title"
              value={title}
              onChange={setTitle}
              helper={`Shown in the replay's header, at most ${SESSION_LIMITS.title} characters.`}
            />
            <p className="text-sm text-muted" aria-live="polite">
              {payload.turns.length} turns · {payload.tools} tool calls ·{" "}
              {hide.length} values hidden
            </p>
            {problem ? (
              <p className="text-sm text-danger" role="alert">
                {problem}
              </p>
            ) : null}
            <div>
              <Button
                magnetic={false}
                loading={saving}
                disabled={!!problem}
                onClick={() => void save()}
              >
                Save session
              </Button>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

// ---- turns -----------------------------------------------------------------------

const preview = (text: string) => {
  const line = text.replace(/\s+/g, " ").trim();
  return line.length > 160 ? `${line.slice(0, 157)}…` : line;
};

function TurnPicker({
  turns,
  picked,
  onChange,
  thinking,
  onThinking,
}: {
  turns: SessionTurn[];
  picked: Set<number>;
  onChange: (next: Set<number>) => void;
  thinking: boolean;
  onThinking: (next: boolean) => void;
}) {
  const [from, setFrom] = useState("1");
  const [to, setTo] = useState(String(turns.length));
  const toggle = (index: number) => {
    const next = new Set(picked);
    if (!next.delete(index)) next.add(index);
    onChange(next);
  };

  return (
    <section className="grid gap-3 [&>*]:min-w-0" aria-label="Turns">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">Turns</h3>
          <p className="text-sm text-muted">
            {picked.size} of {turns.length} chosen. A turn is one prompt and
            everything the agent did before the next.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Button
            variant="secondary"
            size="sm"
            magnetic={false}
            onClick={() => onChange(new Set(turns.map((_, i) => i)))}
          >
            All
          </Button>
          <Button
            variant="secondary"
            size="sm"
            magnetic={false}
            onClick={() => onChange(new Set())}
          >
            None
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <label htmlFor="session-range-from">Choose turns</label>
        <input
          id="session-range-from"
          type="number"
          min={1}
          max={turns.length}
          value={from}
          onChange={(event) => setFrom(event.target.value)}
          className={cn(inputClass, "h-10 w-20 px-3")}
        />
        <label htmlFor="session-range-to">to</label>
        <input
          id="session-range-to"
          type="number"
          min={1}
          max={turns.length}
          value={to}
          onChange={(event) => setTo(event.target.value)}
          className={cn(inputClass, "h-10 w-20 px-3")}
        />
        <Button
          variant="secondary"
          size="sm"
          magnetic={false}
          onClick={() =>
            onChange(turnRange(Number(from), Number(to), turns.length))
          }
        >
          Use this range
        </Button>
      </div>
      <ul className="grid max-h-[26rem] gap-1 overflow-y-auto rounded-lg bg-surface p-2 [&>*]:min-w-0">
        {turns.map((turn, index) => {
          const tools = turn.parts.filter((p) => p.kind === "tool");
          const id = `session-turn-${index}`;
          return (
            <li
              key={index}
              className="rounded-md px-2 py-2 hover:bg-surface-raised"
            >
              <div className="flex items-start gap-3">
                <input
                  id={id}
                  type="checkbox"
                  checked={picked.has(index)}
                  onChange={() => toggle(index)}
                  className="mt-1 size-4 shrink-0 accent-[var(--primary)]"
                />
                <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
                  <span className="type-label text-muted">
                    Turn {index + 1}
                  </span>
                  <span className="mt-0.5 block text-sm text-foreground">
                    {preview(turn.prompt)}
                  </span>
                </label>
              </div>
              {tools.length ? (
                <details className="mt-1 pl-7 text-sm text-muted">
                  <summary className="cursor-pointer">
                    {tools.length} tool call{tools.length === 1 ? "" : "s"}
                  </summary>
                  <ul className="mt-1 grid gap-0.5 font-mono text-[0.8125rem]">
                    {tools.map((tool, i) => (
                      <li key={i} className="truncate">
                        {tool.name}
                        {tool.summary ? ` · ${tool.summary}` : ""}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </li>
          );
        })}
      </ul>
      <div className="flex items-center justify-between gap-4 rounded-lg bg-surface p-3 pl-4">
        <span className="text-sm font-medium text-foreground">
          Include the agent&rsquo;s thinking
        </span>
        <Switch
          checked={thinking}
          onChange={onThinking}
          label="Include the agent's thinking"
        />
      </div>
    </section>
  );
}

// ---- redaction -------------------------------------------------------------------

// The context of a finding with the hidden value marked.
function Context({ finding }: { finding: Finding }) {
  const at = finding.context.indexOf(finding.value);
  if (at === -1) return <span className="break-words">{finding.context}</span>;
  return (
    <span className="break-words">
      {finding.context.slice(0, at)}
      <mark className="rounded bg-danger/15 px-0.5 text-foreground">
        {finding.value}
      </mark>
      {finding.context.slice(at + finding.value.length)}
    </span>
  );
}

function RedactionReview({
  findings,
  shown,
  onShown,
  extra,
  onExtra,
  custom,
}: {
  findings: Finding[];
  shown: Set<string>;
  onShown: (next: Set<string>) => void;
  extra: string[];
  onExtra: (next: string[]) => void;
  custom: Finding[];
}) {
  const [term, setTerm] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const add = () => {
    const value = term.trim();
    if (value && !extra.some((t) => t.toLowerCase() === value.toLowerCase()))
      onExtra([...extra, value]);
    setTerm("");
    input.current?.focus();
  };
  const places = (value: string) =>
    custom
      .filter((f) => f.value.toLowerCase() === value.toLowerCase())
      .reduce((sum, f) => sum + f.count, 0);

  return (
    <section className="grid gap-3 [&>*]:min-w-0" aria-label="Redaction review">
      <div>
        <h3 className="text-base font-semibold text-foreground">
          What will be hidden
        </h3>
        <p className="text-sm text-muted">
          Each value found is replaced with a <code>[redacted]</code> mark
          wherever it appears. Turn one off to keep it.
        </p>
      </div>
      {findings.length === 0 ? (
        <p className="rounded-lg bg-surface p-4 text-sm text-muted">
          Nothing to hide was found in the turns you chose. Check the text
          yourself, and add anything else below.
        </p>
      ) : (
        RULE_ORDER.map((rule) => {
          const rows = findings.filter((f) => f.rule === rule);
          if (!rows.length) return null;
          return (
            <div key={rule} className="grid gap-1 [&>*]:min-w-0">
              <p className="type-label text-muted">
                {RULES[rule].label} · {rows.length}
              </p>
              <ul className="grid gap-1 [&>*]:min-w-0">
                {rows.map((finding) => (
                  <li
                    key={finding.id}
                    className="flex items-start justify-between gap-4 rounded-lg bg-surface p-3 pl-4"
                  >
                    <div className="min-w-0 text-sm">
                      <p className="font-mono text-[0.8125rem] text-muted">
                        <Context finding={finding} />
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {finding.count} place{finding.count === 1 ? "" : "s"}
                      </p>
                    </div>
                    <Switch
                      checked={!shown.has(finding.id)}
                      onChange={(hidden) => {
                        const next = new Set(shown);
                        if (hidden) next.delete(finding.id);
                        else next.add(finding.id);
                        onShown(next);
                      }}
                      label={`Hide ${RULES[rule].label.toLowerCase()}: ${finding.value}`}
                    />
                  </li>
                ))}
              </ul>
            </div>
          );
        })
      )}
      <div className="grid gap-2">
        <FormField
          id="session-extra"
          label="Add anything else to hide"
          optional
          helper="A name, a client, a project: every place it appears, in any case, is hidden."
        >
          <div className="flex gap-2">
            <input
              id="session-extra"
              ref={input}
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  add();
                }
              }}
              className={inputClass}
            />
            <Button
              variant="secondary"
              magnetic={false}
              disabled={!term.trim()}
              onClick={add}
            >
              Add
            </Button>
          </div>
        </FormField>
        {extra.length ? (
          <ul className="flex flex-wrap gap-2">
            {extra.map((value) => (
              <li
                key={value}
                className="flex items-center gap-1 rounded-full bg-surface py-1 pr-1 pl-3 text-sm"
              >
                <span>
                  {value}{" "}
                  <span className="text-muted">
                    · {places(value)} place{places(value) === 1 ? "" : "s"}
                  </span>
                </span>
                <button
                  type="button"
                  aria-label={`Stop hiding ${value}`}
                  onClick={() => onExtra(extra.filter((t) => t !== value))}
                  className="grid size-6 place-items-center rounded-full text-muted hover:bg-tile-hover hover:text-foreground"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

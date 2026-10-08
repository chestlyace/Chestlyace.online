"use client";

import {
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Pause,
  Play,
  SkipBack,
  SkipForward,
} from "lucide-react";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  REPLAY,
  buildTimeline,
  finishedTurns,
  replayState,
  timeAfterTurns,
  typedPrefix,
  type ReplayState,
  type TurnShape,
} from "@/lib/blog/replay";
import { cn } from "@/lib/cn";
import { usePrefersReducedMotion } from "@/lib/media";
import { Redacted } from "./Redacted";
import { useReplayClock } from "./useReplayClock";

// What the server hands over for each turn (SessionBlock).
export type ReplayDiffLine = { type: "add" | "remove" | "same"; text: string };

export type ReplayPart =
  | {
      kind: "text";
      /** The reply's markdown, drawn on the server. */
      body: ReactNode;
      lines: number;
    }
  | { kind: "thinking"; text: string; lines: number }
  | {
      kind: "tool";
      name: string;
      summary: string;
      input: string;
      output: string;
      failed: boolean;
      /** For an edit: the change, line by line. */
      diff: ReplayDiffLine[] | null;
    };

export type ReplayTurn = {
  number: number;
  prompt: string;
  parts: ReplayPart[];
};

const CUT = 40;

const shapeOf = (turn: ReplayTurn): TurnShape => ({
  promptLength: turn.prompt.length,
  parts: turn.parts.map((part) => ({
    kind: part.kind,
    lines: part.kind === "tool" ? 1 : part.lines,
  })),
});

const label = "type-label select-none";

// `session` (design.md §13.47): a replayable transcript of an agent session, in a
// dark window like the terminal's. At first it shows six turns and a Play button;
// Play reveals the turns one by one, never by itself. Every turn is in the page
// from the start (the ones not on screen are visually hidden, not removed), so
// assistive technology reads the whole session.
export function SessionReplay({
  title,
  turns,
  toolCalls,
}: {
  title: string;
  turns: ReplayTurn[];
  toolCalls: number;
}) {
  const reduced = usePrefersReducedMotion();
  const shapes = useMemo(() => turns.map(shapeOf), [turns]);
  const timeline = useMemo(() => buildTimeline(shapes), [shapes]);
  const clock = useReplayClock(timeline.total);
  const [mode, setMode] = useState<"idle" | "replay">("idle");
  const [expanded, setExpanded] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const progress = useId();

  const initial = Math.min(REPLAY.initialTurns, turns.length);
  const state: ReplayState =
    mode === "replay"
      ? replayState(shapes, timeline, clock.elapsed)
      : { shown: initial, chars: 0, parts: 0, done: true };
  const everything = expanded;
  const complete =
    mode === "replay"
      ? finishedTurns(shapes, timeline, clock.elapsed)
      : initial;

  // Keep the newest turn in view, inside the transcript (never scrolling the page).
  const last = state.shown;
  const parts = state.parts;
  const chars = state.chars;
  useEffect(() => {
    const box = scroller.current;
    if (!box || mode !== "replay" || everything) return;
    box.scrollTo({
      top: box.scrollHeight,
      behavior: reduced ? "instant" : "smooth",
    });
  }, [mode, everything, last, parts, chars, reduced]);

  const seekTo = (count: number) => {
    const target = Math.max(0, Math.min(turns.length, count));
    setMode("replay");
    setExpanded(false);
    clock.seek(timeAfterTurns(timeline, target));
  };

  const atEnd = mode === "replay" && state.done && state.shown === turns.length;
  const startPlaying = () => {
    if (mode === "idle" || atEnd) {
      setExpanded(false);
      setMode("replay");
      clock.seek(0);
    }
    clock.play();
  };

  const range = turns.length
    ? `${turns[0].number} to ${turns[turns.length - 1].number}`
    : "";

  return (
    <section
      aria-label={`${title}: agent session`}
      className="my-8 overflow-hidden rounded-lg border border-border bg-[#0a0a0a] text-[#f5f5f7]"
    >
      <div className="flex min-h-10 flex-wrap items-center justify-between gap-x-4 border-b border-[#262626] bg-[#171717] py-1.5 pr-4 pl-4 text-[#a1a1a6]">
        <span className="min-w-0 truncate text-sm font-medium text-[#f5f5f7]">
          {title}
        </span>
        <span className={cn(label, "flex items-center gap-3")}>
          <span>Claude Code</span>
          <span aria-hidden="true">·</span>
          <span>
            {turns.length} turns · {toolCalls} tool calls
          </span>
        </span>
      </div>

      <div
        ref={scroller}
        role="group"
        aria-label={`Transcript, turns ${range}`}
        tabIndex={0}
        className="max-h-[560px] overflow-y-auto outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      >
        <ol className="grid gap-5 px-4 py-4 font-mono text-[0.875rem] leading-[1.65] sm:px-5">
          {turns.map((turn, index) => {
            const onScreen = everything || index < state.shown;
            const going =
              !everything &&
              mode === "replay" &&
              index === state.shown - 1 &&
              !state.done;
            return (
              <Turn
                key={turn.number}
                turn={turn}
                onScreen={onScreen}
                animate={mode === "replay" && !reduced && !everything}
                typing={
                  going ? { chars: state.chars, parts: state.parts } : null
                }
                expanded={expanded}
              />
            );
          })}
        </ol>
      </div>

      <div className="flex flex-wrap items-center gap-x-1 gap-y-2 border-t border-[#262626] bg-[#171717] px-2 py-1.5 text-[#a1a1a6] [&_button]:text-[#a1a1a6] [&_button:hover]:bg-white/10 [&_button:hover]:text-[#f5f5f7]">
        {clock.playing ? (
          <ControlButton onClick={clock.pause} text="Pause" icon={<Pause />} />
        ) : (
          <ControlButton
            onClick={startPlaying}
            text={mode === "idle" ? "Play session" : atEnd ? "Replay" : "Play"}
            icon={<Play />}
            strong={mode === "idle"}
          />
        )}
        <IconControl
          label="Previous turn"
          disabled={complete <= 0 && mode === "replay"}
          onClick={() => seekTo(complete - 1)}
          icon={<SkipBack />}
        />
        <IconControl
          label="Next turn"
          disabled={complete >= turns.length}
          onClick={() => seekTo(complete + 1)}
          icon={<SkipForward />}
        />
        <button
          type="button"
          aria-label={`Speed: ${clock.speed}×. Change speed`}
          onClick={() => clock.setSpeed(clock.speed === 1 ? 2 : 1)}
          className="type-label h-8 min-w-10 rounded-full px-3 transition-colors duration-150"
        >
          {clock.speed}×
        </button>
        <div className="flex min-w-24 flex-1 items-center gap-3 px-2">
          <label htmlFor={progress} className="sr-only">
            Turns shown
          </label>
          <input
            id={progress}
            type="range"
            min={0}
            max={turns.length}
            step={1}
            value={everything ? turns.length : complete}
            onChange={(event) => seekTo(Number(event.target.value))}
            aria-valuetext={`${everything ? turns.length : complete} of ${turns.length} turns`}
            className="h-1 w-full cursor-pointer accent-[#60a5fa]"
          />
          <span
            aria-hidden="true"
            className={cn(label, "shrink-0 tabular-nums")}
          >
            {everything ? turns.length : complete}/{turns.length}
          </span>
        </div>
        <ControlButton
          onClick={() => setExpanded((open) => !open)}
          text={expanded ? "Collapse" : "Expand all"}
          icon={expanded ? <ChevronsDownUp /> : <ChevronsUpDown />}
          pressed={expanded}
        />
      </div>
    </section>
  );
}

function ControlButton({
  onClick,
  text,
  icon,
  strong,
  pressed,
}: {
  onClick: () => void;
  text: string;
  icon: ReactNode;
  strong?: boolean;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={cn(
        "type-label inline-flex h-8 items-center gap-1.5 rounded-full px-3 transition-colors duration-150 [&_svg]:size-4",
        strong && "bg-[#60a5fa]/15 !text-[#93c5fd]",
      )}
    >
      <span aria-hidden="true" className="contents">
        {icon}
      </span>
      {text}
    </button>
  );
}

function IconControl({
  label: name,
  icon,
  onClick,
  disabled,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={name}
      disabled={disabled}
      onClick={onClick}
      className="relative grid size-8 place-items-center rounded-full transition-colors duration-150 before:absolute before:-inset-1 before:content-[''] disabled:opacity-40 [&_svg]:size-4"
    >
      {icon}
    </button>
  );
}

// ---- a turn ----------------------------------------------------------------------

function Turn({
  turn,
  onScreen,
  animate,
  typing,
  expanded,
}: {
  turn: ReplayTurn;
  onScreen: boolean;
  animate: boolean;
  /** While this turn is being played: how much of it has appeared. */
  typing: { chars: number; parts: number } | null;
  expanded: boolean;
}) {
  const prompt = typing ? typedPrefix(turn.prompt, typing.chars) : turn.prompt;
  const rise = animate ? "animate-[replay-in_250ms_ease-out_both]" : "";
  return (
    <li className={cn(!onScreen && "sr-only", onScreen && rise)}>
      <div className="grid gap-3">
        <div className="border-l-2 border-[#60a5fa] pl-3">
          <p className={cn(label, "mb-1 text-[#60a5fa]")}>You</p>
          {typing ? <span className="sr-only">{turn.prompt}</span> : null}
          <p
            aria-hidden={typing ? true : undefined}
            className="break-words whitespace-pre-wrap text-[#f5f5f7]"
          >
            <Redacted text={prompt} />
            {typing && typing.parts === 0 ? (
              <span className="ml-px inline-block h-[1.1em] w-[0.55em] translate-y-[0.2em] animate-[caret-blink_1s_steps(1)_infinite] bg-[#60a5fa] motion-reduce:animate-none" />
            ) : null}
          </p>
        </div>
        {turn.parts.map((part, index) => {
          const appeared = !typing || index < typing.parts;
          return (
            <div
              key={index}
              className={cn(
                !appeared && "sr-only",
                appeared &&
                  typing &&
                  animate &&
                  index === typing.parts - 1 &&
                  rise,
              )}
            >
              <Part part={part} expanded={expanded} />
            </div>
          );
        })}
      </div>
    </li>
  );
}

function Part({ part, expanded }: { part: ReplayPart; expanded: boolean }) {
  if (part.kind === "text")
    return (
      <div>
        <p className={cn(label, "mb-1 text-[#a1a1a6]")}>Agent</p>
        <div className="grid gap-2 break-words text-[#f5f5f7] [&_a]:text-[#93c5fd] [&_a]:underline [&_code]:rounded-sm [&_code]:bg-[#262626] [&_code]:px-1 [&_li]:ml-5 [&_ol]:list-decimal [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-[#171717] [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_ul]:list-disc">
          {part.body}
        </div>
      </div>
    );
  if (part.kind === "thinking")
    return (
      <details className="group/thinking text-[#8e8e93]">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-sm italic outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
          <ChevronRight
            aria-hidden="true"
            className="size-4 transition-transform duration-150 group-open/thinking:rotate-90"
          />
          Thinking
        </summary>
        <p className="mt-1 break-words whitespace-pre-wrap pl-5 italic">
          <Redacted text={part.text} />
        </p>
      </details>
    );
  return <ToolCall part={part} expanded={expanded} />;
}

function Cut({ text, open }: { text: string; open: boolean }) {
  const [all, setAll] = useState(false);
  const lines = text.split("\n");
  const long = lines.length > CUT;
  const showing = !long || all || open ? lines : lines.slice(0, CUT);
  return (
    <>
      <pre className="overflow-x-auto whitespace-pre text-[0.8125rem] text-[#d1d1d6]">
        <Redacted text={showing.join("\n")} />
      </pre>
      {long && !all && !open ? (
        <button
          type="button"
          onClick={() => setAll(true)}
          className="type-label mt-1 rounded-sm text-[#93c5fd] underline underline-offset-2"
        >
          Show all {lines.length} lines
        </button>
      ) : null}
    </>
  );
}

function ToolCall({
  part,
  expanded,
}: {
  part: Extract<ReplayPart, { kind: "tool" }>;
  expanded: boolean;
}) {
  const [all, setAll] = useState(false);
  return (
    <details
      open={expanded || undefined}
      className="group/tool rounded-md border border-[#262626] bg-[#111111]"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md px-3 py-2 outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
        <ChevronRight
          aria-hidden="true"
          className="size-4 shrink-0 text-[#a1a1a6] transition-transform duration-150 group-open/tool:rotate-90"
        />
        <span className="shrink-0 font-semibold text-[#f5f5f7]">
          {part.name}
        </span>
        {part.summary ? (
          <span className="min-w-0 truncate text-[#a1a1a6]">
            · <Redacted text={part.summary} />
          </span>
        ) : null}
        {part.failed ? (
          <span className={cn(label, "ml-auto shrink-0 text-[#f87171]")}>
            Failed
          </span>
        ) : null}
      </summary>
      <div className="grid gap-2 border-t border-[#262626] px-3 py-2">
        {part.diff ? (
          <DiffLines
            lines={part.diff}
            all={all || expanded}
            onAll={() => setAll(true)}
          />
        ) : part.input ? (
          <Cut text={part.input} open={expanded} />
        ) : null}
        {part.output ? (
          <div>
            <p className={cn(label, "mb-1 text-[#8e8e93]")}>Output</p>
            <Cut text={part.output} open={expanded} />
          </div>
        ) : null}
      </div>
    </details>
  );
}

function DiffLines({
  lines,
  all,
  onAll,
}: {
  lines: ReplayDiffLine[];
  all: boolean;
  onAll: () => void;
}) {
  const long = lines.length > CUT;
  const showing = long && !all ? lines.slice(0, CUT) : lines;
  return (
    <>
      <pre className="overflow-x-auto text-[0.8125rem]">
        <code className="grid min-w-max">
          {showing.map((line, index) => (
            <span
              key={index}
              className={cn(
                "flex min-h-[1lh]",
                line.type === "add" && "bg-[#34d399]/10",
                line.type === "remove" && "bg-[#f87171]/10",
              )}
            >
              <span
                aria-label={
                  line.type === "add"
                    ? "added"
                    : line.type === "remove"
                      ? "removed"
                      : undefined
                }
                className={cn(
                  "w-6 shrink-0 text-center select-none",
                  line.type === "add" && "text-[#34d399]",
                  line.type === "remove" && "text-[#f87171]",
                )}
              >
                {line.type === "add" ? "+" : line.type === "remove" ? "−" : " "}
              </span>
              <span className="pr-3 text-[#d1d1d6]">
                <Redacted text={line.text} />
              </span>
            </span>
          ))}
        </code>
      </pre>
      {long && !all ? (
        <button
          type="button"
          onClick={onAll}
          className="type-label rounded-sm text-left text-[#93c5fd] underline underline-offset-2"
        >
          Show all {lines.length} lines
        </button>
      ) : null}
    </>
  );
}

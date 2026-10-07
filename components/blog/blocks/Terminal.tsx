"use client";

import { RotateCcw } from "lucide-react";
import { useRef } from "react";
import type { TerminalRow } from "@/lib/blog/blocks";
import { totalTerminalMs, terminalState } from "@/lib/blog/typing";
import { usePrefersReducedMotion } from "@/lib/media";
import { CopyButton } from "./CopyButton";
import { useClock } from "./useClock";
import { useReveal } from "./useReveal";

// `terminal` (design.md §13.44): a terminal window. Always dark, in both
// themes. Commands type at 22ms a character and their output prints after them;
// replay runs it again; Skip or a click finishes it. The whole session is in
// the page from the start for assistive technology. Copy puts only the commands
// on the clipboard.
export function Terminal({
  title,
  rows,
}: {
  title: string | null;
  rows: TerminalRow[];
}) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const total = totalTerminalMs(rows);
  const clock = useClock(total);
  useReveal(ref, clock.start);

  const state = reduced
    ? { shown: rows.length, typing: null, done: true }
    : terminalState(rows, clock.elapsed);
  const commands = rows
    .filter((row) => row.type === "command")
    .map((row) => row.text);
  const plain = rows
    .map((row) =>
      row.type === "command"
        ? `$ ${row.text}`
        : row.type === "comment"
          ? `# ${row.text}`
          : row.text,
    )
    .join("\n");
  const caretAt = state.typing?.row ?? (state.done ? -1 : state.shown);

  return (
    <div
      ref={ref}
      onClick={clock.playing ? clock.skip : undefined}
      className="my-8 overflow-hidden rounded-lg border border-border bg-[#0a0a0a] text-[#f5f5f7]"
    >
      <div className="flex h-10 items-center justify-between border-b border-[#262626] bg-[#171717] pr-1.5 pl-4 text-[#a1a1a6]">
        <span className="type-label truncate">{title ?? "terminal"}</span>
        <div className="flex items-center gap-0.5 [&_button]:text-[#a1a1a6] [&_button:hover]:bg-white/10 [&_button:hover]:text-[#f5f5f7]">
          {clock.playing && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                clock.skip();
              }}
              className="type-label rounded-full px-3 py-1.5 transition-colors duration-150"
            >
              Skip
            </button>
          )}
          {!reduced && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                if (clock.playing) clock.skip();
                else clock.replay();
              }}
              aria-label={
                clock.playing ? "Finish the session" : "Replay the session"
              }
              className="relative grid size-8 place-items-center rounded-full transition-colors duration-150 before:absolute before:-inset-1 before:content-['']"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
            </button>
          )}
          <CopyButton text={commands.join("\n")} label="Copy commands" />
        </div>
      </div>
      <div
        role="region"
        aria-label={`${title ?? "Terminal"} session`}
        tabIndex={0}
        className="overflow-x-auto outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      >
        <pre className="sr-only">{plain}</pre>
        <noscript>
          <pre className="px-5 py-4 font-mono text-[0.875rem] leading-[1.65]">
            {plain}
          </pre>
        </noscript>
        <div
          aria-hidden="true"
          className="min-w-max px-5 py-4 font-mono text-[0.875rem] leading-[1.65]"
        >
          {rows.map((row, index) => {
            const typing = state.typing?.row === index;
            if (index > state.shown && !typing)
              return <div key={index} className="min-h-[1lh]" />;
            if (!typing && index >= state.shown)
              return <div key={index} className="min-h-[1lh]" />;
            const text = typing
              ? row.text.slice(0, state.typing!.chars)
              : row.text;
            return (
              <div key={index} className="min-h-[1lh] whitespace-pre">
                {row.type === "command" && (
                  <span className="mr-2 text-[#60a5fa] select-none">$</span>
                )}
                <span
                  className={
                    row.type === "comment"
                      ? "text-[#8e8e93] italic"
                      : row.type === "output"
                        ? "text-[#a1a1a6]"
                        : "text-[#f5f5f7]"
                  }
                >
                  {row.type === "comment" ? `# ${text}` : text}
                </span>
                {caretAt === index && (
                  <span className="ml-px inline-block h-[1.1em] w-[0.55em] translate-y-[0.2em] animate-[caret-blink_1s_steps(1)_infinite] bg-[#60a5fa]" />
                )}
              </div>
            );
          })}
          {state.done && (
            <div className="min-h-[1lh]">
              <span className="mr-2 text-[#60a5fa] select-none">$</span>
              <span className="ml-px inline-block h-[1.1em] w-[0.55em] translate-y-[0.2em] animate-[caret-blink_1s_steps(1)_infinite] bg-[#60a5fa] motion-reduce:animate-none" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

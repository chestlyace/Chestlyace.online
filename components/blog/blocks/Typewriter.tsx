"use client";

import { CornerDownRight, RotateCcw } from "lucide-react";
import { useRef } from "react";
import type { Token } from "@/lib/blog/tokens";
import { totalTypewriterMs, typewriterState } from "@/lib/blog/typing";
import { usePrefersReducedMotion } from "@/lib/media";
import { CodeFrame, Tokens } from "./CodeFrame";
import { CopyButton } from "./CopyButton";
import { useClock } from "./useClock";
import { useReveal } from "./useReveal";
import { format } from "@/lib/i18n/format";
import { useBlockText } from "./useBlockText";

export type TypewriterLineView = {
  tokens: Token[];
  code: string;
  caption: string | null;
};

function slice(tokens: Token[], chars: number): Token[] {
  const out: Token[] = [];
  let left = chars;
  for (const token of tokens) {
    if (left <= 0) break;
    out.push(
      left >= token.text.length
        ? token
        : { ...token, text: token.text.slice(0, left) },
    );
    left -= token.text.length;
  }
  return out;
}

// `typewriter` (design.md §13.41): code that types itself, with a caption under
// chosen lines. It starts when 70% into view; Skip or a click finishes it,
// replay types it again. All the code and captions are in the page from the
// start (a hidden full copy for assistive technology and search engines); the
// typed copy is what is seen. Reduced motion shows it complete.
export function Typewriter({
  title,
  language,
  lines,
}: {
  title: string | null;
  language: string;
  lines: TypewriterLineView[];
}) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const plain = lines.map((line) => line.code);
  const total = totalTypewriterMs(
    lines.map((line) => ({ code: line.code, caption: line.caption })),
  );
  const clock = useClock(total);
  useReveal(ref, clock.start);
  const t = useBlockText();

  const state = reduced
    ? { doneLines: lines.length, typing: null, done: true }
    : typewriterState(
        lines.map((line) => ({ code: line.code, caption: line.caption })),
        clock.elapsed,
      );

  return (
    <div ref={ref} onClick={clock.playing ? clock.skip : undefined}>
      <CodeFrame
        label={title ?? language}
        controls={
          <>
            {clock.playing && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  clock.skip();
                }}
                className="type-label rounded-full px-3 py-1.5 text-muted transition-colors duration-150 hover:bg-tile-hover hover:text-foreground"
              >
                {t.skip}
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
                aria-label={clock.playing ? t.finishTyping : t.replayTyping}
                className="relative grid size-8 place-items-center rounded-full transition-colors duration-150 before:absolute before:-inset-1 before:content-[''] hover:bg-tile-hover"
              >
                <RotateCcw className="size-4" aria-hidden="true" />
              </button>
            )}
            <CopyButton text={plain.join("\n")} />
          </>
        }
      >
        <div
          role="region"
          aria-label={format(t.typedOut, { title: title ?? language })}
          tabIndex={0}
          className="overflow-x-auto outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        >
          <pre className="sr-only">{plain.join("\n")}</pre>
          <noscript>
            <pre className="shiki px-5 py-4 font-mono text-[0.875rem] leading-[1.65]">
              {plain.join("\n")}
            </pre>
          </noscript>
          <pre
            aria-hidden="true"
            className="shiki px-5 py-4 font-mono text-[0.875rem] leading-[1.65]"
          >
            <code className="grid min-w-max">
              {lines.map((line, index) => {
                const typing = state.typing?.line === index;
                const shown =
                  index < state.doneLines
                    ? line.tokens
                    : typing
                      ? slice(line.tokens, state.typing!.chars)
                      : [];
                return (
                  <span key={index} className="contents">
                    <span
                      className={
                        typing
                          ? "line min-h-[1lh] bg-primary/6 shadow-[inset_2px_0_0_var(--primary)]"
                          : "line min-h-[1lh]"
                      }
                    >
                      <Tokens tokens={shown} />
                      {typing && (
                        <span className="ml-px inline-block h-[1.1em] w-0.5 translate-y-[0.2em] animate-[caret-blink_1s_steps(1)_infinite] bg-primary" />
                      )}
                    </span>
                    {line.caption && (
                      <span
                        className={
                          index < state.doneLines
                            ? "flex items-start gap-1.5 pb-1 font-sans text-sm text-muted opacity-100 transition-opacity duration-200"
                            : "flex items-start gap-1.5 pb-1 font-sans text-sm text-muted opacity-0"
                        }
                      >
                        <CornerDownRight
                          className="mt-1 size-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        {line.caption}
                      </span>
                    )}
                  </span>
                );
              })}
            </code>
          </pre>
        </div>
      </CodeFrame>
    </div>
  );
}

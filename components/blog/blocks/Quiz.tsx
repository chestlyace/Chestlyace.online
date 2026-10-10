"use client";

import { Check, X } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Button } from "@/components/shared/Button";
import { cn } from "@/lib/cn";
import { useReveal } from "./useReveal";
import { format } from "@/lib/i18n/format";
import type { BlockText } from "@/lib/i18n/ui";
import { useBlockText } from "./useBlockText";

export type QuizQuestionView = {
  question: ReactNode;
  options: { text: ReactNode; correct: boolean }[];
  explanation: ReactNode | null;
};

const LETTERS = ["A", "B", "C", "D", "E", "F"];

const message = (score: number, total: number, t: BlockText) =>
  score === total
    ? t.quizPerfect
    : score >= total / 2
      ? t.quizGood
      : t.quizRetry;

// `quiz` (design.md §13.46): a short multiple-choice quiz. One answer per
// question, locked once chosen; the right answer and the explanation appear;
// nothing is saved or sent.
export function Quiz({ questions }: { questions: QuizQuestionView[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useReveal(ref);
  const t = useBlockText();
  const id = useId();
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const explanation = useRef<HTMLDivElement>(null);
  const options = useRef<(HTMLButtonElement | null)[]>([]);
  const question = questions[index];

  // After an answer, focus moves to the explanation (design.md §13.46).
  useEffect(() => {
    if (chosen !== null) explanation.current?.focus();
  }, [chosen]);

  function choose(option: number) {
    if (chosen !== null) return;
    setChosen(option);
    if (question.options[option].correct) setScore((value) => value + 1);
  }

  function next() {
    if (index + 1 >= questions.length) setFinished(true);
    else {
      setIndex(index + 1);
      setChosen(null);
    }
  }

  function restart() {
    setIndex(0);
    setChosen(null);
    setScore(0);
    setFinished(false);
  }

  function onKeyDown(event: KeyboardEvent, position: number) {
    const count = question.options.length;
    const target =
      event.key === "ArrowDown" || event.key === "ArrowRight"
        ? (position + 1) % count
        : event.key === "ArrowUp" || event.key === "ArrowLeft"
          ? (position - 1 + count) % count
          : null;
    if (target === null) return;
    event.preventDefault();
    options.current[target]?.focus();
  }

  return (
    <div
      ref={ref}
      className="group/quiz my-10 rounded-lg bg-tile p-6 transition-[opacity,transform] duration-[650ms] ease-out group-data-[phase=armed]/quiz:translate-y-4 group-data-[phase=armed]/quiz:opacity-0 sm:p-8 [&[data-phase=armed]]:translate-y-4 [&[data-phase=armed]]:opacity-0"
    >
      {finished ? (
        <div role="status">
          <p className="type-label text-muted">{t.quizResult}</p>
          <p className="mt-2 text-h3 text-foreground">
            {format(t.quizScore, { score, total: questions.length })}
          </p>
          <p className="mt-2 text-body text-muted">
            {message(score, questions.length, t)}
          </p>
          <Button
            variant="ghost"
            size="sm"
            magnetic={false}
            onClick={restart}
            className="mt-5"
          >
            {t.quizAgain}
          </Button>
        </div>
      ) : (
        <>
          <p className="type-label text-muted">
            {format(t.quizQuestion, {
              n: index + 1,
              total: questions.length,
            })}
          </p>
          <div
            key={index}
            className="animate-[quiz-in_200ms_ease-out] motion-reduce:animate-none"
          >
            <p id={`${id}-q`} className="mt-3 text-h3 text-foreground">
              {question.question}
            </p>
            <div
              role="radiogroup"
              aria-labelledby={`${id}-q`}
              className="mt-5 flex flex-col gap-2"
            >
              {question.options.map((option, position) => {
                const picked = chosen === position;
                const reveal = chosen !== null;
                const right = reveal && option.correct;
                const wrong = reveal && picked && !option.correct;
                return (
                  <button
                    key={position}
                    ref={(element) => {
                      options.current[position] = element;
                    }}
                    type="button"
                    role="radio"
                    aria-checked={picked}
                    disabled={reveal && !picked && !option.correct}
                    aria-disabled={reveal || undefined}
                    onClick={() => choose(position)}
                    onKeyDown={(event) => onKeyDown(event, position)}
                    className={cn(
                      "flex min-h-12 items-center gap-3 rounded-md border bg-surface-raised px-4 py-2 text-left text-body text-foreground transition-[border-color,transform,opacity] duration-150 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring enabled:active:scale-[0.98]",
                      right
                        ? "border-[var(--diff-add)]"
                        : wrong
                          ? "border-danger"
                          : "border-border [@media(hover:hover)]:enabled:hover:border-muted/50",
                      reveal && !right && !wrong && "opacity-60",
                    )}
                  >
                    <span className="type-label grid size-6 shrink-0 place-items-center rounded-sm bg-tile text-muted">
                      {LETTERS[position]}
                    </span>
                    <span className="min-w-0 flex-1">{option.text}</span>
                    {right && (
                      <span className="flex items-center gap-1 text-sm text-[var(--diff-add)]">
                        <Check className="size-4" aria-hidden="true" />
                        {t.quizCorrect}
                      </span>
                    )}
                    {wrong && (
                      <span className="flex items-center gap-1 text-sm text-danger">
                        <X className="size-4" aria-hidden="true" />
                        {t.quizNotQuite}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          {chosen !== null && (
            <div className="mt-5 grid animate-[quiz-open_250ms_ease-out] gap-4 motion-reduce:animate-none">
              <div
                ref={explanation}
                role="status"
                tabIndex={-1}
                className="rounded-md bg-surface-raised p-4 text-body leading-[1.7] text-foreground outline-none"
              >
                {question.options[chosen].correct
                  ? `${t.quizCorrect}. `
                  : `${t.quizNotQuite}. `}
                {question.explanation}
              </div>
              <div>
                <Button size="md" magnetic={false} onClick={next}>
                  {index + 1 >= questions.length ? t.quizSeeResult : t.quizNext}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

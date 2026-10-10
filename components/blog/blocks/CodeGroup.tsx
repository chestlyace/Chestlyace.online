"use client";

import { LayoutGroup, motion } from "motion/react";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import type { Token } from "@/lib/blog/tokens";
import { cn } from "@/lib/cn";
import { SPRING } from "@/lib/motion";
import { CodeFrame, Tokens } from "./CodeFrame";
import { CopyButton } from "./CopyButton";
import { format } from "@/lib/i18n/format";
import { useBlockText } from "./useBlockText";

export type TabView = {
  label: string;
  lang: string;
  lines: Token[][];
  code: string;
};

// `codegroup` (design.md §13.42): several files in one frame, as tabs. The
// selected tab has a `primary` underline that moves between tabs; the code
// cross-fades. Copy copies the selected tab. One tab is a plain code block.
export function CodeGroup({ tabs }: { tabs: TabView[] }) {
  const [selected, setSelected] = useState(0);
  const id = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const tab = tabs[selected];
  const t = useBlockText();

  function onKeyDown(event: KeyboardEvent, index: number) {
    const last = tabs.length - 1;
    const target =
      event.key === "ArrowRight"
        ? index === last
          ? 0
          : index + 1
        : event.key === "ArrowLeft"
          ? index === 0
            ? last
            : index - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    if (target === null) return;
    event.preventDefault();
    setSelected(target);
    buttons.current[target]?.focus();
  }

  return (
    <CodeFrame
      label={tab.label}
      controls={
        <>
          <span className="type-label hidden pr-2 text-muted/80 sm:inline">
            {tab.lang}
          </span>
          <CopyButton text={tab.code} />
        </>
      }
      tabs={
        tabs.length > 1 ? (
          <LayoutGroup id={id}>
            <div
              role="tablist"
              aria-label={t.files}
              className="flex min-w-0 overflow-x-auto"
            >
              {tabs.map((item, index) => (
                <button
                  key={index}
                  ref={(element) => {
                    buttons.current[index] = element;
                  }}
                  type="button"
                  role="tab"
                  id={`${id}-tab-${index}`}
                  aria-selected={index === selected}
                  aria-controls={`${id}-panel`}
                  tabIndex={index === selected ? 0 : -1}
                  onClick={() => setSelected(index)}
                  onKeyDown={(event) => onKeyDown(event, index)}
                  className={cn(
                    "type-label relative h-10 shrink-0 px-3 whitespace-nowrap transition-colors duration-150 outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                    index === selected
                      ? "text-foreground"
                      : "text-muted hover:text-foreground",
                  )}
                >
                  {item.label}
                  {index === selected && (
                    <motion.span
                      layoutId="codegroup-underline"
                      transition={SPRING}
                      className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary"
                    />
                  )}
                </button>
              ))}
            </div>
          </LayoutGroup>
        ) : undefined
      }
    >
      <div
        role={tabs.length > 1 ? "tabpanel" : "region"}
        id={`${id}-panel`}
        aria-labelledby={tabs.length > 1 ? `${id}-tab-${selected}` : undefined}
        aria-label={
          tabs.length > 1 ? undefined : format(t.code, { title: tab.label })
        }
        tabIndex={0}
        className="overflow-x-auto outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      >
        <motion.pre
          key={selected}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="shiki px-5 py-4 font-mono text-[0.875rem] leading-[1.65]"
        >
          <code className="grid min-w-max">
            {tab.lines.map((line, index) => (
              <span key={index} className="line min-h-[1lh]">
                <Tokens tokens={line} />
              </span>
            ))}
          </code>
        </motion.pre>
      </div>
    </CodeFrame>
  );
}

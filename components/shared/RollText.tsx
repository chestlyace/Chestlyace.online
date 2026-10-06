import type { CSSProperties } from "react";
import { rollChars, rollStaggerMs } from "@/lib/roll";

// The two stacked copies of a label for the text roll (design.md §13.3). The
// animation is the `.roll` CSS in globals.css, played by hovering or focusing
// the surrounding `.roll-host`. The real label is in the DOM once, for
// assistive technology; both animated copies are hidden from it.
export function RollText({ children }: { children: string }) {
  const chars = rollChars(children);
  const style = {
    "--stagger": `${rollStaggerMs(chars.length)}ms`,
  } as CSSProperties;

  const row = (className: string) => (
    <span className={`roll-row ${className}`} aria-hidden="true">
      {chars.map((char, index) => (
        <span
          key={index}
          className="roll-char"
          style={{ "--i": index } as CSSProperties}
        >
          {char === " " ? " " : char}
        </span>
      ))}
    </span>
  );

  return (
    <span className="roll" style={style}>
      <span className="sr-only">{children}</span>
      {row("roll-row--out")}
      {row("roll-row--in")}
    </span>
  );
}

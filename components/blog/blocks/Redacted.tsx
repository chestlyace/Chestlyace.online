import { Fragment } from "react";
import { splitRedacted } from "@/lib/blog/replay";

// A text with its `[redacted]` marks drawn as pills (design.md §13.47): where the
// editor hid a secret, a path or an address. The dark window's colours, as the
// rest of the replay. The words stay `[redacted]` for assistive technology.
export function Pill() {
  return (
    <span className="rounded-sm bg-[#262626] px-1.5 py-px text-[0.8125em] text-[#a1a1a6]">
      [redacted]
    </span>
  );
}

export function Redacted({ text }: { text: string }) {
  return (
    <>
      {splitRedacted(text).map((piece, index) => (
        <Fragment key={index}>{piece.hidden ? <Pill /> : piece.text}</Fragment>
      ))}
    </>
  );
}

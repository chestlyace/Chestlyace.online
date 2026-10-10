"use client";

import { Heart } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/media";
import { cn } from "@/lib/cn";
import type { Messages } from "@/content/messages";
import type { Lang } from "@/lib/i18n";
import { plural } from "@/lib/i18n/format";
import { RollingCount } from "./RollingCount";
import { ShareMenu } from "./ShareMenu";

type State = { count: number; liked: boolean };

// The reaction bar under a post (design.md §13.35): Like (no account, one per
// browser) and Share. The page is cached, so the count and whether this browser
// has liked the post load from the blog's API after it; a like shows at once and is
// corrected from the server's answer.
export function ReactionBar({
  slug,
  title,
  url,
  initialCount,
  lang,
  reactions,
  share,
}: {
  slug: string;
  title: string;
  url: string;
  initialCount: number;
  lang: Lang;
  reactions: Messages["blog"]["reactions"];
  share: Messages["blog"]["share"];
}) {
  const reduced = usePrefersReducedMotion();
  const [state, setState] = useState<State>({
    count: initialCount,
    liked: false,
  });
  const [popKey, setPopKey] = useState(0);
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const endpoint = `/api/blog/posts/${encodeURIComponent(slug)}/like`;

  useEffect(() => {
    let current = true;
    fetch(endpoint)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: State | null) => current && data && setState(data))
      .catch(() => {});
    return () => {
      current = false;
    };
  }, [endpoint]);

  const toggle = async () => {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    const before = state;
    const liking = !before.liked;
    setState({
      count: Math.max(0, before.count + (liking ? 1 : -1)),
      liked: liking,
    });
    if (liking) setPopKey((key) => key + 1);
    try {
      const response = await fetch(endpoint, { method: "POST" });
      if (response.ok) setState((await response.json()) as State);
      else setState(before);
    } catch {
      setState(before);
    }
    busy.current = false;
    setPending(false);
  };

  return (
    <div className="flex items-center gap-3 border-t border-border pt-4">
      <button
        type="button"
        aria-pressed={state.liked}
        aria-label={`${reactions.like}, ${plural(reactions.likes, state.count, lang)}`}
        onClick={() => void toggle()}
        className={cn(
          "type-label flex h-10 items-center gap-2 rounded-full border bg-surface px-4 text-foreground transition-colors duration-150 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [@media(hover:hover)]:hover:bg-tile-hover",
          state.liked ? "border-primary/40" : "border-border",
          pending && "pending-pulse",
        )}
      >
        <motion.span
          key={popKey}
          aria-hidden="true"
          initial={false}
          animate={
            reduced || popKey === 0 ? { scale: 1 } : { scale: [1, 1.25, 1] }
          }
          transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
          className="inline-flex"
        >
          <Heart
            className={cn(
              "size-5",
              state.liked
                ? "fill-primary-text text-primary-text"
                : "text-foreground",
            )}
          />
        </motion.span>
        <RollingCount value={state.count} up={state.liked} />
      </button>
      <ShareMenu title={title} url={url} labels={share} />
    </div>
  );
}

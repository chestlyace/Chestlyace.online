"use client";

import { Check, Link2, Mail, Share2 } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { siWhatsapp, siX } from "simple-icons";
import { Button } from "@/components/shared/Button";
import { cn } from "@/lib/cn";

const Brand = ({ path }: { path: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className="size-4"
  >
    <path d={path} />
  </svg>
);

// Share (design.md §13.35): the system share sheet where there is one, otherwise a
// small menu: Copy link, X, LinkedIn, WhatsApp, Email. The address is the post's own
// canonical one, with no tracking parameters.
export function ShareMenu({ title, url }: { title: string; url: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    if (!open) return;
    const away = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      button.current?.querySelector("button")?.focus();
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  const start = async () => {
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function"
    ) {
      try {
        await navigator.share({ title, url });
      } catch {
        // dismissed
      }
      return;
    }
    setOpen((value) => !value);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      return;
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2000);
  };

  const encoded = encodeURIComponent(url);
  const text = encodeURIComponent(title);
  const links: { label: string; href: string; icon: ReactNode }[] = [
    {
      label: "Share on X",
      href: `https://twitter.com/intent/tweet?text=${text}&url=${encoded}`,
      icon: <Brand path={siX.path} />,
    },
    {
      label: "Share on LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`,
      icon: (
        <span
          aria-hidden="true"
          className="grid size-4 place-items-center rounded-[3px] bg-current text-[0.5625rem] leading-none font-bold"
        >
          <span className="text-surface-raised">in</span>
        </span>
      ),
    },
    {
      label: "Share on WhatsApp",
      href: `https://wa.me/?text=${text}%20${encoded}`,
      icon: <Brand path={siWhatsapp.path} />,
    },
    {
      label: "Share by email",
      href: `mailto:?subject=${text}&body=${encoded}`,
      icon: <Mail className="size-4" aria-hidden="true" />,
    },
  ];

  const item =
    "flex h-10 w-full items-center gap-3 rounded-sm px-3 text-left text-[0.9375rem] text-foreground outline-none hover:bg-tile focus-visible:bg-tile focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring";

  return (
    <div ref={root} className="relative">
      <div ref={button}>
        <Button
          variant="secondary"
          size="sm"
          magnetic={false}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          onClick={() => void start()}
          trailingIcon={<Share2 />}
          iconNudge="none"
        >
          Share
        </Button>
      </div>
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Share this post"
          className={cn(
            "absolute bottom-full left-0 z-20 mb-2 w-60 rounded-md border border-border/60 bg-surface-raised p-1 shadow-float-lifted",
            "animate-[quiz-open_150ms_ease-out] motion-reduce:animate-none",
          )}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => void copy()}
            className={item}
          >
            {copied ? (
              <Check className="size-4" aria-hidden="true" />
            ) : (
              <Link2 className="size-4" aria-hidden="true" />
            )}
            {copied ? "Link copied" : "Copy link"}
          </button>
          {links.map((link) => (
            <a
              key={link.label}
              role="menuitem"
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={item}
            >
              {link.icon}
              {link.label}
            </a>
          ))}
        </div>
      )}
      <p role="status" aria-live="polite" className="sr-only">
        {copied ? "Link copied" : ""}
      </p>
    </div>
  );
}

import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

// The facts about a piece or an event (design.md §13.56): a definition list under a
// mono label, then the description and any credits. Used by the lightbox's panel
// and, later, by the event page's sidebar. A term with no value is left out.
export type DetailRow = { term: string; value: ReactNode };
export type CreditRow = { role: string; name: string; url?: string | null };

export function Details({
  heading,
  rows,
  tags,
  description,
  link,
  credits,
  tone = "dark",
}: {
  heading: string;
  rows: readonly DetailRow[];
  /** A "Tools" or "What was covered" row of tags. */
  tags?: { term: string; values: readonly string[] };
  description?: string | null;
  link?: { href: string; label: string } | null;
  credits?: readonly CreditRow[];
  /** `dark` over the lightbox's dark layer; `page` on the page's own background. */
  tone?: "dark" | "page";
}) {
  const page = tone === "page";
  const head = page ? "text-muted" : "text-[#a1a1a6]";
  const term = page ? "text-muted" : "text-[#8e8e93]";
  const value = page ? "text-foreground" : "text-[#f5f5f7]";
  const body = page ? "text-muted" : "text-[#d1d1d6]";
  const rule = page
    ? "decoration-foreground/40 hover:decoration-foreground"
    : "decoration-white/40 hover:decoration-[#f5f5f7]";
  const shown = rows.filter((row) => row.value);
  return (
    <div className="grid gap-6">
      <div>
        <p className={`type-label ${head}`}>{heading}</p>
        <dl className="mt-4 grid gap-3">
          {shown.map((row) => (
            <div key={row.term} className="grid gap-0.5">
              <dt className={`type-label ${term}`}>{row.term}</dt>
              <dd className={`text-sm ${value}`}>{row.value}</dd>
            </div>
          ))}
          {tags && tags.values.length > 0 && (
            <div className="grid gap-1.5">
              <dt className={`type-label ${term}`}>{tags.term}</dt>
              <dd className="flex flex-wrap gap-1.5">
                {tags.values.map((tag) => (
                  <span
                    key={tag}
                    className={`type-label inline-flex h-6 items-center rounded-sm px-2.5 whitespace-nowrap ${page ? "bg-tile text-foreground" : "bg-white/10 text-[#d1d1d6]"}`}
                  >
                    {tag}
                  </span>
                ))}
              </dd>
            </div>
          )}
        </dl>
      </div>
      {description && (
        <p
          className={`max-w-[60ch] text-sm leading-relaxed whitespace-pre-line ${body}`}
        >
          {description}
        </p>
      )}
      {link && (
        <a
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex w-fit items-center gap-1.5 rounded-sm text-sm font-medium underline underline-offset-4 ${value} ${rule}`}
        >
          {link.label}
          <ArrowUpRight className="size-4" aria-hidden="true" />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      )}
      {credits && credits.length > 0 && (
        <div>
          <p className={`type-label ${head}`}>Credits</p>
          <ul className={`mt-4 grid gap-2 text-sm ${value}`}>
            {credits.map((credit, index) => (
              <li key={index}>
                <span className={head}>{credit.role} — </span>
                {credit.url ? (
                  <a
                    href={credit.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`underline underline-offset-4 ${rule}`}
                  >
                    {credit.name}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ) : (
                  credit.name
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

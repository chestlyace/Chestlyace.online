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
}: {
  heading: string;
  rows: readonly DetailRow[];
  /** A "Tools" or "What was covered" row of tags. */
  tags?: { term: string; values: readonly string[] };
  description?: string | null;
  link?: { href: string; label: string } | null;
  credits?: readonly CreditRow[];
}) {
  const shown = rows.filter((row) => row.value);
  return (
    <div className="grid gap-6">
      <div>
        <p className="type-label text-[#a1a1a6]">{heading}</p>
        <dl className="mt-4 grid gap-3">
          {shown.map((row) => (
            <div key={row.term} className="grid gap-0.5">
              <dt className="type-label text-[#8e8e93]">{row.term}</dt>
              <dd className="text-sm text-[#f5f5f7]">{row.value}</dd>
            </div>
          ))}
          {tags && tags.values.length > 0 && (
            <div className="grid gap-1.5">
              <dt className="type-label text-[#8e8e93]">{tags.term}</dt>
              <dd className="flex flex-wrap gap-1.5">
                {tags.values.map((value) => (
                  <span
                    key={value}
                    className="type-label inline-flex h-6 items-center rounded-sm bg-white/10 px-2.5 whitespace-nowrap text-[#d1d1d6]"
                  >
                    {value}
                  </span>
                ))}
              </dd>
            </div>
          )}
        </dl>
      </div>
      {description && (
        <p className="max-w-[60ch] text-sm leading-relaxed whitespace-pre-line text-[#d1d1d6]">
          {description}
        </p>
      )}
      {link && (
        <a
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center gap-1.5 rounded-sm text-sm font-medium text-[#f5f5f7] underline underline-offset-4 decoration-white/40 hover:decoration-[#f5f5f7]"
        >
          {link.label}
          <ArrowUpRight className="size-4" aria-hidden="true" />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      )}
      {credits && credits.length > 0 && (
        <div>
          <p className="type-label text-[#a1a1a6]">Credits</p>
          <ul className="mt-4 grid gap-2 text-sm text-[#f5f5f7]">
            {credits.map((credit, index) => (
              <li key={index}>
                <span className="text-[#a1a1a6]">{credit.role} — </span>
                {credit.url ? (
                  <a
                    href={credit.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-4 decoration-white/40 hover:decoration-[#f5f5f7]"
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

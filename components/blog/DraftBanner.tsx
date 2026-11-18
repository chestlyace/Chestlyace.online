import { Reveal } from "@/components/shared/Reveal";
import { Tag } from "@/components/shared/Tag";
import { TextLink } from "@/components/shared/TextLink";
import { getMessages } from "@/content/messages";
import { fullDate, relativeTime } from "@/lib/blog/relativeTime";
import type { Lang } from "@/lib/i18n";

// The notice at the top of a shared draft (design.md §13.68, D93): a mono DRAFT
// label, a line saying it isn't published, when it was last saved and, once the page
// has its feedback form, a link down to it. Not dismissible. The page is rendered on
// each request, so "2 hours ago" is worked out on the server.
export function DraftBanner({
  savedAt,
  lang,
  feedbackHref,
}: {
  /** The post's `updated_at` (ISO). */
  savedAt: string;
  lang: Lang;
  /** The feedback form's anchor, when the page has one. */
  feedbackHref?: string;
}) {
  const m = getMessages(lang).blog.draft;
  const [before, after = ""] = m.saved.split("{time}");
  return (
    <Reveal y={16}>
      <div
        role="note"
        aria-label={m.noticeLabel}
        className="flex flex-col items-start gap-x-4 gap-y-2 rounded-lg border border-border bg-surface px-5 py-4 md:flex-row md:items-center"
      >
        <Tag className="shrink-0">{m.label}</Tag>
        <p className="text-sm text-foreground">
          {m.notice}{" "}
          <span className="text-muted">
            {before}
            <time dateTime={savedAt} title={fullDate(savedAt, lang)}>
              {/* A server component on a page rendered per request: "now" is the
                  request's time (relativeTime's default). */}
              {relativeTime(savedAt, undefined, lang, m.justNow)}
            </time>
            {after}
          </span>
        </p>
        {feedbackHref && (
          <TextLink
            href={feedbackHref}
            variant="inline"
            className="shrink-0 text-sm md:ml-auto"
          >
            {m.feedbackLink} ↓
          </TextLink>
        )}
      </div>
    </Reveal>
  );
}

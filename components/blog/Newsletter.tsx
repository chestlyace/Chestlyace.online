import { getMessages } from "@/content/messages";
import { getCachedNewsletterCopy } from "@/lib/blog/cache";
import type { Lang } from "@/lib/i18n";
import { NewsletterBox } from "./NewsletterBox";

// The newsletter box with the wording and switch from the admin (Blog →
// Newsletter). The pages are cached under the blog tag, so a change shows on the
// next visit. Nothing when the owner has turned the box off.
export async function Newsletter({
  lang,
  className,
}: {
  lang: Lang;
  className?: string;
}) {
  const { enabled, box } = await getCachedNewsletterCopy(lang);
  const { newsletter } = getMessages(lang).blog;
  return enabled ? (
    <NewsletterBox
      copy={box}
      labels={newsletter}
      lang={lang}
      className={className}
    />
  ) : null;
}

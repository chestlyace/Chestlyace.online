import { getCachedNewsletterCopy } from "@/lib/blog/cache";
import { NewsletterBox } from "./NewsletterBox";

// The newsletter box with the wording and switch from the admin (Blog →
// Newsletter). The pages are cached under the blog tag, so a change shows on the
// next visit. Nothing when the owner has turned the box off.
export async function Newsletter({ className }: { className?: string }) {
  const { enabled, box } = await getCachedNewsletterCopy();
  return enabled ? <NewsletterBox copy={box} className={className} /> : null;
}

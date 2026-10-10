import { unstable_cache } from "next/cache";
import { getDb } from "@/lib/db";
import type { Lang } from "@/lib/i18n";
import {
  getCreativesCopy,
  listCreativesSocials,
  listPublishedEvents,
  listPublishedFaqs,
  listPublishedPieces,
  listPublishedServices,
} from "./data";

// The creatives site's cache tag and cached reads, like `portfolio` for the main
// site and `blog` for the blog: every write in the admin revalidates the tag, so a
// page stays static until something changes (D74).
export const CREATIVES_TAG = "creatives";

const deployment = process.env.VERCEL_GIT_COMMIT_SHA ?? "local";

// In `next dev` reads are never cached, so edits show on the next refresh.
function cached<Args extends unknown[], Result>(
  name: string,
  read: (...args: Args) => Promise<Result>,
) {
  if (process.env.NODE_ENV === "development") return read;
  return unstable_cache(read, ["creatives", name, deployment], {
    tags: [CREATIVES_TAG],
  });
}

export const getCachedPieces = cached("pieces", (lang: Lang) =>
  listPublishedPieces(getDb(), lang),
);
export const getCachedEvents = cached("events", (lang: Lang) =>
  listPublishedEvents(getDb(), lang),
);
export const getCachedServices = cached("services", (lang: Lang) =>
  listPublishedServices(getDb(), lang),
);
export const getCachedFaqs = cached("faqs", (lang: Lang) =>
  listPublishedFaqs(getDb(), lang),
);
export const getCachedCreativesCopy = cached("copy", (lang: Lang) =>
  getCreativesCopy(getDb(), lang),
);
export const getCachedCreativesSocials = cached("socials", () =>
  listCreativesSocials(getDb()),
);

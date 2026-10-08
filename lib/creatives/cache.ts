import { unstable_cache } from "next/cache";
import { getDb } from "@/lib/db";
import {
  getCreativesCopy,
  listCreativesSocials,
  listPublishedPieces,
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

export const getCachedPieces = cached("pieces", () =>
  listPublishedPieces(getDb()),
);
export const getCachedCreativesCopy = cached("copy", () =>
  getCreativesCopy(getDb()),
);
export const getCachedCreativesSocials = cached("socials", () =>
  listCreativesSocials(getDb()),
);

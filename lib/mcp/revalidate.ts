import { revalidateTag } from "next/cache";
import { BLOG_TAG } from "@/lib/blog/cache";
import { CREATIVES_TAG } from "@/lib/creatives/cache";
import { PORTFOLIO_TAG } from "@/lib/portfolio";

// Every write an agent makes refreshes the public sites exactly as the admin's does
// (docs/mcp.md §4): `{ expire: 0 }`, so the next visit waits for the new data.

export const publishedProfile = () =>
  revalidateTag(PORTFOLIO_TAG, { expire: 0 });
export const publishedPortfolio = publishedProfile;
export const publishedCreatives = () =>
  revalidateTag(CREATIVES_TAG, { expire: 0 });
export const publishedBlog = () => revalidateTag(BLOG_TAG, { expire: 0 });

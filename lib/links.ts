// A path on this site that is a page — something `next/link` can navigate to
// and prefetch. Files (`/resume.pdf`, `/hero.webp`) and external URLs are plain
// anchors: prefetching a file just logs a 404 and wastes a request.
export function isPagePath(href: string): boolean {
  if (!href.startsWith("/") || href.startsWith("//")) return false;
  const path = href.split(/[?#]/)[0];
  const last = path.split("/").pop() ?? "";
  return !/\.[A-Za-z0-9]{1,8}$/.test(last);
}

// Links from the database that open another site must be web addresses: a
// `javascript:` or `data:` value must never become a live link, whatever got
// into the table.
export function isHttpUrl(href: string): boolean {
  try {
    const { protocol } = new URL(href);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { getCachedPostsByTag } from "@/lib/blog/cache";
import { isLang } from "@/lib/i18n";

// A tag with no posts is answered here, above the page's loading skeleton, so the
// response is a real 404.
export default async function TagLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string; tag: string }>;
}) {
  const { lang, tag } = await params;
  if (!isLang(lang) || (await getCachedPostsByTag(tag, lang)).length === 0)
    notFound();
  return children;
}

import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { getCachedPost } from "@/lib/blog/cache";
import { isLang } from "@/lib/i18n";

// A post that does not exist is answered here, above the page's loading skeleton, so
// the response is a real 404 (a `notFound()` inside a streamed `loading.tsx` boundary
// would arrive after the 200 was sent).
export default async function PostLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isLang(lang) || !(await getCachedPost(slug, lang))) notFound();
  return children;
}

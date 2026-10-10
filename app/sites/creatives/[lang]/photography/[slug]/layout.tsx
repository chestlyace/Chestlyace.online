import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { getCachedEvents } from "@/lib/creatives/cache";
import { isLang } from "@/lib/i18n";

// An event that does not exist is answered here, above the page's loading skeleton, so
// the response is a real 404.
export default async function EventLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();
  if (!(await getCachedEvents(lang)).some((event) => event.slug === slug))
    notFound();
  return children;
}

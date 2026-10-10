import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { getCachedProjectSlugs } from "@/lib/portfolio";

// A project that does not exist is answered here, above the page's loading skeleton, so
// the response is a real 404 (a `notFound()` inside a streamed `loading.tsx` boundary
// would arrive after the 200 was sent).
export default async function ProjectLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!(await getCachedProjectSlugs()).includes(slug)) notFound();
  return children;
}

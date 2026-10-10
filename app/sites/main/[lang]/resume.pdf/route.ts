import { NextResponse } from "next/server";
import { isLang } from "@/lib/i18n";
import { resumeHref } from "@/lib/links";
import { getCachedHomepageData } from "@/lib/portfolio";

// /resume.pdf never changes (ia-content.md §5): it sends the visitor to wherever
// the profile's résumé address points now (an upload on Cloudinary, or a file on
// this site). Not permanent, because the owner can replace the file at any time.
// `/fr/resume.pdf` goes to the French résumé when there is one, else the English
// (docs/i18n.md §8): the profile is read in the address's language.
export async function GET(
  request: Request,
  context?: { params: Promise<{ lang: string }> },
) {
  const language = (await context?.params)?.lang;
  const { profile } = await getCachedHomepageData(
    isLang(language) ? language : undefined,
  );
  if (profile?.resumeUrl) {
    const { href } = resumeHref(profile.resumeUrl);
    const target = new URL(href, request.url);
    // A bare "resume.pdf" with no file behind it would send the visitor back
    // here, forever: that is a plain 404 instead.
    if (
      target.pathname !== new URL(request.url).pathname ||
      target.host !== new URL(request.url).host
    ) {
      return NextResponse.redirect(target, 307);
    }
  }
  return new Response("Not Found", { status: 404 });
}

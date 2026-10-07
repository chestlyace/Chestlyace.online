import { NextResponse, type NextRequest } from "next/server";
import { PREVIEW_SITE_COOKIE, decideRoute } from "@/lib/sites";

// The admin is never to be indexed (D71): every response says so, on top of the
// page's own robots meta and robots.txt.
function noindex(response: NextResponse) {
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
}

export function proxy(request: NextRequest) {
  const decision = decideRoute({
    host: request.headers.get("host"),
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
    siteParam: request.nextUrl.searchParams.get("site"),
    siteCookie: request.cookies.get(PREVIEW_SITE_COOKIE)?.value,
    allowOverride: process.env.VERCEL_ENV !== "production",
  });

  // Old addresses move for good (ia-content.md §6).
  if (decision.kind === "redirect") {
    return NextResponse.redirect(decision.location, 308);
  }
  if (decision.kind === "not-found") {
    return new NextResponse("Not Found", { status: 404 });
  }
  if (decision.kind === "pass-through") {
    const response = NextResponse.next();
    if (decision.site === "admin") noindex(response);
    return response;
  }

  const url = request.nextUrl.clone();
  url.pathname = decision.pathname;

  // The admin's pages need the address the visitor asked for, to send them back
  // to it after signing in (lib/admin/auth.ts).
  const requestHeaders = new Headers(request.headers);
  if (decision.site === "admin") {
    requestHeaders.set(
      "x-admin-path",
      request.nextUrl.pathname + request.nextUrl.search,
    );
  } else {
    requestHeaders.delete("x-admin-path");
  }
  const response = NextResponse.rewrite(url, {
    request: { headers: requestHeaders },
  });
  if (decision.site === "admin") noindex(response);

  if (decision.setPreviewCookie) {
    response.cookies.set(PREVIEW_SITE_COOKIE, decision.setPreviewCookie, {
      path: "/",
      sameSite: "lax",
    });
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_vercel|.*\\.(?:png|jpe?g|gif|svg|webp|avif|ico|woff2?)$).*)",
  ],
};

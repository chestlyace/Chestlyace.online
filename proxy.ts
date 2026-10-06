import { NextResponse, type NextRequest } from "next/server";
import { PREVIEW_SITE_COOKIE, decideRoute } from "@/lib/sites";

export function proxy(request: NextRequest) {
  const decision = decideRoute({
    host: request.headers.get("host"),
    pathname: request.nextUrl.pathname,
    siteParam: request.nextUrl.searchParams.get("site"),
    siteCookie: request.cookies.get(PREVIEW_SITE_COOKIE)?.value,
    allowOverride: process.env.VERCEL_ENV !== "production",
  });

  if (decision.kind === "not-found") {
    return new NextResponse("Not Found", { status: 404 });
  }
  if (decision.kind === "pass-through") {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = decision.pathname;
  const response = NextResponse.rewrite(url);

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
    "/((?!_next/static|_next/image|.*\\.(?:png|jpe?g|gif|svg|webp|avif|ico|pdf|woff2?)$).*)",
  ],
};

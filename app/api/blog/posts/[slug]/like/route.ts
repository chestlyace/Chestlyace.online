import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { clientIp, isSameOrigin } from "@/lib/admin/request";
import {
  VISITOR_COOKIE,
  getLikeState,
  hashVisitor,
  isVisitorToken,
  newVisitorToken,
  toggleLike,
} from "@/lib/blog/likes";
import { getDb } from "@/lib/db";
import { createRateLimiter } from "@/lib/rateLimit";

// The blog's likes API (design.md §13.35). The post page itself stays cached; the
// count and whether this browser liked it load from here after the page. Answers
// on the blog host only (lib/sites.ts).
const perIp = createRateLimiter({ limit: 60, windowMs: 60 * 1000 });
const perVisitor = createRateLimiter({ limit: 12, windowMs: 60 * 1000 });

const reply = (body: unknown, status = 200, headers?: HeadersInit) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });

// GET: the count, and whether this browser has liked the post.
export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/blog/posts/[slug]/like">,
) {
  const { slug } = await params;
  const token = (await cookies()).get(VISITOR_COOKIE)?.value;
  const state = await getLikeState(
    getDb(),
    slug,
    isVisitorToken(token) ? hashVisitor(token) : null,
  );
  return state ? reply(state) : reply({ error: "not-found" }, 404);
}

// POST: like, or take the like back.
export async function POST(
  request: Request,
  { params }: RouteContext<"/api/blog/posts/[slug]/like">,
) {
  if (!isSameOrigin(request)) return reply({ error: "forbidden" }, 403);
  const limit = perIp.check(clientIp(request));
  if (!limit.allowed)
    return reply({ error: "rate-limited" }, 429, {
      "Retry-After": String(limit.retryAfterSeconds),
    });

  const { slug } = await params;
  const jar = await cookies();
  const existing = jar.get(VISITOR_COOKIE)?.value;
  const token = isVisitorToken(existing) ? existing : newVisitorToken();
  const hash = hashVisitor(token);

  const each = perVisitor.check(hash);
  if (!each.allowed)
    return reply({ error: "rate-limited" }, 429, {
      "Retry-After": String(each.retryAfterSeconds),
    });

  const state = await toggleLike(getDb(), slug, hash);
  if (!state) return reply({ error: "not-found" }, 404);

  const response = reply(state);
  if (token !== existing) {
    response.cookies.set(VISITOR_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return response;
}

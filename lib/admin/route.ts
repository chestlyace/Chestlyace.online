import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { hasSession } from "./auth";
import { isSameOrigin } from "./request";
import { isAdminApiResource, type Failure } from "./api";
import { BLOG_TAG } from "@/lib/blog/cache";
import { PORTFOLIO_TAG } from "@/lib/portfolio";

// What every /api/admin route does first and last (content-schema.md §2).

export const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

// Session, origin and body type; null means "go on".
export async function guard(
  request: Request,
  options: { body: boolean },
): Promise<Response | null> {
  if (!(await hasSession())) return json({ error: "unauthorized" }, 401);
  if (request.method !== "GET" && !isSameOrigin(request)) {
    return json({ error: "forbidden" }, 403);
  }
  if (
    options.body &&
    !request.headers.get("content-type")?.includes("application/json")
  ) {
    return json({ error: "bad-request" }, 415);
  }
  return null;
}

export async function readBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

export function unknownResource(name: string): Response | null {
  return isAdminApiResource(name) ? null : json({ error: "not-found" }, 404);
}

export function parseId(value: string): number | null {
  return /^[1-9]\d{0,9}$/.test(value) ? Number(value) : null;
}

export function failure(result: Failure): Response {
  return result.status === 404
    ? json({ error: "not-found" }, 404)
    : json({ error: "invalid", fields: result.fields }, 422);
}

// Every successful write makes the public site read fresh data
// (`{ expire: 0 }`: the next visit waits for the new data, not the old page).
export function published() {
  revalidateTag(PORTFOLIO_TAG, { expire: 0 });
}

// A post written, published or deleted makes the blog read fresh data (D74).
export function publishedBlog() {
  revalidateTag(BLOG_TAG, { expire: 0 });
}

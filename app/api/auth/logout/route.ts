import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/admin/request";
import { SESSION_COOKIE } from "@/lib/admin/session";

// POST /api/auth/logout (admin host only): clears the session cookie.
export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  (await cookies()).delete(SESSION_COOKIE);
  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}

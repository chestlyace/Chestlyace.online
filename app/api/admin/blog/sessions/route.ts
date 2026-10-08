import { createSession } from "@/lib/admin/sessionsApi";
import { guard, json, readBody } from "@/lib/admin/route";
import { getDb } from "@/lib/db";

// POST /api/admin/blog/sessions: stores a redacted agent session and answers with
// its id. The editor sends only the turns the author kept, already redacted.
export async function POST(request: Request) {
  const denied = await guard(request, { body: true });
  if (denied) return denied;
  const result = await createSession(getDb(), await readBody(request));
  if (!result.ok) return json({ error: "invalid", fields: result.fields }, 422);
  return json({ item: result.session }, 201);
}

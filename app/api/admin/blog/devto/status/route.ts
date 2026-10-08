import { guard, json } from "@/lib/admin/route";

// GET /api/admin/blog/devto/status: whether the DEV API key is set on the server
// (never the key itself).
export async function GET(request: Request) {
  const denied = await guard(request, { body: false });
  if (denied) return denied;
  return json({ configured: Boolean(process.env.DEVTO_API_KEY?.trim()) });
}

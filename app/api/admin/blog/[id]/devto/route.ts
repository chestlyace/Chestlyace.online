import { z } from "zod";
import { exportPost } from "@/lib/admin/devtoApi";
import { guard, json, parseId, readBody } from "@/lib/admin/route";
import { getDb } from "@/lib/db";
import { siteUrl } from "@/lib/sites";

const body = z
  .object({ publish: z.boolean(), fresh: z.boolean().optional() })
  .strict();

// POST /api/admin/blog/<id>/devto: sends the saved post to DEV (created the first
// time, updated after), as a draft there unless `publish` is set.
export async function POST(
  request: Request,
  { params }: RouteContext<"/api/admin/blog/[id]/devto">,
) {
  const denied = await guard(request, { body: true });
  if (denied) return denied;
  const id = parseId((await params).id);
  const parsed = body.safeParse(await readBody(request));
  if (id === null) return json({ error: "not-found" }, 404);
  if (!parsed.success) return json({ error: "invalid" }, 422);

  const result = await exportPost(
    getDb(),
    fetch,
    process.env.DEVTO_API_KEY?.trim() || null,
    id,
    {
      publish: parsed.data.publish,
      fresh: parsed.data.fresh,
      postUrl: (slug) => siteUrl("blog", `/${slug}`),
    },
  );
  return result.ok
    ? json({ url: result.url, created: result.created, devId: result.devId })
    : json({ error: "dev", message: result.error }, result.status);
}

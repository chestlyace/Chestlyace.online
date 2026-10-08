import { z } from "zod";
import { importArticles } from "@/lib/admin/devtoApi";
import { guard, json, readBody } from "@/lib/admin/route";
import { getDb } from "@/lib/db";

const body = z
  .object({ ids: z.array(z.number().int().positive()).min(1).max(100) })
  .strict();

// POST /api/admin/blog/devto/import: the chosen articles become drafts, with a
// report of what became what. Nothing is published, so nothing is revalidated.
export async function POST(request: Request) {
  const denied = await guard(request, { body: true });
  if (denied) return denied;
  const parsed = body.safeParse(await readBody(request));
  if (!parsed.success)
    return json(
      { error: "invalid", message: "Choose at least one article." },
      422,
    );
  return json({ items: await importArticles(getDb(), fetch, parsed.data.ids) });
}

import { z } from "zod";
import { findArticles } from "@/lib/admin/devtoApi";
import { guard, json, readBody } from "@/lib/admin/route";
import { DevError } from "@/lib/blog/devto";
import { getDb } from "@/lib/db";

const body = z.object({ username: z.string().min(1).max(60) }).strict();

// POST /api/admin/blog/devto/find: a DEV user's published articles, with the ones
// already imported marked. Reading published articles needs no key.
export async function POST(request: Request) {
  const denied = await guard(request, { body: true });
  if (denied) return denied;
  const parsed = body.safeParse(await readBody(request));
  if (!parsed.success)
    return json({ error: "invalid", message: "Enter a DEV username." }, 422);
  try {
    return json({
      items: await findArticles(getDb(), fetch, parsed.data.username),
    });
  } catch (error) {
    if (error instanceof DevError)
      return json(
        { error: "dev", message: error.message },
        error.status === 400 ? 422 : 502,
      );
    throw error;
  }
}

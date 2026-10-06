import { z } from "zod";
import { UPLOAD_USES, signedUpload, type UploadUse } from "@/lib/cloudinary";
import { guard, json, readBody } from "@/lib/admin/route";

// POST /api/admin/upload-signature { use } (admin host only): a signature that
// lets the browser upload one file straight to Cloudinary (content-schema.md §3).
// The API secret never leaves the server; 503 when Cloudinary isn't set up.
const body = z
  .object({ use: z.enum(UPLOAD_USES as [UploadUse, ...UploadUse[]]) })
  .strict();

export async function POST(request: Request) {
  const denied = await guard(request, { body: true });
  if (denied) return denied;

  const parsed = body.safeParse(await readBody(request));
  if (!parsed.success) {
    return json(
      { error: "invalid", fields: { use: "Choose what the file is for." } },
      422,
    );
  }
  const upload = signedUpload(parsed.data.use, process.env);
  if (!upload) return json({ error: "not-configured" }, 503);
  return json({ upload });
}

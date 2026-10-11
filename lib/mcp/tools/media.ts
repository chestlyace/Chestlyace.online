import { z } from "zod";
import { getProfile, updateProfile } from "@/lib/admin/api";
import { UPLOAD_USES, type UploadUse } from "@/lib/cloudinary";
import { publishedProfile } from "../revalidate";
import { decodeBase64, fetchPublicFile, uploadFile } from "../media";
import { ToolError, defineTool, type AnyTool } from "../tool";

// The media tools (docs/mcp.md §5): upload a picture from an address or from base64, and
// the résumé. The result is what the content tools take: the hosted address, its size.

const IMAGE_USES = UPLOAD_USES.filter((use) => use !== "resume") as [
  UploadUse,
  ...UploadUse[],
];
const use = z
  .enum(IMAGE_USES)
  .describe(
    "What the picture is for (sets its folder, size limit and formats): project, logo, profile, badge, icon, blog, creatives. See get_guide images.",
  );

const fromUrl = defineTool({
  name: "media_upload_from_url",
  title: "Upload a picture from an address",
  description:
    "Fetches a picture from a public https address (up to 10 MB; JPG, PNG, WebP or AVIF) and uploads it. Returns the hosted `url`, `width` and `height` to use in content.",
  scope: "media",
  write: true,
  input: {
    use,
    url: z.string().describe("A public https:// address of the picture"),
  },
  async run({ use, url }) {
    const { bytes, filename } = await fetchPublicFile(url);
    const uploaded = await uploadFile(use, bytes, filename);
    return { summary: `Uploaded a ${use} picture`, data: uploaded };
  },
});

// Many pictures in one call (docs/mcp.md §5): a few at a time, each with its own outcome, so
// one bad address does not lose the rest. The call stops starting new ones near the
// function's time limit and says which were left.
const MANY_MAX = 10;
const MANY_AT_ONCE = 3;
const MANY_BUDGET_MS = 40_000;

type ManyResult =
  | {
      index: number;
      url: string;
      ok: true;
      hosted: Awaited<ReturnType<typeof uploadFile>>;
    }
  | { index: number; url: string; ok: false; error: string };

const fromUrls = defineTool({
  name: "media_upload_many_from_urls",
  title: "Upload several pictures from addresses",
  description: `Fetches up to ${MANY_MAX} pictures from public https addresses (each up to 10 MB; JPG, PNG, WebP or AVIF) and uploads them all for the same \`use\`. Returns one result per address, in the order sent: the hosted \`url\`, \`width\` and \`height\`, or why that one failed. A failure does not stop the others; send the failed ones again.`,
  scope: "media",
  write: true,
  input: {
    use,
    urls: z
      .array(z.string())
      .min(1)
      .max(MANY_MAX)
      .describe(`Public https:// addresses, at most ${MANY_MAX}`),
  },
  async run({ use, urls }) {
    const started = Date.now();
    const results: ManyResult[] = new Array(urls.length);
    let next = 0;
    const worker = async () => {
      for (;;) {
        const index = next++;
        if (index >= urls.length) return;
        const url = urls[index];
        if (Date.now() - started > MANY_BUDGET_MS) {
          results[index] = {
            index,
            url,
            ok: false,
            error: "Not started: the call ran out of time. Send it again.",
          };
          continue;
        }
        try {
          const { bytes, filename } = await fetchPublicFile(url);
          results[index] = {
            index,
            url,
            ok: true,
            hosted: await uploadFile(use, bytes, filename),
          };
        } catch (error) {
          results[index] = {
            index,
            url,
            ok: false,
            error:
              error instanceof ToolError
                ? error.message
                : "The upload failed. Try this one again.",
          };
        }
      }
    };
    await Promise.all(
      Array.from({ length: Math.min(MANY_AT_ONCE, urls.length) }, worker),
    );
    const uploaded = results.filter((result) => result.ok).length;
    return {
      summary: `Uploaded ${uploaded} of ${urls.length} ${use} pictures`,
      data: {
        uploaded,
        failed: urls.length - uploaded,
        results: results.map((result) =>
          result.ok
            ? { index: result.index, source: result.url, ...result.hosted }
            : { index: result.index, source: result.url, error: result.error },
        ),
      },
    };
  },
});

const fromBase64 = defineTool({
  name: "media_upload_base64",
  title: "Upload a picture from base64",
  description:
    "Uploads a picture sent as base64 (or a data: URL), up to 10 MB. Returns the hosted `url`, `width` and `height`.",
  scope: "media",
  write: true,
  input: {
    use,
    filename: z
      .string()
      .min(1)
      .max(120)
      .describe("The file's name, like cover.png"),
    data: z.string().min(1).describe("The file's bytes as base64"),
  },
  async run({ use, filename, data }) {
    const uploaded = await uploadFile(use, decodeBase64(data), filename);
    return { summary: `Uploaded ${filename}`, data: uploaded };
  },
});

const resume = defineTool({
  name: "resume_upload",
  title: "Upload the résumé",
  description:
    "Uploads a PDF résumé (up to 5 MB) from a public https address or base64. With `setAs` it also makes it the profile's résumé: `en` for the English file, `fr` for the French one (needs the write scope).",
  scope: "media",
  write: true,
  input: {
    url: z.string().optional().describe("A public https:// address of the PDF"),
    data: z.string().optional().describe("Or the PDF as base64"),
    filename: z
      .string()
      .max(120)
      .optional()
      .describe("The file's name, with base64"),
    setAs: z
      .enum(["en", "fr"])
      .optional()
      .describe("Also set it as the profile's résumé in this language"),
  },
  async run({ url, data, filename, setAs }, { db, caller }) {
    if (!url === !data)
      throw new ToolError(
        "Send either `url` or `data`, not both and not neither.",
      );
    if (setAs && !caller.scopes.includes("write"))
      throw new ToolError(
        "Setting it as the résumé needs the write scope; upload it without `setAs`.",
      );
    const file = url
      ? await fetchPublicFile(url, 5 * 1024 * 1024)
      : {
          bytes: decodeBase64(data!, 5 * 1024 * 1024),
          filename: filename ?? "resume.pdf",
        };
    if (file.bytes.byteLength > 5 * 1024 * 1024)
      throw new ToolError("That file is over 5 MB.");
    const uploaded = await uploadFile("resume", file.bytes, file.filename);
    if (setAs) {
      const result =
        setAs === "en"
          ? await updateProfile(db, { resumeUrl: uploaded.url })
          : await updateProfile(db, await frenchResume(db, uploaded.url));
      if (!result.ok)
        throw new ToolError(
          "Uploaded, but the profile could not be updated.",
          result.status === 422 ? result.fields : undefined,
        );
      publishedProfile();
    }
    return {
      summary: setAs
        ? `Uploaded the ${setAs} résumé and set it`
        : "Uploaded a résumé",
      data: { ...uploaded, setAs: setAs ?? null },
    };
  },
});

// The French résumé lives in `translations.fr.resumeUrl`; keep the rest of the French.
async function frenchResume(
  db: Parameters<typeof updateProfile>[0],
  url: string,
) {
  const row = await getProfile(db);
  const current =
    (row?.translations as { fr?: Record<string, unknown> } | undefined)?.fr ??
    {};
  return { translations: { fr: { ...current, resumeUrl: url } } };
}

export const mediaTools: AnyTool[] = [fromUrl, fromUrls, fromBase64, resume];

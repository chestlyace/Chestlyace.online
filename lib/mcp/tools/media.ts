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

export const mediaTools: AnyTool[] = [fromUrl, fromBase64, resume];

import { z } from "zod";
import { getProfile, updateProfile } from "@/lib/admin/api";
import { publishedProfile } from "../revalidate";
import { ToolError, defineTool, refuse, type AnyTool } from "../tool";
import { resourceTools } from "./resources";

// The portfolio's tools (docs/mcp.md §5): the profile, and the lists on the main site.

export const PORTFOLIO_RESOURCES = [
  "projects",
  "skills",
  "journey",
  "volunteering",
  "certifications",
  "services",
  "faqs",
  "socials",
] as const;

const profileGet = defineTool({
  name: "profile_get",
  title: "Read the profile",
  description:
    "The profile: name, headline, About text, résumé addresses, contact details, availability, with French text.",
  scope: "read",
  write: false,
  input: {},
  async run(_args, { db }) {
    const row = await getProfile(db);
    if (!row) throw new ToolError("The profile has not been created yet.");
    return { summary: "Read the profile", data: row };
  },
});

const profileUpdate = defineTool({
  name: "profile_update",
  title: "Change the profile",
  description:
    'Changes the profile fields you send in `data` (see list_resources "profile"); the rest stay. French text goes in data.translations.fr and is merged with what is there. Upload pictures and the résumé first (media_upload_*, resume_upload).',
  scope: "write",
  write: true,
  input: {
    data: z
      .record(z.string(), z.unknown())
      .describe("The profile fields to change"),
  },
  async run({ data }, { db }) {
    const current = await getProfile(db);
    const sent = (data as { translations?: { fr?: Record<string, unknown> } })
      .translations;
    const before = (current as { translations?: { fr?: object } } | null)
      ?.translations?.fr;
    const body =
      sent?.fr && before
        ? { ...data, translations: { fr: { ...before, ...sent.fr } } }
        : data;
    const result = await updateProfile(db, body);
    if (!result.ok) refuse(result, "profile");
    publishedProfile();
    return { summary: "Changed the profile", data: result.row };
  },
});

export const portfolioTools: AnyTool[] = [
  profileGet,
  profileUpdate,
  ...PORTFOLIO_RESOURCES.flatMap(resourceTools),
];

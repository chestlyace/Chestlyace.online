import { z } from "zod";
import {
  getCreativesSettings,
  getNewsletter,
  updateCreativesSettings,
  updateNewsletter,
} from "@/lib/admin/api";
import { publishedBlog, publishedCreatives } from "../revalidate";
import { hasScope } from "../scopes";
import { ToolError, defineTool, refuse, type AnyTool } from "../tool";
import { resourceTools } from "./resources";

// The creatives site's tools and the two settings screens (docs/mcp.md §5).

export const CREATIVES_RESOURCES = [
  "design-pieces",
  "photo-events",
  "creative-services",
  "creative-faqs",
] as const;

const data = (what: string) =>
  z
    .record(z.string(), z.unknown())
    .describe(`The ${what} fields to change (see list_resources).`);

type Translated = { translations?: { fr?: Record<string, unknown> } };

/** French wording sent in a change joins what is stored, so a text left out is kept. */
function withFrench(current: Translated, sent: Record<string, unknown>) {
  const fr = (sent as Translated).translations?.fr;
  if (!fr) return sent;
  return {
    ...sent,
    translations: { fr: { ...current.translations?.fr, ...fr } },
  };
}

const creativesGet = defineTool({
  name: "creatives_settings_get",
  title: "Read the creatives settings",
  description:
    "The creatives site's wording (hero, about, contact, SEO) as the site uses it: your text, or the built-in text where you left it blank, with the French wording.",
  scope: "read",
  write: false,
  input: {},
  async run(_args, { db }) {
    return {
      summary: "Read the creatives settings",
      data: await getCreativesSettings(db),
    };
  },
});

const creativesUpdate = defineTool({
  name: "creatives_settings_update",
  title: "Change the creatives settings",
  description:
    'Changes the creatives site\'s wording fields you send in `data` (see list_resources "creatives_settings"); the rest stay. French wording goes in data.translations.fr.',
  scope: "write",
  write: true,
  input: { data: data("creatives settings") },
  async run({ data }, { db }) {
    const result = await updateCreativesSettings(
      db,
      withFrench(await getCreativesSettings(db), data),
    );
    if (!result.ok) refuse(result, "setting");
    publishedCreatives();
    return { summary: "Changed the creatives settings", data: result.row };
  },
});

const newsletterGet = defineTool({
  name: "newsletter_settings_get",
  title: "Read the newsletter settings",
  description:
    "The blog's newsletter: whether the signup box is on, and every text of the box, the pages the email link opens and the confirmation email, with the French wording.",
  scope: "read",
  write: false,
  input: {},
  async run(_args, { db }) {
    return {
      summary: "Read the newsletter settings",
      data: await getNewsletter(db),
    };
  },
});

const newsletterUpdate = defineTool({
  name: "newsletter_settings_update",
  title: "Change the newsletter settings",
  description:
    'Changes the newsletter fields you send in `data` (see list_resources "newsletter"). Switching `enabled` (the signup box on or off) needs the publish scope. French wording goes in data.translations.fr.',
  scope: "write",
  write: true,
  input: { data: data("newsletter") },
  async run({ data }, { db, caller }) {
    const current = await getNewsletter(db);
    if ("enabled" in data && data.enabled !== current.enabled) {
      if (!hasScope(caller.scopes, "publish"))
        throw new ToolError(
          "Switching the newsletter box on or off needs the publish scope, which this token does not have. Change the wording only, or ask the owner.",
        );
    }
    const result = await updateNewsletter(db, withFrench(current, data));
    if (!result.ok) refuse(result, "setting");
    publishedBlog();
    return { summary: "Changed the newsletter settings", data: result.row };
  },
});

export const creativesTools: AnyTool[] = [
  ...CREATIVES_RESOURCES.flatMap(resourceTools),
  creativesGet,
  creativesUpdate,
  newsletterGet,
  newsletterUpdate,
];

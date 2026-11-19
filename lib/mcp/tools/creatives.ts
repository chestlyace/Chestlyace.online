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

// The creatives site's tools and the two settings screens (docs/mcp.md §5, Phase
// 13b.5): the four creatives lists get the same generated tools as the portfolio's, and
// each settings screen a get and an update. Turning the newsletter on puts it live, so
// it needs `publish` (§4); everything else in the settings is wording.

export const CREATIVES_TOOL_RESOURCES = [
  "design-pieces",
  "photo-events",
  "creative-services",
  "creative-faqs",
] as const;

type Translated = { translations?: { fr?: Record<string, unknown> } };

/** French text sent in an update joins what is there, so a field left out is kept. */
function withFrench(
  current: Translated,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const sent = (data as Translated).translations;
  if (!sent?.fr) return data;
  const before = current.translations?.fr ?? {};
  return { ...data, translations: { fr: { ...before, ...sent.fr } } };
}

const data = (screen: string) =>
  z
    .record(z.string(), z.unknown())
    .describe(
      `The fields to change, as list_resources describes "${screen}"; the rest stay. French wording goes in data.translations.fr.`,
    );

const creativesSettingsGet = defineTool({
  name: "creatives_settings_get",
  title: "Read the creatives site's wording",
  description:
    "The creatives site's wording as it is shown (hero, section intros, portals, marquee words, contact block, SEO description), with the French beside it.",
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

const creativesSettingsUpdate = defineTool({
  name: "creatives_settings_update",
  title: "Change the creatives site's wording",
  description:
    "Changes the creatives site's wording you send in `data`; the rest stays. It shows on the site at once.",
  scope: "write",
  write: true,
  input: { data: data("creatives_settings") },
  async run({ data }, { db }) {
    const current = await getCreativesSettings(db);
    const result = await updateCreativesSettings(db, withFrench(current, data));
    if (!result.ok) refuse(result, "creatives settings");
    publishedCreatives();
    return { summary: "Changed the creatives settings", data: result.row };
  },
});

const newsletterSettingsGet = defineTool({
  name: "newsletter_settings_get",
  title: "Read the newsletter settings",
  description:
    "Whether the blog's signup box is on, and the wording of the box, the two confirmation pages and the email, with the French beside it.",
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

const newsletterSettingsUpdate = defineTool({
  name: "newsletter_settings_update",
  title: "Change the newsletter settings",
  description:
    "Changes the newsletter wording you send in `data`; the rest stays. Turning the signup box on (`enabled: true`) needs the publish scope.",
  scope: "write",
  write: true,
  input: { data: data("newsletter") },
  async run({ data }, { db, caller }) {
    const current = await getNewsletter(db);
    if (
      data.enabled === true &&
      !current.enabled &&
      !hasScope(caller.scopes, "publish")
    )
      throw new ToolError(
        "Turning the newsletter on needs the publish scope, which this token does not have. Change the wording; the owner can switch it on.",
      );
    const result = await updateNewsletter(db, withFrench(current, data));
    if (!result.ok) refuse(result, "newsletter settings");
    publishedBlog();
    return { summary: "Changed the newsletter settings", data: result.row };
  },
});

export const creativesTools: AnyTool[] = [
  ...CREATIVES_TOOL_RESOURCES.flatMap(resourceTools),
  creativesSettingsGet,
  creativesSettingsUpdate,
  newsletterSettingsGet,
  newsletterSettingsUpdate,
];

import { z } from "zod";
import { siteUrl } from "@/lib/sites";
import { describeResources } from "../catalog";
import { GUIDE_NAMES, GUIDE_TITLES, guide } from "../guides";
import { defineTool, type AnyTool } from "../tool";
import { agentTokens } from "@/db/schema";
import { eq } from "drizzle-orm";

// The tools every token has (docs/mcp.md §5): who am I, what can I edit, how do I write.

const whoami = defineTool({
  name: "whoami",
  title: "Who am I",
  description:
    "The token's name, what it may do (scopes) and when it expires, and the addresses of the owner's sites.",
  scope: "read",
  write: false,
  input: {},
  async run(_args, { db, caller }) {
    const [row] = await db
      .select({ expiresAt: agentTokens.expiresAt })
      .from(agentTokens)
      .where(eq(agentTokens.id, caller.id))
      .limit(1);
    return {
      summary: "Checked the token",
      data: {
        token: caller.name,
        scopes: caller.scopes,
        expiresAt: row?.expiresAt?.toISOString() ?? null,
        sites: {
          main: siteUrl("main", "/"),
          blog: siteUrl("blog", "/"),
          creatives: siteUrl("creatives", "/"),
          admin: siteUrl("admin", "/"),
        },
      },
    };
  },
});

const listResources = defineTool({
  name: "list_resources",
  title: "List what can be edited",
  description:
    "Every kind of content the admin edits (projects, skills, experience, services, FAQ, socials, certifications, volunteering, design pieces, photo events, creative services and FAQ, profile, the settings): what it is, whether it has a published switch, which fields have a French version, and its fields as a JSON Schema. Tools for each are named `<name>_list`, `<name>_get`, `<name>_create`, `<name>_update`, `<name>_delete`, `<name>_reorder`.",
  scope: "read",
  write: false,
  input: {},
  async run() {
    const resources = describeResources();
    return {
      summary: `Listed ${resources.length} resources`,
      data: { resources },
    };
  },
});

const getGuide = defineTool({
  name: "get_guide",
  title: "Read a guide",
  description: `Read a guide before you write: ${GUIDE_NAMES.map((name) => `"${name}" (${GUIDE_TITLES[name]})`).join("; ")}.`,
  scope: "read",
  write: false,
  input: { name: z.enum(GUIDE_NAMES).describe("Which guide") },
  async run({ name }) {
    return { summary: `Read the ${name} guide`, data: guide(name) };
  },
});

export const generalTools: AnyTool[] = [whoami, listResources, getGuide];

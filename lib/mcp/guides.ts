import { readFileSync } from "node:fs";
import path from "node:path";
import { UPLOAD_RULES, MAX_UPLOAD_BYTES } from "@/lib/cloudinary";

// The guides an agent can read before it writes (docs/mcp.md §5): how a blog post's
// markdown works, how French works, which sizes and kinds of pictures there are. Served
// as the `get_guide` tool and as MCP resources.

export const GUIDE_NAMES = ["blog_markdown", "languages", "images"] as const;
export type GuideName = (typeof GUIDE_NAMES)[number];

export const GUIDE_TITLES: Record<GuideName, string> = {
  blog_markdown:
    "Writing a blog post: every block's markdown syntax, from docs/blog-markdown.md",
  languages: "English and French: how a French version of anything is written",
  images: "Pictures: what each upload is for, its folder, size and formats",
};

const LANGUAGES = `# English and French

The sites are in English (default) and French (under /fr). Everything an agent writes has an
English version; most text also has an optional French version.

- **Content resources** (projects, skills, experience, services, FAQ, design pieces, photo
  events, creative services and FAQ, profile, the two settings): every translatable text
  field has a French counterpart in \`translations.fr\`, an object that holds only the fields
  you translated: \`{ "fr": { "title": "…", "description": "…" } }\`. A blank or missing French
  field shows the English one on the French site. \`list_resources\` says which fields are
  translatable for each resource.
- **Images inside a list** (a piece's or event's pictures, an event's credits) use sibling
  keys: \`alt\` and \`altFr\`, \`caption\` and \`captionFr\`, \`role\` and \`roleFr\`.
- **Blog posts**: \`translations.fr\` holds \`title\`, \`description\`, \`content\` (the whole post in
  markdown, same block syntax), \`coverAlt\`, \`series\` and \`published\`. The French version is
  live only when \`content\` is set **and** \`published\` is true (and the post itself is
  published). Posts without French stay in English on the French blog, marked EN. Tags are not
  translated.
- Write French with the polite form (vous). Avoid wording that depends on the owner's gender.
- Slugs, addresses, dates, numbers, tool and technology names are never translated.
`;

function imagesGuide(): string {
  const lines = Object.entries(UPLOAD_RULES).map(
    ([use, rule]) =>
      `- **${use}**: folder \`${rule.folder}\`, ${rule.resource === "raw" ? "a file" : "an image"}, ${rule.formats.join(", ")}${rule.transformation ? `, limited to ${rule.transformation.replace(/c_limit,w_(\d+),h_\d+/, "$1px on the longest side")}` : ""}`,
  );
  return `# Pictures

Upload with \`media_upload_from_url\` (an https address) or \`media_upload_base64\`; both return the
hosted address, width and height, which is what the content tools take (\`coverUrl\`, \`coverWidth\`,
\`coverHeight\`, an image's \`url\`, \`width\`, \`height\`). Always write a description (\`alt\`) for
people who cannot see the picture. Files are limited to ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB.

What each \`use\` is for:

${lines.join("\n")}

Use \`project\` for a project's pictures, \`logo\` for a company or school logo, \`profile\` for the
owner's photo, \`badge\` for a certification's badge, \`icon\` for a skill's icon, \`blog\` for a blog
post's cover and pictures, \`creatives\` for design pieces and photographs, \`resume\` for the résumé.
`;
}

function readDoc(name: string): string {
  try {
    return readFileSync(path.join(process.cwd(), "docs", name), "utf8");
  } catch {
    return `The guide "${name}" is not available on this server. Ask the owner to check the deployment.`;
  }
}

export function guide(name: GuideName): string {
  if (name === "blog_markdown") return readDoc("blog-markdown.md");
  if (name === "languages") return LANGUAGES;
  return imagesGuide();
}

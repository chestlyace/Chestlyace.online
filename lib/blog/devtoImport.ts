import { findProblems } from "./markdown";

// DEV (dev.to) articles into this blog's markdown (docs/blog-markdown.md §3).
// Pure: it takes the article's `body_markdown` and metadata and says what became
// what and what needs a look. The API calls live in lib/blog/devto.ts.

export type DevArticle = {
  id: number;
  title: string;
  description?: string | null;
  body_markdown?: string | null;
  tag_list?: string | string[] | null;
  tags?: string | string[] | null;
  cover_image?: string | null;
  url?: string | null;
  canonical_url?: string | null;
  published_at?: string | null;
  published_timestamp?: string | null;
};

export type Converted = {
  markdown: string;
  /** What needs a look (a tag kept as text, an image still on DEV…). */
  warnings: string[];
  /** What became what. */
  notes: string[];
  /** The article's front matter, if its body had one. */
  front: Record<string, string>;
};

// ---- front matter ---------------------------------------------------------------------

function splitFrontMatter(body: string): {
  front: Record<string, string>;
  rest: string;
} {
  const match = body.match(/^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
  if (!match) return { front: {}, rest: body };
  const front: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const pair = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (pair)
      front[pair[1].toLowerCase()] = pair[2].trim().replace(/^["']|["']$/g, "");
  }
  return { front, rest: body.slice(match[0].length) };
}

// ---- liquid tags ----------------------------------------------------------------------

const fenceOf = (line: string) => line.match(/^\s*(`{3,}|~{3,})/)?.[1] ?? null;

// A fence long enough that nothing inside can close it.
function fence(info: string, body: string) {
  const longest = Math.max(
    0,
    ...[...body.matchAll(/`{3,}/g)].map((run) => run[0].length),
  );
  const ticks = "`".repeat(Math.max(3, longest + 1));
  return `${ticks}${info}\n${body}\n${ticks}`;
}

const isUrl = (text: string) => /^https?:\/\/\S+$/i.test(text);

type Report = { notes: Set<string>; kept: Map<string, number> };

function linkFor(name: string, arg: string): string | null {
  switch (name) {
    case "embed":
    case "link":
      return isUrl(arg) ? `[${arg}](${arg})` : null;
    case "youtube": {
      const id = arg
        .replace(
          /^https?:\/\/(www\.)?(youtu\.be\/|youtube\.com\/watch\?v=)/i,
          "",
        )
        .trim();
      return /^[\w-]{6,}$/.test(id)
        ? `[Watch on YouTube](https://www.youtube.com/watch?v=${id})`
        : null;
    }
    case "github": {
      if (isUrl(arg))
        return `[${arg.replace(/^https?:\/\/github\.com\//i, "")}](${arg})`;
      return /^[\w.-]+\/[\w.-]+$/.test(arg)
        ? `[${arg}](https://github.com/${arg})`
        : null;
    }
    default:
      return null;
  }
}

function convertInline(line: string, report: Report): string {
  return line.replace(
    /\{%\s*(\w+)\s*([^%]*?)\s*%\}/g,
    (whole, name: string, arg: string) => {
      const link = linkFor(name, arg.trim());
      if (link) {
        report.notes.add(`{% ${name} %} became a link`);
        return link;
      }
      const label = `{% ${name} %}`;
      report.kept.set(label, (report.kept.get(label) ?? 0) + 1);
      return `\`${whole.replace(/`/g, "'")}\``;
    },
  );
}

function convertLines(lines: string[], report: Report): string[] {
  const out: string[] = [];
  let open: string | null = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const marker = fenceOf(line);
    if (open) {
      out.push(line);
      if (
        marker &&
        marker[0] === open[0] &&
        marker.length >= open.length &&
        line.trim() === marker
      )
        open = null;
      continue;
    }
    if (marker) {
      open = marker;
      out.push(line);
      continue;
    }
    const start = line.match(/^\s*\{%\s*details\s*(.*?)\s*%\}\s*$/);
    if (start) {
      // Find the matching end, ignoring tags inside code.
      let depth = 1;
      let fenced: string | null = null;
      let end = -1;
      for (let j = i + 1; j < lines.length; j++) {
        const m = fenceOf(lines[j]);
        if (fenced) {
          if (
            m &&
            m[0] === fenced[0] &&
            m.length >= fenced.length &&
            lines[j].trim() === m
          )
            fenced = null;
          continue;
        }
        if (m) {
          fenced = m;
          continue;
        }
        if (/^\s*\{%\s*details\b/.test(lines[j])) depth++;
        else if (
          /^\s*\{%\s*enddetails\s*%\}\s*$/.test(lines[j]) &&
          --depth === 0
        ) {
          end = j;
          break;
        }
      }
      if (end !== -1) {
        const inner = convertLines(lines.slice(i + 1, end), report)
          .join("\n")
          .trim();
        const title = start[1].replace(/"/g, "'") || "Details";
        out.push(fence(`callout type=note title="${title}"`, inner));
        report.notes.add("{% details %} became a note callout");
        i = end;
        continue;
      }
    }
    out.push(convertInline(line, report));
  }
  return out;
}

// ---- images ---------------------------------------------------------------------------

const DEV_CDN =
  /!\[[^\]]*\]\((?:https?:)?\/\/(?:res\.cloudinary\.com\/practicaldev|dev-to-uploads\.s3\.amazonaws\.com|media2?\.dev\.to|images\.dev\.to)[^)]*\)/g;

// ---- the article ---------------------------------------------------------------------

export function convertDevMarkdown(body: string): Converted {
  const { front, rest } = splitFrontMatter(body.replace(/\r\n?/g, "\n"));
  const report: Report = { notes: new Set(), kept: new Map() };
  const markdown =
    convertLines(rest.split("\n"), report).join("\n").trim() + "\n";

  const warnings: string[] = [];
  for (const [label, count] of report.kept)
    warnings.push(
      `${count === 1 ? "A" : `${count}`} ${label} tag${count === 1 ? " was" : "s were"} kept as text, because the blog doesn't know it.`,
    );
  const onDev = markdown.match(DEV_CDN)?.length ?? 0;
  if (onDev > 0)
    warnings.push(
      `${onDev === 1 ? "An image is" : `${onDev} images are`} still hosted on DEV. Upload ${onDev === 1 ? "it" : "them"} to the blog's image storage to keep ${onDev === 1 ? "it" : "them"} if the DEV article goes.`,
    );
  for (const problem of findProblems(markdown))
    if (problem.level === "error")
      warnings.push(`Fix before publishing: ${problem.message}`);

  return { markdown, warnings, notes: [...report.notes], front };
}

// ---- metadata -------------------------------------------------------------------------

const slugTag = (tag: string) =>
  tag
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30)
    .replace(/-+$/g, "");

const asList = (value: string | string[] | null | undefined): string[] =>
  Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",").map((part) => part.trim())
      : [];

/** The plain opening text of a markdown body, for a missing description. */
function opening(markdown: string): string {
  const paragraph =
    markdown
      .split(/\n{2,}/)
      .map((part) => part.trim())
      .find((part) => part && !/^(#|```|>|!\[|[-*] |\d+\. |\|)/.test(part)) ??
    "";
  const text = paragraph
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 200 ? `${text.slice(0, 197).trimEnd()}…` : text;
}

export type ImportedPost = {
  title: string;
  description: string;
  content: string;
  tags: string[];
  coverUrl: string | null;
  series: string | null;
  canonicalUrl: string | null;
  publishedAt: string | null;
  devtoId: number;
  devtoUrl: string | null;
  warnings: string[];
  notes: string[];
};

const onDevHost = (url: string) => {
  try {
    return /(^|\.)dev\.to$/i.test(new URL(url).hostname);
  } catch {
    return false;
  }
};

// A DEV article (the full one, with its markdown) as the fields of a draft here.
export function articleToPost(article: DevArticle): ImportedPost {
  const converted = convertDevMarkdown(article.body_markdown ?? "");
  const warnings = [...converted.warnings];

  let title = (article.title || converted.front.title || "Untitled").trim();
  if (title.length > 120) {
    title = `${title.slice(0, 119).trimEnd()}…`;
    warnings.push("The title was shortened to 120 characters.");
  }

  let description = (
    article.description ||
    converted.front.description ||
    ""
  ).trim();
  if (!description) {
    description = opening(converted.markdown);
    warnings.push(
      "The article has no description; the opening text was used. Check it.",
    );
  }
  if (description.length > 300)
    description = `${description.slice(0, 297).trimEnd()}…`;

  const raw = asList(article.tags ?? article.tag_list ?? converted.front.tags);
  const tags = [...new Set(raw.map(slugTag).filter(Boolean))].slice(0, 8);

  const canonical =
    article.canonical_url?.trim() || converted.front.canonical_url || "";
  const canonicalUrl = canonical && !onDevHost(canonical) ? canonical : null;
  if (canonical && !canonicalUrl)
    converted.notes.push(
      "The canonical address pointed at DEV, so it was left empty here",
    );

  return {
    title,
    description,
    content: converted.markdown,
    tags,
    coverUrl:
      article.cover_image?.trim() || converted.front.cover_image || null,
    series: converted.front.series?.trim() || null,
    canonicalUrl,
    publishedAt: article.published_at ?? article.published_timestamp ?? null,
    devtoId: article.id,
    devtoUrl: article.url ?? null,
    warnings,
    notes: converted.notes,
  };
}

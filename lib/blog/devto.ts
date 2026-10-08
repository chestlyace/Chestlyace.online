// The DEV (Forem) API (docs/blog-markdown.md §3–§4). Plain `fetch`, so nothing is
// added to the project; `fetcher` is a parameter so tests can stand in for DEV.
import type { DevArticle } from "./devtoImport";

// DEV's API (DEVTO_API_URL points it at a stand-in when testing).
const base = () => process.env.DEVTO_API_URL?.trim() || "https://dev.to/api";
const ACCEPT = "application/vnd.forem.api-v1+json";

export type Fetcher = typeof fetch;

export class DevError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function call(
  fetcher: Fetcher,
  path: string,
  init: RequestInit & { key?: string } = {},
): Promise<unknown> {
  const { key, ...rest } = init;
  let response: Response;
  try {
    response = await fetcher(`${base()}${path}`, {
      ...rest,
      headers: {
        Accept: ACCEPT,
        "User-Agent": "chestlyace-blog",
        ...(key ? { "api-key": key } : {}),
        ...(rest.body ? { "Content-Type": "application/json" } : {}),
      },
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new DevError("Couldn't reach DEV. Try again in a moment.", 502);
  }
  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!response.ok) {
    const reason =
      typeof data === "object" && data !== null && "error" in data
        ? String((data as { error: unknown }).error)
        : "";
    throw new DevError(
      response.status === 401
        ? "DEV refused the API key. Check it in DEV's settings."
        : response.status === 404
          ? "DEV couldn't find that."
          : response.status === 429
            ? "DEV says to slow down. Try again in a minute."
            : reason || `DEV answered ${response.status}.`,
      response.status,
    );
  }
  return data;
}

export type ArticleSummary = {
  id: number;
  title: string;
  url: string;
  publishedAt: string | null;
  tags: string[];
  cover: string | null;
};

const asTags = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.map(String)
    : typeof value === "string"
      ? value
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

// The published articles of a DEV user, newest first (no key needed).
export async function listArticles(
  fetcher: Fetcher,
  username: string,
): Promise<ArticleSummary[]> {
  const name = username.trim().replace(/^@/, "");
  if (!/^[A-Za-z0-9_]{1,40}$/.test(name))
    throw new DevError("That doesn't look like a DEV username.", 400);
  const found: ArticleSummary[] = [];
  for (let page = 1; page <= 5; page++) {
    const data = (await call(
      fetcher,
      `/articles?username=${encodeURIComponent(name)}&per_page=100&page=${page}`,
    )) as Record<string, unknown>[] | null;
    if (!Array.isArray(data) || data.length === 0) break;
    for (const item of data)
      found.push({
        id: Number(item.id),
        title: String(item.title ?? ""),
        url: String(item.url ?? ""),
        publishedAt: (item.published_at as string | null) ?? null,
        tags: asTags(item.tag_list ?? item.tags),
        cover: (item.cover_image as string | null) ?? null,
      });
    if (data.length < 100) break;
  }
  return found;
}

// One article with its markdown.
export async function getArticle(
  fetcher: Fetcher,
  id: number,
): Promise<DevArticle> {
  const data = (await call(fetcher, `/articles/${id}`)) as DevArticle | null;
  if (!data || typeof data.id !== "number")
    throw new DevError("DEV sent something unexpected.", 502);
  return data;
}

export type DevPayload = {
  title: string;
  body_markdown: string;
  published: boolean;
  tags: string[];
  description?: string;
  canonical_url: string;
  main_image?: string;
  series?: string;
};

// DEV's tags are letters and numbers only, four at most.
export const devTags = (tags: readonly string[]) =>
  [
    ...new Set(
      tags
        .map((tag) => tag.replace(/[^a-z0-9]/gi, "").toLowerCase())
        .filter(Boolean),
    ),
  ].slice(0, 4);

// Creates the article, or updates it when `id` is given.
export async function publishArticle(
  fetcher: Fetcher,
  key: string,
  payload: DevPayload,
  id?: number | null,
): Promise<{ id: number; url: string }> {
  const data = (await call(fetcher, id ? `/articles/${id}` : "/articles", {
    method: id ? "PUT" : "POST",
    key,
    body: JSON.stringify({ article: payload }),
  })) as { id?: number; url?: string } | null;
  if (!data || typeof data.id !== "number" || typeof data.url !== "string")
    throw new DevError("DEV sent something unexpected.", 502);
  return { id: data.id, url: data.url };
}

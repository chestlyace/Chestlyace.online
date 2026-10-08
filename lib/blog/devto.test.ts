import { describe, expect, it, vi } from "vitest";
import {
  DevError,
  devTags,
  getArticle,
  listArticles,
  publishArticle,
} from "./devto";

const reply = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));

describe("listArticles", () => {
  it("asks for the user's articles and maps them, paging until a short page", async () => {
    const fetcher = vi.fn(async (url: RequestInfo | URL) =>
      /[?&]page=1$/.test(String(url))
        ? await reply(
            Array.from({ length: 100 }, (_, i) => ({
              id: i + 1,
              title: `T${i}`,
              url: `u${i}`,
              tag_list: ["a", "b"],
              published_at: "2025-01-01",
            })),
          )
        : await reply([
            {
              id: 101,
              title: "Last",
              url: "ul",
              tag_list: "x, y",
              cover_image: "c.png",
            },
          ]),
    );
    const list = await listArticles(fetcher as never, "@some_user");
    expect(list).toHaveLength(101);
    expect(list[100]).toMatchObject({
      id: 101,
      tags: ["x", "y"],
      cover: "c.png",
    });
    expect(String(fetcher.mock.calls[0][0])).toContain("username=some_user");
    expect(fetcher.mock.calls).toHaveLength(2);
  });

  it("refuses an odd username without calling DEV", async () => {
    const fetcher = vi.fn();
    await expect(
      listArticles(fetcher as never, "a b/../c"),
    ).rejects.toBeInstanceOf(DevError);
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe("getArticle and publishArticle", () => {
  it("reads one article", async () => {
    const fetcher = vi.fn(() =>
      reply({ id: 5, title: "T", body_markdown: "x" }),
    );
    expect((await getArticle(fetcher as never, 5)).title).toBe("T");
  });

  it("creates with POST and updates with PUT, sending the key", async () => {
    const fetcher = vi.fn(() =>
      reply({ id: 9, url: "https://dev.to/me/p" }, 201),
    );
    const payload = {
      title: "T",
      body_markdown: "b",
      published: false,
      tags: ["a"],
      canonical_url: "https://x/y",
    };
    expect(await publishArticle(fetcher as never, "KEY", payload)).toEqual({
      id: 9,
      url: "https://dev.to/me/p",
    });
    await publishArticle(fetcher as never, "KEY", payload, 9);
    const [create, update] = fetcher.mock.calls as unknown as [
      string,
      RequestInit,
    ][][];
    expect(String(create[0])).toBe("https://dev.to/api/articles");
    expect((create[1] as RequestInit).method).toBe("POST");
    expect(
      ((create[1] as RequestInit).headers as Record<string, string>)["api-key"],
    ).toBe("KEY");
    expect(String(update[0])).toBe("https://dev.to/api/articles/9");
    expect((update[1] as RequestInit).method).toBe("PUT");
    expect(
      JSON.parse(String((create[1] as RequestInit).body)).article.title,
    ).toBe("T");
  });

  it("turns DEV's errors into messages", async () => {
    const bad = (status: number, body: unknown = {}) =>
      vi.fn(() => reply(body, status));
    await expect(
      publishArticle(bad(401) as never, "K", {} as never),
    ).rejects.toThrow(/refused the API key/);
    await expect(
      publishArticle(
        bad(422, { error: "Title is too long" }) as never,
        "K",
        {} as never,
      ),
    ).rejects.toThrow("Title is too long");
    await expect(getArticle(bad(404) as never, 1)).rejects.toThrow(
      /couldn't find/,
    );
    await expect(
      getArticle(vi.fn(() => Promise.reject(new Error("net"))) as never, 1),
    ).rejects.toThrow(/Couldn't reach DEV/);
  });
});

describe("devTags", () => {
  it("keeps letters and numbers, lowercase, four at most", () => {
    expect(devTags(["web-dev", "C++", "a", "b", "c", "d"])).toEqual([
      "webdev",
      "c",
      "a",
      "b",
    ]);
  });
});

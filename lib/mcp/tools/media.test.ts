import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as schema from "@/db/schema";
import type { Database } from "@/lib/db";
import { ToolError } from "../tool";
import { connectAs, testDb } from "../testkit";

vi.mock("next/cache", () => ({
  revalidateTag: () => {},
  unstable_cache: (fn: unknown) => fn,
}));

const fetchPublicFile = vi.fn();
const uploadFile = vi.fn();
vi.mock("../media", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../media")>()),
  fetchPublicFile: (...args: unknown[]) => fetchPublicFile(...args),
  uploadFile: (...args: unknown[]) => uploadFile(...args),
}));

let db: Database;
beforeAll(async () => {
  db = await testDb();
}, 30_000);
beforeEach(async () => {
  fetchPublicFile.mockReset();
  uploadFile.mockReset();
  await db.delete(schema.agentActivity);
  await db.delete(schema.agentTokens);
});

const address = (n: number) => `https://example.com/p${n}.png`;

describe("media_upload_many_from_urls", () => {
  it("is listed with the media scope only", async () => {
    const names = async (scopes: string[]) =>
      (await (await connectAs(db, scopes)).client.listTools()).tools.map(
        (tool) => tool.name,
      );
    expect(await names(["read", "write"])).not.toContain(
      "media_upload_many_from_urls",
    );
    expect(await names(["read", "media"])).toContain(
      "media_upload_many_from_urls",
    );
  });

  it("uploads each picture and answers in the order sent", async () => {
    fetchPublicFile.mockImplementation(async (url: string) => ({
      bytes: new Uint8Array([1]),
      filename: url.split("/").pop(),
    }));
    uploadFile.mockImplementation(
      async (_use: string, _bytes: unknown, name: string) => {
        // later pictures finish first: the order of the answer must not follow it
        await new Promise((resolve) =>
          setTimeout(resolve, name === "p1.png" ? 40 : 1),
        );
        return {
          url: `https://res.cloudinary.com/x/${name}`,
          width: 800,
          height: 600,
          bytes: 1,
          format: "png",
        };
      },
    );
    const { call } = await connectAs(db, ["read", "media"]);
    const result = await call("media_upload_many_from_urls", {
      use: "project",
      urls: [address(1), address(2), address(3), address(4), address(5)],
    });
    expect(result.error, result.text).toBe(false);
    expect(result.data.uploaded).toBe(5);
    expect(result.data.failed).toBe(0);
    expect(result.data.results.map((r: { url: string }) => r.url)).toEqual([
      "https://res.cloudinary.com/x/p1.png",
      "https://res.cloudinary.com/x/p2.png",
      "https://res.cloudinary.com/x/p3.png",
      "https://res.cloudinary.com/x/p4.png",
      "https://res.cloudinary.com/x/p5.png",
    ]);
    expect(uploadFile).toHaveBeenCalledTimes(5);
    expect(uploadFile.mock.calls.every((c) => c[0] === "project")).toBe(true);
  });

  it("reports the ones that fail and keeps the rest", async () => {
    fetchPublicFile.mockImplementation(async (url: string) => {
      if (url === address(2))
        throw new ToolError("That address could not be found.");
      if (url === address(3)) throw new Error("socket exploded");
      return { bytes: new Uint8Array([1]), filename: "ok.png" };
    });
    uploadFile.mockResolvedValue({
      url: "https://res.cloudinary.com/x/ok.png",
      width: 1,
      height: 1,
      bytes: 1,
      format: "png",
    });
    const { call } = await connectAs(db, ["read", "media"]);
    const result = await call("media_upload_many_from_urls", {
      use: "blog",
      urls: [address(1), address(2), address(3), address(4)],
    });
    expect(result.error).toBe(false);
    expect(result.data).toMatchObject({ uploaded: 2, failed: 2 });
    const [a, b, c, d] = result.data.results;
    expect(a.url).toBeTruthy();
    expect(b.error).toBe("That address could not be found.");
    // an unexpected error never leaks its message
    expect(c.error).toMatch(/Try this one again/);
    expect(JSON.stringify(c)).not.toContain("exploded");
    expect(d.url).toBeTruthy();
  });

  it("refuses an empty list and more than ten", async () => {
    const { call } = await connectAs(db, ["read", "media"]);
    expect(
      (await call("media_upload_many_from_urls", { use: "blog", urls: [] }))
        .error,
    ).toBe(true);
    const many = Array.from({ length: 11 }, (_, i) => address(i));
    expect(
      (await call("media_upload_many_from_urls", { use: "blog", urls: many }))
        .error,
    ).toBe(true);
    expect(fetchPublicFile).not.toHaveBeenCalled();
  });

  it("is logged once in the activity", async () => {
    fetchPublicFile.mockResolvedValue({
      bytes: new Uint8Array([1]),
      filename: "a.png",
    });
    uploadFile.mockResolvedValue({
      url: "https://res.cloudinary.com/x/a.png",
      width: 1,
      height: 1,
      bytes: 1,
      format: "png",
    });
    const { call } = await connectAs(db, ["read", "media"]);
    await call("media_upload_many_from_urls", {
      use: "project",
      urls: [address(1), address(2)],
    });
    const rows = await db.select().from(schema.agentActivity);
    expect(rows).toHaveLength(1);
    expect(rows[0].summary).toBe("Uploaded 2 of 2 project pictures");
  });
});

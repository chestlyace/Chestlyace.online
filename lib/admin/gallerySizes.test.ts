import { beforeEach, describe, expect, it, vi } from "vitest";

const lookupMock = vi.fn();
vi.mock("node:dns/promises", () => ({
  lookup: (...args: unknown[]) => lookupMock(...args),
}));

import { gallerySizesFor } from "./gallerySizes";

const be32 = (n: number) => [
  (n >>> 24) & 255,
  (n >>> 16) & 255,
  (n >>> 8) & 255,
  n & 255,
];
const png = (width: number, height: number) =>
  Uint8Array.from([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a,
    ...be32(13),
    ...[..."IHDR"].map((c) => c.charCodeAt(0)),
    ...be32(width),
    ...be32(height),
    8,
    6,
    0,
    0,
    0,
  ]);
const reply = (bytes: Uint8Array, status = 206) =>
  new Response(bytes as BodyInit, { status });

beforeEach(() => {
  lookupMock.mockReset();
  lookupMock.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
});

describe("gallerySizesFor", () => {
  it("measures new https pictures from their first bytes, asking for only the start", async () => {
    const fetchImpl = vi.fn(async (...args: Parameters<typeof fetch>) =>
      reply(
        String(args[0]).endsWith("a.png") ? png(1600, 900) : png(800, 1200),
      ),
    );
    const sizes = await gallerySizesFor(
      ["https://cdn.test/a.png", "https://cdn.test/b.png"],
      {},
      fetchImpl as unknown as typeof fetch,
    );
    expect(sizes).toEqual({
      "https://cdn.test/a.png": { width: 1600, height: 900 },
      "https://cdn.test/b.png": { width: 800, height: 1200 },
    });
    const init = fetchImpl.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>).Range).toMatch(/^bytes=0-/);
    expect(init.redirect).toBe("manual");
  });

  it("keeps known sizes without fetching, drops pictures that left, skips site paths", async () => {
    const fetchImpl = vi.fn();
    const sizes = await gallerySizesFor(
      [
        "https://cdn.test/a.png",
        "shots/local.png",
        " ",
        "https://cdn.test/a.png",
      ],
      {
        "https://cdn.test/a.png": { width: 5, height: 6 },
        "https://cdn.test/gone.png": { width: 1, height: 1 },
      },
      fetchImpl as unknown as typeof fetch,
    );
    expect(sizes).toEqual({
      "https://cdn.test/a.png": { width: 5, height: 6 },
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("leaves a picture out when it cannot be read: a bad status, junk, a redirect, a network error, a private address", async () => {
    const fetchImpl = vi.fn(async (url: string | URL | Request) => {
      const u = String(url);
      if (u.includes("missing")) return reply(new Uint8Array(), 404);
      if (u.includes("junk")) return reply(Uint8Array.from([1, 2, 3, 4]));
      if (u.includes("moved"))
        return new Response(null, {
          status: 302,
          headers: { location: "https://elsewhere.test/x" },
        });
      if (u.includes("down")) throw new Error("network");
      return reply(png(10, 20));
    });
    lookupMock.mockImplementation(async (host: string) => [
      {
        address: host === "private.test" ? "10.0.0.5" : "93.184.216.34",
        family: 4,
      },
    ]);
    const sizes = await gallerySizesFor(
      [
        "https://cdn.test/missing.png",
        "https://cdn.test/junk.png",
        "https://cdn.test/moved.png",
        "https://cdn.test/down.png",
        "https://private.test/a.png",
        "https://cdn.test/ok.png",
      ],
      {},
      fetchImpl as unknown as typeof fetch,
    );
    expect(sizes).toEqual({
      "https://cdn.test/ok.png": { width: 10, height: 20 },
    });
    // the private address was refused before any request
    expect(
      fetchImpl.mock.calls.some((c) => String(c[0]).includes("private.test")),
    ).toBe(false);
  });
});

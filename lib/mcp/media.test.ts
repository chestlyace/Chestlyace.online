import { beforeEach, describe, expect, it, vi } from "vitest";

const lookupMock = vi.fn();
vi.mock("node:dns/promises", () => ({
  lookup: (...args: unknown[]) => lookupMock(...args),
}));

import {
  assertPublicUrl,
  decodeBase64,
  fetchPublicFile,
  isPublicIp,
  sniffKind,
  uploadFile,
} from "./media";
import { ToolError } from "./tool";

const PNG = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4,
]);
const JPG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
const PDF = Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0x2d, 1, 2]);
const WEBP = Uint8Array.from([
  0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
]);
const AVIF = Uint8Array.from([
  0, 0, 0, 0x1c, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66,
]);

beforeEach(() => {
  lookupMock.mockReset();
});

describe("sniffKind", () => {
  it("knows a picture by its first bytes, not its name", () => {
    expect(sniffKind(PNG)).toBe("png");
    expect(sniffKind(JPG)).toBe("jpg");
    expect(sniffKind(WEBP)).toBe("webp");
    expect(sniffKind(AVIF)).toBe("avif");
    expect(sniffKind(PDF)).toBe("pdf");
    expect(sniffKind(Uint8Array.from([60, 115, 118, 103]))).toBeNull(); // <svg
    expect(sniffKind(new Uint8Array())).toBeNull();
  });
});

describe("isPublicIp", () => {
  it("refuses private, loopback, link-local and reserved addresses", () => {
    for (const ip of [
      "10.0.0.1",
      "127.0.0.1",
      "172.16.5.5",
      "172.31.255.255",
      "192.168.1.1",
      "169.254.169.254",
      "100.64.0.1",
      "0.0.0.0",
      "224.0.0.1",
      "::1",
      "::",
      "fe80::1",
      "fd00::1",
      "::ffff:10.0.0.1",
      "not-an-ip",
    ])
      expect(isPublicIp(ip), ip).toBe(false);
  });

  it("accepts public ones", () => {
    for (const ip of [
      "8.8.8.8",
      "1.1.1.1",
      "172.32.0.1",
      "2606:4700:4700::1111",
      "::ffff:8.8.8.8",
    ])
      expect(isPublicIp(ip), ip).toBe(true);
  });
});

describe("assertPublicUrl", () => {
  it("accepts an https address that resolves to the public internet", async () => {
    lookupMock.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
    expect((await assertPublicUrl("https://example.com/a.png")).hostname).toBe(
      "example.com",
    );
  });

  it("refuses everything else, with a message for the agent", async () => {
    for (const bad of [
      "not a url",
      "http://example.com/a.png",
      "ftp://example.com/a",
      "https://localhost/a",
      "https://printer.local/a",
      "https://x.internal/a",
      "https://127.0.0.1/a",
      "https://[::1]/a",
    ])
      await expect(assertPublicUrl(bad), bad).rejects.toBeInstanceOf(ToolError);
    lookupMock.mockResolvedValue([{ address: "10.1.2.3", family: 4 }]);
    await expect(assertPublicUrl("https://sneaky.example/a")).rejects.toThrow(
      /public internet/,
    );
    lookupMock.mockResolvedValue([
      { address: "8.8.8.8", family: 4 },
      { address: "192.168.0.9", family: 4 },
    ]);
    await expect(assertPublicUrl("https://mixed.example/a")).rejects.toThrow(
      /public internet/,
    );
    lookupMock.mockImplementation(async () => {
      throw new Error("ENOTFOUND");
    });
    const outcome = await assertPublicUrl("https://nowhere.example/a").then(
      () => "resolved",
      (error: Error) => `${error.name}: ${error.message}`,
    );
    expect(outcome).toMatch(/could not be found/);
  });
});

const response = (bytes: Uint8Array, init: ResponseInit = {}) =>
  new Response(bytes as BodyInit, init);

describe("fetchPublicFile", () => {
  beforeEach(() =>
    lookupMock.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]),
  );

  it("fetches the bytes and names the file after the address", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response(PNG));
    const file = await fetchPublicFile(
      "https://example.com/pics/cover%20one.png",
      1000,
      fetchImpl,
    );
    expect(file.filename).toBe("cover one.png");
    expect(file.bytes).toEqual(PNG);
    expect(fetchImpl.mock.calls[0][1].redirect).toBe("manual");
  });

  it("follows a redirect only to a public address", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: { location: "https://cdn.example.com/a.png" },
        }),
      )
      .mockResolvedValueOnce(response(PNG));
    expect(
      (await fetchPublicFile("https://example.com/a", 1000, fetchImpl)).bytes,
    ).toEqual(PNG);
    lookupMock.mockImplementation(async (host: string) => [
      {
        address: host === "evil.example" ? "169.254.169.254" : "93.184.216.34",
        family: 4,
      },
    ]);
    const bounce = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { location: "https://evil.example/x" },
      }),
    );
    await expect(
      fetchPublicFile("https://example.com/a", 1000, bounce),
    ).rejects.toThrow(/public internet/);
  });

  it("refuses a file that is too big, by header or by streaming, and a bad status", async () => {
    const big = vi
      .fn()
      .mockResolvedValue(
        response(new Uint8Array(50), { headers: { "content-length": "5000" } }),
      );
    await expect(
      fetchPublicFile("https://example.com/a", 100, big),
    ).rejects.toThrow(/over/);
    const stream = vi.fn().mockResolvedValue(response(new Uint8Array(500)));
    await expect(
      fetchPublicFile("https://example.com/a", 100, stream),
    ).rejects.toThrow(/over/);
    const missing = vi
      .fn()
      .mockResolvedValue(new Response("no", { status: 404 }));
    await expect(
      fetchPublicFile("https://example.com/a", 100, missing),
    ).rejects.toThrow(/404/);
  });

  it("stops after too many redirects", async () => {
    const loop = vi.fn().mockImplementation(
      async () =>
        new Response(null, {
          status: 302,
          headers: { location: "https://example.com/again" },
        }),
    );
    await expect(
      fetchPublicFile("https://example.com/a", 100, loop),
    ).rejects.toThrow(/too many/);
  });
});

describe("decodeBase64", () => {
  it("decodes plain base64 and data URLs, and refuses anything else", () => {
    expect(decodeBase64(Buffer.from(PNG).toString("base64"))).toEqual(PNG);
    expect(
      decodeBase64(
        `data:image/png;base64,${Buffer.from(PNG).toString("base64")}`,
      ),
    ).toEqual(PNG);
    expect(() => decodeBase64("not base64!!")).toThrow(/base64/);
    expect(() => decodeBase64("")).toThrow(/base64/);
    expect(() =>
      decodeBase64(Buffer.alloc(200).toString("base64"), 100),
    ).toThrow(/over/);
  });
});

const ENV = {
  CLOUDINARY_CLOUD_NAME: "demo",
  CLOUDINARY_API_KEY: "key",
  CLOUDINARY_API_SECRET: "secret",
};

describe("uploadFile", () => {
  it("sends a signed upload to the use's folder and returns the hosted address", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      Response.json({
        secure_url: "https://res.cloudinary.com/demo/image/upload/v1/x.png",
        width: 800,
        height: 600,
        bytes: 12,
        format: "png",
      }),
    );
    const out = await uploadFile("project", PNG, "x.png", {
      env: ENV,
      fetchImpl,
    });
    expect(out).toEqual({
      url: "https://res.cloudinary.com/demo/image/upload/v1/x.png",
      width: 800,
      height: 600,
      bytes: 12,
      format: "png",
    });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://api.cloudinary.com/v1_1/demo/image/upload");
    const form = init.body as FormData;
    expect(form.get("folder")).toBe("portfolio/projects");
    expect(form.get("api_key")).toBe("key");
    expect(String(form.get("signature"))).toMatch(/^[0-9a-f]{40}$/);
    expect(form.get("transformation")).toBe("c_limit,w_1600,h_1600");
    expect(form.get("file")).toBeInstanceOf(Blob);
  });

  it("uploads a PDF to the raw endpoint for the résumé", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      Response.json({
        secure_url: "https://res.cloudinary.com/demo/raw/upload/v1/cv.pdf",
        bytes: 7,
        format: "pdf",
      }),
    );
    const out = await uploadFile("resume", PDF, "cv.pdf", {
      env: ENV,
      fetchImpl,
    });
    expect(out.url).toContain("/raw/upload/");
    expect(fetchImpl.mock.calls[0][0]).toBe(
      "https://api.cloudinary.com/v1_1/demo/raw/upload",
    );
  });

  it("refuses what the use does not take, by what the bytes are", async () => {
    const never = vi.fn();
    await expect(
      uploadFile("project", PDF, "x.png", { env: ENV, fetchImpl: never }),
    ).rejects.toThrow(/PDF.*project.*jpg, png, webp, avif/);
    await expect(
      uploadFile("resume", PNG, "cv.pdf", { env: ENV, fetchImpl: never }),
    ).rejects.toThrow(/PNG.*resume/);
    await expect(
      uploadFile("project", Uint8Array.from([60, 115]), "x.svg", {
        env: ENV,
        fetchImpl: never,
      }),
    ).rejects.toThrow(/not a recognised/);
    await expect(
      uploadFile("project", new Uint8Array(), "x.png", {
        env: ENV,
        fetchImpl: never,
      }),
    ).rejects.toThrow(/empty/);
    expect(never).not.toHaveBeenCalled();
  });

  it("says so when Cloudinary is not set up, or refuses", async () => {
    await expect(
      uploadFile("project", PNG, "x.png", { env: {} }),
    ).rejects.toThrow(/not set up/);
    const refused = vi
      .fn()
      .mockResolvedValue(
        Response.json(
          { error: { message: "Invalid image file" } },
          { status: 400 },
        ),
      );
    await expect(
      uploadFile("project", PNG, "x.png", { env: ENV, fetchImpl: refused }),
    ).rejects.toThrow(/Invalid image file/);
    const down = vi.fn().mockRejectedValue(new Error("network"));
    await expect(
      uploadFile("project", PNG, "x.png", { env: ENV, fetchImpl: down }),
    ).rejects.toThrow(/Could not reach/);
  });
});

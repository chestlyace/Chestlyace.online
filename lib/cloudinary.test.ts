import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  MAX_UPLOAD_BYTES,
  UPLOAD_RULES,
  optimizeCloudinaryUrl,
  signParams,
  signedUpload,
} from "./cloudinary";

const env = {
  CLOUDINARY_CLOUD_NAME: "demo",
  CLOUDINARY_API_KEY: "123456",
  CLOUDINARY_API_SECRET: "s3cret",
};

const sha1 = (text: string) => createHash("sha1").update(text).digest("hex");

describe("signParams", () => {
  it("signs the sorted name=value pairs with the secret on the end", () => {
    expect(
      signParams({ timestamp: 1315060510, public_id: "sample" }, "abcd"),
    ).toBe(sha1("public_id=sample&timestamp=1315060510abcd"));
  });

  it("doesn't care what order the parameters come in", () => {
    expect(signParams({ b: 2, a: 1 }, "k")).toBe(
      signParams({ a: 1, b: 2 }, "k"),
    );
  });
});

describe("signedUpload", () => {
  const now = Date.UTC(2026, 9, 6, 12, 0, 0);

  it("signs the folder, formats, transformation and time for an image", () => {
    const up = signedUpload("project", env, now)!;
    const timestamp = Math.floor(now / 1000);
    expect(up).toMatchObject({
      uploadUrl: "https://api.cloudinary.com/v1_1/demo/image/upload",
      apiKey: "123456",
      folder: "portfolio/projects",
      transformation: "c_limit,w_1600,h_1600",
      allowedFormats: "jpg,png,webp,avif",
      maxBytes: MAX_UPLOAD_BYTES,
      timestamp,
    });
    expect(up.signature).toBe(
      sha1(
        `allowed_formats=jpg,png,webp,avif&folder=portfolio/projects&timestamp=${timestamp}&transformation=c_limit,w_1600,h_1600s3cret`,
      ),
    );
  });

  it("puts blog images in portfolio/blog, at most 1600×1600", () => {
    const up = signedUpload("blog", env, now)!;
    expect(up.folder).toBe("portfolio/blog");
    expect(up.transformation).toBe("c_limit,w_1600,h_1600");
    expect(up.allowedFormats).toBe("jpg,png,webp,avif");
  });

  it("sends the résumé as a raw PDF with no transformation", () => {
    const up = signedUpload("resume", env, now)!;
    expect(up.uploadUrl).toBe(
      "https://api.cloudinary.com/v1_1/demo/raw/upload",
    );
    expect(up.transformation).toBeUndefined();
    expect(up.allowedFormats).toBe("pdf");
    expect(up.signature).toBe(
      sha1(
        `allowed_formats=pdf&folder=portfolio/profile&timestamp=${Math.floor(now / 1000)}s3cret`,
      ),
    );
  });

  it("follows the folders and sizes in content-schema.md §3", () => {
    expect(UPLOAD_RULES.logo).toMatchObject({
      folder: "portfolio/journey",
      transformation: "c_limit,w_600,h_600",
    });
    expect(UPLOAD_RULES.profile).toMatchObject({
      folder: "portfolio/profile",
      transformation: "c_limit,w_1600,h_1600",
    });
    expect(UPLOAD_RULES.icon.formats).toContain("svg");
    expect(UPLOAD_RULES.badge.formats).not.toContain("svg");
  });

  it("is null without Cloudinary set up, and never leaks the secret", () => {
    expect(signedUpload("project", {}, now)).toBeNull();
    expect(
      signedUpload("project", { ...env, CLOUDINARY_API_SECRET: "" }, now),
    ).toBeNull();
    expect(JSON.stringify(signedUpload("project", env, now))).not.toContain(
      "s3cret",
    );
  });
});

describe("optimizeCloudinaryUrl", () => {
  it("adds f_auto,q_auto after /upload/ once", () => {
    const url =
      "https://res.cloudinary.com/demo/image/upload/v123/portfolio/projects/a.png";
    const once = optimizeCloudinaryUrl(url);
    expect(once).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/v123/portfolio/projects/a.png",
    );
    expect(optimizeCloudinaryUrl(once)).toBe(once);
  });

  it("leaves everything else alone", () => {
    for (const url of [
      "https://res.cloudinary.com/demo/raw/upload/v1/portfolio/profile/cv.pdf",
      "https://example.com/image/upload/a.png",
      "/certs/a.png",
      "not a url",
    ]) {
      expect(optimizeCloudinaryUrl(url)).toBe(url);
    }
  });
});

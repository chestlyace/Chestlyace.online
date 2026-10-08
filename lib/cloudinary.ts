import { createHash } from "node:crypto";

// Uploads go from the admin's browser straight to Cloudinary with a short-lived
// signature from our server (content-schema.md §3), so files never pass through a
// serverless function. No SDK: a signature is a SHA-1 of the signed parameters,
// sorted by name and joined as `name=value&…`, with the API secret on the end.

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export type UploadUse =
  | "project"
  | "logo"
  | "profile"
  | "resume"
  | "badge"
  | "icon"
  | "blog"
  | "creatives";

export type UploadRule = {
  folder: string;
  /** Incoming transformation: never larger than this (design.md §13.22). */
  transformation?: string;
  resource: "image" | "raw";
  /** File extensions Cloudinary accepts for this use. */
  formats: readonly string[];
};

const IMAGE_FORMATS = ["jpg", "png", "webp", "avif"] as const;

// The four uses of content-schema.md §3, plus the badge and skill icon, which
// have no folder of their own.
export const UPLOAD_RULES: Record<UploadUse, UploadRule> = {
  project: {
    folder: "portfolio/projects",
    transformation: "c_limit,w_1600,h_1600",
    resource: "image",
    formats: IMAGE_FORMATS,
  },
  logo: {
    folder: "portfolio/journey",
    transformation: "c_limit,w_600,h_600",
    resource: "image",
    formats: IMAGE_FORMATS,
  },
  profile: {
    folder: "portfolio/profile",
    transformation: "c_limit,w_1600,h_1600",
    resource: "image",
    formats: IMAGE_FORMATS,
  },
  blog: {
    folder: "portfolio/blog",
    transformation: "c_limit,w_1600,h_1600",
    resource: "image",
    formats: IMAGE_FORMATS,
  },
  // Design pieces and photographs (design.md §14.26): kept larger for the lightbox.
  creatives: {
    folder: "portfolio/creatives",
    transformation: "c_limit,w_2400,h_2400",
    resource: "image",
    formats: IMAGE_FORMATS,
  },
  badge: {
    folder: "portfolio/profile",
    transformation: "c_limit,w_600,h_600",
    resource: "image",
    formats: IMAGE_FORMATS,
  },
  icon: {
    folder: "portfolio/profile",
    transformation: "c_limit,w_600,h_600",
    resource: "image",
    formats: [...IMAGE_FORMATS, "svg"],
  },
  resume: {
    folder: "portfolio/profile",
    resource: "raw",
    formats: ["pdf"],
  },
};

export const UPLOAD_USES = Object.keys(UPLOAD_RULES) as UploadUse[];

export function signParams(
  params: Record<string, string | number>,
  secret: string,
): string {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1")
    .update(toSign + secret)
    .digest("hex");
}

export type SignedUpload = {
  uploadUrl: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  transformation?: string;
  allowedFormats: string;
  maxBytes: number;
};

// What the browser needs to upload one file for `use`, or null when Cloudinary
// isn't set up on the server.
export function signedUpload(
  use: UploadUse,
  env: Record<string, string | undefined>,
  now: number = Date.now(),
): SignedUpload | null {
  const cloud = env.CLOUDINARY_CLOUD_NAME;
  const apiKey = env.CLOUDINARY_API_KEY;
  const secret = env.CLOUDINARY_API_SECRET;
  if (!cloud || !apiKey || !secret) return null;

  const rule = UPLOAD_RULES[use];
  const timestamp = Math.floor(now / 1000);
  const allowedFormats = rule.formats.join(",");
  const signed: Record<string, string | number> = {
    allowed_formats: allowedFormats,
    folder: rule.folder,
    timestamp,
    ...(rule.transformation ? { transformation: rule.transformation } : {}),
  };

  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/${rule.resource}/upload`,
    apiKey,
    timestamp,
    signature: signParams(signed, secret),
    folder: rule.folder,
    transformation: rule.transformation,
    allowedFormats,
    maxBytes: MAX_UPLOAD_BYTES,
  };
}

// Images are delivered as WebP/AVIF at a sensible quality: `f_auto,q_auto` goes
// in right after `/upload/`. Anything that isn't a Cloudinary image is left alone.
export function optimizeCloudinaryUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "res.cloudinary.com") return url;
    if (!parsed.pathname.includes("/image/upload/")) return url;
    if (/\/image\/upload\/[^/]*(f_auto|q_auto)/.test(parsed.pathname))
      return url;
    parsed.pathname = parsed.pathname.replace(
      "/image/upload/",
      "/image/upload/f_auto,q_auto/",
    );
    return parsed.toString();
  } catch {
    return url;
  }
}

// A small version of a Cloudinary image for a list's thumbnail (`w_` pixels wide,
// delivered as WebP/AVIF). Anything that isn't a Cloudinary image is left alone.
export function thumbnailUrl(url: string, width = 96): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "res.cloudinary.com") return url;
    if (!parsed.pathname.includes("/image/upload/")) return url;
    parsed.pathname = parsed.pathname.replace(
      /\/image\/upload\/(?:[^/]*(?:f_auto|q_auto)[^/]*\/)?/,
      `/image/upload/c_fill,w_${width},h_${width},f_auto,q_auto/`,
    );
    return parsed.toString();
  } catch {
    return url;
  }
}

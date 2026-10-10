import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import {
  MAX_UPLOAD_BYTES,
  UPLOAD_RULES,
  signedUpload,
  type UploadUse,
} from "@/lib/cloudinary";
import { ToolError } from "./tool";

// What the media tools do on the server (docs/mcp.md §5): fetch a picture from an https
// address (never from the owner's own network), recognise what the bytes really are, and
// upload them to Cloudinary the way the admin's browser does, with the same signature,
// folder, size limit and formats.

export type Kind = "jpg" | "png" | "webp" | "avif" | "pdf";

/** What the first bytes say a file is (a file's name or type is not trusted). */
export function sniffKind(bytes: Uint8Array): Kind | null {
  const at = (offset: number, ...values: number[]) =>
    values.every((value, index) => bytes[offset + index] === value);
  if (at(0, 0xff, 0xd8, 0xff)) return "jpg";
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "png";
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50))
    return "webp";
  if (at(4, 0x66, 0x74, 0x79, 0x70) && at(8, 0x61, 0x76, 0x69, 0x66))
    return "avif";
  if (at(0, 0x25, 0x50, 0x44, 0x46)) return "pdf";
  return null;
}

/** Whether an IP address is one on the public internet. */
export function isPublicIp(address: string): boolean {
  const mapped = address.toLowerCase().match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  const ip = mapped ? mapped[1] : address.toLowerCase();
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return !(
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }
  if (isIP(ip) === 6) {
    return !(
      ip === "::" ||
      ip === "::1" ||
      /^f[cd]/.test(ip) ||
      /^fe[89ab]/.test(ip) ||
      ip.startsWith("ff")
    );
  }
  return false;
}

/** Refuses an address that is not https or that leads into a private network. */
export async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new ToolError(
      "That is not a web address. Send a full https:// address.",
    );
  }
  if (url.protocol !== "https:")
    throw new ToolError("Only https:// addresses can be fetched.");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  )
    throw new ToolError("That address is not on the public internet.");
  const addresses = isIP(host)
    ? [host]
    : (await lookup(host, { all: true }).catch(() => [])).map(
        (entry) => entry.address,
      );
  if (addresses.length === 0)
    throw new ToolError(
      "That address could not be found. Check it is spelled right.",
    );
  if (!addresses.every(isPublicIp))
    throw new ToolError("That address is not on the public internet.");
  return url;
}

/** Fetches a file from a public https address, with limits (3 redirects, 15 s, `maxBytes`). */
export async function fetchPublicFile(
  raw: string,
  maxBytes: number = MAX_UPLOAD_BYTES,
  fetchImpl: typeof fetch = fetch,
): Promise<{ bytes: Uint8Array; filename: string }> {
  let url = await assertPublicUrl(raw);
  for (let hop = 0; hop <= 3; hop++) {
    let response: Response;
    try {
      response = await fetchImpl(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(15_000),
        headers: { Accept: "image/*,application/pdf" },
      });
    } catch {
      throw new ToolError(
        "Could not fetch that address (it did not answer in time).",
      );
    }
    if (response.status >= 300 && response.status < 400) {
      const next = response.headers.get("location");
      if (!next) throw new ToolError("That address redirects nowhere.");
      url = await assertPublicUrl(new URL(next, url).toString());
      continue;
    }
    if (!response.ok)
      throw new ToolError(
        `That address answered ${response.status}. Check it opens in a browser.`,
      );
    const declared = Number(response.headers.get("content-length"));
    if (declared > maxBytes)
      throw new ToolError(
        `That file is over ${Math.round(maxBytes / (1024 * 1024))} MB.`,
      );
    const reader = response.body?.getReader();
    if (!reader) throw new ToolError("That address sent nothing.");
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new ToolError(
          `That file is over ${Math.round(maxBytes / (1024 * 1024))} MB.`,
        );
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const filename = decodeURIComponent(
      url.pathname.split("/").filter(Boolean).pop() ?? "file",
    );
    return { bytes, filename };
  }
  throw new ToolError("That address redirects too many times.");
}

/** Decodes base64 (or a `data:` URL) into bytes, within `maxBytes`. */
export function decodeBase64(
  data: string,
  maxBytes: number = MAX_UPLOAD_BYTES,
): Uint8Array {
  const clean = data.replace(/^data:[^;,]*;base64,/, "").replace(/\s+/g, "");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean) || clean.length === 0)
    throw new ToolError("`data` is not valid base64.");
  if ((clean.length * 3) / 4 > maxBytes + 3)
    throw new ToolError(
      `That file is over ${Math.round(maxBytes / (1024 * 1024))} MB.`,
    );
  return new Uint8Array(Buffer.from(clean, "base64"));
}

export type Uploaded = {
  url: string;
  width: number | null;
  height: number | null;
  bytes: number;
  format: string;
};

/** Checks the bytes against the `use`'s rules, and uploads them to Cloudinary. */
export async function uploadFile(
  use: UploadUse,
  bytes: Uint8Array,
  filename: string,
  options: {
    env?: Record<string, string | undefined>;
    fetchImpl?: typeof fetch;
  } = {},
): Promise<Uploaded> {
  const rule = UPLOAD_RULES[use];
  if (bytes.byteLength === 0) throw new ToolError("That file is empty.");
  if (bytes.byteLength > MAX_UPLOAD_BYTES)
    throw new ToolError(
      `That file is over ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB.`,
    );
  const kind = sniffKind(bytes);
  const allowed = rule.formats.includes("jpg")
    ? [...rule.formats, "jpeg"]
    : [...rule.formats];
  if (!kind || !allowed.includes(kind))
    throw new ToolError(
      `That file is ${kind ? kind.toUpperCase() : "not a recognised picture or PDF"}, but \`${use}\` takes ${rule.formats.join(", ")}.`,
    );
  const signed = signedUpload(use, options.env ?? process.env);
  if (!signed)
    throw new ToolError(
      "Picture storage (Cloudinary) is not set up on the server. Tell the owner.",
    );

  const form = new FormData();
  form.set("file", new Blob([bytes as BlobPart]), filename);
  form.set("api_key", signed.apiKey);
  form.set("timestamp", String(signed.timestamp));
  form.set("signature", signed.signature);
  form.set("folder", signed.folder);
  form.set("allowed_formats", signed.allowedFormats);
  if (signed.transformation) form.set("transformation", signed.transformation);

  let response: Response;
  try {
    response = await (options.fetchImpl ?? fetch)(signed.uploadUrl, {
      method: "POST",
      body: form,
    });
  } catch {
    throw new ToolError("Could not reach the picture storage. Try again.");
  }
  const body = (await response.json().catch(() => ({}))) as {
    secure_url?: string;
    width?: number;
    height?: number;
    bytes?: number;
    format?: string;
    error?: { message?: string };
  };
  if (!response.ok || !body.secure_url)
    throw new ToolError(
      `The picture storage refused it: ${body.error?.message ?? response.status}.`,
    );
  return {
    url: body.secure_url,
    width: body.width ?? null,
    height: body.height ?? null,
    bytes: body.bytes ?? bytes.byteLength,
    format: body.format ?? kind,
  };
}

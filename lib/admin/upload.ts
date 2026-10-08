import {
  MAX_UPLOAD_BYTES,
  UPLOAD_RULES,
  optimizeCloudinaryUrl,
  type SignedUpload,
  type UploadUse,
} from "@/lib/cloudinary";

// The browser's half of an upload (design.md §13.22): check the file, ask the
// server for a signature, send the file straight to Cloudinary with progress.

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, "")} MB`;
}

// "JPG, PNG, WebP or AVIF · up to 10 MB"
export function limitsText(use: UploadUse): string {
  const names: Record<string, string> = {
    jpg: "JPG",
    png: "PNG",
    webp: "WebP",
    avif: "AVIF",
    svg: "SVG",
    pdf: "PDF",
  };
  const list = UPLOAD_RULES[use].formats.map(
    (format) => names[format] ?? format,
  );
  const text =
    list.length > 1
      ? `${list.slice(0, -1).join(", ")} or ${list.at(-1)}`
      : list[0];
  return `${text} · up to ${formatBytes(MAX_UPLOAD_BYTES)}`;
}

// The reason a file can't be used, or null. Cloudinary checks again.
export function checkFile(
  file: { name: string; size: number },
  use: UploadUse,
): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const formats = UPLOAD_RULES[use].formats
    .map((f) => (f === "jpg" ? ["jpg", "jpeg"] : [f]))
    .flat();
  if (!formats.includes(extension)) {
    return `That file type isn't allowed here. Use ${limitsText(use).split(" · ")[0]}.`;
  }
  if (file.size > MAX_UPLOAD_BYTES) return "That file is over 10 MB.";
  if (file.size === 0) return "That file is empty.";
  return null;
}

// What to call a file already in the database: the end of its address.
export function nameFromUrl(url: string): string {
  const last = url.split(/[?#]/)[0].split("/").filter(Boolean).pop() ?? url;
  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
}

export const isPdf = (url: string) => /\.pdf(\?|#|$)/i.test(url);

export type UploadResult = {
  url: string;
  bytes: number;
  name: string;
  /** The image's pixel size as Cloudinary stored it (images only). */
  width?: number;
  height?: number;
};

export class UploadError extends Error {
  constructor(
    public code: "not-configured" | "failed" | "cancelled" | "session",
    message: string,
  ) {
    super(message);
  }
}

export function uploadFile(
  file: File,
  use: UploadUse,
  onProgress: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const run = async () => {
      let signed: SignedUpload;
      try {
        const response = await fetch("/api/admin/upload-signature", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ use }),
          signal,
        });
        if (response.status === 401)
          throw new UploadError(
            "session",
            "Your session ended. Sign in again.",
          );
        if (response.status === 503)
          throw new UploadError("not-configured", "Uploads aren't set up yet.");
        if (!response.ok)
          throw new UploadError("failed", "Upload failed — try again.");
        signed = ((await response.json()) as { upload: SignedUpload }).upload;
      } catch (error) {
        if (error instanceof UploadError) throw error;
        if (signal?.aborted) throw new UploadError("cancelled", "Cancelled.");
        throw new UploadError("failed", "Upload failed — try again.");
      }

      const form = new FormData();
      form.append("file", file);
      form.append("api_key", signed.apiKey);
      form.append("timestamp", String(signed.timestamp));
      form.append("signature", signed.signature);
      form.append("folder", signed.folder);
      form.append("allowed_formats", signed.allowedFormats);
      if (signed.transformation)
        form.append("transformation", signed.transformation);

      await new Promise<void>((done, fail) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", signed.uploadUrl);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) onProgress(event.loaded / event.total);
        };
        xhr.onerror = () =>
          fail(new UploadError("failed", "Upload failed — try again."));
        xhr.onabort = () => fail(new UploadError("cancelled", "Cancelled."));
        xhr.onload = () => {
          try {
            const body = JSON.parse(xhr.responseText) as {
              secure_url?: string;
              bytes?: number;
              width?: number;
              height?: number;
            };
            if (xhr.status >= 200 && xhr.status < 300 && body.secure_url) {
              onProgress(1);
              resolve({
                url: optimizeCloudinaryUrl(body.secure_url),
                bytes: body.bytes ?? file.size,
                name: file.name,
                width: body.width,
                height: body.height,
              });
              done();
              return;
            }
          } catch {
            // fall through
          }
          fail(new UploadError("failed", "Upload failed — try again."));
        };
        signal?.addEventListener("abort", () => xhr.abort(), { once: true });
        xhr.send(form);
      });
    };
    run().catch(reject);
  });
}

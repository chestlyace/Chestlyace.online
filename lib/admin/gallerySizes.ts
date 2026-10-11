import { imageSizeFromBytes, type Size } from "@/lib/imageSize";
import { assertPublicUrl } from "@/lib/mcp/media";

// The pixel size of a project's gallery images (design.md §14.10), learned on the server
// when the project is saved, so it works for every way a picture gets in: an upload in
// the admin (one or many), an address pasted in, or an agent. The sizes are kept by image
// address in `projects.gallery_sizes`; the public gallery uses them to lay itself out
// before the pictures load. An image whose size cannot be read (not a picture we know,
// not reachable, too slow) just has no entry and is laid out when it arrives.

export type GallerySizes = Record<string, Size>;

const FIRST_BYTES = 256 * 1024;
const TIMEOUT_MS = 6000;
const AT_ONCE = 4;

async function measure(
  url: string,
  fetchImpl: typeof fetch,
): Promise<Size | null> {
  try {
    await assertPublicUrl(url);
    const response = await fetchImpl(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        Range: `bytes=0-${FIRST_BYTES - 1}`,
        Accept: "image/avif,image/webp,image/*",
      },
    });
    if (response.status !== 200 && response.status !== 206) return null;
    const reader = response.body?.getReader();
    if (!reader) return null;
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (total < FIRST_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      total += value.byteLength;
    }
    await reader.cancel().catch(() => {});
    const bytes = new Uint8Array(Math.min(total, FIRST_BYTES));
    let offset = 0;
    for (const chunk of chunks) {
      const room = bytes.length - offset;
      if (room <= 0) break;
      bytes.set(chunk.subarray(0, room), offset);
      offset += Math.min(chunk.byteLength, room);
    }
    return imageSizeFromBytes(bytes);
  } catch {
    return null;
  }
}

/**
 * The sizes for a gallery's addresses: those already `known` are kept as they are, the
 * others (https only) are measured, a few at a time. Addresses no longer in the gallery
 * are dropped.
 */
export async function gallerySizesFor(
  urls: readonly string[],
  known: GallerySizes = {},
  fetchImpl: typeof fetch = fetch,
): Promise<GallerySizes> {
  const wanted = [...new Set(urls.map((url) => url.trim()).filter(Boolean))];
  const sizes: GallerySizes = {};
  const missing: string[] = [];
  for (const url of wanted) {
    if (known[url]) sizes[url] = known[url];
    else if (/^https:\/\//i.test(url)) missing.push(url);
  }
  let next = 0;
  const worker = async () => {
    for (;;) {
      const index = next++;
      if (index >= missing.length) return;
      const size = await measure(missing[index], fetchImpl);
      if (size) sizes[missing[index]] = size;
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(AT_ONCE, missing.length) }, worker),
  );
  return sizes;
}

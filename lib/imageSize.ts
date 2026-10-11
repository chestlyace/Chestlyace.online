// The pixel size of a picture from its first bytes (JPEG, PNG, WebP, AVIF), without
// decoding it. Used to learn the size of a project's gallery images (docs/design.md §14.10).

export type Size = { width: number; height: number };

const be16 = (b: Uint8Array, o: number) => (b[o] << 8) | b[o + 1];
const be32 = (b: Uint8Array, o: number) =>
  ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
const le16 = (b: Uint8Array, o: number) => b[o] | (b[o + 1] << 8);
const le24 = (b: Uint8Array, o: number) =>
  b[o] | (b[o + 1] << 8) | (b[o + 2] << 16);
const ascii = (b: Uint8Array, o: number, text: string) =>
  [...text].every((char, i) => b[o + i] === char.charCodeAt(0));

function png(b: Uint8Array): Size | null {
  if (b.length < 24 || !ascii(b, 12, "IHDR")) return null;
  return { width: be32(b, 16), height: be32(b, 20) };
}

function jpeg(b: Uint8Array): Size | null {
  let offset = 2;
  while (offset + 9 < b.length) {
    if (b[offset] !== 0xff) {
      offset++;
      continue;
    }
    const marker = b[offset + 1];
    // Fill bytes and markers without a length.
    if (marker === 0xff) {
      offset++;
      continue;
    }
    if (
      marker === 0xd8 ||
      marker === 0x01 ||
      (marker >= 0xd0 && marker <= 0xd7)
    ) {
      offset += 2;
      continue;
    }
    const length = be16(b, offset + 2);
    const isFrame =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc;
    if (isFrame)
      return { height: be16(b, offset + 5), width: be16(b, offset + 7) };
    offset += 2 + length;
  }
  return null;
}

function webp(b: Uint8Array): Size | null {
  if (b.length < 25) return null;
  if (ascii(b, 12, "VP8X") && b.length >= 30)
    return { width: 1 + le24(b, 24), height: 1 + le24(b, 27) };
  if (ascii(b, 12, "VP8L")) {
    const bits = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
    return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >>> 14) & 0x3fff) };
  }
  if (ascii(b, 12, "VP8 ") && b.length >= 30)
    return { width: le16(b, 26) & 0x3fff, height: le16(b, 28) & 0x3fff };
  return null;
}

// AVIF is an ISO box file: the picture's size is in the `ispe` box (version/flags, then
// width and height as 32-bit numbers).
function avif(b: Uint8Array): Size | null {
  for (let o = 4; o + 16 <= b.length; o++) {
    if (ascii(b, o, "ispe"))
      return { width: be32(b, o + 8), height: be32(b, o + 12) };
  }
  return null;
}

/** The size of a JPEG, PNG, WebP or AVIF from its first bytes, or null. */
export function imageSizeFromBytes(bytes: Uint8Array): Size | null {
  let size: Size | null = null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8) size = jpeg(bytes);
  else if (bytes[0] === 0x89 && ascii(bytes, 1, "PNG")) size = png(bytes);
  else if (ascii(bytes, 0, "RIFF") && ascii(bytes, 8, "WEBP"))
    size = webp(bytes);
  else if (ascii(bytes, 4, "ftyp")) size = avif(bytes);
  return size && size.width > 0 && size.height > 0 ? size : null;
}

import { describe, expect, it } from "vitest";
import { imageSizeFromBytes } from "./imageSize";

const bytes = (...parts: (number[] | Uint8Array | string)[]) =>
  Uint8Array.from(
    parts.flatMap((part) =>
      typeof part === "string"
        ? [...part].map((c) => c.charCodeAt(0))
        : [...part],
    ),
  );
const be32 = (n: number) => [
  (n >>> 24) & 255,
  (n >>> 16) & 255,
  (n >>> 8) & 255,
  n & 255,
];
const be16 = (n: number) => [(n >>> 8) & 255, n & 255];
const le16 = (n: number) => [n & 255, (n >>> 8) & 255];
const le24 = (n: number) => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255];

describe("imageSizeFromBytes", () => {
  it("reads a PNG", () => {
    const png = bytes(
      [0x89],
      "PNG",
      [0x0d, 0x0a, 0x1a, 0x0a],
      be32(13),
      "IHDR",
      be32(1600),
      be32(900),
      [8, 6, 0, 0, 0],
    );
    expect(imageSizeFromBytes(png)).toEqual({ width: 1600, height: 900 });
  });

  it("reads a JPEG past other segments (EXIF, a thumbnail's own frame is not skipped wrongly)", () => {
    const app1 = bytes([0xff, 0xe1], be16(2 + 6), "Exif\0\0");
    const dqt = bytes([0xff, 0xdb], be16(2 + 3), [0, 1, 2]);
    const sof = bytes(
      [0xff, 0xc0],
      be16(17),
      [8],
      be16(1200),
      be16(1800),
      [3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1],
    );
    expect(imageSizeFromBytes(bytes([0xff, 0xd8], app1, dqt, sof))).toEqual({
      width: 1800,
      height: 1200,
    });
    // a progressive frame (SOF2) is a frame too
    const sof2 = bytes(
      [0xff, 0xc2],
      be16(17),
      [8],
      be16(300),
      be16(400),
      [3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1],
    );
    expect(imageSizeFromBytes(bytes([0xff, 0xd8], sof2))).toEqual({
      width: 400,
      height: 300,
    });
  });

  it("ignores the Huffman table marker (0xC4), which is not a frame", () => {
    const dht = bytes([0xff, 0xc4], be16(2 + 3), [0, 0, 0]);
    const sof = bytes(
      [0xff, 0xc0],
      be16(17),
      [8],
      be16(10),
      be16(20),
      [3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1],
    );
    expect(imageSizeFromBytes(bytes([0xff, 0xd8], dht, sof))).toEqual({
      width: 20,
      height: 10,
    });
  });

  it("reads the three kinds of WebP", () => {
    const x = bytes(
      "RIFF",
      [0, 0, 0, 0],
      "WEBP",
      "VP8X",
      [10, 0, 0, 0],
      [0, 0, 0, 0],
      le24(2399),
      le24(1599),
    );
    expect(imageSizeFromBytes(x)).toEqual({ width: 2400, height: 1600 });
    const l = bytes(
      "RIFF",
      [0, 0, 0, 0],
      "WEBP",
      "VP8L",
      [5, 0, 0, 0],
      [0x2f],
      (() => {
        const bits = 799 | (599 << 14);
        return [
          bits & 255,
          (bits >>> 8) & 255,
          (bits >>> 16) & 255,
          (bits >>> 24) & 255,
        ];
      })(),
      [0, 0],
    );
    expect(imageSizeFromBytes(l)).toEqual({ width: 800, height: 600 });
    const lossy = bytes(
      "RIFF",
      [0, 0, 0, 0],
      "WEBP",
      "VP8 ",
      [10, 0, 0, 0],
      [0, 0, 0],
      [0x9d, 0x01, 0x2a],
      le16(640),
      le16(480),
    );
    expect(imageSizeFromBytes(lossy)).toEqual({ width: 640, height: 480 });
  });

  it("reads an AVIF from its ispe box", () => {
    const avif = bytes(
      be32(28),
      "ftyp",
      "avif",
      [0, 0, 0, 0],
      "avifmif1",
      be32(20),
      "meta",
      [0, 0, 0, 0],
      be32(20),
      "ispe",
      [0, 0, 0, 0],
      be32(1920),
      be32(1080),
    );
    expect(imageSizeFromBytes(avif)).toEqual({ width: 1920, height: 1080 });
  });

  it("gives null for anything else, a cut-off file and zero sizes", () => {
    expect(imageSizeFromBytes(new Uint8Array())).toBeNull();
    expect(imageSizeFromBytes(bytes("<svg"))).toBeNull();
    expect(
      imageSizeFromBytes(bytes([0xff, 0xd8, 0xff, 0xe0, 0, 4])),
    ).toBeNull();
    expect(
      imageSizeFromBytes(
        bytes(
          [0x89],
          "PNG",
          [0x0d, 0x0a, 0x1a, 0x0a],
          be32(13),
          "IHDR",
          be32(0),
          be32(5),
        ),
      ),
    ).toBeNull();
  });
});

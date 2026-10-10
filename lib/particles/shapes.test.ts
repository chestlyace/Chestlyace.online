import { describe, expect, it } from "vitest";
import {
  apertureForm,
  bezierForm,
  bracesForm,
  cameraForm,
  cloudForm,
  latticeForm,
  mulberry32,
  sampleMask,
  wheelForm,
  wordBox,
} from "./shapes";

const ASPECT = 16 / 7;
const N = 3000;

function bounds(points: Float32Array) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < points.length; i += 3)
    for (let k = 0; k < 3; k++) {
      min[k] = Math.min(min[k], points[i + k]);
      max[k] = Math.max(max[k], points[i + k]);
    }
  return { min, max };
}

describe("the generator", () => {
  it("repeats for the same seed and differs for another", () => {
    const a = Array.from({ length: 4 }, mulberry32(7));
    const b = Array.from({ length: 4 }, mulberry32(7));
    expect(a).toEqual(b);
    expect(Array.from({ length: 4 }, mulberry32(8))).not.toEqual(a);
    expect(a.every((v) => v >= 0 && v < 1)).toBe(true);
  });
});

describe("the forms", () => {
  const forms: [string, (n: number, rng: () => number) => Float32Array][] = [
    ["braces", bracesForm],
    ["lattice", latticeForm],
    ["bezier", bezierForm],
    ["wheel", wheelForm],
    ["camera", cameraForm],
    ["aperture", apertureForm],
  ];

  it.each(forms)(
    "%s has n finite points that fit in 70% of the stage",
    (_, make) => {
      const points = make(N, mulberry32(1));
      expect(points).toHaveLength(N * 3);
      expect(Array.from(points).every(Number.isFinite)).toBe(true);
      const { min, max } = bounds(points);
      expect(max[1] - min[1]).toBeLessThanOrEqual(0.72);
      expect(max[0] - min[0]).toBeLessThanOrEqual(1.6);
      // Centred, not off to a side.
      expect(Math.abs((max[0] + min[0]) / 2)).toBeLessThan(0.1);
      expect(Math.abs((max[1] + min[1]) / 2)).toBeLessThan(0.1);
    },
  );

  it("is the same for the same seed", () => {
    expect(Array.from(wheelForm(200, mulberry32(3)))).toEqual(
      Array.from(wheelForm(200, mulberry32(3))),
    );
  });

  it("makes the lattice deep and the flat forms thin", () => {
    const lattice = bounds(latticeForm(N, mulberry32(2)));
    expect(lattice.max[2] - lattice.min[2]).toBeGreaterThan(0.5);
    const camera = bounds(cameraForm(N, mulberry32(2)));
    expect(camera.max[2] - camera.min[2]).toBeLessThan(0.15);
  });

  it("scatters the starting cloud over the stage", () => {
    const { min, max } = bounds(cloudForm(N, ASPECT, mulberry32(4)));
    expect(max[0] - min[0]).toBeGreaterThan(ASPECT);
    expect(max[1] - min[1]).toBeGreaterThan(1);
  });
});

describe("words", () => {
  it("spans the stage unless that would be too tall", () => {
    const wide = wordBox(1100, 100, ASPECT);
    expect(wide.width).toBeCloseTo(ASPECT);
    expect(wide.height).toBeLessThan(0.6);
    const short = wordBox(300, 100, ASPECT);
    expect(short.height).toBeCloseTo(0.6);
    expect(short.width).toBeLessThan(ASPECT);
    expect(short.width / short.height).toBeCloseTo(3);
  });

  it("samples only the opaque pixels of a mask", () => {
    // A 10 × 4 mask whose only opaque pixels are the two left columns.
    const w = 10;
    const h = 4;
    const alpha = new Uint8Array(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < 2; x++) alpha[y * w + x] = 255;
    const box = { width: 2, height: 0.4 };
    const points = sampleMask(alpha, w, h, 500, box, mulberry32(5));
    for (let i = 0; i < points.length; i += 3) {
      expect(points[i]).toBeGreaterThanOrEqual(-1 - 1e-6);
      expect(points[i]).toBeLessThanOrEqual(-0.6 + 1e-6); // the left 2 of 10 columns
      expect(Math.abs(points[i + 1])).toBeLessThanOrEqual(0.2 + 1e-6);
    }
  });

  it("gives zeros for an empty mask", () => {
    const points = sampleMask(
      new Uint8Array(16),
      4,
      4,
      10,
      { width: 1, height: 1 },
      mulberry32(1),
    );
    expect(Array.from(points).every((v) => v === 0)).toBe(true);
  });
});

// The point sets of the footer's particle wordmark (design.md §13.61), apart from any
// DOM or WebGL so they can be tested. Every form is a `Float32Array` of `n` points
// (x, y, z) in *stage units*: the stage is 1 unit tall and `aspect` units wide, centred
// on the origin, so x runs from -aspect/2 to aspect/2 and y from -0.5 to 0.5 (up is
// positive). Shapes use at most 0.7 of the height; words are fitted by `wordBox`.

export type Rng = () => number;
export type Pt = [number, number, number];

// A small seeded generator, so a form is the same every time (and testable).
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const gauss = (rng: Rng) => (rng() + rng() + rng() + rng() - 2) / 2; // about -1..1, bell shaped

/** The scattered cloud the dots start from, before the first form (§13.61). */
export function cloudForm(n: number, aspect: number, rng: Rng): Float32Array {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    out[i * 3] = (rng() - 0.5) * aspect * 1.2;
    out[i * 3 + 1] = (rng() - 0.5) * 1.3;
    out[i * 3 + 2] = (rng() - 0.5) * 0.6;
  }
  return out;
}

/**
 * The box a word is fitted in (§13.61): as wide as the stage, but never taller than
 * `maxHeight` of it (a short word such as DESIGNER would otherwise be too tall).
 */
export function wordBox(
  textWidth: number,
  textHeight: number,
  aspect: number,
  maxHeight = 0.6,
): { width: number; height: number } {
  const ratio = textHeight > 0 ? textWidth / textHeight : 1;
  let width = aspect;
  let height = width / ratio;
  if (height > maxHeight) {
    height = maxHeight;
    width = height * ratio;
  }
  return { width, height };
}

/**
 * Points chosen at random among the opaque pixels of a mask (a word drawn into a 2D
 * canvas), mapped into `box`. `alpha` has one byte per pixel.
 */
export function sampleMask(
  alpha: ArrayLike<number>,
  width: number,
  height: number,
  n: number,
  box: { width: number; height: number },
  rng: Rng,
): Float32Array {
  const opaque: number[] = [];
  for (let i = 0; i < width * height; i++) if (alpha[i] > 127) opaque.push(i);
  const out = new Float32Array(n * 3);
  if (opaque.length === 0) return out;
  for (let i = 0; i < n; i++) {
    const pixel = opaque[Math.floor(rng() * opaque.length)];
    const px = (pixel % width) + rng();
    const py = Math.floor(pixel / width) + rng();
    out[i * 3] = (px / width - 0.5) * box.width;
    out[i * 3 + 1] = -(py / height - 0.5) * box.height;
    out[i * 3 + 2] = (rng() - 0.5) * 0.02;
  }
  return out;
}

// --- strokes: shapes drawn as lines and dots ---------------------------------------

type Dot = { at: Pt; radius: number; weight: number };
type Drawing = {
  lines: Pt[][];
  dots?: Dot[];
  /** How thick a line is (a stage unit). */
  thickness?: number;
  /** The share of the points that go to the dots, 0..1. */
  dotShare?: number;
  depth?: number;
};

const length = (a: Pt, b: Pt) =>
  Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);

function strokes(drawing: Drawing, n: number, rng: Rng): Float32Array {
  const { lines, dots = [], thickness = 0.008, depth = 0.02 } = drawing;
  const dotShare = dots.length ? (drawing.dotShare ?? 0.15) : 0;
  // Cumulative length of every segment, to pick a place along the lines.
  const segments: { a: Pt; b: Pt; start: number }[] = [];
  let total = 0;
  for (const line of lines) {
    for (let i = 0; i + 1 < line.length; i++) {
      const len = length(line[i], line[i + 1]);
      if (len === 0) continue;
      segments.push({ a: line[i], b: line[i + 1], start: total });
      total += len;
    }
  }
  const weightSum = dots.reduce((sum, dot) => sum + dot.weight, 0) || 1;
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    let x: number;
    let y: number;
    let z: number;
    if (rng() < dotShare) {
      let pick = rng() * weightSum;
      let dot = dots[0];
      for (const candidate of dots) {
        pick -= candidate.weight;
        if (pick <= 0) {
          dot = candidate;
          break;
        }
      }
      const angle = rng() * Math.PI * 2;
      const radius = dot.radius * Math.sqrt(rng());
      x = dot.at[0] + Math.cos(angle) * radius;
      y = dot.at[1] + Math.sin(angle) * radius;
      z = dot.at[2] + (rng() - 0.5) * depth;
    } else {
      const along = rng() * total;
      // The segment that holds `along` (a binary search over the starts).
      let low = 0;
      let high = segments.length - 1;
      while (low < high) {
        const mid = (low + high + 1) >> 1;
        if (segments[mid].start <= along) low = mid;
        else high = mid - 1;
      }
      const seg = segments[low];
      const len = length(seg.a, seg.b);
      const t = Math.min(1, (along - seg.start) / len);
      x = seg.a[0] + (seg.b[0] - seg.a[0]) * t + gauss(rng) * thickness;
      y = seg.a[1] + (seg.b[1] - seg.a[1]) * t + gauss(rng) * thickness;
      z = seg.a[2] + (seg.b[2] - seg.a[2]) * t + gauss(rng) * thickness;
      z += (rng() - 0.5) * depth;
    }
    out[i * 3] = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = z;
  }
  return out;
}

const pt = (x: number, y: number, z = 0): Pt => [x, y, z];

function arc(
  cx: number,
  cy: number,
  r: number,
  from: number,
  to: number,
  steps = 32,
  rx = r,
): Pt[] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const a = from + ((to - from) * i) / steps;
    return pt(cx + Math.cos(a) * rx, cy + Math.sin(a) * r);
  });
}

function cubic(p0: Pt, p1: Pt, p2: Pt, p3: Pt, steps = 40): Pt[] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const u = 1 - t;
    const f = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
    return pt(
      f[0] * p0[0] + f[1] * p1[0] + f[2] * p2[0] + f[3] * p3[0],
      f[0] * p0[1] + f[1] * p1[1] + f[2] * p2[1] + f[3] * p3[1],
    );
  });
}

function roundedRect(
  cx: number,
  cy: number,
  w: number,
  h: number,
  r: number,
): Pt[] {
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const y0 = cy - h / 2;
  const y1 = cy + h / 2;
  const q = Math.PI / 2;
  return [
    ...arc(x1 - r, y1 - r, r, 0, q, 8),
    ...arc(x0 + r, y1 - r, r, q, 2 * q, 8),
    ...arc(x0 + r, y0 + r, r, 2 * q, 3 * q, 8),
    ...arc(x1 - r, y0 + r, r, 3 * q, 4 * q, 8),
    pt(x1, y1 - r),
  ];
}

/** Form 2: a pair of curly braces, { }. */
export function bracesForm(n: number, rng: Rng): Float32Array {
  // A "}" for side 1 (the ends are left of the stem, the tip points right); mirrored
  // for the "{" of side -1.
  const brace = (side: 1 | -1, cx: number): Pt[] => {
    const h = 0.34; // half height
    const w = 0.09;
    const x = (v: number) => cx + side * v;
    return [
      ...cubic(
        pt(x(0), h),
        pt(x(w * 0.8), h),
        pt(x(w), h * 0.62),
        pt(x(w), h * 0.36),
      ),
      pt(x(w), h * 0.12),
      ...cubic(
        pt(x(w), h * 0.12),
        pt(x(w), 0.01),
        pt(x(w * 1.5), 0),
        pt(x(w * 2.4), 0),
      ),
      ...cubic(
        pt(x(w * 2.4), 0),
        pt(x(w * 1.5), 0),
        pt(x(w), -0.01),
        pt(x(w), -h * 0.12),
      ),
      pt(x(w), -h * 0.36),
      ...cubic(
        pt(x(w), -h * 0.36),
        pt(x(w), -h * 0.62),
        pt(x(w * 0.8), -h),
        pt(x(0), -h),
      ),
    ];
  };
  return strokes(
    { lines: [brace(-1, -0.3), brace(1, 0.3)], thickness: 0.008 },
    n,
    rng,
  );
}

/** Form 3: a 5 × 5 × 5 lattice of nodes with its edges (3D). */
export function latticeForm(n: number, rng: Rng): Float32Array {
  const size = 5;
  const step = 0.15;
  const at = (i: number) => (i - (size - 1) / 2) * step;
  const lines: Pt[][] = [];
  const dots: Dot[] = [];
  for (let a = 0; a < size; a++) {
    for (let b = 0; b < size; b++) {
      lines.push([pt(at(0), at(a), at(b)), pt(at(size - 1), at(a), at(b))]);
      lines.push([pt(at(a), at(0), at(b)), pt(at(a), at(size - 1), at(b))]);
      lines.push([pt(at(a), at(b), at(0)), pt(at(a), at(b), at(size - 1))]);
      for (let c = 0; c < size; c++)
        dots.push({ at: pt(at(a), at(b), at(c)), radius: 0.012, weight: 1 });
    }
  }
  return strokes(
    { lines, dots, thickness: 0.002, dotShare: 0.45, depth: 0 },
    n,
    rng,
  );
}

/** Form 5: a pen-tool curve with its anchor points and handles. */
export function bezierForm(n: number, rng: Rng): Float32Array {
  const p0 = pt(-0.7, -0.18);
  const p3 = pt(0.7, 0.16);
  const h0 = pt(-0.4, 0.3);
  const h1 = pt(0.32, -0.31);
  return strokes(
    {
      lines: [cubic(p0, h0, h1, p3, 80), [p0, h0], [p3, h1]],
      dots: [
        { at: p0, radius: 0.026, weight: 2 },
        { at: p3, radius: 0.026, weight: 2 },
        { at: h0, radius: 0.018, weight: 1 },
        { at: h1, radius: 0.018, weight: 1 },
      ],
      thickness: 0.007,
      dotShare: 0.14,
    },
    n,
    rng,
  );
}

/** Form 6: a colour wheel as a ring with six wedge rays. */
export function wheelForm(n: number, rng: Rng): Float32Array {
  const outer = 0.34;
  const inner = 0.17;
  const lines: Pt[][] = [
    arc(0, 0, outer, 0, Math.PI * 2, 96),
    arc(0, 0, inner, 0, Math.PI * 2, 64),
  ];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    lines.push([
      pt(Math.cos(a) * inner, Math.sin(a) * inner),
      pt(Math.cos(a) * outer, Math.sin(a) * outer),
    ]);
  }
  return strokes(
    {
      lines,
      dots: [{ at: pt(0, 0), radius: 0.05, weight: 1 }],
      thickness: 0.006,
      dotShare: 0.06,
    },
    n,
    rng,
  );
}

/** Form 8: a camera outline with its lens. */
export function cameraForm(n: number, rng: Rng): Float32Array {
  const body = roundedRect(0, -0.02, 0.78, 0.46, 0.05);
  const hump = [pt(-0.16, 0.21), pt(-0.11, 0.3), pt(0.11, 0.3), pt(0.16, 0.21)];
  return strokes(
    {
      lines: [
        body,
        hump,
        arc(0, -0.02, 0.15, 0, Math.PI * 2, 48),
        arc(0, -0.02, 0.09, 0, Math.PI * 2, 32),
        [pt(0.26, 0.15), pt(0.33, 0.15)],
      ],
      dots: [{ at: pt(0, -0.02), radius: 0.035, weight: 1 }],
      thickness: 0.006,
      dotShare: 0.08,
    },
    n,
    rng,
  );
}

/** Form 9: an aperture, a circle with six blades. */
export function apertureForm(n: number, rng: Rng): Float32Array {
  const outer = 0.34;
  const hole = 0.1;
  const lines: Pt[][] = [arc(0, 0, outer, 0, Math.PI * 2, 96)];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i;
    const from = pt(Math.cos(a) * outer, Math.sin(a) * outer);
    const b = a + Math.PI / 3 + 0.35;
    const to = pt(Math.cos(b) * hole, Math.sin(b) * hole);
    lines.push([from, to]);
    const c = a + Math.PI / 3;
    lines.push([to, pt(Math.cos(c) * hole * 1.0, Math.sin(c) * hole * 1.0)]);
  }
  return strokes({ lines, thickness: 0.006 }, n, rng);
}

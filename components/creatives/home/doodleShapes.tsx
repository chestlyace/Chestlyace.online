import type { ReactNode } from "react";

// The hand-drawn doodles of the home page's hero (design.md §13.57). Every shape is
// drawn around its own centre (0, 0), in a box of about 120 units, with slightly
// wobbly paths; the strokes are `currentColor`, so a doodle takes the colour of its
// group. Each path carries `pathLength="1"`, which the motion (useDoodles) draws on.

export type DoodleKind =
  | "camera"
  | "aperture"
  | "nib"
  | "pencil"
  | "crop"
  | "star"
  | "spiral"
  | "spark"
  | "dots"
  | "squiggle"
  | "scribble"
  | "arrow";

const polar = (angle: number, radius: number): [number, number] => [
  Math.cos((angle * Math.PI) / 180) * radius,
  Math.sin((angle * Math.PI) / 180) * radius,
];
const fixed = (n: number) => Math.round(n * 10) / 10;

// A path that is drawn on: the dash is one whole path long and starts hidden.
export function Stroke({ d, className }: { d: string; className?: string }) {
  return (
    <path
      d={d}
      pathLength={1}
      data-draw
      className={className}
      fill="none"
      strokeDasharray="1 1.02"
      strokeDashoffset={1.02}
      opacity={0}
    />
  );
}

function rays(count: number, inner: number, outer: number, offset = 0) {
  return Array.from({ length: count }, (_, i) => {
    const angle = offset + (360 / count) * i;
    const long = i % 2 === 0;
    const [x1, y1] = polar(angle, inner);
    const [x2, y2] = polar(angle, long ? outer : outer * 0.68);
    return `M${fixed(x1)} ${fixed(y1)} L${fixed(x2)} ${fixed(y2)}`;
  });
}

function bladeLines(): string[] {
  return Array.from({ length: 6 }, (_, i) => {
    const [x1, y1] = polar(i * 60, 38);
    const [x2, y2] = polar(i * 60 + 62, 13);
    return `M${fixed(x1)} ${fixed(y1)} L${fixed(x2)} ${fixed(y2)}`;
  });
}

function spiralPath(): string {
  const points: string[] = [];
  for (let i = 0; i <= 64; i++) {
    const angle = i * 28;
    const radius = 3 + i * 0.62 + Math.sin(i * 1.3) * 0.7;
    const [x, y] = polar(angle, radius);
    points.push(`${i === 0 ? "M" : "L"}${fixed(x)} ${fixed(y)}`);
  }
  return points.join(" ");
}

const CAMERA_BODY =
  "M-44-20 C-44-27 -40-30 -33-30 L-19-31 L-14-41 C-13-43 -11-43 -9-43 L12-42 L19-31 L34-30 C41-30 45-27 44-20 L45 25 C45 32 41 35 34 35 L-33 34 C-41 34 -45 31 -44 25 Z";

// What each kind is drawn with: its strokes, and the parts a reaction moves
// (`.burst`, `.blades`, `.handles`).
export function Shape({ kind }: { kind: DoodleKind }): ReactNode {
  switch (kind) {
    case "camera":
      return (
        <>
          <Stroke d={CAMERA_BODY} />
          <Stroke d="M-19 3 C-19-8 -9-17 1-17 C12-17 19-8 19 3 C19 14 10 21 0 21 C-11 21 -19 14 -19 3 Z" />
          <Stroke d="M-8 3 C-8-3 -4-7 1-7 C6-7 9-3 9 3 C9 8 5 11 0 11 C-5 11 -8 8 -8 3" />
          <Stroke d="M29-20 L37-21" />
          <g className="burst doodle-part" opacity={0}>
            {rays(10, 56, 78).map((d) => (
              <path key={d} d={d} fill="none" />
            ))}
          </g>
        </>
      );
    case "aperture":
      return (
        <>
          <Stroke d="M-41 2 C-42-21 -21-41 1-41 C24-42 42-22 41 1 C42 23 22 42 0 41 C-22 42 -41 24 -41 2 Z" />
          <g className="blades doodle-part">
            {bladeLines().map((d) => (
              <Stroke key={d} d={d} />
            ))}
          </g>
        </>
      );
    case "nib":
      return (
        <>
          <Stroke d="M0-50 L21-14 C23 3 13 17 1 30 C-12 17 -23 3 -21-14 Z" />
          <Stroke d="M0-50 L1-12" />
          <Stroke d="M-5-6 C-5-10 5-10 5-6 C5-1 -5-1 -5-6" />
          <Stroke d="M-58 56 C-28 12 26 96 58 50" />
          <g className="handles doodle-part">
            <Stroke d="M-58 56 L-42 26" />
            <Stroke d="M58 50 L44 82" />
            <Stroke d="M-62 56 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0" />
            <Stroke d="M54 50 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0" />
            <Stroke d="M-46 26 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0" />
            <Stroke d="M40 82 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0" />
          </g>
        </>
      );
    case "pencil":
      return (
        <>
          <Stroke d="M-52 42 L-49 25 L-36 37 Z" />
          <Stroke d="M-49 25 L25-49 L38-37 L-36 37" />
          <Stroke d="M25-49 L33-58 C37-61 43-56 46-52 L38-37" />
          <Stroke d="M-42 31 L31-43" />
        </>
      );
    case "crop":
      return (
        <>
          <Stroke d="M-52-30 L-31-31 L-30-52" />
          <Stroke d="M52-30 L31-31 L30-52" />
          <Stroke d="M-52 30 L-31 31 L-30 52" />
          <Stroke d="M52 30 L31 31 L30 52" />
        </>
      );
    case "star":
      return (
        <>
          {rays(8, 7, 30).map((d) => (
            <Stroke key={d} d={d} />
          ))}
        </>
      );
    case "spiral":
      return <Stroke d={spiralPath()} />;
    case "spark":
      return (
        <Stroke d="M0-26 C3-9 9-3 26 0 C9 3 3 9 0 26 C-3 9 -9 3 -26 0 C-9-3 -3-9 0-26 Z" />
      );
    case "dots":
      return (
        <>
          <circle
            cx={-26}
            cy={4}
            r={7}
            className="fill-primary-text"
            opacity={0}
            data-dot
          />
          <circle
            cx={0}
            cy={-6}
            r={5}
            className="fill-foreground"
            opacity={0}
            data-dot
          />
          <circle
            cx={22}
            cy={8}
            r={4}
            className="fill-muted"
            opacity={0}
            data-dot
          />
        </>
      );
    case "squiggle":
      return (
        <Stroke d="M-62 2 C-54-12 -48-12 -42 2 C-36 16 -30 16 -22 2 C-15-12 -9-12 -2 2 C4 16 11 16 18 2 C25-12 31-12 38 2 C44 16 51 15 62 0" />
      );
    case "scribble":
      return (
        <Stroke d="M20 55 C8 20 120 4 220 8 C332 11 396 30 388 58 C380 90 250 98 150 94 C60 90 10 80 17 50 C22 26 100 16 180 14" />
      );
    case "arrow":
      return (
        <>
          <Stroke d="M-60-18 C-34-52 14-44 12-8 C10 22-30 20-16-4 C-6-20 24-8 52 10" />
          <Stroke d="M36 8 L54 11 L47 -6" />
        </>
      );
  }
}

// The size a kind's invisible hit area covers (its box), for hover and tap.
export const HIT: Record<DoodleKind, [number, number]> = {
  camera: [100, 90],
  aperture: [90, 90],
  nib: [130, 130],
  pencil: [110, 110],
  crop: [110, 110],
  star: [64, 64],
  spiral: [64, 64],
  spark: [56, 56],
  dots: [70, 30],
  squiggle: [130, 40],
  scribble: [400, 110],
  arrow: [130, 90],
};

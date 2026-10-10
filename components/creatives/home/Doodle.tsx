import { HIT, Shape, Stroke, type DoodleKind } from "./doodleShapes";

// One doodle (design.md §13.57): a static place in the scene (`transform`), then the
// three layers the motion moves, so they never fight: the pointer field, the idle
// breathing and a reaction. The invisible rectangle is what a hover or a tap lands on.
export function Doodle({
  kind,
  x = 0,
  y = 0,
  rotate = 0,
  scale = 1,
  accent = false,
  hit = true,
}: {
  kind: DoodleKind;
  x?: number;
  y?: number;
  rotate?: number;
  scale?: number;
  /** In the creatives orange (stars, the scribble, the arrow, the spark). */
  accent?: boolean;
  hit?: boolean;
}) {
  const [width, height] = HIT[kind];
  return (
    <g
      data-doodle={kind}
      transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}
      className={
        (accent ? "text-primary-text" : "text-foreground/85") +
        " transition-colors duration-150 motion-reduce:hover:text-primary-text"
      }
    >
      <g data-layer="field">
        <g data-layer="idle">
          <g data-layer="react">
            <Shape kind={kind} />
          </g>
        </g>
      </g>
      {hit && (
        <rect
          x={-width / 2}
          y={-height / 2}
          width={width}
          height={height}
          fill="transparent"
          stroke="none"
          pointerEvents="all"
        />
      )}
    </g>
  );
}

// A hand-drawn frame holding a featured picture (design.md §13.57): the outline is
// drawn first, then the picture is wiped in. A polaroid has the wider bottom margin.
export function Frame({
  id,
  src,
  x,
  y,
  width,
  height,
  rotate,
  polaroid = false,
}: {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotate: number;
  polaroid?: boolean;
}) {
  const w = width / 2;
  const h = height / 2;
  const pad = 9;
  const imageWidth = width - pad * 2;
  const imageHeight = height - pad - (polaroid ? pad + 26 : pad);
  const imageX = -w + pad;
  const imageY = -h + pad;
  const clip = `${id}-clip`;
  return (
    <g
      data-doodle="frame"
      data-tilt={rotate}
      transform={`translate(${x} ${y}) rotate(${rotate})`}
      className="text-foreground/85 transition-colors duration-150 motion-reduce:hover:text-primary-text"
    >
      <g data-layer="field">
        <g data-layer="idle">
          <g data-layer="react">
            <clipPath id={clip}>
              <rect
                data-frame-clip
                data-width={imageWidth}
                x={imageX}
                y={imageY}
                width={0}
                height={imageHeight}
              />
            </clipPath>
            <image
              data-frame-image
              href={src}
              x={imageX}
              y={imageY}
              width={imageWidth}
              height={imageHeight}
              preserveAspectRatio="xMidYMid slice"
              clipPath={`url(#${clip})`}
              opacity={0}
              stroke="none"
            />
            <Stroke
              d={`M${-w} ${-h + 2} C${-w / 3} ${-h - 2} ${w / 3} ${-h + 3} ${w + 1} ${-h} C${w + 3} ${-h / 3} ${w - 2} ${h / 3} ${w} ${h + 1} C${w / 3} ${h + 3} ${-w / 3} ${h - 2} ${-w - 1} ${h} C${-w - 3} ${h / 3} ${-w + 2} ${-h / 3} ${-w} ${-h + 2} Z`}
            />
          </g>
        </g>
      </g>
      <rect
        x={-w}
        y={-h}
        width={width}
        height={height}
        fill="transparent"
        stroke="none"
        pointerEvents="all"
      />
    </g>
  );
}

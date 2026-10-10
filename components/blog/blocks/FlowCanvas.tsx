"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { FlowLayout } from "@/lib/blog/flowLayout";
import { cn } from "@/lib/cn";
import { useReveal } from "./useReveal";
import { format } from "@/lib/i18n/format";
import { useBlockText } from "./useBlockText";

export type FlowNodeView = {
  id: string;
  label: string;
  desc: string | null;
  style: string;
  group: boolean;
  icon: ReactNode;
};

const MIN_WIDTH = 640;
const MAX_SCALE = 1.25;

// The head of an arrow, from the last control point to the end of its path.
function arrowHead(d: string): { x: number; y: number; angle: number } {
  const numbers = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
  const [cx, cy, x, y] = numbers.slice(-4);
  return { x, y, angle: (Math.atan2(y - cy, x - cx) * 180) / Math.PI };
}

// `flow` (design.md §13.45): an architecture or process diagram. The layout is
// worked out on the server; this draws it: boxes and groups in HTML (so text is
// real text) over SVG arrows, the whole canvas scaled to the column and never
// narrower than 640px (it scrolls sideways below that). Nodes fade in, then
// the arrows draw themselves; hovering or focusing a node lights its arrows.
export function FlowCanvas({
  layout,
  nodes,
}: {
  layout: FlowLayout;
  nodes: FlowNodeView[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [active, setActive] = useState<string | null>(null);
  useReveal(ref);
  const t = useBlockText();

  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const measure = () =>
      setScale(
        Math.min(
          MAX_SCALE,
          Math.max(element.clientWidth, MIN_WIDTH) / layout.width,
        ),
      );
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [layout.width]);

  const byId = new Map(nodes.map((node) => [node.id, node]));
  const rect = new Map(layout.items.map((item) => [item.id, item]));
  const boxes = nodes.filter((node) => !node.group);
  const groups = nodes.filter((node) => node.group);
  const label = format(t.diagram, { title: nodes[0]?.label ?? t.flow });
  const tint = (style: string) => `var(--diagram-${style})`;
  const nodeCount = nodes.length;
  const connected = (index: number) =>
    active === null ||
    layout.edges[index].from === active ||
    layout.edges[index].to === active;

  return (
    <div
      ref={ref}
      className="group/flow my-10 overflow-hidden rounded-xl border border-border bg-surface"
    >
      <div ref={frame} className="overflow-x-auto">
        <div
          style={{ width: layout.width * scale, height: layout.height * scale }}
          className="relative"
        >
          <div
            style={{
              width: layout.width,
              height: layout.height,
              transform: `scale(${scale})`,
              transformOrigin: "0 0",
            }}
            className="absolute top-0 left-0"
          >
            {groups.map((group) => {
              const box = rect.get(group.id)!;
              return (
                <div
                  key={group.id}
                  style={{
                    left: box.x,
                    top: box.y,
                    width: box.w,
                    height: box.h,
                  }}
                  className="absolute rounded-lg border border-dashed border-border"
                >
                  <span className="type-label absolute top-2 left-4 text-muted">
                    {group.label}
                  </span>
                </div>
              );
            })}

            <svg
              role="img"
              aria-label={label}
              width={layout.width}
              height={layout.height}
              viewBox={`0 0 ${layout.width} ${layout.height}`}
              className="absolute top-0 left-0"
            >
              {layout.edges.map((edge, index) => {
                const head = arrowHead(edge.d);
                const delay = nodeCount * 60 + 400 + index * 120;
                const style: CSSProperties = { transitionDelay: `${delay}ms` };
                const lit = active !== null && connected(index);
                return (
                  <g
                    key={index}
                    className="transition-opacity duration-150"
                    style={{ opacity: connected(index) ? 1 : 0.4 }}
                  >
                    <path
                      d={edge.d}
                      pathLength={1}
                      fill="none"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeDasharray={1}
                      style={style}
                      className={cn(
                        "transition-[stroke-dashoffset,stroke] duration-[600ms] ease-in-out [stroke-dashoffset:0] group-data-[phase=armed]/flow:[stroke-dashoffset:1]",
                        lit ? "stroke-primary" : "stroke-muted",
                      )}
                    />
                    <path
                      d="M-7 -4 L0 0 L-7 4"
                      fill="none"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      transform={`translate(${head.x} ${head.y}) rotate(${head.angle})`}
                      style={{ transitionDelay: `${delay + 500}ms` }}
                      className={cn(
                        "opacity-100 transition-opacity duration-200 group-data-[phase=armed]/flow:opacity-0",
                        lit ? "stroke-primary" : "stroke-muted",
                      )}
                    />
                  </g>
                );
              })}
            </svg>

            {layout.edges.map(
              (edge, index) =>
                edge.label && (
                  <span
                    key={index}
                    style={{
                      left: edge.mid.x,
                      top: edge.mid.y,
                      opacity: connected(index) ? 1 : 0.4,
                      transitionDelay: `${nodeCount * 60 + 400 + index * 120 + 500}ms`,
                    }}
                    className="type-label absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-surface px-2 py-0.5 whitespace-nowrap text-muted transition-opacity duration-200 group-data-[phase=armed]/flow:!opacity-0"
                  >
                    {edge.label}
                  </span>
                ),
            )}

            {boxes.map((node, index) => {
              const box = rect.get(node.id)!;
              return (
                <div
                  key={node.id}
                  tabIndex={0}
                  role="group"
                  aria-label={node.label}
                  onMouseEnter={() => setActive(node.id)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(node.id)}
                  onBlur={() => setActive(null)}
                  style={{
                    left: box.x,
                    top: box.y,
                    width: box.w,
                    height: box.h,
                    transitionDelay: `${index * 60}ms`,
                  }}
                  className="absolute flex items-start gap-3 rounded-md border border-border bg-surface-raised px-4 py-3 outline-none transition-[opacity,transform,border-color] duration-[400ms] ease-out group-data-[phase=armed]/flow:scale-[0.96] group-data-[phase=armed]/flow:opacity-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <span
                    style={{
                      color: tint(node.style),
                      backgroundColor: `color-mix(in srgb, ${tint(node.style)} 14%, transparent)`,
                    }}
                    className="grid size-7 shrink-0 place-items-center rounded-sm"
                  >
                    {node.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-foreground">
                      {node.label}
                    </span>
                    {node.desc && (
                      <span className="mt-0.5 block text-sm leading-snug text-muted">
                        {node.desc}
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <ul className="sr-only">
        {layout.edges.map((edge, index) => (
          <li key={index}>
            {byId.get(edge.from)?.label} → {byId.get(edge.to)?.label}
            {edge.label ? `: ${edge.label}` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import {
  ArrowDown,
  ArrowUp,
  Group,
  LayoutGrid,
  MoveRight,
  Square,
  Trash2,
} from "lucide-react";
import { DynamicIcon, iconNames, type IconName } from "lucide-react/dynamic";
import {
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { FormField } from "@/components/shared/FormField";
import { IconButton } from "@/components/shared/IconButton";
import {
  FLOW_STYLES,
  type Flow,
  type FlowNode,
  type FlowStyle,
} from "@/lib/blog/blocks";
import {
  STYLE_NAMES,
  addEdge,
  addNode,
  autoArrange,
  moveSibling,
  parentChoices,
  removeEdge,
  removeNode,
  setParent,
  updateEdge,
  updateNode,
} from "@/lib/blog/flowEdit";
import { MARGIN, layoutFlow, type FlowLayout } from "@/lib/blog/flowLayout";
import { cn } from "@/lib/cn";
import { Switch } from "../Switch";
import { AddButton, IconPicker, TextInput, inputClass } from "./formParts";

type Selection =
  { kind: "node"; id: string } | { kind: "edge"; index: number } | null;

const GRID = 8;
const snap = (value: number) => Math.max(0, Math.round(value / GRID) * GRID);
const tint = (style: FlowStyle) => `var(--diagram-${style})`;

// A box's rectangle on the editor canvas. The editor shows raw positions (what
// `pos` says, plus a margin), not the public layout's, so moving one box never
// moves another.
type Rect = { x: number; y: number; w: number; h: number };

function rects(layout: FlowLayout): Map<string, Rect> {
  const dx = MARGIN - layout.shift.x;
  const dy = MARGIN - layout.shift.y;
  return new Map(
    layout.items.map((item) => [
      item.id,
      { x: item.x + dx, y: item.y + dy, w: item.w, h: item.h },
    ]),
  );
}

const overlaps = (a: Rect, b: Rect, gap = 16) =>
  a.x < b.x + b.w + gap &&
  a.x + a.w + gap > b.x &&
  a.y < b.y + b.h + gap &&
  a.y + a.h + gap > b.y;

// The first free place on a grid of cells for a new box.
function freeSpot(taken: Rect[]): { x: number; y: number } {
  for (let row = 0; row < 40; row++) {
    for (let column = 0; column < 4; column++) {
      const spot = { x: column * 256, y: row * 136 };
      if (
        !taken.some((rect) =>
          overlaps(
            { ...spot, w: 208, h: 92 },
            { ...rect, x: rect.x - MARGIN, y: rect.y - MARGIN },
          ),
        )
      )
        return spot;
    }
  }
  return { x: 0, y: 0 };
}

// The flow canvas editor (design.md §13.48): a canvas to draw on and a side panel
// that lists every box and arrow, so a diagram can be edited with a pointer or
// without one.
export function FlowEditor({
  data,
  onChange,
}: {
  data: Flow;
  onChange: (next: Flow) => void;
}) {
  const id = useId();
  const [selected, setSelected] = useState<Selection>(null);
  const [linkMode, setLinkMode] = useState(false);
  const [linkFrom, setLinkFrom] = useState<string | null>(null);
  const [draft, setDraft] = useState<{
    from: string;
    x: number;
    y: number;
  } | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const canvas = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    id: string;
    startX: number;
    startY: number;
    origin: { x: number; y: number };
    moved: boolean;
    flow: Flow;
  } | null>(null);

  const layout = useMemo(
    () => (data.nodes.length ? layoutFlow(data) : null),
    [data],
  );
  const box = useMemo(
    () => (layout ? rects(layout) : new Map<string, Rect>()),
    [layout],
  );
  const byId = new Map(data.nodes.map((node) => [node.id, node]));
  const node = selected?.kind === "node" ? byId.get(selected.id) : undefined;
  const edge =
    selected?.kind === "edge" ? data.edges[selected.index] : undefined;

  const width = Math.max(640, ...[...box.values()].map((r) => r.x + r.w + 160));
  const height = Math.max(
    360,
    ...[...box.values()].map((r) => r.y + r.h + 120),
  );

  // Every free box gets the position it has now, so moving one doesn't re-flow the rest.
  const pinned = (flow: Flow): Flow =>
    !layout
      ? flow
      : {
          ...flow,
          nodes: flow.nodes.map((n) => {
            if (n.parent || n.pos) return n;
            const r = box.get(n.id)!;
            return { ...n, pos: { x: r.x - MARGIN, y: r.y - MARGIN } };
          }),
        };

  const announce = (message: string) => setAnnouncement(message);

  const add = (kind: "box" | "group") => {
    const pinnedFlow = pinned(data);
    const taken = pinnedFlow.nodes
      .filter((n) => !n.parent)
      .map((n) => box.get(n.id))
      .filter((r): r is Rect => Boolean(r));
    const made = addNode(pinnedFlow, kind, freeSpot(taken));
    onChange(made.flow);
    setSelected({ kind: "node", id: made.id });
    announce(`${kind === "group" ? "Group" : "Box"} added`);
  };

  const connect = (from: string, to: string) => {
    const next = addEdge(data, from, to);
    if (next !== data) {
      onChange(next);
      setSelected({ kind: "edge", index: next.edges.length - 1 });
      announce(
        `Arrow from ${byId.get(from)?.label} to ${byId.get(to)?.label} added`,
      );
    }
  };

  // ---- dragging a box ---------------------------------------------------------------

  const onBoxPointerDown = (event: PointerEvent, n: FlowNode) => {
    if (event.button !== 0) return;
    if (linkMode) return;
    const r = box.get(n.id);
    if (!r || n.parent) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      id: n.id,
      startX: event.clientX,
      startY: event.clientY,
      origin: { x: n.pos?.x ?? r.x - MARGIN, y: n.pos?.y ?? r.y - MARGIN },
      moved: false,
      flow: pinned(data),
    };
  };

  const onBoxPointerMove = (event: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = event.clientX - d.startX;
    const dy = event.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) < 4) return;
    d.moved = true;
    onChange(
      updateNode(d.flow, d.id, {
        pos: { x: snap(d.origin.x + dx), y: snap(d.origin.y + dy) },
      }),
    );
  };

  const onBoxPointerUp = (n: FlowNode) => {
    const d = drag.current;
    drag.current = null;
    if (d?.moved) return;
    clickBox(n);
  };

  const clickBox = (n: FlowNode) => {
    if (linkMode) {
      if (!linkFrom) {
        setLinkFrom(n.id);
        announce(`Arrow starts at ${n.label}. Choose where it points.`);
      } else {
        if (linkFrom !== n.id) connect(linkFrom, n.id);
        setLinkFrom(null);
        setLinkMode(false);
      }
      return;
    }
    setSelected({ kind: "node", id: n.id });
  };

  const onBoxKey = (event: KeyboardEvent, n: FlowNode) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      clickBox(n);
      return;
    }
    const step = event.shiftKey ? 32 : GRID;
    const move: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const delta = move[event.key];
    const r = box.get(n.id);
    if (!delta || !r || n.parent) return;
    event.preventDefault();
    const from = n.pos ?? { x: r.x - MARGIN, y: r.y - MARGIN };
    onChange(
      updateNode(pinned(data), n.id, {
        pos: {
          x: Math.max(0, from.x + delta[0]),
          y: Math.max(0, from.y + delta[1]),
        },
      }),
    );
  };

  // ---- drawing an arrow from a box's edge dot ---------------------------------------

  const local = (event: PointerEvent) => {
    const rect = canvas.current!.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const onDotDown = (event: PointerEvent, from: string) => {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraft({ from, ...local(event) });
  };

  const onDotMove = (event: PointerEvent) => {
    if (draft) setDraft({ ...draft, ...local(event) });
  };

  const onDotUp = (event: PointerEvent) => {
    if (!draft) return;
    const target = document
      .elementsFromPoint(event.clientX, event.clientY)
      .map((element) => (element as HTMLElement).closest?.("[data-flow-box]"))
      .find(Boolean) as HTMLElement | null | undefined;
    const to = target?.dataset.flowBox;
    if (to) connect(draft.from, to);
    setDraft(null);
  };

  // ---- the panel ---------------------------------------------------------------------

  const depthOf = (n: FlowNode) => {
    let depth = 0;
    for (let at = n; at.parent; at = byId.get(at.parent)!) depth++;
    return depth;
  };
  const hasChildren = (n: FlowNode) =>
    data.nodes.some((other) => other.parent === n.id);
  const nameOf = (nodeId: string) => byId.get(nodeId)?.label || nodeId;

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const draftLine = (() => {
    if (!draft) return null;
    const r = box.get(draft.from);
    return r
      ? { x1: r.x + r.w, y1: r.y + r.h / 2, x2: draft.x, y2: draft.y }
      : null;
  })();

  return (
    <div className="@container">
      <div className="grid gap-4 @3xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap gap-2">
            <AddButton
              onClick={() => add("box")}
              icon={<Square className="size-4" aria-hidden="true" />}
            >
              Add box
            </AddButton>
            <AddButton
              onClick={() => add("group")}
              icon={<Group className="size-4" aria-hidden="true" />}
            >
              Add group
            </AddButton>
            <button
              type="button"
              aria-pressed={linkMode}
              onClick={() => {
                setLinkMode((value) => !value);
                setLinkFrom(null);
              }}
              className={cn(
                "flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors duration-150",
                linkMode
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface text-foreground hover:bg-tile-hover",
              )}
            >
              <MoveRight className="size-4" aria-hidden="true" />
              {linkMode
                ? linkFrom
                  ? "Tap where it points"
                  : "Tap where it starts"
                : "Add arrow"}
            </button>
            <AddButton
              icon={<LayoutGrid className="size-4" aria-hidden="true" />}
              onClick={() => {
                onChange(autoArrange(data));
                announce("Boxes arranged in rows");
              }}
            >
              Auto-arrange
            </AddButton>
          </div>

          <div
            role="application"
            aria-label="Diagram canvas. Drag boxes, or use the lists beside it."
            className="h-[30rem] overflow-auto rounded-lg border border-border bg-background"
          >
            <div
              ref={canvas}
              onClick={(event) => {
                if (event.target === event.currentTarget) setSelected(null);
              }}
              style={{
                width,
                height,
                backgroundImage:
                  "radial-gradient(circle, color-mix(in srgb, var(--muted) 35%, transparent) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
                backgroundPosition: `${MARGIN % 24}px ${MARGIN % 24}px`,
              }}
              className="relative"
            >
              {!layout && (
                <p className="absolute inset-0 grid place-items-center text-sm text-muted">
                  Add a box to start the diagram.
                </p>
              )}

              {layout &&
                data.nodes
                  .filter((n) => n.group)
                  .map((n) => {
                    const r = box.get(n.id)!;
                    return (
                      <div
                        key={n.id}
                        style={{ left: r.x, top: r.y, width: r.w, height: r.h }}
                        data-flow-box={n.id}
                        className={cn(
                          "pointer-events-none absolute rounded-lg border border-dashed border-border",
                          selected?.kind === "node" &&
                            selected.id === n.id &&
                            "border-primary",
                          linkFrom === n.id && "border-primary",
                        )}
                      >
                        <div
                          role="button"
                          tabIndex={0}
                          aria-label={`Group: ${n.label}`}
                          onPointerDown={(event) => onBoxPointerDown(event, n)}
                          onPointerMove={onBoxPointerMove}
                          onPointerUp={() => onBoxPointerUp(n)}
                          onKeyDown={(event) => onBoxKey(event, n)}
                          className={cn(
                            "pointer-events-auto flex h-8 touch-none items-center rounded-t-lg px-4 outline-none focus-visible:outline-2 focus-visible:outline-ring",
                            n.parent
                              ? "cursor-default"
                              : "cursor-grab active:cursor-grabbing",
                          )}
                        >
                          <span className="type-label truncate text-muted">
                            {n.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}

              {layout && (
                <svg
                  width={width}
                  height={height}
                  className="pointer-events-none absolute top-0 left-0"
                  aria-hidden="true"
                >
                  <defs>
                    <marker
                      id={`${id}-arrow`}
                      viewBox="0 0 10 10"
                      refX="9"
                      refY="5"
                      markerWidth="8"
                      markerHeight="8"
                      orient="auto"
                    >
                      <path
                        d="M1 1 L9 5 L1 9"
                        fill="none"
                        stroke="context-stroke"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </marker>
                  </defs>
                  {layout.edges.map((e, index) => {
                    const dx = MARGIN - layout.shift.x;
                    const dy = MARGIN - layout.shift.y;
                    const active =
                      selected?.kind === "edge" && selected.index === index;
                    return (
                      <g key={index} transform={`translate(${dx} ${dy})`}>
                        <path
                          d={e.d}
                          fill="none"
                          strokeWidth={active ? 2.5 : 1.5}
                          markerEnd={`url(#${id}-arrow)`}
                          className={active ? "stroke-primary" : "stroke-muted"}
                        />
                        <path
                          d={e.d}
                          fill="none"
                          stroke="transparent"
                          strokeWidth={16}
                          style={{ pointerEvents: "stroke", cursor: "pointer" }}
                          onClick={() => setSelected({ kind: "edge", index })}
                        />
                      </g>
                    );
                  })}
                  {draftLine && (
                    <line
                      {...draftLine}
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      className="stroke-primary"
                    />
                  )}
                </svg>
              )}

              {layout &&
                layout.edges.map((e, index) => {
                  if (!e.label) return null;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelected({ kind: "edge", index })}
                      style={{
                        left: e.mid.x + MARGIN - layout.shift.x,
                        top: e.mid.y + MARGIN - layout.shift.y,
                      }}
                      className="type-label absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-surface px-2 py-0.5 whitespace-nowrap text-muted"
                    >
                      {e.label}
                    </button>
                  );
                })}

              {layout &&
                data.nodes
                  .filter((n) => !n.group)
                  .map((n) => {
                    const r = box.get(n.id)!;
                    const active =
                      selected?.kind === "node" && selected.id === n.id;
                    return (
                      <div
                        key={n.id}
                        role="button"
                        tabIndex={0}
                        data-flow-box={n.id}
                        aria-label={`Box: ${n.label}`}
                        aria-pressed={active}
                        onPointerDown={(event) => onBoxPointerDown(event, n)}
                        onPointerMove={onBoxPointerMove}
                        onPointerUp={() => onBoxPointerUp(n)}
                        onKeyDown={(event) => onBoxKey(event, n)}
                        style={{ left: r.x, top: r.y, width: r.w, height: r.h }}
                        className={cn(
                          "group/box absolute flex touch-none items-start gap-3 rounded-md border bg-surface-raised px-4 py-3 outline-none focus-visible:outline-2 focus-visible:outline-ring",
                          n.parent
                            ? "cursor-default"
                            : "cursor-grab active:cursor-grabbing",
                          active || linkFrom === n.id
                            ? "border-primary"
                            : "border-border",
                        )}
                      >
                        <span
                          style={{
                            color: tint(n.style),
                            backgroundColor: `color-mix(in srgb, ${tint(n.style)} 14%, transparent)`,
                          }}
                          className="grid size-7 shrink-0 place-items-center rounded-sm"
                        >
                          {n.icon &&
                          (iconNames as readonly string[]).includes(n.icon) ? (
                            <DynamicIcon
                              name={n.icon as IconName}
                              className="size-4"
                            />
                          ) : null}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-foreground">
                            {n.label}
                          </span>
                          {n.desc && (
                            <span className="mt-0.5 block truncate text-sm text-muted">
                              {n.desc}
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })}

              {layout &&
                data.nodes.map((n) => {
                  const r = box.get(n.id)!;
                  return (
                    <span
                      key={n.id}
                      role="presentation"
                      aria-hidden="true"
                      title="Drag to another box to draw an arrow"
                      onPointerDown={(event) => onDotDown(event, n.id)}
                      onPointerMove={onDotMove}
                      onPointerUp={onDotUp}
                      style={{ left: r.x + r.w - 8, top: r.y + r.h / 2 - 8 }}
                      className="absolute grid size-4 cursor-crosshair touch-none place-items-center rounded-full border border-primary bg-surface-raised opacity-60 hover:opacity-100"
                    >
                      <span className="size-1.5 rounded-full bg-primary" />
                    </span>
                  );
                })}
            </div>
          </div>
          <p className="mt-2 text-sm text-muted">
            Drag a box to move it, or focus it and use the arrow keys. Drag from
            the dot on its right edge to another box to draw an arrow; on a
            touch screen use Add arrow. Boxes inside a group are placed by the
            group.
          </p>
        </div>

        <aside
          aria-label="Diagram details"
          className="grid content-start gap-5"
        >
          {node && (
            <section
              aria-label="Selected box"
              className="grid gap-4 rounded-lg bg-surface p-4"
            >
              <p className="type-label text-muted">
                {node.group ? "Group" : "Box"}
              </p>
              <TextInput
                label="Label"
                value={node.label}
                onChange={(label) =>
                  onChange(updateNode(data, node.id, { label }))
                }
              />
              <IconPicker
                value={node.icon ?? ""}
                onChange={(icon) =>
                  onChange(updateNode(data, node.id, { icon: icon || null }))
                }
              />
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-foreground">
                  Colour
                </legend>
                <div className="flex flex-wrap gap-2">
                  {FLOW_STYLES.map((style) => (
                    <button
                      key={style}
                      type="button"
                      aria-pressed={node.style === style}
                      aria-label={STYLE_NAMES[style]}
                      title={STYLE_NAMES[style]}
                      onClick={() =>
                        onChange(updateNode(data, node.id, { style }))
                      }
                      className={cn(
                        "grid size-9 place-items-center rounded-full border-2 transition-colors duration-150",
                        node.style === style
                          ? "border-foreground"
                          : "border-transparent",
                      )}
                    >
                      <span
                        style={{ backgroundColor: tint(style) }}
                        className="size-6 rounded-full"
                      />
                    </button>
                  ))}
                </div>
              </fieldset>
              <TextInput
                label="Description"
                optional
                value={node.desc ?? ""}
                onChange={(desc) =>
                  onChange(updateNode(data, node.id, { desc: desc || null }))
                }
              />
              <div className="flex items-center justify-between gap-4 rounded-lg bg-surface-raised p-3 pl-4">
                <div>
                  <p className="text-sm font-medium text-foreground">A group</p>
                  {hasChildren(node) && (
                    <p className="text-sm text-muted">
                      Empty it to turn this off.
                    </p>
                  )}
                </div>
                <Switch
                  checked={node.group}
                  disabled={hasChildren(node)}
                  onChange={(group) =>
                    onChange(updateNode(data, node.id, { group }))
                  }
                  label="This box is a group"
                />
              </div>
              {node.group && (
                <FormField id={`${id}-dir`} label="Lays its boxes out">
                  <select
                    id={`${id}-dir`}
                    value={node.dir}
                    onChange={(event) =>
                      onChange(
                        updateNode(data, node.id, {
                          dir: event.target.value as "h" | "v",
                        }),
                      )
                    }
                    className={inputClass}
                  >
                    <option value="h">Left to right</option>
                    <option value="v">Top to bottom</option>
                  </select>
                </FormField>
              )}
              <FormField id={`${id}-parent`} label="Inside group">
                <select
                  id={`${id}-parent`}
                  value={node.parent ?? ""}
                  onChange={(event) =>
                    onChange(
                      setParent(data, node.id, event.target.value || null),
                    )
                  }
                  className={inputClass}
                >
                  <option value="">None, on the canvas</option>
                  {parentChoices(data, node.id).map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.label}
                    </option>
                  ))}
                </select>
              </FormField>
              <div>
                <AddButton
                  icon={<Trash2 className="size-4" aria-hidden="true" />}
                  onClick={() => {
                    onChange(removeNode(data, node.id));
                    setSelected(null);
                    announce("Removed");
                  }}
                >
                  Remove {node.group ? "group" : "box"}
                </AddButton>
              </div>
            </section>
          )}

          {edge && selected?.kind === "edge" && (
            <section
              aria-label="Selected arrow"
              className="grid gap-4 rounded-lg bg-surface p-4"
            >
              <p className="type-label text-muted">Arrow</p>
              <p className="text-sm text-foreground">
                {nameOf(edge.from)} → {nameOf(edge.to)}
              </p>
              <TextInput
                label="Label"
                optional
                value={edge.label ?? ""}
                onChange={(label) =>
                  onChange(
                    updateEdge(data, selected.index, { label: label || null }),
                  )
                }
              />
              <div>
                <AddButton
                  icon={<Trash2 className="size-4" aria-hidden="true" />}
                  onClick={() => {
                    onChange(removeEdge(data, selected.index));
                    setSelected(null);
                  }}
                >
                  Remove arrow
                </AddButton>
              </div>
            </section>
          )}

          <section aria-label="Boxes" className="rounded-lg bg-surface p-3">
            <h4 className="type-label mb-2 px-1 text-muted">Boxes</h4>
            {data.nodes.length === 0 ? (
              <p className="px-1 text-sm text-muted">None yet.</p>
            ) : (
              <ol className="grid gap-1">
                {data.nodes.map((n) => (
                  <li
                    key={n.id}
                    className="flex items-center gap-1"
                    style={{ paddingLeft: `${depthOf(n) * 0.75}rem` }}
                  >
                    <button
                      type="button"
                      aria-pressed={
                        selected?.kind === "node" && selected.id === n.id
                      }
                      onClick={() => setSelected({ kind: "node", id: n.id })}
                      className={cn(
                        "min-w-0 flex-1 truncate rounded-md px-2 py-1.5 text-left text-sm",
                        selected?.kind === "node" && selected.id === n.id
                          ? "bg-surface-raised font-medium text-foreground"
                          : "text-foreground hover:bg-tile-hover",
                      )}
                    >
                      {n.group && (
                        <span className="type-label mr-1.5 text-muted">
                          Group
                        </span>
                      )}
                      {n.label}
                    </button>
                    <IconButton
                      label={`Move ${n.label} up`}
                      iconKey="up"
                      onClick={() => onChange(moveSibling(data, n.id, -1))}
                      className="size-8"
                    >
                      <ArrowUp className="size-4" />
                    </IconButton>
                    <IconButton
                      label={`Move ${n.label} down`}
                      iconKey="down"
                      onClick={() => onChange(moveSibling(data, n.id, 1))}
                      className="size-8"
                    >
                      <ArrowDown className="size-4" />
                    </IconButton>
                    <IconButton
                      label={`Remove ${n.label}`}
                      iconKey="remove"
                      onClick={() => {
                        onChange(removeNode(data, n.id));
                        if (selected?.kind === "node" && selected.id === n.id)
                          setSelected(null);
                      }}
                      className="size-8 hover:text-danger"
                    >
                      <Trash2 className="size-4" />
                    </IconButton>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section aria-label="Arrows" className="rounded-lg bg-surface p-3">
            <h4 className="type-label mb-2 px-1 text-muted">Arrows</h4>
            {data.edges.length > 0 && (
              <ol className="mb-3 grid gap-1">
                {data.edges.map((e, index) => (
                  <li key={index} className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-pressed={
                        selected?.kind === "edge" && selected.index === index
                      }
                      onClick={() => setSelected({ kind: "edge", index })}
                      className={cn(
                        "min-w-0 flex-1 truncate rounded-md px-2 py-1.5 text-left text-sm",
                        selected?.kind === "edge" && selected.index === index
                          ? "bg-surface-raised font-medium text-foreground"
                          : "text-foreground hover:bg-tile-hover",
                      )}
                    >
                      {nameOf(e.from)} → {nameOf(e.to)}
                      {e.label ? `: ${e.label}` : ""}
                    </button>
                    <IconButton
                      label={`Remove arrow ${nameOf(e.from)} to ${nameOf(e.to)}`}
                      iconKey="remove"
                      onClick={() => {
                        onChange(removeEdge(data, index));
                        setSelected(null);
                      }}
                      className="size-8 hover:text-danger"
                    >
                      <Trash2 className="size-4" />
                    </IconButton>
                  </li>
                ))}
              </ol>
            )}
            {data.nodes.length >= 2 && (
              <div className="grid gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <select
                    aria-label="Arrow from"
                    value={from}
                    onChange={(event) => setFrom(event.target.value)}
                    className={cn(inputClass, "h-10 text-[0.9375rem]")}
                  >
                    <option value="">From…</option>
                    {data.nodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.label}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Arrow to"
                    value={to}
                    onChange={(event) => setTo(event.target.value)}
                    className={cn(inputClass, "h-10 text-[0.9375rem]")}
                  >
                    <option value="">To…</option>
                    {data.nodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <AddButton
                    disabled={!from || !to || from === to}
                    onClick={() => {
                      connect(from, to);
                      setFrom("");
                      setTo("");
                    }}
                  >
                    Add this arrow
                  </AddButton>
                </div>
              </div>
            )}
          </section>
        </aside>
        <p role="status" aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </div>
    </div>
  );
}

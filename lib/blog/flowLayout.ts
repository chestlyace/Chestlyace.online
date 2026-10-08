import type { Flow, FlowNode } from "./blocks";

// Lays a `flow` block out on its canvas (design.md §13.45): where each box and
// group sits and how big it is, and the path of each arrow. Boxes with a `pos`
// keep it; the rest are placed in rows under them; a group's children are laid
// out inside it, left to right (`dir:h`) or top to bottom (`dir:v`).

export const NODE_WIDTH = 208;
export const NODE_HEIGHT = 68;
export const NODE_HEIGHT_WITH_DESC = 92;
const GAP = 24;
const GROUP_PADDING = 20;
const GROUP_HEADER = 32;
export const MARGIN = 24;
const ROW_SIZE = 3;

export type Placed = { id: string; x: number; y: number; w: number; h: number };
export type PlacedEdge = {
  from: string;
  to: string;
  label: string | null;
  d: string;
  mid: { x: number; y: number };
};
export type FlowLayout = {
  width: number;
  height: number;
  items: Placed[];
  edges: PlacedEdge[];
  /** How far everything was moved to bring the top-left box to the margin. */
  shift: { x: number; y: number };
};

type Size = { w: number; h: number };

export function layoutFlow(flow: Flow): FlowLayout {
  const byParent = new Map<string | null, FlowNode[]>();
  for (const node of flow.nodes) {
    const list = byParent.get(node.parent) ?? [];
    list.push(node);
    byParent.set(node.parent, list);
  }

  // Sizes, children first.
  const sizes = new Map<string, Size>();
  const childOffsets = new Map<string, { x: number; y: number }>();
  const sizeOf = (node: FlowNode): Size => {
    const known = sizes.get(node.id);
    if (known) return known;
    let size: Size;
    if (node.group) {
      const kids = byParent.get(node.id) ?? [];
      let cursor = 0;
      let across = 0;
      for (const kid of kids) {
        const kidSize = sizeOf(kid);
        childOffsets.set(
          kid.id,
          node.dir === "h"
            ? { x: GROUP_PADDING + cursor, y: GROUP_HEADER }
            : { x: GROUP_PADDING, y: GROUP_HEADER + cursor },
        );
        cursor += (node.dir === "h" ? kidSize.w : kidSize.h) + GAP;
        across = Math.max(across, node.dir === "h" ? kidSize.h : kidSize.w);
      }
      const along = Math.max(0, cursor - GAP);
      size =
        node.dir === "h"
          ? {
              w: along + GROUP_PADDING * 2,
              h: across + GROUP_HEADER + GROUP_PADDING,
            }
          : {
              w: across + GROUP_PADDING * 2,
              h: along + GROUP_HEADER + GROUP_PADDING,
            };
      size.w = Math.max(size.w, NODE_WIDTH);
    } else {
      size = {
        w: NODE_WIDTH,
        h: node.desc ? NODE_HEIGHT_WITH_DESC : NODE_HEIGHT,
      };
    }
    sizes.set(node.id, size);
    return size;
  };
  flow.nodes.forEach(sizeOf);

  // Positions: top-level boxes first (given, then in rows), then children.
  const origin = new Map<string, { x: number; y: number }>();
  const top = byParent.get(null) ?? [];
  let bottom = 0;
  for (const node of top) {
    if (node.pos) {
      origin.set(node.id, node.pos);
      bottom = Math.max(bottom, node.pos.y + sizeOf(node).h);
    }
  }
  let index = 0;
  let rowTop = bottom > 0 ? bottom + GAP * 2 : 0;
  let x = 0;
  let rowHeight = 0;
  for (const node of top) {
    if (node.pos) continue;
    if (index > 0 && index % ROW_SIZE === 0) {
      rowTop += rowHeight + GAP * 2;
      x = 0;
      rowHeight = 0;
    }
    const size = sizeOf(node);
    origin.set(node.id, { x, y: rowTop });
    x += size.w + GAP * 2;
    rowHeight = Math.max(rowHeight, size.h);
    index++;
  }
  const place = (node: FlowNode) => {
    for (const kid of byParent.get(node.id) ?? []) {
      const base = origin.get(node.id)!;
      const offset = childOffsets.get(kid.id)!;
      origin.set(kid.id, { x: base.x + offset.x, y: base.y + offset.y });
      place(kid);
    }
  };
  top.forEach(place);

  // Move everything so the top-left box sits at the margin.
  const items: Placed[] = flow.nodes.map((node) => {
    const { x: ox, y: oy } = origin.get(node.id)!;
    const { w, h } = sizes.get(node.id)!;
    return { id: node.id, x: ox, y: oy, w, h };
  });
  const minX = Math.min(...items.map((item) => item.x));
  const minY = Math.min(...items.map((item) => item.y));
  for (const item of items) {
    item.x += MARGIN - minX;
    item.y += MARGIN - minY;
  }
  const width = Math.max(...items.map((item) => item.x + item.w)) + MARGIN;
  const height = Math.max(...items.map((item) => item.y + item.h)) + MARGIN;

  const rect = new Map(items.map((item) => [item.id, item]));
  const edges: PlacedEdge[] = flow.edges.map((edge) => {
    const a = rect.get(edge.from)!;
    const b = rect.get(edge.to)!;
    const ac = { x: a.x + a.w / 2, y: a.y + a.h / 2 };
    const bc = { x: b.x + b.w / 2, y: b.y + b.h / 2 };
    const dx = bc.x - ac.x;
    const dy = bc.y - ac.y;
    let start: { x: number; y: number };
    let end: { x: number; y: number };
    let d: string;
    if (Math.abs(dx) > Math.abs(dy)) {
      start = { x: dx > 0 ? a.x + a.w : a.x, y: ac.y };
      end = { x: dx > 0 ? b.x : b.x + b.w, y: bc.y };
      const bend = (end.x - start.x) / 2;
      d = `M${start.x} ${start.y} C${start.x + bend} ${start.y} ${end.x - bend} ${end.y} ${end.x} ${end.y}`;
    } else {
      start = { x: ac.x, y: dy > 0 ? a.y + a.h : a.y };
      end = { x: bc.x, y: dy > 0 ? b.y : b.y + b.h };
      const bend = (end.y - start.y) / 2;
      d = `M${start.x} ${start.y} C${start.x} ${start.y + bend} ${end.x} ${end.y - bend} ${end.x} ${end.y}`;
    }
    return {
      from: edge.from,
      to: edge.to,
      label: edge.label,
      d,
      mid: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
    };
  });

  return {
    width,
    height,
    items,
    edges,
    shift: { x: MARGIN - minX, y: MARGIN - minY },
  };
}

import type { Flow, FlowEdge, FlowNode, FlowStyle } from "./blocks";

// The flow-canvas editor's operations (design.md §13.48) and the text it writes,
// the inverse of `parseFlow` (docs/blog-markdown.md §2). Pure: no React.

const clean = (text: string) => text.replace(/\s*\n\s*/g, " ").trim();

// A box's attributes are separated by `|` and end at `]`, so neither can appear
// in a description.
const safeDesc = (text: string) =>
  clean(text).replace(/\|/g, "/").replace(/\]/g, ")");

export function flowText(flow: Flow): string {
  if (flow.nodes.length === 0) return "";
  const nodes = flow.nodes.map((node) => {
    const attrs = [
      node.id,
      node.icon ? `icon:${node.icon}` : "",
      node.style !== "gray" ? `style:${node.style}` : "",
      node.desc?.trim() ? `desc:${safeDesc(node.desc)}` : "",
      node.pos ? `pos:${Math.round(node.pos.x)},${Math.round(node.pos.y)}` : "",
      node.group ? "group" : "",
      node.group && node.dir === "v" ? "dir:v" : "",
      node.parent ? `parent:${node.parent}` : "",
    ].filter(Boolean);
    return `[${attrs.join("|")}] ${clean(node.label) || node.id}`;
  });
  const edges = flow.edges.map(
    (edge) =>
      `${edge.from} --> ${edge.to}${edge.label?.trim() ? ` : ${clean(edge.label)}` : ""}`,
  );
  return [...nodes, ...(edges.length ? ["", ...edges] : [])].join("\n");
}

export const emptyFlow = (): Flow => ({ nodes: [], edges: [] });

// ---- operations ----------------------------------------------------------------------

export function nextId(flow: Flow): string {
  const used = new Set(flow.nodes.map((node) => node.id));
  for (let n = 1; ; n++) {
    if (!used.has(`box${n}`)) return `box${n}`;
  }
}

export function addNode(
  flow: Flow,
  kind: "box" | "group",
  at?: { x: number; y: number },
): { flow: Flow; id: string } {
  const id = nextId(flow);
  const node: FlowNode = {
    id,
    label: kind === "group" ? "Group" : "Box",
    icon: null,
    style: kind === "group" ? "gray" : "blue",
    desc: null,
    pos: at ?? null,
    group: kind === "group",
    dir: "h",
    parent: null,
  };
  return { flow: { ...flow, nodes: [...flow.nodes, node] }, id };
}

export const updateNode = (
  flow: Flow,
  id: string,
  change: Partial<FlowNode>,
): Flow => ({
  ...flow,
  nodes: flow.nodes.map((node) =>
    node.id === id ? { ...node, ...change } : node,
  ),
});

/** Every box inside `id`, at any depth. */
export function descendants(flow: Flow, id: string): Set<string> {
  const found = new Set<string>();
  const visit = (parent: string) => {
    for (const node of flow.nodes) {
      if (node.parent === parent && !found.has(node.id)) {
        found.add(node.id);
        visit(node.id);
      }
    }
  };
  visit(id);
  return found;
}

/** The groups `id` could sit inside: not itself, not one of its own contents. */
export function parentChoices(flow: Flow, id: string): FlowNode[] {
  const inside = descendants(flow, id);
  return flow.nodes.filter(
    (node) => node.group && node.id !== id && !inside.has(node.id),
  );
}

/** Puts a box inside a group (or back on the canvas), clearing its position. */
export function setParent(flow: Flow, id: string, parent: string | null): Flow {
  if (parent && !parentChoices(flow, id).some((node) => node.id === parent))
    return flow;
  return updateNode(flow, id, { parent, pos: parent ? null : null });
}

/** Removes a box and its arrows; what was inside a group goes back on the canvas. */
export function removeNode(flow: Flow, id: string): Flow {
  return {
    nodes: flow.nodes
      .filter((node) => node.id !== id)
      .map((node) => (node.parent === id ? { ...node, parent: null } : node)),
    edges: flow.edges.filter((edge) => edge.from !== id && edge.to !== id),
  };
}

export function addEdge(flow: Flow, from: string, to: string): Flow {
  if (from === to) return flow;
  const ids = new Set(flow.nodes.map((node) => node.id));
  if (!ids.has(from) || !ids.has(to)) return flow;
  if (flow.edges.some((edge) => edge.from === from && edge.to === to))
    return flow;
  return { ...flow, edges: [...flow.edges, { from, to, label: null }] };
}

export const updateEdge = (
  flow: Flow,
  index: number,
  change: Partial<FlowEdge>,
): Flow => ({
  ...flow,
  edges: flow.edges.map((edge, i) =>
    i === index ? { ...edge, ...change } : edge,
  ),
});

export const removeEdge = (flow: Flow, index: number): Flow => ({
  ...flow,
  edges: flow.edges.filter((_, i) => i !== index),
});

/** Lays the boxes out in rows again: every free position is forgotten. */
export const autoArrange = (flow: Flow): Flow => ({
  ...flow,
  nodes: flow.nodes.map((node) => ({ ...node, pos: null })),
});

/** Swaps a box with its neighbour among those in the same group (or on the canvas). */
export function moveSibling(flow: Flow, id: string, by: -1 | 1): Flow {
  const node = flow.nodes.find((n) => n.id === id);
  if (!node) return flow;
  const siblings = flow.nodes.filter((n) => n.parent === node.parent);
  const at = siblings.findIndex((n) => n.id === id);
  const other = siblings[at + by];
  if (!other) return flow;
  const a = flow.nodes.findIndex((n) => n.id === id);
  const b = flow.nodes.findIndex((n) => n.id === other.id);
  const nodes = [...flow.nodes];
  [nodes[a], nodes[b]] = [nodes[b], nodes[a]];
  return { ...flow, nodes };
}

export const STYLE_NAMES: Record<FlowStyle, string> = {
  blue: "Blue",
  green: "Green",
  orange: "Orange",
  purple: "Purple",
  teal: "Teal",
  red: "Red",
  gray: "Gray",
};

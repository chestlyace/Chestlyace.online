import { describe, expect, it } from "vitest";
import { parseFlow } from "./blocks";
import { layoutFlow, NODE_WIDTH } from "./flowLayout";

const layout = (text: string) => {
  const parsed = parseFlow(text);
  if (!parsed.ok) throw new Error(parsed.error);
  return layoutFlow(parsed.data);
};
const item = (l: ReturnType<typeof layout>, id: string) =>
  l.items.find((i) => i.id === id)!;

describe("layoutFlow", () => {
  it("keeps given positions (shifted to the margin) and places the rest in rows", () => {
    const l = layout(
      "[a|pos:200,100] A\n[b|pos:400,100] B\n[c] C\n[d] D\n[e] E\n[f] F",
    );
    expect(item(l, "b").x - item(l, "a").x).toBe(200);
    expect(Math.min(...l.items.map((i) => i.x))).toBe(24);
    const rowOne = ["c", "d", "e"].map((id) => item(l, id).y);
    expect(new Set(rowOne).size).toBe(1);
    expect(item(l, "f").y).toBeGreaterThan(item(l, "c").y);
    expect(item(l, "c").y).toBeGreaterThan(item(l, "a").y);
  });

  it("lays a group's children out inside it", () => {
    const l = layout("[g|group|dir:h] G\n[x|parent:g] X\n[y|parent:g] Y");
    const g = item(l, "g");
    const x = item(l, "x");
    const y = item(l, "y");
    expect(y.x).toBe(x.x + NODE_WIDTH + 24);
    expect(x.x).toBeGreaterThan(g.x);
    expect(y.x + y.w).toBeLessThan(g.x + g.w);
    expect(x.y).toBeGreaterThan(g.y);
    expect(y.y + y.h).toBeLessThan(g.y + g.h);
  });

  it("stacks a vertical group's children", () => {
    const l = layout("[g|group|dir:v] G\n[x|parent:g] X\n[y|parent:g] Y");
    expect(item(l, "y").y).toBeGreaterThan(item(l, "x").y + item(l, "x").h);
    expect(item(l, "y").x).toBe(item(l, "x").x);
  });

  it("draws a path and a mid point for each arrow, side to side or top to bottom", () => {
    const side = layout("[a|pos:0,0] A\n[b|pos:400,0] B\na --> b : to");
    expect(side.edges[0].d).toMatch(/^M\d+ \d+ C/);
    expect(side.edges[0].label).toBe("to");
    const down = layout("[a|pos:0,0] A\n[b|pos:0,300] B\na --> b");
    expect(down.edges[0].mid.x).toBe(item(down, "a").x + NODE_WIDTH / 2);
  });

  it("sizes the canvas to its content with a margin", () => {
    const l = layout("[a|pos:0,0] A");
    expect(l.width).toBe(24 + NODE_WIDTH + 24);
    expect(l.height).toBeGreaterThan(24 + 68);
  });
});

describe("layoutFlow shift", () => {
  it("says how far everything moved, so a raw position can be recovered", () => {
    const l = layout("[a|pos:200,100] A\n[b|pos:400,300] B");
    expect(l.shift).toEqual({ x: 24 - 200, y: 24 - 100 });
    expect(item(l, "b").x - l.shift.x).toBe(400);
  });
});

import { describe, expect, it } from "vitest";
import { parseFlow, type Flow } from "./blocks";
import {
  addEdge,
  addNode,
  autoArrange,
  descendants,
  emptyFlow,
  flowText,
  moveSibling,
  parentChoices,
  removeEdge,
  removeNode,
  setParent,
  updateNode,
} from "./flowEdit";

const read = (text: string): Flow => {
  const parsed = parseFlow(text);
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.data;
};

const DOC = [
  "[org|icon:cloud|style:teal|desc:The whole company|pos:240,0] Organization",
  "[folder|icon:folder|style:blue|pos:240,130] Folders",
  "[proj|group|dir:v|style:green|pos:20,290] production",
  "[api|icon:server|style:orange|parent:proj|desc:The app] api",
  "",
  "org --> folder",
  "folder --> api : contains",
].join("\n");

describe("flowText", () => {
  it("writes what parseFlow reads back to the same diagram", () => {
    const flow = read(DOC);
    const again = read(flowText(flow));
    expect(again).toEqual(flow);
    expect(flowText(again)).toBe(flowText(flow));
  });

  it("skips the defaults, keeps the id as the label's fallback, and writes nothing for an empty flow", () => {
    expect(flowText(emptyFlow())).toBe("");
    const { flow } = addNode(emptyFlow(), "box");
    expect(flowText(updateNode(flow, "box1", { style: "gray" }))).toBe(
      "[box1] Box",
    );
  });

  it("keeps a description from breaking the line", () => {
    const flow = updateNode(addNode(emptyFlow(), "box").flow, "box1", {
      desc: "a|b]c\nd",
    });
    const again = read(flowText(flow));
    expect(again.nodes[0].desc).toBe("a/b)c d");
  });
});

describe("operations", () => {
  it("adds boxes with unused ids, and arrows once, never to itself or a missing box", () => {
    let flow = addNode(emptyFlow(), "box").flow;
    flow = addNode(flow, "group").flow;
    expect(flow.nodes.map((n) => n.id)).toEqual(["box1", "box2"]);
    flow = removeNode(flow, "box1");
    expect(addNode(flow, "box").id).toBe("box1");
    flow = addNode(flow, "box").flow;
    const ids = flow.nodes.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
    flow = addEdge(flow, ids[0], ids[1]);
    expect(addEdge(flow, ids[0], ids[1]).edges).toHaveLength(1);
    expect(addEdge(flow, ids[0], ids[0]).edges).toHaveLength(1);
    expect(addEdge(flow, ids[0], "nope").edges).toHaveLength(1);
    expect(removeEdge(flow, 0).edges).toHaveLength(0);
  });

  it("removing a box takes its arrows, and a group's contents go back on the canvas", () => {
    const flow = read(DOC);
    const without = removeNode(flow, "proj");
    expect(without.nodes.find((n) => n.id === "api")?.parent).toBeNull();
    expect(without.edges).toHaveLength(2);
    expect(removeNode(flow, "org").edges.every((e) => e.from !== "org")).toBe(
      true,
    );
  });

  it("only allows a box inside a group that is not itself or one of its own contents", () => {
    let flow = read("[a|group] A\n[b|group|parent:a] B\n[c] C");
    expect([...descendants(flow, "a")]).toEqual(["b"]);
    expect(parentChoices(flow, "a").map((n) => n.id)).toEqual([]);
    expect(
      parentChoices(flow, "c")
        .map((n) => n.id)
        .sort(),
    ).toEqual(["a", "b"]);
    expect(
      setParent(flow, "a", "b").nodes.find((n) => n.id === "a")?.parent,
    ).toBeNull();
    flow = setParent(updateNode(flow, "c", { pos: { x: 5, y: 5 } }), "c", "b");
    const c = flow.nodes.find((n) => n.id === "c")!;
    expect(c.parent).toBe("b");
    expect(c.pos).toBeNull();
  });

  it("auto-arrange forgets positions; moving swaps within the same group", () => {
    const flow = read(DOC);
    expect(autoArrange(flow).nodes.every((n) => n.pos === null)).toBe(true);
    const two = read(
      "[a] A\n[g|group] G\n[x|parent:g] X\n[y|parent:g] Y\n[b] B",
    );
    expect(moveSibling(two, "y", -1).nodes.map((n) => n.id)).toEqual([
      "a",
      "g",
      "y",
      "x",
      "b",
    ]);
    expect(moveSibling(two, "x", -1).nodes.map((n) => n.id)).toEqual(
      two.nodes.map((n) => n.id),
    );
    expect(moveSibling(two, "a", 1).nodes.map((n) => n.id)).toEqual([
      "g",
      "a",
      "x",
      "y",
      "b",
    ]);
  });
});

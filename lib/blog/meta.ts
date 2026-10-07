// The words after the language on a code fence (docs/blog-markdown.md §1):
// ` ```ts title="proxy.ts" showLineNumbers {2,4-6} `, and the attributes of a
// custom block (` ```callout type=tip title="Heads up" `).

export type FenceAttributes = {
  values: Record<string, string>;
  flags: Set<string>;
  /** Line numbers named in `{2,4-6}`. */
  highlight: Set<number>;
};

export function parseFenceMeta(
  meta: string | null | undefined,
): FenceAttributes {
  const values: Record<string, string> = {};
  const flags = new Set<string>();
  const highlight = new Set<number>();
  if (!meta) return { values, flags, highlight };

  let rest = meta;
  // {2,4-6}
  rest = rest.replace(/\{([\d,\-\s]+)\}/g, (_, list: string) => {
    for (const part of list.split(",")) {
      const [from, to] = part.trim().split("-").map(Number);
      if (!Number.isInteger(from) || from < 1) continue;
      const last =
        Number.isInteger(to) && to >= from ? Math.min(to, from + 500) : from;
      for (let n = from; n <= last; n++) highlight.add(n);
    }
    return " ";
  });

  // key="a value", key='a value', key=value, or a bare flag.
  const token = /([A-Za-z][\w-]*)(?:=(?:"([^"]*)"|'([^']*)'|(\S+)))?/g;
  for (const match of rest.matchAll(token)) {
    const [, key, quoted, single, bare] = match;
    const value = quoted ?? single ?? bare;
    if (value === undefined) flags.add(key);
    else values[key] = value;
  }
  return { values, flags, highlight };
}

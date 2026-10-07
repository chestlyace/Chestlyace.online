import rehypeShiki from "@shikijs/rehype";
import type { ShikiTransformer } from "shiki";
import type { Element, ElementContent, Root as HastRoot } from "hast";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import type { Code, Root as MdastRoot, RootContent } from "mdast";
import type { ComponentType, ReactNode } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified, type Plugin } from "unified";
import { parseFenceMeta } from "./meta";
import { codeThemes } from "./theme";

// Renders a post's custom markdown (docs/blog-markdown.md): CommonMark + GFM,
// heading ids, Shiki-highlighted code, and the blocks this step knows
// (`callout`, images with captions). Other custom blocks (steps, quiz…) arrive
// with 9b.2 and meanwhile show as plain code, as the format says unknown blocks do.

export const CALLOUT_TYPES = ["note", "tip", "warning"] as const;
export type CalloutType = (typeof CALLOUT_TYPES)[number];

export type TocItem = { id: string; text: string; depth: 2 | 3 };

export type Components = Record<string, ComponentType<never>>;

// ---- small tree helpers --------------------------------------------------------

type Node = { type: string; children?: Node[]; value?: string };

function walk(
  node: Node,
  visit: (node: Node, parent: Node | null) => void,
  parent: Node | null = null,
) {
  visit(node, parent);
  for (const child of node.children ?? []) walk(child, visit, node);
}

export function hastText(node: Node): string {
  if (node.type === "text") return node.value ?? "";
  return (node.children ?? []).map(hastText).join("");
}

// ---- remark: the custom blocks ---------------------------------------------------

const remarkBlocks: Plugin<[], MdastRoot> = () => (tree) => {
  const inner = unified().use(remarkParse).use(remarkGfm);
  walk(tree as Node, (node, parent) => {
    if (node.type !== "code" || !parent?.children) return;
    const code = node as unknown as Code;
    if (code.lang !== "callout") return;

    const { values } = parseFenceMeta(code.meta);
    const type = (CALLOUT_TYPES as readonly string[]).includes(values.type)
      ? values.type
      : "note";
    const body = inner.parse(code.value) as MdastRoot;
    const callout = {
      type: "callout",
      data: {
        hName: "aside",
        hProperties: { dataCallout: type, dataTitle: values.title ?? "" },
      },
      children: body.children as RootContent[],
    };
    const index = parent.children.indexOf(node);
    parent.children[index] = callout as unknown as Node;
  });
};

// ---- rehype: images become figures -------------------------------------------------

function isImage(node: ElementContent): node is Element {
  return node.type === "element" && node.tagName === "img";
}

// A paragraph holding only an image is a figure; `#wide` and `#decorative` on
// the address are options, not part of it; the title is the caption.
const rehypeFigures: Plugin<[], HastRoot> = () => (tree) => {
  walk(tree as Node, (node) => {
    const element = node as unknown as Element;
    if (element.type === "element" && element.tagName === "img") {
      const src = String(element.properties.src ?? "");
      const [address, ...flags] = src.split("#");
      const options = flags.join("#");
      element.properties.src = address;
      if (options.includes("decorative")) element.properties.alt = "";
      if (options.includes("wide")) element.properties["data-wide"] = "true";
    }
    if (element.type === "element" && element.tagName === "p") {
      const meaningful = element.children.filter(
        (child) => !(child.type === "text" && child.value.trim() === ""),
      );
      if (meaningful.length === 1 && isImage(meaningful[0])) {
        const image = meaningful[0];
        const caption = image.properties.title
          ? String(image.properties.title)
          : "";
        delete image.properties.title;
        element.tagName = "figure";
        element.properties = image.properties["data-wide"]
          ? { "data-wide": "true" }
          : {};
        element.children = [
          image,
          ...(caption
            ? [
                {
                  type: "element" as const,
                  tagName: "figcaption",
                  properties: {},
                  children: [{ type: "text" as const, value: caption }],
                },
              ]
            : []),
        ];
      }
    }
  });
};

// Shiki only calls parseMetaString for a fence that has words after its language.
function fenceOf(meta: Record<string, unknown> | undefined) {
  return (
    (meta?.attributes as ReturnType<typeof parseFenceMeta> | undefined) ??
    parseFenceMeta(null)
  );
}

// ---- the processor -----------------------------------------------------------------

async function createProcessor() {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkBlocks)
    .use(remarkRehype)
    .use(rehypeFigures)
    .use(rehypeSlug)
    .use(rehypeShiki, {
      themes: await codeThemes(),
      defaultColor: false,
      fallbackLanguage: "text",
      parseMetaString: (meta: string) => ({ attributes: parseFenceMeta(meta) }),
      transformers: [
        {
          name: "chestly-fence",
          pre(node) {
            const { values, flags } = fenceOf(this.options.meta);
            if (values.title) node.properties["data-title"] = values.title;
            node.properties["data-lang"] = this.options.lang;
            if (flags.has("showLineNumbers"))
              node.properties["data-line-numbers"] = "true";
          },
          line(node, line) {
            if (fenceOf(this.options.meta).highlight.has(line))
              this.addClassToHast(node, "highlighted");
          },
        } satisfies ShikiTransformer,
      ],
    });
}

let processor: ReturnType<typeof createProcessor> | undefined;

export type Rendered = { content: ReactNode; toc: TocItem[] };

export async function renderMarkdown(
  markdown: string,
  components: Components,
): Promise<Rendered> {
  processor ??= createProcessor();
  const ready = await processor;
  const tree = (await ready.run(ready.parse(markdown))) as HastRoot;

  const toc: TocItem[] = [];
  walk(tree as Node, (node) => {
    const element = node as unknown as Element;
    if (element.type !== "element") return;
    if (
      (element.tagName === "h2" || element.tagName === "h3") &&
      element.properties.id
    ) {
      toc.push({
        id: String(element.properties.id),
        text: hastText(element as unknown as Node),
        depth: element.tagName === "h2" ? 2 : 3,
      });
    }
  });

  const content = toJsxRuntime(tree, {
    Fragment,
    jsx,
    jsxs,
    components: components as never,
  });
  return { content, toc };
}

// ---- checks for the editor ---------------------------------------------------------

export type Problem = { level: "error" | "warning"; message: string };

// What the editor and the importer check before a post can be published: images
// need alt text (unless marked `#decorative`), headings must not skip a level,
// callouts need a known type.
export function findProblems(markdown: string): Problem[] {
  const tree = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .parse(markdown) as MdastRoot;
  const problems: Problem[] = [];
  let lastHeading = 1;
  walk(tree as Node, (node) => {
    if (node.type === "image") {
      const image = node as unknown as { alt?: string | null; url: string };
      const decorative = image.url
        .split("#")
        .slice(1)
        .join("#")
        .includes("decorative");
      if (!decorative && !(image.alt ?? "").trim()) {
        problems.push({
          level: "error",
          message: `The image ${image.url.split("#")[0]} has no alt text.`,
        });
      }
    }
    if (node.type === "heading") {
      const depth = (node as unknown as { depth: number }).depth;
      if (depth > lastHeading + 1) {
        problems.push({
          level: "warning",
          message: `A heading jumps from level ${lastHeading} to ${depth}: "${hastText(node)}".`,
        });
      }
      lastHeading = depth;
    }
    if (node.type === "code") {
      const code = node as unknown as Code;
      if (code.lang === "callout") {
        const { values } = parseFenceMeta(code.meta);
        if (
          values.type &&
          !(CALLOUT_TYPES as readonly string[]).includes(values.type)
        ) {
          problems.push({
            level: "error",
            message: `A callout has the unknown type "${values.type}" (use note, tip or warning).`,
          });
        }
      }
    }
  });
  return problems;
}

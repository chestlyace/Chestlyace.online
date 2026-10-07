import type { ComponentProps, ReactNode } from "react";
import { TextLink } from "@/components/shared/TextLink";
import type * as Data from "@/lib/blog/blocks";
import { layoutFlow } from "@/lib/blog/flowLayout";
import { renderMarkdown, type Components } from "@/lib/blog/markdown";
import { tokenize } from "@/lib/blog/tokens";
import { CodeGroup } from "./CodeGroup";
import { Compare } from "./Compare";
import { Diff } from "./Diff";
import { FileTree } from "./FileTree";
import { FlowCanvas } from "./FlowCanvas";
import { renderIcon } from "./icons";
import { Quiz } from "./Quiz";
import { Steps } from "./Steps";
import { Terminal } from "./Terminal";
import { Typewriter } from "./Typewriter";

// The server side of a rich block (design.md §13.38): the markdown pipeline
// leaves `<x-block data-kind data-props>` with the parsed data; this turns it
// into what the client component needs (highlighted tokens, inline markdown,
// icons, a diagram layout) and picks the component by kind.

function InlineLink({ href = "", children }: ComponentProps<"a">) {
  const external = /^https?:\/\//i.test(href);
  return (
    <TextLink variant="inline" href={href} external={external}>
      {children}
    </TextLink>
  );
}

const inlineComponents = {
  p: ({ children }: { children?: ReactNode }) => <>{children}</>,
  a: InlineLink,
} as unknown as Components;

const textComponents = {
  p: (props: ComponentProps<"p">) => <p {...props} />,
  a: InlineLink,
} as unknown as Components;

// A line of text in a block: its inline markdown, without a paragraph around it.
const inline = async (markdown: string) =>
  (await renderMarkdown(markdown, inlineComponents)).content;

// A step's text: paragraphs, lists and links.
const text = async (markdown: string) =>
  (await renderMarkdown(markdown, textComponents)).content;

export async function Block({
  "data-kind": kind,
  "data-props": raw,
}: {
  "data-kind"?: string;
  "data-props"?: string;
}) {
  const data = JSON.parse(raw ?? "null");

  switch (kind as Data.BlockName) {
    case "steps": {
      const steps = await Promise.all(
        (data as Data.Step[]).map(async (step) => ({
          title: step.title,
          icon: renderIcon(step.icon, "size-4 sm:size-5"),
          text: await text(step.text),
        })),
      );
      return <Steps steps={steps} />;
    }
    case "compare": {
      const compare = data as Data.Compare;
      return (
        <Compare
          title={compare.title}
          highlight={compare.highlight}
          header={await Promise.all(compare.header.map(inline))}
          rows={await Promise.all(
            compare.rows.map((row) => Promise.all(row.map(inline))),
          )}
        />
      );
    }
    case "filetree":
      return <FileTree entries={data as Data.TreeEntry[]} />;
    case "typewriter": {
      const block = data as Data.Typewriter;
      const tokens = await tokenize(
        block.lines.map((line) => line.code).join("\n"),
        block.lang,
      );
      return (
        <Typewriter
          title={block.title}
          language={block.lang}
          lines={block.lines.map((line, index) => ({
            tokens: tokens[index] ?? [],
            code: line.code,
            caption: line.caption,
          }))}
        />
      );
    }
    case "codegroup": {
      const tabs = await Promise.all(
        (data as Data.CodeTab[]).map(async (tab) => ({
          label: tab.file ?? tab.lang,
          lang: tab.lang,
          lines: await tokenize(tab.code, tab.lang),
          code: tab.code,
        })),
      );
      return <CodeGroup tabs={tabs} />;
    }
    case "diff": {
      const block = data as Data.Diff;
      const tokens = await tokenize(
        block.lines.map((line) => line.text).join("\n"),
        block.lang,
      );
      return (
        <Diff
          title={block.title}
          language={block.lang}
          lines={block.lines.map((line, index) => ({
            type: line.type,
            text: line.text,
            tokens: tokens[index] ?? [],
          }))}
        />
      );
    }
    case "terminal": {
      const block = data as Data.Terminal;
      return <Terminal title={block.title} rows={block.rows} />;
    }
    case "flow": {
      const flow = data as Data.Flow;
      return (
        <FlowCanvas
          layout={layoutFlow(flow)}
          nodes={flow.nodes.map((node) => ({
            id: node.id,
            label: node.label,
            desc: node.desc,
            style: node.style,
            group: node.group,
            icon: renderIcon(node.icon, "size-4"),
          }))}
        />
      );
    }
    case "quiz": {
      const questions = await Promise.all(
        (data as Data.QuizQuestion[]).map(async (question) => ({
          question: await inline(question.question),
          options: await Promise.all(
            question.options.map(async (option) => ({
              text: await inline(option.text),
              correct: option.correct,
            })),
          ),
          explanation: question.explanation
            ? await inline(question.explanation)
            : null,
        })),
      );
      return <Quiz questions={questions} />;
    }
    default:
      return null;
  }
}

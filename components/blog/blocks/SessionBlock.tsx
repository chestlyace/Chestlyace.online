import {
  Children,
  cloneElement,
  isValidElement,
  type ComponentProps,
  type ReactNode,
} from "react";
import { TextLink } from "@/components/shared/TextLink";
import type * as Data from "@/lib/blog/blocks";
import { getCachedSession } from "@/lib/blog/cache";
import { renderMarkdown, type Components } from "@/lib/blog/markdown";
import { turnWindow } from "@/lib/blog/replay";
import { diffFromTexts } from "@/lib/blog/editorTools";
import { toolCount } from "@/lib/blog/session/types";
import { Redacted } from "./Redacted";
import {
  SessionReplay,
  type ReplayPart,
  type ReplayTurn,
} from "./SessionReplay";

// The server side of the `session` block (design.md §13.47): reads the stored
// session, draws each reply's markdown subset (paragraphs, lists, inline code,
// links) and hands the replay its turns. A session that is gone, or a range with
// no turns, gives a quiet note, so a post never breaks.

function Link({ href = "", children }: ComponentProps<"a">) {
  return (
    <TextLink
      variant="inline"
      href={href}
      external={/^https?:\/\//i.test(href)}
    >
      {children}
    </TextLink>
  );
}

// The text of a rendered node, for a code block drawn plain.
function plainText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(plainText).join("");
  if (isValidElement(node))
    return plainText((node.props as { children?: ReactNode }).children);
  return "";
}

const Plain = ({ children }: { children?: ReactNode }) => <>{children}</>;
const Heading = ({ children }: { children?: ReactNode }) => (
  <p className="font-semibold">{children}</p>
);

// A reply is a transcript, not a document: headings are bold lines (and carry no
// ids that could clash with the post's), code blocks are plain text, images are
// their alt text.
const replyComponents = {
  a: Link,
  h1: Heading,
  h2: Heading,
  h3: Heading,
  h4: Heading,
  h5: Heading,
  h6: Heading,
  pre: ({ children }: { children?: ReactNode }) => (
    <pre>
      <code>{plainText(children)}</code>
    </pre>
  ),
  img: ({ alt }: { alt?: string }) => <Plain>{alt}</Plain>,
} as unknown as Components;

// `[redacted]` marks anywhere in a rendered reply become pills.
function pills(node: ReactNode): ReactNode {
  if (typeof node === "string")
    return node.includes("[redacted]") ? <Redacted text={node} /> : node;
  if (Array.isArray(node)) return Children.map(node, pills);
  if (isValidElement(node)) {
    const { children } = node.props as { children?: ReactNode };
    return children === undefined
      ? node
      : cloneElement(node, undefined, Children.map(children, pills));
  }
  return node;
}

const lineCount = (text: string) => text.split("\n").length;

export async function SessionBlock({ data }: { data: Data.Session }) {
  const session = await getCachedSession(data.id);
  const span = session
    ? turnWindow(session.turns.length, data.from, data.to)
    : null;
  if (!session || !span)
    return (
      <p className="my-8 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted">
        This agent session isn&rsquo;t available.
      </p>
    );

  const chosen = session.turns.slice(span.start, span.end);
  const turns: ReplayTurn[] = await Promise.all(
    chosen.map(async (turn, index) => ({
      number: span.start + index + 1,
      prompt: turn.prompt,
      parts: await Promise.all(
        turn.parts.map(async (part): Promise<ReplayPart> => {
          if (part.kind === "text")
            return {
              kind: "text",
              body: pills(
                (await renderMarkdown(part.text, replyComponents)).content,
              ),
              lines: lineCount(part.text),
            };
          if (part.kind === "thinking")
            return {
              kind: "thinking",
              text: part.text,
              lines: lineCount(part.text),
            };
          return {
            kind: "tool",
            name: part.name,
            summary: part.summary,
            input: part.input,
            output: part.output,
            failed: part.failed,
            diff: part.edit
              ? diffFromTexts(part.edit.before, part.edit.after)
              : null,
          };
        }),
      ),
    })),
  );

  return (
    <SessionReplay
      title={data.title ?? session.title}
      turns={turns}
      toolCalls={toolCount(chosen)}
    />
  );
}

"use client";

import {
  Bold,
  Code as CodeIcon,
  Italic,
  Link as LinkIcon,
  List as ListIcon,
  ListOrdered,
} from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { FormField, fieldControl } from "@/components/shared/FormField";
import { UploadField } from "../UploadField";
import { Switch } from "../Switch";
import { rawKind, type EditorBlock } from "@/lib/blog/editor";
import { CODE_LANGUAGES } from "@/lib/blog/languages";
import { applyFormat, type Format } from "@/lib/blog/textFormat";
import { cn } from "@/lib/cn";

// The forms of the blocks the editor has so far (design.md §13.48). Each is a
// set of labelled admin fields that changes one block.

type Props<T extends EditorBlock> = {
  block: T;
  onChange: (next: T) => void;
};

const select = cn(fieldControl, "h-12 px-4");
const input = cn(fieldControl, "h-12 px-4");
const area = cn(fieldControl, "resize-y px-4 py-3");
const mono = "font-mono text-[0.9375rem] leading-[1.6]";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-surface p-3 pl-4">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </div>
  );
}

// ---- paragraph ---------------------------------------------------------------------

const TOOLS: {
  format: Format;
  label: string;
  icon: ReactNode;
  keys?: string;
}[] = [
  {
    format: "bold",
    label: "Bold",
    icon: <Bold className="size-4" />,
    keys: "B",
  },
  {
    format: "italic",
    label: "Italic",
    icon: <Italic className="size-4" />,
    keys: "I",
  },
  {
    format: "link",
    label: "Link",
    icon: <LinkIcon className="size-4" />,
    keys: "K",
  },
  {
    format: "code",
    label: "Inline code",
    icon: <CodeIcon className="size-4" />,
  },
  {
    format: "bullets",
    label: "Bulleted list",
    icon: <ListIcon className="size-4" />,
  },
  {
    format: "numbers",
    label: "Numbered list",
    icon: <ListOrdered className="size-4" />,
  },
];

export function ParagraphForm({
  block,
  onChange,
  onSlash,
}: Props<Extract<EditorBlock, { type: "paragraph" }>> & {
  onSlash?: () => void;
}) {
  const id = useId();
  const area_ = useRef<HTMLTextAreaElement>(null);

  // The box grows with its text.
  useEffect(() => {
    const element = area_.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, [block.text]);

  const apply = (format: Format) => {
    const element = area_.current;
    if (!element) return;
    const edit = applyFormat(
      block.text,
      element.selectionStart,
      element.selectionEnd,
      format,
    );
    onChange({ ...block, text: edit.text });
    requestAnimationFrame(() => {
      element.focus();
      element.setSelectionRange(edit.start, edit.end);
    });
  };

  return (
    <div>
      <div
        role="toolbar"
        aria-label="Text formatting"
        className="mb-2 flex flex-wrap gap-1"
      >
        {TOOLS.map((tool) => (
          <button
            key={tool.format}
            type="button"
            aria-label={
              tool.keys ? `${tool.label} (Ctrl+${tool.keys})` : tool.label
            }
            title={
              tool.keys ? `${tool.label} (Ctrl/⌘ ${tool.keys})` : tool.label
            }
            onClick={() => apply(tool.format)}
            className="grid size-9 place-items-center rounded-md text-muted transition-colors duration-150 hover:bg-tile hover:text-foreground"
          >
            {tool.icon}
          </button>
        ))}
      </div>
      <label htmlFor={id} className="sr-only">
        Paragraph text
      </label>
      <textarea
        id={id}
        ref={area_}
        value={block.text}
        rows={3}
        placeholder="Write something, or type / for blocks"
        onChange={(event) => {
          const next = event.target.value;
          if (next === "/" && block.text === "" && onSlash) onSlash();
          onChange({ ...block, text: next });
        }}
        onKeyDown={(event) => {
          if (!(event.metaKey || event.ctrlKey)) return;
          const tool = TOOLS.find(
            (t) => t.keys?.toLowerCase() === event.key.toLowerCase(),
          );
          if (!tool) return;
          event.preventDefault();
          apply(tool.format);
        }}
        className={cn(area, "min-h-24 overflow-hidden")}
      />
    </div>
  );
}

// ---- heading, quote, list, callout, divider ---------------------------------------------

export function HeadingForm({
  block,
  onChange,
}: Props<Extract<EditorBlock, { type: "heading" }>>) {
  const id = useId();
  return (
    <div className="grid gap-4 sm:grid-cols-[9rem_1fr]">
      <FormField id={`${id}-level`} label="Level">
        <select
          id={`${id}-level`}
          value={block.level}
          onChange={(event) =>
            onChange({
              ...block,
              level: Number(event.target.value) as 2 | 3 | 4,
            })
          }
          className={select}
        >
          <option value={2}>Heading 2</option>
          <option value={3}>Heading 3</option>
          <option value={4}>Heading 4</option>
        </select>
      </FormField>
      <FormField id={`${id}-text`} label="Heading">
        <input
          id={`${id}-text`}
          value={block.text}
          onChange={(event) => onChange({ ...block, text: event.target.value })}
          className={input}
        />
      </FormField>
    </div>
  );
}

export function QuoteForm({
  block,
  onChange,
}: Props<Extract<EditorBlock, { type: "quote" }>>) {
  const id = useId();
  return (
    <FormField id={id} label="Quote">
      <textarea
        id={id}
        rows={3}
        value={block.text}
        onChange={(event) => onChange({ ...block, text: event.target.value })}
        className={area}
      />
    </FormField>
  );
}

export function ListForm({
  block,
  onChange,
}: Props<Extract<EditorBlock, { type: "list" }>>) {
  const id = useId();
  return (
    <div className="grid gap-4">
      <FormField
        id={id}
        label="Items"
        helper="One item per line. Paste a list to add many at once."
      >
        <textarea
          id={id}
          rows={4}
          value={block.items.join("\n")}
          onChange={(event) =>
            onChange({ ...block, items: event.target.value.split("\n") })
          }
          className={area}
        />
      </FormField>
      <Row label="Numbered">
        <Switch
          checked={block.ordered}
          onChange={(ordered) => onChange({ ...block, ordered })}
          label="Numbered list"
        />
      </Row>
    </div>
  );
}

export function CalloutForm({
  block,
  onChange,
}: Props<Extract<EditorBlock, { type: "callout" }>>) {
  const id = useId();
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-[9rem_1fr]">
        <FormField id={`${id}-kind`} label="Type">
          <select
            id={`${id}-kind`}
            value={block.kind}
            onChange={(event) =>
              onChange({
                ...block,
                kind: event.target.value as typeof block.kind,
              })
            }
            className={select}
          >
            <option value="note">Note</option>
            <option value="tip">Tip</option>
            <option value="warning">Warning</option>
          </select>
        </FormField>
        <FormField id={`${id}-title`} label="Title" optional>
          <input
            id={`${id}-title`}
            value={block.title}
            onChange={(event) =>
              onChange({ ...block, title: event.target.value })
            }
            className={input}
          />
        </FormField>
      </div>
      <FormField id={`${id}-text`} label="Text">
        <textarea
          id={`${id}-text`}
          rows={3}
          value={block.text}
          onChange={(event) => onChange({ ...block, text: event.target.value })}
          className={area}
        />
      </FormField>
    </div>
  );
}

export function DividerForm() {
  return <hr className="my-3 border-border" aria-label="Divider" />;
}

// ---- image -------------------------------------------------------------------------

export function ImageForm({
  block,
  onChange,
}: Props<Extract<EditorBlock, { type: "image" }>>) {
  const id = useId();
  return (
    <div className="grid gap-4">
      <div>
        <p className="mb-2 text-sm font-medium text-foreground">Image</p>
        <UploadField
          id={`${id}-src`}
          name="image"
          use="blog"
          value={block.src}
          onChange={(src) => onChange({ ...block, src })}
          onBlur={() => {}}
        />
      </div>
      <FormField
        id={`${id}-alt`}
        label="Alt text"
        helper={
          block.decorative
            ? "Not needed: this image is decorative."
            : "Describe the image for people who can't see it."
        }
      >
        <input
          id={`${id}-alt`}
          value={block.decorative ? "" : block.alt}
          disabled={block.decorative}
          onChange={(event) => onChange({ ...block, alt: event.target.value })}
          className={input}
        />
      </FormField>
      <FormField id={`${id}-caption`} label="Caption" optional>
        <input
          id={`${id}-caption`}
          value={block.caption}
          onChange={(event) =>
            onChange({ ...block, caption: event.target.value })
          }
          className={input}
        />
      </FormField>
      <div className="grid gap-2 sm:grid-cols-2">
        <Row label="Decorative">
          <Switch
            checked={block.decorative}
            onChange={(decorative) => onChange({ ...block, decorative })}
            label="Decorative image"
          />
        </Row>
        <Row label="Wide">
          <Switch
            checked={block.wide}
            onChange={(wide) => onChange({ ...block, wide })}
            label="Wide image"
          />
        </Row>
      </div>
    </div>
  );
}

// ---- code --------------------------------------------------------------------------

export function CodeForm({
  block,
  onChange,
}: Props<Extract<EditorBlock, { type: "code" }>>) {
  const id = useId();
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id={`${id}-lang`} label="Language" optional>
          <input
            id={`${id}-lang`}
            list={`${id}-langs`}
            value={block.lang}
            placeholder="Search, e.g. ts"
            onChange={(event) =>
              onChange({
                ...block,
                lang: event.target.value.trim().toLowerCase(),
              })
            }
            className={input}
          />
          <datalist id={`${id}-langs`}>
            {CODE_LANGUAGES.map((language) => (
              <option key={language} value={language} />
            ))}
          </datalist>
        </FormField>
        <FormField id={`${id}-file`} label="File name" optional>
          <input
            id={`${id}-file`}
            value={block.file}
            placeholder="proxy.ts"
            onChange={(event) =>
              onChange({ ...block, file: event.target.value })
            }
            className={input}
          />
        </FormField>
      </div>
      <FormField id={`${id}-code`} label="Code">
        <textarea
          id={`${id}-code`}
          rows={8}
          spellCheck={false}
          value={block.code}
          onChange={(event) => onChange({ ...block, code: event.target.value })}
          className={cn(area, mono, "min-h-40 whitespace-pre")}
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id={`${id}-hl`}
          label="Highlighted lines"
          optional
          helper="For example 2, 4-6."
        >
          <input
            id={`${id}-hl`}
            value={block.highlight}
            onChange={(event) =>
              onChange({ ...block, highlight: event.target.value })
            }
            className={input}
          />
        </FormField>
        <div className="sm:pt-7">
          <Row label="Line numbers">
            <Switch
              checked={block.lineNumbers}
              onChange={(lineNumbers) => onChange({ ...block, lineNumbers })}
              label="Show line numbers"
            />
          </Row>
        </div>
      </div>
    </div>
  );
}

// ---- raw markdown ---------------------------------------------------------------------

export function RawForm({
  block,
  onChange,
}: Props<Extract<EditorBlock, { type: "raw" }>>) {
  const id = useId();
  const kind = rawKind(block.markdown);
  return (
    <FormField
      id={id}
      label="Markdown"
      helper={
        kind
          ? `A ${kind} block. Its own form arrives in a later step; until then it is edited as markdown.`
          : "Anything the other blocks can't write, as markdown."
      }
    >
      <textarea
        id={id}
        rows={6}
        spellCheck={false}
        value={block.markdown}
        onChange={(event) =>
          onChange({ ...block, markdown: event.target.value })
        }
        className={cn(area, mono, "min-h-32 whitespace-pre")}
      />
    </FormField>
  );
}

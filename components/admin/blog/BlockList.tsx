"use client";

import {
  ArrowDown,
  ArrowUp,
  Copy,
  Ellipsis,
  GripVertical,
  Trash2,
} from "lucide-react";
import { Reorder, useDragControls } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { IconButton } from "@/components/shared/IconButton";
import { Tag } from "@/components/shared/Tag";
import {
  blockToMarkdown,
  emptyBlock,
  newBlockId,
  rawKind,
  type BlockProblem,
  type BlockType,
  type EditorBlock,
} from "@/lib/blog/editor";
import { cn } from "@/lib/cn";
import { useConfirm } from "../ConfirmDialog";
import {
  CalloutForm,
  CodeForm,
  DividerForm,
  HeadingForm,
  ImageForm,
  ListForm,
  ParagraphForm,
  QuoteForm,
  RawForm,
} from "./blockForms";
import { InsertButton, InsertMenu } from "./InsertMenu";
import { CodeGroupForm, DiffForm, TypewriterForm } from "./codeForms";
import {
  CompareForm,
  FileTreeForm,
  QuizForm,
  StepsForm,
  TerminalForm,
} from "./interactiveForms";

const NAMES: Record<BlockType, string> = {
  paragraph: "Paragraph",
  heading: "Heading",
  quote: "Quote",
  list: "List",
  callout: "Callout",
  divider: "Divider",
  image: "Image",
  code: "Code",
  codegroup: "Code group",
  diff: "Diff",
  steps: "Steps",
  compare: "Compare",
  filetree: "File tree",
  terminal: "Terminal",
  typewriter: "Typewriter code",
  quiz: "Quiz",
  raw: "Raw markdown",
};

const nameOf = (block: EditorBlock) =>
  block.type === "raw"
    ? (rawKind(block.markdown) ?? NAMES.raw)
    : NAMES[block.type];

function Form({
  block,
  onChange,
  onSlash,
}: {
  block: EditorBlock;
  onChange: (next: EditorBlock) => void;
  onSlash: () => void;
}) {
  const change = onChange as never;
  switch (block.type) {
    case "paragraph":
      return (
        <ParagraphForm block={block} onChange={change} onSlash={onSlash} />
      );
    case "heading":
      return <HeadingForm block={block} onChange={change} />;
    case "quote":
      return <QuoteForm block={block} onChange={change} />;
    case "list":
      return <ListForm block={block} onChange={change} />;
    case "callout":
      return <CalloutForm block={block} onChange={change} />;
    case "divider":
      return <DividerForm />;
    case "image":
      return <ImageForm block={block} onChange={change} />;
    case "code":
      return <CodeForm block={block} onChange={change} />;
    case "steps":
      return (
        <StepsForm
          data={block.data}
          onChange={(data) => onChange({ ...block, data })}
        />
      );
    case "compare":
      return (
        <CompareForm
          data={block.data}
          onChange={(data) => onChange({ ...block, data })}
        />
      );
    case "filetree":
      return (
        <FileTreeForm
          data={block.data}
          onChange={(data) => onChange({ ...block, data })}
        />
      );
    case "terminal":
      return (
        <TerminalForm
          data={block.data}
          onChange={(data) => onChange({ ...block, data })}
        />
      );
    case "quiz":
      return (
        <QuizForm
          data={block.data}
          onChange={(data) => onChange({ ...block, data })}
        />
      );
    case "typewriter":
      return (
        <TypewriterForm
          data={block.data}
          onChange={(data) => onChange({ ...block, data })}
        />
      );
    case "codegroup":
      return (
        <CodeGroupForm
          data={block.data}
          onChange={(data) => onChange({ ...block, data })}
        />
      );
    case "diff":
      return (
        <DiffForm
          data={block.data}
          onChange={(data) => onChange({ ...block, data })}
        />
      );
    case "raw":
      return <RawForm block={block} onChange={change} />;
  }
}

// The Write tab's list of blocks (design.md §13.48): each a row with a drag
// handle, its type, its form and a toolbar. Blocks reorder by dragging or with
// the Move buttons, and a live region says where one went.
export function BlockList({
  blocks,
  onChange,
  problems,
}: {
  blocks: EditorBlock[];
  onChange: (next: EditorBlock[]) => void;
  problems: BlockProblem[];
}) {
  const [announcement, setAnnouncement] = useState("");
  const [slashFor, setSlashFor] = useState<string | null>(null);
  const confirm = useConfirm();

  const insert = (index: number, type: BlockType, replace?: string) => {
    const block = emptyBlock(type, newBlockId());
    const next = replace
      ? blocks.map((existing) => (existing.id === replace ? block : existing))
      : [...blocks.slice(0, index), block, ...blocks.slice(index)];
    onChange(next);
    setAnnouncement(`${NAMES[type]} added`);
    requestAnimationFrame(() =>
      document
        .getElementById(`block-${block.id}`)
        ?.querySelector<HTMLElement>("input, textarea, select, button")
        ?.focus(),
    );
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= blocks.length) return;
    const next = [...blocks];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
    setAnnouncement(`Moved to position ${to + 1} of ${blocks.length}`);
    requestAnimationFrame(() =>
      document.getElementById(`move-${moved.id}`)?.focus(),
    );
  };

  const duplicate = (index: number) => {
    const copy = { ...blocks[index], id: newBlockId() } as EditorBlock;
    onChange([...blocks.slice(0, index + 1), copy, ...blocks.slice(index + 1)]);
    setAnnouncement("Block duplicated");
  };

  const remove = async (index: number) => {
    const block = blocks[index];
    if (
      blockToMarkdown(block) !== "" &&
      !(await confirm({
        title: `Delete this ${nameOf(block).toLowerCase()} block?`,
        text: "Its content is removed from the post.",
        confirmLabel: "Delete",
      }))
    )
      return;
    onChange(blocks.filter((_, i) => i !== index));
    setAnnouncement("Block deleted");
  };

  return (
    <>
      <Reorder.Group
        as="ol"
        axis="y"
        values={blocks}
        onReorder={onChange}
        aria-label="Blocks"
        className="flex flex-col"
      >
        {blocks.map((block, index) => (
          <BlockRow
            key={block.id}
            block={block}
            index={index}
            total={blocks.length}
            problem={problems.find((p) => p.blockId === block.id)?.message}
            slashOpen={slashFor === block.id}
            onChange={(next) =>
              onChange(blocks.map((b) => (b.id === block.id ? next : b)))
            }
            onSlash={() => setSlashFor(block.id)}
            onSlashPick={(type) => {
              setSlashFor(null);
              insert(index, type, block.id);
            }}
            onSlashClose={() => setSlashFor(null)}
            onInsert={(type) => insert(index, type)}
            onMove={(to) => move(index, to)}
            onDuplicate={() => duplicate(index)}
            onDelete={() => remove(index)}
          />
        ))}
      </Reorder.Group>
      <div className="mt-2">
        <InsertButton
          always
          label="Add a block at the end"
          onPick={(type) => insert(blocks.length, type)}
        />
      </div>
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </>
  );
}

function BlockRow({
  block,
  index,
  total,
  problem,
  slashOpen,
  onChange,
  onSlash,
  onSlashPick,
  onSlashClose,
  onInsert,
  onMove,
  onDuplicate,
  onDelete,
}: {
  block: EditorBlock;
  index: number;
  total: number;
  problem?: string;
  slashOpen: boolean;
  onChange: (next: EditorBlock) => void;
  onSlash: () => void;
  onSlashPick: (type: BlockType) => void;
  onSlashClose: () => void;
  onInsert: (type: BlockType) => void;
  onMove: (to: number) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const controls = useDragControls();
  const name = nameOf(block);

  return (
    <Reorder.Item
      as="li"
      value={block}
      dragListener={false}
      dragControls={controls}
      id={`block-${block.id}`}
      data-block={name}
      whileDrag={{
        scale: 1.005,
        boxShadow: "var(--shadow-float-lifted)",
        zIndex: 2,
      }}
      className="list-none"
    >
      {index === 0 && (
        <InsertButton
          label="Insert a block before the first"
          onPick={onInsert}
        />
      )}
      <div
        className={cn(
          "relative rounded-lg bg-surface p-3 sm:p-4",
          problem && "shadow-[inset_0_0_0_1px_var(--danger)]",
        )}
      >
        <div className="mb-3 flex items-center gap-2">
          <button
            type="button"
            aria-label={`Drag ${name} block (or use the move buttons)`}
            onPointerDown={(event) => controls.start(event)}
            className="grid size-9 shrink-0 cursor-grab touch-none place-items-center rounded-md text-muted active:cursor-grabbing"
          >
            <GripVertical className="size-5" aria-hidden="true" />
          </button>
          <Tag>{name}</Tag>
          <span className="ml-auto hidden items-center md:flex">
            <IconButton
              id={`move-${block.id}`}
              label={`Move ${name} up`}
              iconKey="up"
              disabled={index === 0}
              onClick={() => onMove(index - 1)}
            >
              <ArrowUp className="size-[1.125rem]" />
            </IconButton>
            <IconButton
              label={`Move ${name} down`}
              iconKey="down"
              disabled={index === total - 1}
              onClick={() => onMove(index + 1)}
            >
              <ArrowDown className="size-[1.125rem]" />
            </IconButton>
            <IconButton
              label={`Duplicate ${name}`}
              iconKey="copy"
              onClick={onDuplicate}
            >
              <Copy className="size-[1.125rem]" />
            </IconButton>
            <IconButton
              label={`Delete ${name}`}
              iconKey="delete"
              onClick={onDelete}
              className="hover:text-danger focus-visible:text-danger"
            >
              <Trash2 className="size-[1.125rem]" />
            </IconButton>
          </span>
          <BlockMenu
            name={name}
            index={index}
            total={total}
            onMove={onMove}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        </div>
        <Form block={block} onChange={onChange} onSlash={onSlash} />
        {problem && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {problem}
          </p>
        )}
        {slashOpen && <SlashMenu onPick={onSlashPick} onClose={onSlashClose} />}
      </div>
      <InsertButton
        label={`Insert a block after block ${index + 1}`}
        onPick={(type) => onInsert(type)}
      />
    </Reorder.Item>
  );
}

// Typing `/` in an empty paragraph opens the insert menu there.
function SlashMenu({
  onPick,
  onClose,
}: {
  onPick: (type: BlockType) => void;
  onClose: () => void;
}) {
  return (
    <div className="relative">
      <InsertMenu label="Insert a block" onPick={onPick} onClose={onClose} />
    </div>
  );
}

// Below `md` the block toolbar is one "…" menu.
function BlockMenu({
  name,
  index,
  total,
  onMove,
  onDuplicate,
  onDelete,
}: {
  name: string;
  index: number;
  total: number;
  onMove: (to: number) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const key = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  const item =
    "flex h-11 w-full items-center gap-2 px-4 text-left text-body hover:bg-surface disabled:opacity-40";
  const run = (action: () => void) => () => {
    setOpen(false);
    action();
  };
  return (
    <span ref={root} className="relative ml-auto md:hidden">
      <IconButton
        label={`More: ${name} block`}
        iconKey="more"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Ellipsis className="size-5" />
      </IconButton>
      {open && (
        <div className="absolute top-full right-0 z-10 mt-1 w-44 overflow-hidden rounded-md border border-border/60 bg-surface-raised py-1 shadow-float-lifted">
          <button
            type="button"
            disabled={index === 0}
            onClick={run(() => onMove(index - 1))}
            className={item}
          >
            <ArrowUp className="size-4" aria-hidden="true" /> Move up
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={run(() => onMove(index + 1))}
            className={item}
          >
            <ArrowDown className="size-4" aria-hidden="true" /> Move down
          </button>
          <button type="button" onClick={run(onDuplicate)} className={item}>
            <Copy className="size-4" aria-hidden="true" /> Duplicate
          </button>
          <button
            type="button"
            onClick={run(onDelete)}
            className={cn(item, "text-danger")}
          >
            <Trash2 className="size-4" aria-hidden="true" /> Delete
          </button>
        </div>
      )}
    </span>
  );
}

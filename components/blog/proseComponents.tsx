import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { LANGS, type Lang } from "@/lib/i18n";
import { BLOCK_TEXT, type BlockText } from "@/lib/i18n/ui";
import type { CalloutType, Components } from "@/lib/blog/markdown";
import { TextLink } from "@/components/shared/TextLink";
import { Block } from "./blocks/Block";
import { Callout } from "./Callout";
import { CodeBlock } from "./CodeBlock";

// How each element of a post's markdown looks (design.md §13.29): plain
// components, so every colour and size is a token and nothing leans on a
// typography plugin. Inline code is styled by the Prose wrapper.

const first = "[&:not(:first-child)]:";

function Heading({
  as: Tag,
  linkLabel,
  className,
  id,
  children,
  ...rest
}: ComponentProps<"h2"> & {
  as: "h2" | "h3" | "h4";
  /** The accessible name of the "#" link ("Link to this heading"). */
  linkLabel: string;
}) {
  return (
    <Tag
      id={id}
      className={cn("group relative scroll-mt-24 text-foreground", className)}
      {...rest}
    >
      {id && (
        <a
          href={`#${id}`}
          aria-label={linkLabel}
          className="type-label absolute top-1/2 -left-6 hidden -translate-y-1/2 text-muted opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-visible:opacity-100 md:block"
        >
          #
        </a>
      )}
      {children}
    </Tag>
  );
}

function A({ href = "", children }: ComponentProps<"a">) {
  const external = /^https?:\/\//i.test(href);
  return (
    <TextLink variant="inline" href={href} external={external}>
      {children}
    </TextLink>
  );
}

function Table({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className="my-8 max-w-full overflow-x-auto outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <table className="w-full min-w-max border-collapse text-left text-[0.9375rem]">
        {children}
      </table>
    </div>
  );
}

function Figure({
  children,
  ...rest
}: ComponentProps<"figure"> & { "data-wide"?: string }) {
  const wide = rest["data-wide"] === "true";
  return (
    <figure
      className={cn(
        "my-10 [&_img]:w-full [&_img]:rounded-lg [&_img]:bg-tile",
        wide && "lg:w-[min(125%,calc(100vw-4rem))] lg:max-w-none",
      )}
    >
      {children}
    </figure>
  );
}

function PostCallout({
  "data-callout": type,
  "data-title": title,
  labels,
  children,
}: {
  "data-callout"?: string;
  "data-title"?: string;
  labels: Record<CalloutType, string>;
  children?: ReactNode;
}) {
  return (
    <Callout
      type={(type ?? "note") as CalloutType}
      title={title || undefined}
      labels={labels}
    >
      {children}
    </Callout>
  );
}

// The components of a language: only the few words they carry differ (the heading
// link, the table's name, the callout labels).
function buildComponents(t: BlockText): Components {
  const h2 = (props: ComponentProps<"h2">) => (
    <Heading
      as="h2"
      linkLabel={t.headingLink}
      className="mt-16 mb-4 text-[clamp(1.75rem,1.5rem+1.1vw,2.25rem)] leading-[1.15] font-semibold tracking-[-0.02em]"
      {...props}
    />
  );
  const h3 = (props: ComponentProps<"h3">) => (
    <Heading
      as="h3"
      linkLabel={t.headingLink}
      className="mt-10 mb-3 text-h3"
      {...props}
    />
  );
  const h4 = (props: ComponentProps<"h4">) => (
    <Heading
      as="h4"
      linkLabel={t.headingLink}
      className="mt-8 mb-2 text-body font-semibold"
      {...props}
    />
  );
  const labels = { note: t.note, tip: t.tip, warning: t.warning };
  return {
    p: (props: ComponentProps<"p">) => (
      <p
        className={`text-body leading-[1.7] text-foreground ${first}mt-6`}
        {...props}
      />
    ),
    h2,
    h3,
    h4,
    a: A,
    ul: (props: ComponentProps<"ul">) => (
      <ul
        className={`my-6 ml-6 list-disc space-y-2 text-body leading-[1.7] marker:text-muted [&_ol]:mt-2 [&_ul]:mt-2 [&_ul]:ml-4`}
        {...props}
      />
    ),
    ol: (props: ComponentProps<"ol">) => (
      <ol
        className="my-6 ml-6 list-decimal space-y-2 text-body leading-[1.7] marker:text-muted [&_ol]:mt-2 [&_ol]:ml-4 [&_ul]:mt-2"
        {...props}
      />
    ),
    blockquote: (props: ComponentProps<"blockquote">) => (
      <blockquote
        className="my-8 border-l-2 border-border pl-5 text-foreground/80 italic [&>p]:mt-0 [&>p+p]:mt-4"
        {...props}
      />
    ),
    hr: () => <hr className="my-12 border-border" />,
    strong: (props: ComponentProps<"strong">) => (
      <strong className="font-semibold" {...props} />
    ),
    table: (props: ComponentProps<"table">) => (
      <Table label={t.table}>{props.children}</Table>
    ),
    th: (props: ComponentProps<"th">) => (
      <th
        className="type-label border-b border-border px-4 py-3 text-muted"
        {...props}
      />
    ),
    td: (props: ComponentProps<"td">) => (
      <td className="border-b border-border px-4 py-3 align-top" {...props} />
    ),
    figure: Figure,
    img: ({ alt = "", ...props }: ComponentProps<"img">) => (
      // eslint-disable-next-line @next/next/no-img-element -- addresses come from the post
      <img alt={alt} loading="lazy" decoding="async" {...props} />
    ),
    figcaption: (props: ComponentProps<"figcaption">) => (
      <figcaption className="mt-3 text-sm text-muted" {...props} />
    ),
    pre: CodeBlock,
    aside: (props: ComponentProps<"aside">) => (
      <PostCallout {...(props as Record<string, string>)} labels={labels} />
    ),
    "x-block": Block,
  } as unknown as Components;
}

const BY_LANG = Object.fromEntries(
  LANGS.map((lang) => [lang, buildComponents(BLOCK_TEXT[lang])]),
) as Record<Lang, Components>;

/** How a post's markdown looks, with the words of `lang`. */
export const proseComponentsFor = (lang: Lang): Components => BY_LANG[lang];

/** The English components (the admin's preview). */
export const proseComponents: Components = BY_LANG.en;

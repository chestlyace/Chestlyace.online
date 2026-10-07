"use client";

import { ChevronDown } from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/shared/Button";
import { FormField, fieldControl } from "@/components/shared/FormField";
import { siteUrl } from "@/lib/sites";
import type { PostDetails as Details } from "@/lib/admin/blogForm";
import type { FieldDef } from "@/lib/admin/config";
import { cn } from "@/lib/cn";
import { AdminField } from "../fields";

type Errors = Record<string, string | undefined>;

const FIELDS: Record<string, FieldDef> = {
  slug: {
    type: "slug",
    name: "slug",
    label: "Address",
    from: "title",
    prefix: `${siteUrl("blog", "/").replace(/^https?:\/\//, "")}`,
  },
  description: {
    type: "long",
    name: "description",
    label: "Description",
    max: 300,
    helper: "Shown in the list, in search results and when the post is shared.",
  },
  tags: {
    type: "tags",
    name: "tags",
    label: "Tags",
    itemLabel: "tag",
    max: 8,
    optional: true,
    helper: "Lowercase, with hyphens: web-dev. Up to 8.",
  },
  coverUrl: {
    type: "image",
    name: "coverUrl",
    label: "Cover",
    use: "blog",
    optional: true,
  },
  publishedAt: {
    type: "date",
    name: "publishedAt",
    label: "Published date",
    optional: true,
    helper: "Set when the post goes live. Change it to back-date a post.",
  },
  commentsEnabled: {
    type: "switch",
    name: "commentsEnabled",
    label: "Comments",
    helper: "Readers can comment when this is on.",
  },
  canonicalUrl: {
    type: "url",
    name: "canonicalUrl",
    label: "Canonical address",
    optional: true,
    helper: "Only if the post was first published somewhere else.",
  },
  series: {
    type: "text",
    name: "series",
    label: "Series",
    max: 80,
    optional: true,
  },
};

// The post's details (design.md §13.48): the title, description, address, tags,
// cover and a Settings disclosure. Every field is an admin field (§13.21).
export function PostDetails({
  details,
  errors,
  onChange,
}: {
  details: Details;
  errors: Errors;
  onChange: <K extends keyof Details>(name: K, value: Details[K]) => void;
}) {
  const id = useId();
  const field = (name: keyof typeof FIELDS & keyof Details) => (
    <AdminField
      field={FIELDS[name]}
      value={details[name] as string | boolean | string[]}
      error={errors[name]}
      onChange={(value) => onChange(name, value as never)}
      onBlur={() => {}}
    />
  );

  return (
    <div className="grid gap-6">
      <FormField id="post-title" label="Title" error={errors.title}>
        <input
          id="post-title"
          value={details.title}
          maxLength={200}
          autoComplete="off"
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? "post-title-error" : undefined}
          onChange={(event) => onChange("title", event.target.value)}
          placeholder="A title worth clicking"
          className={cn(fieldControl, "h-14 px-4 text-[1.5rem] font-semibold")}
        />
      </FormField>
      {field("slug")}
      <div id="post-description">{field("description")}</div>
      {field("tags")}
      <div className="grid gap-4">
        {field("coverUrl")}
        {details.coverUrl ? (
          <>
            <FormField
              id={`${id}-cover-alt`}
              label="Cover description"
              optional
              helper="For people who can't see the image."
              error={errors.coverAlt}
            >
              <input
                id={`${id}-cover-alt`}
                value={details.coverAlt}
                onChange={(event) => onChange("coverAlt", event.target.value)}
                className={cn(fieldControl, "h-12 px-4")}
              />
            </FormField>
            <div>
              <Button
                variant="ghost"
                size="sm"
                magnetic={false}
                onClick={() => {
                  onChange("coverUrl", "");
                  onChange("coverAlt", "");
                }}
              >
                Use a generated cover
              </Button>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted">
            No cover: the blog shows a generated one.
          </p>
        )}
      </div>

      <details className="group rounded-lg bg-surface">
        <summary className="flex h-12 cursor-pointer list-none items-center justify-between rounded-lg px-4 text-body font-medium text-foreground [&::-webkit-details-marker]:hidden">
          Settings
          <ChevronDown
            className="size-5 text-muted transition-transform duration-200 group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <div className="grid gap-6 p-4 pt-2">
          {field("publishedAt")}
          {field("commentsEnabled")}
          {field("canonicalUrl")}
          {field("series")}
        </div>
      </details>
    </div>
  );
}

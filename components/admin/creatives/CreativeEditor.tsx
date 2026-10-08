"use client";

import { CircleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import type { FieldDef } from "@/lib/admin/config";
import {
  emptyEvent,
  emptyPiece,
  eventBody,
  eventProblems,
  pieceBody,
  pieceProblems,
  serverProblems,
  type Credit,
  type EventForm,
  type PieceForm,
} from "@/lib/admin/creativesForm";
import { slugify } from "@/lib/admin/order";
import { CREATIVES_RESOURCES } from "@/lib/admin/resources";
import { AdminField } from "../fields";
import { SaveBar } from "../SaveBar";
import { useConfirm } from "../ConfirmDialog";
import { useToast } from "../Toast";
import { useUnsavedChanges } from "../UnsavedGuard";
import { CoverField, PictureList } from "./CreativeImages";
import { CreditsField } from "./CreditsField";

// The editor of a design piece or a photography event (design.md §14.26): the text
// fields of the other editors (§13.21), the cover, the pictures, and for an event
// its credits and album link. Checked when you save, with the problem shown where it
// is; the API checks again. Saving a new one opens it for editing.

type Kind = "design" | "photography";
type Form = PieceForm & Partial<Pick<EventForm, "credits">>;

const SHOW: FieldDef[] = [
  {
    type: "switch",
    name: "isFeatured",
    label: "Featured",
    helper: "Also shown on the home page.",
  },
  {
    type: "switch",
    name: "isPublished",
    label: "Published",
    helper: "Off keeps it off the site without deleting it.",
  },
];

const DESIGN_FIELDS: FieldDef[] = [
  { type: "text", name: "title", label: "Title", max: 120 },
  {
    type: "slug",
    name: "slug",
    label: "Address",
    from: "title",
    prefix: "design/",
  },
  {
    type: "text",
    name: "category",
    label: "Category",
    max: 40,
    placeholder: "Brand identity",
    helper: "Pieces with the same category are grouped under one filter.",
  },
  {
    type: "text",
    name: "year",
    label: "Year",
    max: 4,
    optional: true,
    placeholder: "2026",
  },
  { type: "text", name: "client", label: "Client", max: 80, optional: true },
  { type: "text", name: "role", label: "Your role", max: 80, optional: true },
  {
    type: "tags",
    name: "tools",
    label: "Tools",
    itemLabel: "tool",
    max: 12,
    optional: true,
    helper: "Figma, Photoshop, Illustrator…",
  },
  {
    type: "url",
    name: "linkUrl",
    label: "Link",
    optional: true,
    helper: "A page about the project.",
  },
  {
    type: "long",
    name: "description",
    label: "Description",
    max: 3000,
    optional: true,
  },
];

const EVENT_FIELDS: FieldDef[] = [
  { type: "text", name: "title", label: "Title", max: 120 },
  {
    type: "slug",
    name: "slug",
    label: "Address",
    from: "title",
    prefix: "photography/",
  },
  { type: "date", name: "eventDate", label: "Date" },
  {
    type: "text",
    name: "place",
    label: "Place",
    max: 80,
    optional: true,
    placeholder: "Yaoundé, Cameroon",
  },
  {
    type: "text",
    name: "kind",
    label: "Kind of event",
    max: 30,
    optional: true,
    placeholder: "Conference",
  },
  {
    type: "text",
    name: "role",
    label: "Your role",
    max: 80,
    optional: true,
    placeholder: "Event photographer",
  },
  {
    type: "tags",
    name: "covered",
    label: "What you covered",
    itemLabel: "tag",
    max: 8,
    optional: true,
    helper: "Photography, Portraits, Videography…",
  },
  {
    type: "long",
    name: "description",
    label: "Story",
    max: 3000,
    optional: true,
  },
];

const ALBUM_FIELDS: FieldDef[] = [
  {
    type: "url",
    name: "albumUrl",
    label: "Full album address",
    optional: true,
    helper:
      "Google Photos, Google Drive or Behance. Shown as a “View the full album” button.",
  },
  {
    type: "text",
    name: "albumLabel",
    label: "Name of that service",
    max: 40,
    optional: true,
    placeholder: "Google Photos",
  },
];

const same = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);

function Section({
  title,
  helper,
  error,
  children,
}: {
  title?: string;
  helper?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className={title ? "mt-10 border-t border-border pt-6" : undefined}>
      {title && <h2 className="mb-1 text-h3">{title}</h2>}
      {helper && <p className="mb-5 text-sm text-muted">{helper}</p>}
      {!helper && title && <div className="mb-5" />}
      <div className="flex flex-col gap-6">{children}</div>
      {error && (
        <p
          role="alert"
          className="mt-3 flex items-start gap-1.5 text-sm text-danger"
        >
          <CircleAlert
            className="mt-0.5 size-3.5 shrink-0"
            aria-hidden="true"
          />
          {error}
        </p>
      )}
    </div>
  );
}

export function CreativeEditor({
  kind,
  itemId,
  initial,
}: {
  kind: Kind;
  itemId?: number;
  initial?: Form;
}) {
  const resource = CREATIVES_RESOURCES.find((r) => r.id === kind)!;
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const design = kind === "design";
  const start: Form = initial ?? (design ? emptyPiece() : emptyEvent());

  const [form, setForm] = useState<Form>(start);
  const [saved, setSaved] = useState<Form>(start);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedRecently, setSavedRecently] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(itemId));
  const formRef = useRef<HTMLFormElement>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const dirty = !same(form, saved);
  useUnsavedChanges(dirty);

  const body = () => (design ? pieceBody(form) : eventBody(form as EventForm));
  const check = () =>
    design ? pieceProblems(form) : eventProblems(form as EventForm);

  const setField = (name: string, value: string | boolean | string[]) => {
    const fields = { ...form.fields, [name]: value };
    if (name === "slug") setSlugTouched(true);
    else if (name === "title" && !slugTouched && typeof value === "string")
      fields.slug = slugify(value);
    setForm({ ...form, fields });
    if (errors[name])
      setErrors(({ [name]: _gone, ...rest }) => (void _gone, rest));
  };

  const clearError = (key: string) =>
    setErrors(({ [key]: _gone, ...rest }) => (void _gone, rest));

  const focusFirst = (found: Record<string, string>) => {
    const order = [
      ...(design ? DESIGN_FIELDS : EVENT_FIELDS).map((f) => f.name),
      "cover",
      "images",
      "credits",
      ...ALBUM_FIELDS.map((f) => f.name),
    ];
    const first = order.find((name) => found[name]);
    if (!first) return;
    const target =
      formRef.current?.querySelector<HTMLElement>(
        `[name="${first}"], [id^="field-${first}-"]`,
      ) ??
      formRef.current?.querySelector<HTMLElement>(`[data-section="${first}"]`);
    target?.scrollIntoView({ block: "center" });
    target?.focus?.();
  };

  const cancel = async () => {
    if (
      dirty &&
      !(await confirm({
        title: "Leave without saving?",
        text: "Your changes to this entry will be lost.",
        confirmLabel: "Discard changes",
        tone: "primary",
      }))
    )
      return;
    setSaved(form);
    router.push(resource.href);
  };

  const save = async (event?: FormEvent) => {
    event?.preventDefault();
    if (saving || !dirty) return;
    const found = check();
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) {
      focusFirst(found);
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(
        itemId
          ? `/api/admin/${resource.api}/${itemId}`
          : `/api/admin/${resource.api}`,
        {
          method: itemId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body()),
        },
      );
      const result = (await response.json().catch(() => ({}))) as {
        item?: { id: number };
        fields?: Record<string, string>;
      };
      if (response.ok) {
        setSaved(form);
        toast.success(
          form.fields.isPublished
            ? "Saved. It's live on the site."
            : "Saved. It's a draft, so it isn't on the site yet.",
        );
        if (itemId) {
          setSavedRecently(true);
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(
            () => setSavedRecently(false),
            3000,
          );
          router.refresh();
        } else if (result.item) {
          router.replace(`${resource.href}/${result.item.id}`);
        }
      } else if (response.status === 401) {
        toast.error("Your session ended. Sign in again.");
        router.replace(
          `/login?reason=expired&next=${encodeURIComponent(window.location.pathname)}`,
        );
      } else if (response.status === 422 && result.fields) {
        const { _: general, ...rest } = serverProblems(result.fields);
        setErrors(rest);
        setFormError(general ?? null);
        focusFirst(rest);
      } else {
        setFormError("Couldn't save. Check your connection and try again.");
      }
    } catch {
      setFormError("Couldn't save. Check your connection and try again.");
    }
    setSaving(false);
  };

  const fieldsOf = (defs: FieldDef[]) =>
    defs.map((field) => (
      <AdminField
        key={field.name}
        field={
          field.type === "slug" && itemId
            ? {
                ...field,
                helper: "Changing the address breaks links to the old one.",
              }
            : field
        }
        value={form.fields[field.name]}
        error={errors[field.name]}
        onChange={(value) => setField(field.name, value)}
        onBlur={() => undefined}
      />
    ));

  return (
    <form
      ref={formRef}
      onSubmit={save}
      noValidate
      aria-label={itemId ? `Edit ${resource.noun}` : `New ${resource.noun}`}
      onKeyDown={(event) => {
        if (
          (event.metaKey || event.ctrlKey) &&
          event.key.toLowerCase() === "s"
        ) {
          event.preventDefault();
          void save();
        }
      }}
      className="max-w-[45rem] pb-28"
    >
      {formError && (
        <p
          role="alert"
          className="mb-6 flex items-start gap-2 rounded-lg bg-surface-raised p-4 text-sm text-danger"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {formError}
        </p>
      )}

      <Section>{fieldsOf(design ? DESIGN_FIELDS : EVENT_FIELDS)}</Section>

      <Section
        title="Cover"
        helper={
          design
            ? "The picture shown in the gallery."
            : "The picture on the events page and at the top of the event."
        }
        error={errors.cover}
      >
        <div data-section="cover" tabIndex={-1}>
          <CoverField
            cover={form.cover}
            alt={form.coverAlt}
            error={errors.cover}
            onCover={(cover) => {
              setForm({ ...form, cover });
              clearError("cover");
            }}
            onAlt={(coverAlt) => {
              setForm({ ...form, coverAlt });
              clearError("cover");
            }}
          />
        </div>
      </Section>

      <Section
        title={design ? "More images" : "Pictures"}
        helper={
          design
            ? "Other views of the piece, shown in its lightbox. Up to 12."
            : "The pictures you picked from the event. The rest are in the full album. Up to 60."
        }
        error={errors.images}
      >
        <div data-section="images" tabIndex={-1}>
          <PictureList
            pictures={form.images}
            max={design ? 12 : 60}
            captions={!design}
            onChange={(images) => {
              setForm({ ...form, images });
              clearError("images");
            }}
          />
        </div>
      </Section>

      {!design && (
        <>
          <Section
            title="Credits"
            helper="Who made it happen, in the order they are shown. Yours goes last."
            error={errors.credits}
          >
            <div data-section="credits" tabIndex={-1}>
              <CreditsField
                credits={(form as EventForm).credits}
                onChange={(credits: Credit[]) => {
                  setForm({ ...form, credits } as Form);
                  clearError("credits");
                }}
              />
            </div>
          </Section>
          <Section title="Full album">{fieldsOf(ALBUM_FIELDS)}</Section>
        </>
      )}

      <Section title="On the site">{fieldsOf(SHOW)}</Section>

      <SaveBar
        dirty={dirty}
        saving={saving}
        savedRecently={savedRecently}
        onCancel={cancel}
      />
    </form>
  );
}

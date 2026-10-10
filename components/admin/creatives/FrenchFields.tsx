"use client";

import { FormField, fieldControl } from "@/components/shared/FormField";
import type { FieldDef } from "@/lib/admin/config";
import type { Credit, FrenchValues, Picture } from "@/lib/admin/creativesForm";
import { TRANSLATION_LIMITS } from "@/lib/i18n/translatable";
import { cn } from "@/lib/cn";
import { AdminField } from "../fields";

// The French side of a design piece's or an event's editor (docs/i18n.md §5, §10): each
// translatable text field beside its English, the cover's description, each picture's
// description (and caption, for an event) and each credit's role. Anything left empty
// shows the English on the French site.

const hint = (value: unknown) =>
  typeof value === "string" ? value.replace(/\s+/g, " ").slice(0, 120) : "";

export function FrenchFields({
  defs,
  english,
  french,
  onField,
  coverAlt,
  images,
  credits,
  captions,
  errors,
  onImages,
  onCredits,
}: {
  /** The editor's English field definitions: the ones with a French version are shown. */
  defs: FieldDef[];
  /** The names that have a French version (lib/i18n/translatable.ts). */
  english: Record<string, string | boolean | string[]>;
  french: FrenchValues;
  onField: (name: string, value: string | string[]) => void;
  coverAlt: string;
  images: Picture[];
  credits?: Credit[];
  captions: boolean;
  errors: Record<string, string | undefined>;
  onImages: (images: Picture[]) => void;
  onCredits?: (credits: Credit[]) => void;
}) {
  const textareaLike = (
    id: string,
    label: string,
    value: string,
    placeholder: string,
    set: (value: string) => void,
    max: number,
  ) => (
    <FormField
      id={id}
      label={label}
      optional
      helper="Empty: the English is shown."
    >
      <input
        id={id}
        name={id}
        lang="fr"
        value={value}
        maxLength={max}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(event) => set(event.target.value)}
        className={cn(fieldControl, "h-12 px-4")}
      />
    </FormField>
  );

  return (
    <section
      id="creative-french"
      aria-label="French version"
      className="flex flex-col gap-6"
    >
      {errors.french && (
        <p role="alert" className="text-sm text-danger">
          {errors.french}
        </p>
      )}
      {defs.map((def) => {
        const value = french[def.name];
        const limit =
          def.type === "long"
            ? TRANSLATION_LIMITS.long
            : TRANSLATION_LIMITS.text;
        return (
          <AdminField
            key={def.name}
            field={
              {
                ...def,
                name: `fr:${def.name}`,
                optional: true,
                helper: "Empty: the English is shown.",
                ...(def.type === "text" || def.type === "long"
                  ? { max: limit, placeholder: hint(english[def.name]) }
                  : {}),
              } as FieldDef
            }
            value={value ?? (def.type === "tags" ? [] : "")}
            error={errors[`fr:${def.name}`]}
            onChange={(next) => onField(def.name, next as string | string[])}
            onBlur={() => undefined}
          />
        );
      })}

      {textareaLike(
        "fr:coverAlt",
        "Cover description (French)",
        (french.coverAlt as string) ?? "",
        coverAlt,
        (value) => onField("coverAlt", value),
        300,
      )}

      {images.length > 0 && (
        <div className="grid gap-4">
          <h2 className="text-h3">Pictures</h2>
          {images.map((picture, index) => (
            <div
              key={picture.url}
              className="grid gap-3 rounded-lg bg-surface p-4"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary thumbnail */}
              <img
                src={picture.url}
                alt=""
                className="h-16 w-24 rounded-sm object-cover"
              />
              {textareaLike(
                `fr:image-${index}-alt`,
                `Picture ${index + 1} description (French)`,
                picture.altFr ?? "",
                picture.alt,
                (value) =>
                  onImages(
                    images.map((p, i) =>
                      i === index ? { ...p, altFr: value } : p,
                    ),
                  ),
                200,
              )}
              {captions &&
                textareaLike(
                  `fr:image-${index}-caption`,
                  `Picture ${index + 1} caption (French)`,
                  picture.captionFr ?? "",
                  picture.caption ?? "",
                  (value) =>
                    onImages(
                      images.map((p, i) =>
                        i === index ? { ...p, captionFr: value } : p,
                      ),
                    ),
                  200,
                )}
            </div>
          ))}
        </div>
      )}

      {credits && credits.length > 0 && onCredits && (
        <div className="grid gap-4">
          <h2 className="text-h3">Credits</h2>
          {credits.map((credit, index) =>
            textareaLike(
              `fr:credit-${index}-role`,
              `${credit.name || `Credit ${index + 1}`}: role (French)`,
              credit.roleFr ?? "",
              credit.role,
              (value) =>
                onCredits(
                  credits.map((c, i) =>
                    i === index ? { ...c, roleFr: value } : c,
                  ),
                ),
              60,
            ),
          )}
        </div>
      )}
    </section>
  );
}

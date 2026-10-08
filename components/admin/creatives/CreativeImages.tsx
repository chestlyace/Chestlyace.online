"use client";

import { ArrowDown, ArrowUp, ImagePlus, Trash2, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type DragEvent } from "react";
import { Button } from "@/components/shared/Button";
import { fieldControl } from "@/components/shared/FormField";
import { IconButton } from "@/components/shared/IconButton";
import { thumbnailUrl } from "@/lib/cloudinary";
import type { Cover, Picture } from "@/lib/admin/creativesForm";
import {
  UploadError,
  checkFile,
  limitsText,
  uploadFile,
} from "@/lib/admin/upload";
import { cn } from "@/lib/cn";
import { moved, replaced } from "../blog/formParts";

// The images of a design piece or an event (design.md §14.26): upload to Cloudinary
// (many at once), see each, describe it, put them in order. Each image is saved with
// its pixel size so the public gallery can reserve its space. Nothing is saved until
// the entry is.

type Job = { id: number; name: string; fraction: number; error?: string };

const small = cn(fieldControl, "h-10 px-3 text-[0.9375rem]");

// Uploads files one after the other and hands each result over.
function useUploads(
  onDone: (image: { url: string; width: number; height: number }) => void,
) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const counter = useRef(0);
  // Uploads finish later: they hand over to the latest callback, not the one from
  // when the file was added.
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });
  const queue = useRef(Promise.resolve());

  const add = (files: File[]) => {
    for (const file of files) {
      const id = ++counter.current;
      const problem = checkFile(file, "creatives");
      if (problem) {
        setJobs((j) => [
          ...j,
          { id, name: file.name, fraction: 0, error: problem },
        ]);
        continue;
      }
      setJobs((j) => [...j, { id, name: file.name, fraction: 0 }]);
      queue.current = queue.current.then(async () => {
        try {
          const result = await uploadFile(file, "creatives", (fraction) =>
            setJobs((j) =>
              j.map((x) => (x.id === id ? { ...x, fraction } : x)),
            ),
          );
          const size =
            result.width && result.height
              ? { width: result.width, height: result.height }
              : await measure(file);
          done.current({ url: result.url, ...size });
          setJobs((j) => j.filter((x) => x.id !== id));
        } catch (error) {
          const message =
            error instanceof UploadError
              ? error.message
              : "Upload failed — try again.";
          setJobs((j) =>
            j.map((x) => (x.id === id ? { ...x, error: message } : x)),
          );
        }
      });
    }
  };
  const dismiss = (id: number) => setJobs((j) => j.filter((x) => x.id !== id));
  return { jobs, add, dismiss };
}

// The pixel size of a file the browser can read, for when Cloudinary doesn't say.
function measure(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: 1, height: 1 });
    };
    image.src = url;
  });
}

function Dropzone({
  multiple,
  disabled,
  onFiles,
  jobs,
  onDismiss,
  label,
}: {
  multiple: boolean;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
  jobs: Job[];
  onDismiss: (id: number) => void;
  label: string;
}) {
  const uid = useId();
  const chooser = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const pick = (list: FileList | null) => {
    const files = Array.from(list ?? []);
    if (files.length) onFiles(multiple ? files : files.slice(0, 1));
    if (chooser.current) chooser.current.value = "";
  };
  const drop = (event: DragEvent) => {
    event.preventDefault();
    setOver(false);
    if (!disabled) pick(event.dataTransfer.files);
  };

  return (
    <div>
      <div
        role="group"
        aria-label={label}
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={drop}
        className={cn(
          "flex min-h-28 flex-col items-center justify-center gap-1 rounded-md border border-dashed bg-surface px-4 py-5 text-center transition-colors duration-150",
          over ? "border-primary bg-primary/6" : "border-border",
        )}
      >
        <ImagePlus className="size-6 text-muted" aria-hidden="true" />
        <p className="text-body text-foreground">
          Drop {multiple ? "images" : "an image"} here or{" "}
          <button
            type="button"
            disabled={disabled}
            onClick={() => chooser.current?.click()}
            className="link-inline rounded-sm font-medium disabled:opacity-50"
          >
            choose {multiple ? "some" : "one"}
          </button>
        </p>
        <p className="text-sm text-muted">{limitsText("creatives")}</p>
        <input
          ref={chooser}
          id={`${uid}-files`}
          type="file"
          multiple={multiple}
          accept=".jpg,.jpeg,.png,.webp,.avif"
          tabIndex={-1}
          aria-hidden="true"
          className="hidden"
          onChange={(event) => pick(event.target.files)}
        />
      </div>
      {jobs.length > 0 && (
        <ul className="mt-3 grid gap-2" aria-label="Uploads">
          {jobs.map((job) => (
            <li
              key={job.id}
              className="rounded-md bg-(--field-fill,var(--tile)) px-3 py-2 shadow-[inset_0_0_0_1px_var(--border)]"
            >
              <div className="flex items-center justify-between gap-3">
                <p
                  className={cn(
                    "min-w-0 truncate text-sm",
                    job.error ? "text-danger" : "text-foreground",
                  )}
                >
                  {job.name}
                  {job.error ? ` — ${job.error}` : ""}
                </p>
                {job.error && (
                  <button
                    type="button"
                    aria-label={`Dismiss ${job.name}`}
                    onClick={() => onDismiss(job.id)}
                    className="grid size-6 shrink-0 place-items-center rounded-full text-muted hover:text-foreground"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                )}
              </div>
              {!job.error && (
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-150 ease-linear motion-reduce:transition-none"
                    style={{ width: `${Math.round(job.fraction * 100)}%` }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---- the cover -------------------------------------------------------------------

export function CoverField({
  cover,
  alt,
  onCover,
  onAlt,
  error,
}: {
  cover: Cover | null;
  alt: string;
  onCover: (cover: Cover | null) => void;
  onAlt: (alt: string) => void;
  error?: string;
}) {
  const uid = useId();
  const uploads = useUploads((image) => onCover(image));
  const chooser = useRef<HTMLInputElement>(null);

  return (
    <div>
      {cover ? (
        <div className="rounded-md bg-(--field-fill,var(--tile)) p-3 shadow-[inset_0_0_0_1px_var(--border)]">
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary thumbnail */}
            <img
              src={thumbnailUrl(cover.url, 360)}
              alt=""
              className="h-32 w-48 shrink-0 rounded-sm bg-surface object-cover"
            />
            <div className="min-w-0 flex-1">
              <label
                htmlFor={`${uid}-alt`}
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Describe the cover
              </label>
              <input
                id={`${uid}-alt`}
                value={alt}
                onChange={(event) => onAlt(event.target.value)}
                aria-invalid={error && !alt.trim() ? true : undefined}
                className={small}
              />
              <p className="mt-1.5 text-sm text-muted">
                {cover.width} × {cover.height} px. For people who can&apos;t see
                it.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  magnetic={false}
                  onClick={() => chooser.current?.click()}
                >
                  Replace
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  magnetic={false}
                  onClick={() => onCover(null)}
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>
          <input
            ref={chooser}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.avif"
            tabIndex={-1}
            aria-hidden="true"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) uploads.add([file]);
              event.target.value = "";
            }}
          />
        </div>
      ) : (
        <Dropzone
          multiple={false}
          label="Upload the cover"
          onFiles={uploads.add}
          jobs={uploads.jobs}
          onDismiss={uploads.dismiss}
        />
      )}
      {cover && uploads.jobs.length > 0 && (
        <p className="mt-2 text-sm text-muted" role="status">
          Uploading the new cover…
        </p>
      )}
    </div>
  );
}

// ---- the pictures ------------------------------------------------------------------

export function PictureList({
  pictures,
  onChange,
  max,
  captions,
}: {
  pictures: Picture[];
  onChange: (pictures: Picture[]) => void;
  max: number;
  /** Events keep a caption for each picture; design pieces do not. */
  captions: boolean;
}) {
  const latest = useRef(pictures);
  useEffect(() => {
    latest.current = pictures;
  });
  const uploads = useUploads((image) => {
    if (latest.current.length >= max) return;
    const next = [...latest.current, { ...image, alt: "" }];
    latest.current = next;
    onChange(next);
  });
  const uid = useId();

  return (
    <div>
      {pictures.length > 0 && (
        <ol className="mb-4 grid gap-2">
          {pictures.map((picture, index) => (
            <li
              key={`${picture.url}-${index}`}
              className="flex gap-3 rounded-md bg-(--field-fill,var(--tile)) p-2 shadow-[inset_0_0_0_1px_var(--border)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary thumbnail */}
              <img
                src={thumbnailUrl(picture.url, 160)}
                alt=""
                className="size-20 shrink-0 rounded-sm bg-surface object-cover"
              />
              <div className="grid min-w-0 flex-1 gap-2">
                <div>
                  <label htmlFor={`${uid}-alt-${index}`} className="sr-only">
                    Describe picture {index + 1}
                  </label>
                  <input
                    id={`${uid}-alt-${index}`}
                    placeholder="Describe this picture"
                    value={picture.alt}
                    onChange={(event) =>
                      onChange(
                        replaced(pictures, index, {
                          ...picture,
                          alt: event.target.value,
                        }),
                      )
                    }
                    className={small}
                  />
                </div>
                {captions && (
                  <div>
                    <label htmlFor={`${uid}-cap-${index}`} className="sr-only">
                      Caption for picture {index + 1} (optional)
                    </label>
                    <input
                      id={`${uid}-cap-${index}`}
                      placeholder="Caption (optional)"
                      value={picture.caption ?? ""}
                      onChange={(event) =>
                        onChange(
                          replaced(pictures, index, {
                            ...picture,
                            caption: event.target.value,
                          }),
                        )
                      }
                      className={small}
                    />
                  </div>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-center">
                <IconButton
                  label={`Move picture ${index + 1} up`}
                  iconKey={`up-${index}`}
                  disabled={index === 0}
                  onClick={() => onChange(moved(pictures, index, index - 1))}
                >
                  <ArrowUp className="size-[1.125rem]" />
                </IconButton>
                <IconButton
                  label={`Move picture ${index + 1} down`}
                  iconKey={`down-${index}`}
                  disabled={index === pictures.length - 1}
                  onClick={() => onChange(moved(pictures, index, index + 1))}
                >
                  <ArrowDown className="size-[1.125rem]" />
                </IconButton>
                <IconButton
                  label={`Remove picture ${index + 1}`}
                  iconKey={`remove-${index}`}
                  onClick={() =>
                    onChange(pictures.filter((_, i) => i !== index))
                  }
                  className="hover:text-danger focus-visible:text-danger"
                >
                  <Trash2 className="size-[1.125rem]" />
                </IconButton>
              </div>
            </li>
          ))}
        </ol>
      )}
      {pictures.length < max ? (
        <Dropzone
          multiple
          label="Upload pictures"
          onFiles={uploads.add}
          jobs={uploads.jobs}
          onDismiss={uploads.dismiss}
        />
      ) : (
        <p className="text-sm text-muted">That is the most ({max}).</p>
      )}
      <p className="mt-2 text-sm text-muted" aria-live="polite">
        {pictures.length} of {max}
      </p>
    </div>
  );
}

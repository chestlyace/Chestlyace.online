"use client";

import { ImagePlus, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type DragEvent } from "react";
import { UPLOAD_RULES, type UploadUse } from "@/lib/cloudinary";
import {
  UploadError,
  checkFile,
  limitsText,
  uploadFile,
} from "@/lib/admin/upload";
import { cn } from "@/lib/cn";

// Uploading several pictures at once (design.md §13.22): drop them or choose them, they
// go to Cloudinary one after the other with a progress line each, and every finished
// one is handed over in the order it was chosen. Used by the creatives' pictures and the
// projects' gallery. Nothing is saved until the entry is.

const acceptFor = (use: UploadUse) =>
  UPLOAD_RULES[use].formats
    .flatMap((format) =>
      format === "jpg" ? [".jpg", ".jpeg"] : [`.${format}`],
    )
    .join(",");

export type Job = {
  id: number;
  name: string;
  fraction: number;
  error?: string;
};

// Uploads files one after the other and hands each result over.
export function useUploads(
  use: UploadUse,
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
      const problem = checkFile(file, use);
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
          const result = await uploadFile(file, use, (fraction) =>
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

export function Dropzone({
  use,
  multiple,
  disabled,
  onFiles,
  jobs,
  onDismiss,
  label,
}: {
  use: UploadUse;
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
        <p className="text-sm text-muted">{limitsText(use)}</p>
        <input
          ref={chooser}
          id={`${uid}-files`}
          type="file"
          multiple={multiple}
          accept={acceptFor(use)}
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

"use client";

import { FileText, Upload } from "lucide-react";
import { useCallback, useId, useRef, useState, type DragEvent } from "react";
import { Button } from "@/components/shared/Button";
import { fieldControl } from "@/components/shared/FormField";
import { UPLOAD_RULES, type UploadUse } from "@/lib/cloudinary";
import {
  UploadError,
  checkFile,
  formatBytes,
  isPdf,
  limitsText,
  nameFromUrl,
  uploadFile,
} from "@/lib/admin/upload";
import { cn } from "@/lib/cn";
import { BrandLoader } from "@/components/shared/BrandLoader";

type Status =
  | { kind: "idle" }
  | { kind: "uploading"; name: string; fraction: number }
  | { kind: "error"; message: string; file?: File };

// A site path ("logos/a.png") is served from the site's root.
const previewSrc = (url: string) =>
  /^(https?:)?\/\//i.test(url) || url.startsWith("/") ? url : `/${url}`;

// Choosing an image or file for a field (design.md §13.22): drop it or pick it,
// watch it upload straight to Cloudinary, see it, replace or remove it. "Use an
// address instead" swaps in a plain address box. Changing the field changes
// nothing until the entry is saved.
export function UploadField({
  id,
  name,
  use,
  value,
  onChange,
  onBlur,
  invalid,
  describedBy,
  compact = false,
}: {
  id: string;
  name: string;
  use: UploadUse;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  invalid?: boolean;
  describedBy?: string;
  /** For the gallery: a shorter box. */
  compact?: boolean;
}) {
  const rule = UPLOAD_RULES[use];
  const accept = rule.formats
    .flatMap((format) =>
      format === "jpg" ? [".jpg", ".jpeg"] : [`.${format}`],
    )
    .join(",");
  const square = use === "logo" || use === "badge" || use === "icon";
  const uid = useId();

  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [addressMode, setAddressMode] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploaded, setUploaded] = useState<{
    url: string;
    name: string;
    bytes: number;
  } | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const chooser = useRef<HTMLInputElement>(null);
  const abort = useRef<AbortController | null>(null);
  const lastQuarter = useRef(0);

  const start = useCallback(
    async (file: File) => {
      const problem = checkFile(file, use);
      if (problem) {
        setStatus({ kind: "error", message: problem });
        return;
      }
      lastQuarter.current = 0;
      abort.current = new AbortController();
      setStatus({ kind: "uploading", name: file.name, fraction: 0 });
      setAnnouncement(`Uploading ${file.name}`);
      try {
        const result = await uploadFile(
          file,
          use,
          (fraction) => {
            setStatus({ kind: "uploading", name: file.name, fraction });
            const quarter = Math.floor(fraction * 4);
            if (quarter > lastQuarter.current) {
              lastQuarter.current = quarter;
              setAnnouncement(`${quarter * 25}% uploaded`);
            }
          },
          abort.current.signal,
        );
        setUploaded({
          url: result.url,
          name: result.name,
          bytes: result.bytes,
        });
        setStatus({ kind: "idle" });
        setAnnouncement(`${result.name} uploaded`);
        onChange(result.url);
      } catch (error) {
        if (error instanceof UploadError && error.code === "cancelled") {
          setStatus({ kind: "idle" });
          setAnnouncement("Upload cancelled");
          return;
        }
        const message =
          error instanceof UploadError
            ? error.message
            : "Upload failed — try again.";
        if (error instanceof UploadError && error.code === "not-configured") {
          // Nowhere to upload to: an address still works.
          setAddressMode(true);
          setStatus({
            kind: "error",
            message:
              "Uploads aren't set up yet (see the dashboard). You can paste an address instead.",
          });
        } else {
          setStatus({ kind: "error", message, file });
        }
        setAnnouncement(message);
      }
    },
    [use, onChange],
  );

  const pick = (files: FileList | null) => {
    const file = files?.[0];
    if (file) void start(file);
    if (chooser.current) chooser.current.value = "";
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    pick(event.dataTransfer.files);
  };

  const uploading = status.kind === "uploading";
  const retryFile = status.kind === "error" ? status.file : undefined;
  const hasValue = value.trim() !== "";
  const pdf = hasValue && (isPdf(value) || use === "resume");
  // What was just uploaded is only described while the field still holds it.
  const fresh = uploaded && uploaded.url === value ? uploaded : null;
  const fileName = fresh ? fresh.name : hasValue ? nameFromUrl(value) : "";

  const swap = (
    <button
      type="button"
      onClick={() => {
        setAddressMode((current) => !current);
        setStatus({ kind: "idle" });
      }}
      className="link-inline mt-2 rounded-sm text-sm text-muted"
    >
      {addressMode ? "Upload a file instead" : "Use an address instead"}
    </button>
  );

  const hiddenInput = (
    <input
      ref={chooser}
      id={`${id}-file-${uid.replace(/:/g, "")}`}
      type="file"
      accept={accept}
      tabIndex={-1}
      aria-hidden="true"
      className="hidden"
      onChange={(event) => pick(event.target.files)}
    />
  );

  const live = (
    <p role="status" aria-live="polite" className="sr-only">
      {announcement}
    </p>
  );

  if (addressMode) {
    return (
      <div>
        <input
          id={id}
          name={name}
          type="text"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="https://…"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          aria-describedby={describedBy}
          className={cn(fieldControl, "h-12 px-4")}
        />
        {status.kind === "error" && (
          <p className="mt-1.5 text-sm text-muted">{status.message}</p>
        )}
        {swap}
        {live}
      </div>
    );
  }

  if (uploading) {
    return (
      <div
        aria-busy="true"
        className="rounded-md bg-(--field-fill,var(--tile)) p-4 shadow-[inset_0_0_0_1px_var(--border)]"
      >
        <div className="flex items-center justify-between gap-4">
          <p className="flex min-w-0 items-center gap-2 truncate text-sm text-foreground">
            <BrandLoader size="sm" decorative />
            <span className="truncate">{status.name}</span>
          </p>
          <button
            type="button"
            onClick={() => abort.current?.abort()}
            className="link-inline rounded-sm text-sm text-muted"
          >
            Cancel
          </button>
        </div>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-150 ease-linear motion-reduce:transition-none"
            style={{ width: `${Math.round(status.fraction * 100)}%` }}
          />
        </div>
        {live}
      </div>
    );
  }

  if (hasValue) {
    return (
      <div>
        <div className="rounded-md bg-(--field-fill,var(--tile)) p-3 shadow-[inset_0_0_0_1px_var(--border)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div
              className={cn(
                "grid shrink-0 place-items-center overflow-hidden rounded-md bg-surface",
                pdf
                  ? "size-16"
                  : square
                    ? "size-24"
                    : compact
                      ? "h-20 w-36"
                      : "h-28 w-48",
              )}
            >
              {pdf ? (
                <FileText className="size-8 text-muted" aria-hidden="true" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- remote or site address, shown as is
                <img
                  src={previewSrc(value)}
                  alt=""
                  className="size-full object-contain"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {fileName}
              </p>
              <p className="text-sm text-muted">
                {fresh ? formatBytes(fresh.bytes) : "Already on the site"}
                {pdf && (
                  <>
                    {" · "}
                    <a
                      href={previewSrc(value)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-inline"
                    >
                      View<span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </>
                )}
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
                  onClick={() => {
                    setUploaded(null);
                    onChange("");
                  }}
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>
          {status.kind === "error" && (
            <p className="mt-3 text-sm text-danger">{status.message}</p>
          )}
        </div>
        {hiddenInput}
        {live}
        {swap}
      </div>
    );
  }

  return (
    <div>
      <div
        role="group"
        aria-label={`Upload ${name}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-1 rounded-md border border-dashed bg-surface px-4 text-center transition-colors duration-150",
          compact ? "min-h-24 py-4" : "min-h-36 py-6",
          dragging
            ? "border-primary bg-primary/6"
            : status.kind === "error" || invalid
              ? "border-danger"
              : "border-border",
        )}
      >
        <Upload className="size-6 text-muted" aria-hidden="true" />
        <p className="text-body text-foreground">
          Drop a file here or{" "}
          <button
            type="button"
            id={id}
            name={name}
            onClick={() => chooser.current?.click()}
            onBlur={onBlur}
            aria-describedby={describedBy}
            className="link-inline rounded-sm font-medium"
          >
            choose one
          </button>
        </p>
        <p className="text-sm text-muted">{limitsText(use)}</p>
      </div>
      {status.kind === "error" && (
        <p className="mt-2 flex flex-wrap items-center gap-x-3 text-sm text-danger">
          {status.message}
          {retryFile && (
            <button
              type="button"
              onClick={() => void start(retryFile)}
              className="link-inline rounded-sm"
            >
              Try again
            </button>
          )}
        </p>
      )}
      {hiddenInput}
      {live}
      {swap}
    </div>
  );
}

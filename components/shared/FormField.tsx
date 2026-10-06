import { CircleAlert } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

// Filled form fields (design.md §13.15): a soft fill, a faint inset edge, a
// label above. The same box for inputs, the textarea and the select.
export const fieldControl = cn(
  "block w-full rounded-md bg-(--field-fill,var(--tile)) text-[1.0625rem] text-foreground",
  "shadow-[inset_0_0_0_1px_var(--border)] placeholder:text-muted",
  "transition-shadow duration-150 ease-out",
  "[@media(hover:hover)]:not-disabled:not-aria-invalid:hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--muted)_50%,transparent)]",
  "focus-visible:shadow-none focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring",
  "aria-invalid:shadow-[inset_0_0_0_1px_var(--danger)]",
  "contrast-more:shadow-[inset_0_0_0_1px_var(--muted)]",
  "disabled:opacity-50",
);

export function FormField({
  id,
  label,
  optional = false,
  error,
  helper,
  className,
  children,
  ...rest
}: {
  id: string;
  label: string;
  optional?: boolean;
  error?: string | null;
  helper?: string;
  className?: string;
  children: ReactNode;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} {...rest}>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-foreground"
      >
        {label}
        {optional && (
          <span className="font-normal text-muted"> (optional)</span>
        )}
      </label>
      {children}
      {helper && !error && (
        <p id={`${id}-help`} className="mt-1.5 text-sm text-muted">
          {helper}
        </p>
      )}
      {/* The message opens with height and opacity (200ms); without motion it
          just appears. */}
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none",
          error ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <p
            id={`${id}-error`}
            className="flex items-start gap-1.5 pt-1.5 text-sm text-danger"
          >
            {error && (
              <>
                <CircleAlert
                  className="mt-0.5 size-3.5 shrink-0"
                  aria-hidden="true"
                />
                <span>{error}</span>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Button } from "@/components/shared/Button";

// Save and cancel for an editor (design.md §13.25): fixed to the bottom of the
// content area, the status on the left, Cancel and Save on the right.
export function SaveBar({
  dirty,
  saving,
  savedRecently,
  onCancel,
}: {
  dirty: boolean;
  saving: boolean;
  /** True for a few seconds after a successful save. */
  savedRecently: boolean;
  onCancel: () => void;
}) {
  return (
    <div className="material fixed inset-x-0 bottom-0 z-40 border-t border-border lg:left-62">
      <div className="mx-auto flex max-w-[60rem] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:mx-0 lg:px-8">
        <p
          aria-live="polite"
          className="flex items-center gap-2 text-sm text-muted"
        >
          {dirty ? (
            <>
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-primary"
              />
              Unsaved changes
            </>
          ) : savedRecently ? (
            "All changes saved"
          ) : null}
        </p>
        <div className="flex items-center gap-3">
          <Button variant="ghost" magnetic={false} onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            magnetic={false}
            loading={saving}
            disabled={!dirty}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

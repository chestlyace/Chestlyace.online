"use client";

import { useLinkStatus } from "next/link";
import { useEffect } from "react";
import { startLoading, stopLoading } from "@/lib/loadingStore";

// Inside a `Link`: tells the navigation feedback when this link's navigation is in
// flight (`useLinkStatus` only works under the link it reports on). Renders nothing.
export function LinkPending() {
  const { pending } = useLinkStatus();
  useEffect(() => {
    if (!pending) return;
    startLoading();
    return stopLoading;
  }, [pending]);
  return null;
}

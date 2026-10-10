"use client";

import { ErrorPage } from "@/components/notfound/ErrorPage";

// A page of this site failed (design.md §13.67): the branded error page, inside the layout.
export default function Error(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorPage {...props} />;
}

"use client";

import { Message } from "react-iconly";

// react-iconly uses React context, so it can only be imported from client code.
// These wrappers let server components use its icons (design.md §6: Iconly
// Light for featured icons).
export function MessageIcon({ size = 20 }: { size?: number }) {
  return <Message set="light" primaryColor="currentColor" size={size} />;
}

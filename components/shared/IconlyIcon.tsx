"use client";

import { Call, Chat, Message } from "react-iconly";

// react-iconly uses React context, so it can only be imported from client code.
// These wrappers let server components use its icons (design.md §6: Iconly
// Light for featured icons).
export function MessageIcon({ size = 20 }: { size?: number }) {
  return <Message set="light" primaryColor="currentColor" size={size} />;
}

export function CallIcon({ size = 20 }: { size?: number }) {
  return <Call set="light" primaryColor="currentColor" size={size} />;
}

export function ChatIcon({ size = 20 }: { size?: number }) {
  return <Chat set="light" primaryColor="currentColor" size={size} />;
}

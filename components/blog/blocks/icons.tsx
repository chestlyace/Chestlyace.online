import { icons } from "lucide-react";
import * as simple from "simple-icons";
import type { ReactNode } from "react";

// An icon named in a block (`icon: user-group`, or `icon: brand:github`), drawn
// on the server so the client components receive a ready node. An unknown name
// shows no icon.
const pascal = (name: string) =>
  name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");

export function renderIcon(
  name: string | null,
  className = "size-5",
): ReactNode {
  if (!name) return null;
  if (name.startsWith("brand:")) {
    const entry = (
      simple as unknown as Record<string, { path: string } | undefined>
    )[`si${pascal(name.slice(6))}`];
    if (!entry || typeof entry !== "object" || !("path" in entry)) return null;
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-hidden="true"
      >
        <path d={entry.path} />
      </svg>
    );
  }
  const Icon = (
    icons as Record<
      string,
      (props: { className?: string; "aria-hidden"?: boolean }) => ReactNode
    >
  )[pascal(name)];
  return Icon ? <Icon className={className} aria-hidden={true} /> : null;
}

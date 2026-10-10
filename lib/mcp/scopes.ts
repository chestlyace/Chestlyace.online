// What a token may do (docs/mcp.md §4). `read` is always there. Pure: safe for the browser.

export const SCOPES = ["read", "write", "publish", "delete", "media"] as const;
export type Scope = (typeof SCOPES)[number];

export const SCOPE_HELP: Record<Scope, { label: string; help: string }> = {
  read: {
    label: "Read",
    help: "See everything: lists, items, the guides. Always on.",
  },
  write: {
    label: "Write",
    help: "Create and change content. New posts, projects, pieces and events are created unpublished.",
  },
  publish: {
    label: "Publish",
    help: "Put things live: publish or unpublish a post, switch on the French version, the newsletter box, “published” on any item.",
  },
  delete: {
    label: "Delete",
    help: "Delete items (the agent must send the item's name to confirm) and moderate comments.",
  },
  media: {
    label: "Media",
    help: "Upload pictures and the résumé.",
  },
};

export function isScope(value: unknown): value is Scope {
  return (
    typeof value === "string" && (SCOPES as readonly string[]).includes(value)
  );
}

/** The scopes a token really has: the known ones, `read` first, no duplicates. */
export function normalizeScopes(scopes: readonly unknown[]): Scope[] {
  const wanted = new Set(scopes.filter(isScope));
  wanted.add("read");
  return SCOPES.filter((scope) => wanted.has(scope));
}

export function hasScope(scopes: readonly string[], needed: Scope): boolean {
  return needed === "read" || scopes.includes(needed);
}

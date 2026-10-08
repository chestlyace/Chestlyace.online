import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { AdminResource } from "@/lib/admin/resources";

// The top of an editor screen (design.md §14.11): "← Skills", the title.
export function EditorHeader({
  resource,
  title,
}: {
  resource: AdminResource;
  title: string;
}) {
  return (
    <>
      <Link
        href={resource.href}
        className="roll-host mb-6 inline-flex items-center gap-2 rounded-sm text-body font-medium text-muted transition-colors duration-150 hover:text-foreground"
      >
        <ArrowLeft className="size-[1em]" aria-hidden="true" />
        {resource.label}
      </Link>
      <h1 className="mb-8 text-title text-foreground">{title}</h1>
    </>
  );
}

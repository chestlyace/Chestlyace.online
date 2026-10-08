"use client";

import {
  Award,
  CircleHelp,
  FolderKanban,
  HeartHandshake,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Newspaper,
  Link2,
  Route,
  UserRound,
  Wrench,
  Briefcase,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { useConfirm } from "./ConfirmDialog";
import { useUnsavedGuard } from "./UnsavedGuard";
import { cn } from "@/lib/cn";
import { RESOURCES, type ResourceId } from "@/lib/admin/resources";

const ICONS: Record<ResourceId, LucideIcon> = {
  profile: UserRound,
  skills: Wrench,
  services: Briefcase,
  projects: FolderKanban,
  experience: Route,
  volunteering: HeartHandshake,
  certifications: Award,
  socials: Link2,
  faq: CircleHelp,
};

type Item = { href: string; label: string; icon: LucideIcon };

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: "Overview",
    items: [{ href: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Content",
    items: RESOURCES.map((resource) => ({
      href: resource.href,
      label: resource.label,
      icon: ICONS[resource.id],
    })),
  },
  {
    title: "Blog",
    items: [
      { href: "/blog", label: "Posts", icon: Newspaper },
      { href: "/blog/comments", label: "Comments", icon: MessageSquare },
      { href: "/blog/newsletter", label: "Newsletter", icon: Mail },
    ],
  },
];

function isActive(pathname: string, href: string) {
  // Posts is not also current on the Comments or Newsletter screens beside it.
  if (href === "/blog") {
    return (
      pathname === "/blog" ||
      (pathname.startsWith("/blog/") &&
        !pathname.startsWith("/blog/comments") &&
        !pathname.startsWith("/blog/newsletter"))
    );
  }
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

// The sidebar's links (design.md §13.18): two groups under mono headings; the
// current one gets a fill, a 2px bar on its left edge and `aria-current`.
export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const confirm = useConfirm();
  const unsaved = useUnsavedGuard();

  // A screen with unsaved changes asks before the sidebar takes you away.
  const leave = async (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!unsaved?.isDirty()) {
      onNavigate?.();
      return;
    }
    event.preventDefault();
    if (
      await confirm({
        title: "Leave without saving?",
        text: "Your changes to this entry will be lost.",
        confirmLabel: "Discard changes",
        tone: "primary",
      })
    ) {
      unsaved?.clear();
      onNavigate?.();
      router.push(href);
    }
  };

  return (
    <nav aria-label="Admin" className="flex flex-col gap-6">
      {GROUPS.map((group) => (
        <div key={group.title}>
          <p className="type-label mb-2 px-3 text-muted">{group.title}</p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={(event) => leave(event, item.href)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex h-10 items-center gap-3 rounded-md px-3 text-[0.9375rem] font-medium text-muted transition-colors duration-150",
                      "[@media(hover:hover)]:hover:bg-surface-raised/60 [@media(hover:hover)]:hover:text-foreground",
                      active &&
                        "bg-surface-raised text-foreground before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-primary",
                    )}
                  >
                    <Icon className="size-5 shrink-0" aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

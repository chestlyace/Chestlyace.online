"use client";

import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { Brand } from "@/components/shared/Brand";
import { IconButton } from "@/components/shared/IconButton";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { TextLink } from "@/components/shared/TextLink";
import { RESOURCES } from "@/lib/admin/resources";
import { AdminNav } from "./AdminNav";
import { ConfirmProvider } from "./ConfirmDialog";
import { ToastProvider } from "./Toast";
import { UnsavedProvider } from "./UnsavedGuard";
import { SignOutButton } from "./SignOutButton";

function screenTitle(pathname: string) {
  if (pathname === "/") return "Dashboard";
  return (
    RESOURCES.find(
      (r) => pathname === r.href || pathname.startsWith(`${r.href}/`),
    )?.label ?? "Admin"
  );
}

// The sidebar's contents, shared by the fixed sidebar and the phone drawer.
function SidebarContent({
  siteHref,
  onNavigate,
}: {
  siteHref: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col gap-8 p-4">
      <div className="px-1">
        <Brand />
        <p className="type-label mt-2 pl-1 text-muted">Admin</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <AdminNav onNavigate={onNavigate} />
      </div>
      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <TextLink href={siteHref} external icon="up-right" tone="footer">
          View site
        </TextLink>
        <div className="flex items-center justify-between">
          <SignOutButton />
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

// The frame around every screen after the login (design.md §13.18): a fixed
// sidebar from `lg`; below it a top bar and a drawer (a native <dialog>, so
// focus is trapped and Escape closes it).
export function AdminShell({
  siteHref,
  children,
}: {
  siteHref: string;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <ToastProvider>
      <ConfirmProvider>
        <UnsavedProvider>
          <Frame siteHref={siteHref} pathname={pathname}>
            {children}
          </Frame>
        </UnsavedProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}

function Frame({
  siteHref,
  pathname,
  children,
}: {
  siteHref: string;
  pathname: string;
  children: ReactNode;
}) {
  const drawer = useRef<HTMLDialogElement>(null);

  // Choosing a link (or any navigation) closes the drawer.
  useEffect(() => {
    drawer.current?.close();
  }, [pathname]);

  return (
    <div className="lg:grid lg:grid-cols-[15.5rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh border-r border-border bg-surface lg:block">
        <SidebarContent siteHref={siteHref} />
      </aside>

      <div className="min-w-0">
        <header className="material sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border px-4 lg:hidden">
          <IconButton
            label="Open menu"
            iconKey="menu"
            onClick={() => drawer.current?.showModal()}
          >
            <Menu className="size-5" />
          </IconButton>
          <p className="text-h3 truncate">{screenTitle(pathname)}</p>
          <ThemeToggle />
        </header>

        <dialog
          ref={drawer}
          aria-label="Menu"
          onClick={(event) => {
            if (event.target === drawer.current) drawer.current?.close();
          }}
          className="admin-drawer m-0 h-dvh max-h-none w-[min(20rem,85vw)] max-w-none border-r border-border bg-surface p-0 text-foreground lg:hidden"
        >
          <div className="absolute top-3 right-3">
            <IconButton
              label="Close menu"
              iconKey="close"
              onClick={() => drawer.current?.close()}
            >
              <X className="size-5" />
            </IconButton>
          </div>
          <SidebarContent
            siteHref={siteHref}
            onNavigate={() => drawer.current?.close()}
          />
        </dialog>

        <main
          id="main"
          tabIndex={-1}
          className="px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8"
        >
          <div
            className={
              /^\/blog\/(new|\d+)/.test(pathname) ? undefined : "max-w-[60rem]"
            }
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

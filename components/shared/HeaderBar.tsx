"use client";

import { ArrowUpRight, ChevronDown, Menu, X } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { cn } from "@/lib/cn";
import { useIsPhone } from "@/lib/media";
import { EASE_OUT, SPRING } from "@/lib/motion";
import type { NavLink } from "@/lib/sections";
import type { PublicSiteKey } from "@/lib/sites";
import { Brand } from "./Brand";
import { IconButton } from "./IconButton";
import { useSmoothScroll } from "./SmoothScroll";
import { TextLink } from "./TextLink";
import { ThemeToggle } from "./ThemeToggle";
import { useActiveNavLink } from "./useActiveSection";

export type HeaderSite = {
  key: PublicSiteKey;
  label: string;
  description: string;
  href: string;
  current: boolean;
};

const COMPACT_AFTER_PX = 80;
const FOCUSABLE = "a[href], button:not([disabled])";
const OPEN_SPRING = { type: "spring", bounce: 0, duration: 0.5 } as const;
const CLOSE_SPRING = { type: "spring", bounce: 0, duration: 0.35 } as const;

function NavItem({ link, active }: { link: NavLink; active: boolean }) {
  return (
    <span className="relative">
      <TextLink
        href={link.href}
        tone="nav"
        aria-current={active ? "location" : undefined}
        className={active ? "text-foreground" : undefined}
      >
        {link.label}
      </TextLink>
      {active && (
        <motion.span
          layoutId="nav-dot"
          transition={SPRING}
          aria-hidden="true"
          className="absolute -bottom-2 left-1/2 size-1 -translate-x-1/2 rounded-full bg-primary"
        />
      )}
    </span>
  );
}

export function HeaderBar({
  links,
  sites,
}: {
  links: readonly NavLink[];
  sites: readonly HeaderSite[];
}) {
  const active = useActiveNavLink();
  const { lock, unlock } = useSmoothScroll();
  const isPhone = useIsPhone();

  // Compact once the page has scrolled.
  const scrolled = useSyncExternalStore(
    (onChange) => {
      window.addEventListener("scroll", onChange, { passive: true });
      return () => window.removeEventListener("scroll", onChange);
    },
    () => window.scrollY > COMPACT_AFTER_PX,
    () => false,
  );

  // The phone menu only exists on phones.
  const [menuWanted, setMenuWanted] = useState(false);
  const [wasPhone, setWasPhone] = useState(isPhone);
  if (wasPhone !== isPhone) {
    // Leaving the phone layout closes the menu, so it can't reappear by itself
    // when the window narrows again.
    setWasPhone(isPhone);
    setMenuWanted(false);
  }
  const menuOpen = menuWanted && isPhone;

  // The Sites popover is anchored to the capsule at its current size, so it
  // closes when the size changes.
  const [sitesState, setSitesState] = useState({ open: false, compact: false });
  const sitesOpen = sitesState.open && sitesState.compact === scrolled;
  const closeSites = useCallback(
    () => setSitesState({ open: false, compact: false }),
    [],
  );

  const headerRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const chipRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const popoverId = useId();

  // Phone menu: stop page scrolling, trap focus, close on Escape.
  useEffect(() => {
    if (!menuOpen) return;
    lock();
    const frame = requestAnimationFrame(() =>
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus(),
    );

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuWanted(false);
        menuButtonRef.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !headerRef.current) return;
      const focusable = Array.from(
        headerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((element) => element.offsetParent !== null);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      unlock();
    };
  }, [menuOpen, lock, unlock]);

  // Sites popover: a disclosure that closes on Escape, an outside click, or
  // when focus leaves it.
  useEffect(() => {
    if (!sitesOpen) return;
    const inside = (target: EventTarget | null) =>
      popoverRef.current?.contains(target as Node) ||
      chipRef.current?.contains(target as Node);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeSites();
        chipRef.current?.focus();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!inside(event.target)) closeSites();
    };
    const onFocusIn = (event: FocusEvent) => {
      if (!inside(event.target)) closeSites();
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, [sitesOpen, closeSites]);

  const closeMenu = () => setMenuWanted(false);

  return (
    <>
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="scrim"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            onClick={closeMenu}
            className="fixed inset-0 z-40 bg-black/30 md:hidden dark:bg-black/50"
          />
        )}
      </AnimatePresence>

      <header
        ref={headerRef}
        className="pointer-events-none fixed inset-x-0 top-4 z-50 px-4 sm:px-6"
      >
        <div className="relative mx-auto w-full max-w-4xl">
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.96, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{
              default: { duration: 0.5, delay: 0.1, ease: EASE_OUT },
              layout: menuOpen ? OPEN_SPRING : CLOSE_SPRING,
            }}
            style={{ borderRadius: 28 }}
            className={cn(
              "material pointer-events-auto mx-auto w-full overflow-hidden border border-border/60 shadow-float",
              scrolled && "max-w-[820px] shadow-float-lifted",
            )}
          >
            <motion.div
              layout="position"
              className={cn(
                "flex items-center justify-between gap-4 px-6",
                scrolled ? "h-[46px]" : "h-[54px]",
              )}
            >
              <Brand wordmarkClassName="md:hidden lg:inline" />

              {links.length > 0 && (
                <nav
                  aria-label="Main"
                  className="hidden items-center gap-6 md:flex"
                >
                  <LayoutGroup id="header-nav">
                    {links.map((link) => (
                      <NavItem
                        key={link.id}
                        link={link}
                        active={active === link.id}
                      />
                    ))}
                  </LayoutGroup>
                </nav>
              )}

              <div className="flex items-center gap-2">
                <button
                  ref={chipRef}
                  type="button"
                  aria-expanded={sitesOpen}
                  aria-controls={popoverId}
                  onClick={() =>
                    setSitesState({ open: !sitesOpen, compact: scrolled })
                  }
                  className={cn(
                    "relative hidden h-8 items-center gap-1 rounded-full border border-border bg-tile px-3 text-[0.8125rem] font-medium text-foreground transition-colors duration-150 before:absolute before:-inset-y-1.5 before:inset-x-0 before:content-[''] hover:bg-tile-hover md:inline-flex",
                    sitesOpen && "bg-tile-hover",
                  )}
                >
                  Sites
                  <ChevronDown
                    className={cn(
                      "size-3.5 transition-transform duration-200 ease-out",
                      sitesOpen && "rotate-180",
                    )}
                    aria-hidden="true"
                  />
                </button>
                <ThemeToggle />
                <IconButton
                  ref={menuButtonRef}
                  label={menuOpen ? "Close menu" : "Open menu"}
                  iconKey={menuOpen ? "close" : "menu"}
                  aria-expanded={menuOpen}
                  aria-controls={panelId}
                  onClick={() => setMenuWanted(!menuOpen)}
                  className="md:hidden"
                >
                  {menuOpen ? (
                    <X className="size-5" />
                  ) : (
                    <Menu className="size-5" />
                  )}
                </IconButton>
              </div>
            </motion.div>

            <AnimatePresence initial={false}>
              {menuOpen && (
                <motion.div
                  key="panel"
                  id={panelId}
                  ref={panelRef}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  data-lenis-prevent
                  className="max-h-[calc(100dvh-5.5rem)] overflow-y-auto px-6 pt-2 pb-6 md:hidden"
                >
                  {links.length > 0 && (
                    <nav aria-label="Menu">
                      <ul className="flex flex-col gap-1">
                        {links.map((link, index) => (
                          <MenuItem key={link.id} index={index}>
                            <TextLink
                              href={link.href}
                              tone="menu"
                              onClick={closeMenu}
                              aria-current={
                                active === link.id ? "location" : undefined
                              }
                            >
                              {link.label}
                            </TextLink>
                          </MenuItem>
                        ))}
                      </ul>
                    </nav>
                  )}
                  <MenuItem index={links.length} as="div" className="mt-6">
                    <p className="type-label mb-2 text-muted">Sites</p>
                    <ul className="flex flex-col">
                      {sites.map((site) => (
                        <li key={site.key}>
                          <SiteRow site={site} onNavigate={closeMenu} />
                        </li>
                      ))}
                    </ul>
                  </MenuItem>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <AnimatePresence>
            {sitesOpen && (
              <motion.div
                key="sites"
                id={popoverId}
                ref={popoverRef}
                initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{
                  opacity: 0,
                  scale: 0.95,
                  filter: "blur(4px)",
                  transition: { duration: 0.15, ease: EASE_OUT },
                }}
                transition={{ duration: 0.2, ease: EASE_OUT }}
                style={{
                  transformOrigin: "top right",
                  // The chip's right edge: capsule padding 24 + theme toggle 40
                  // + gap 8, plus the inset when the capsule is compact.
                  right: scrolled
                    ? "calc(72px + max(0px, (100% - 820px) / 2))"
                    : "72px",
                }}
                className="material pointer-events-auto absolute top-[calc(100%+12px)] hidden w-70 rounded-md border border-border/60 p-2 shadow-float-lifted md:block"
              >
                <ul>
                  {sites.map((site) => (
                    <li key={site.key}>
                      <SiteRow site={site} onNavigate={() => closeSites()} />
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>
    </>
  );
}

// One entry of the menu content: rises in 100ms after the panel opens, 40ms
// apart (design.md §13.6).
function MenuItem({
  index,
  as = "li",
  className,
  children,
}: {
  index: number;
  as?: "li" | "div";
  className?: string;
  children: React.ReactNode;
}) {
  const Component = as === "li" ? motion.li : motion.div;
  return (
    <Component
      initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
      animate={{
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: {
          delay: 0.1 + index * 0.04,
          duration: 0.3,
          ease: EASE_OUT,
        },
      }}
      className={className}
    >
      {children}
    </Component>
  );
}

// A site in the Sites menu: name, one-line description, and `↗` — or "You're
// here" for the current site (design.md §13.7).
function SiteRow({
  site,
  onNavigate,
}: {
  site: HeaderSite;
  onNavigate: () => void;
}) {
  const body = (
    <>
      <span className="text-[0.9375rem] font-medium text-foreground">
        {site.label}
      </span>
      {site.current ? (
        <span className="type-label whitespace-nowrap text-muted">
          You&rsquo;re here
        </span>
      ) : (
        <ArrowUpRight className="size-4 text-muted" aria-hidden="true" />
      )}
      <span className="col-span-2 text-sm text-muted">{site.description}</span>
    </>
  );

  const rowClasses =
    "grid grid-cols-[1fr_auto] items-center gap-x-4 rounded-sm p-3";

  if (site.current) {
    return (
      <div aria-current="page" className={rowClasses}>
        {body}
      </div>
    );
  }
  return (
    <a
      href={site.href}
      onClick={onNavigate}
      className={cn(
        rowClasses,
        "transition-colors duration-150 hover:bg-surface dark:hover:bg-surface-raised",
      )}
    >
      {body}
    </a>
  );
}

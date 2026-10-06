"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { usePrefersReducedMotion } from "@/lib/media";
import { easeInOut } from "@/lib/motion";

type SmoothScrollApi = {
  /** Scrolls to a section id (without "#"), or to the top for "top". */
  scrollToId: (id: string) => boolean;
  /** Stops page scrolling (menus, modals). */
  lock: () => void;
  unlock: () => void;
};

const noop: SmoothScrollApi = {
  scrollToId: () => false,
  lock: () => {},
  unlock: () => {},
};

const SmoothScrollContext = createContext<SmoothScrollApi>(noop);

export function useSmoothScroll(): SmoothScrollApi {
  return useContext(SmoothScrollContext);
}

const SCROLL_DURATION_SECONDS = 1.2;

// Moves focus to a section's heading so keyboard and screen-reader users land
// where the page scrolled to (design.md §14.0). "top" focuses the skip link.
function focusTarget(id: string, element: HTMLElement | null) {
  const target =
    id === "top"
      ? document.querySelector<HTMLElement>("[data-skip-link]")
      : (element?.querySelector<HTMLElement>(
          "[data-section-heading], h1, h2",
        ) ?? element);
  if (!target) return;
  if (!target.hasAttribute("tabindex") && !target.matches("a, button")) {
    target.setAttribute("tabindex", "-1");
  }
  target.focus({ preventScroll: true });
}

// Lenis drives all scrolling, ticked by GSAP so ScrollTrigger stays in sync
// (design.md §8). With reduced motion it is off and scrolling is native.
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduced = usePrefersReducedMotion();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (reduced) return;

    const lenis = new Lenis({ autoRaf: false });
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reduced]);

  const api = useMemo<SmoothScrollApi>(() => {
    const scrollToId = (id: string) => {
      const element = id === "top" ? null : document.getElementById(id);
      if (id !== "top" && !element) return false;

      const margin = element
        ? parseFloat(getComputedStyle(element).scrollMarginTop) || 0
        : 0;
      const top = element
        ? element.getBoundingClientRect().top + window.scrollY - margin
        : 0;
      const finish = () => focusTarget(id, element);

      const lenis = lenisRef.current;
      if (lenis) {
        lenis.scrollTo(top, {
          duration: SCROLL_DURATION_SECONDS,
          easing: easeInOut,
          force: true,
          onComplete: finish,
        });
      } else {
        window.scrollTo({ top, behavior: "auto" });
        finish();
      }
      return true;
    };

    return {
      scrollToId,
      lock: () => {
        lenisRef.current?.stop();
        document.documentElement.style.overflow = "hidden";
      },
      unlock: () => {
        lenisRef.current?.start();
        document.documentElement.style.overflow = "";
      },
    };
  }, []);

  // Links to a section on this page scroll through Lenis. The capture phase
  // runs before Next's <Link> handler, which would otherwise jump instantly.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const link = (event.target as Element).closest<HTMLAnchorElement>(
        "a[href]",
      );
      if (!link || link.hasAttribute("data-skip-link")) return;
      if (link.target && link.target !== "_self") return;

      const url = new URL(link.href, window.location.href);
      if (
        url.origin !== window.location.origin ||
        url.pathname !== window.location.pathname ||
        !url.hash
      ) {
        return;
      }

      const id = decodeURIComponent(url.hash.slice(1));
      if (api.scrollToId(id)) {
        // preventDefault makes <Link> skip its own navigation; the event still
        // reaches other handlers (e.g. the phone menu closing itself).
        event.preventDefault();
        if (window.location.hash !== url.hash) {
          window.history.pushState(null, "", url.hash);
        }
      }
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [api]);

  return (
    <SmoothScrollContext.Provider value={api}>
      {children}
    </SmoothScrollContext.Provider>
  );
}

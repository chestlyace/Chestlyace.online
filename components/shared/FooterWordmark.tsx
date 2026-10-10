"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { cn } from "@/lib/cn";
import { prefersReducedMotionNow, usePrefersReducedMotion } from "@/lib/media";
import { particlesCapable, subscribeMotion } from "./particles/capability";
import { ParticleStageLazy } from "./particles/ParticleStageLazy";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

// The giant "CHESTLY ACE" (design.md §13.8). It is sized to the container's
// width with container-query units (no JavaScript), and its letters rise from
// a clip box, scrubbed to scroll, as the wordmark travels from entering the
// viewport to the page bottom. Where motion and WebGL are available it is drawn
// as particles instead (§13.61, D88): the solid text stays in the page as the
// fallback and fades out once the particles are drawing. Decorative: the brand
// block already names the site.
export function FooterWordmark() {
  const reduced = usePrefersReducedMotion();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  // Particles: only where motion is allowed and WebGL exists, and loaded once the
  // footer is within 1.5 viewports of the screen.
  const capable = useSyncExternalStore(
    subscribeMotion,
    particlesCapable,
    () => false,
  );
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const particles = capable && !failed;

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!particles || near || !wrapper) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setNear(true);
      },
      { rootMargin: "150% 0px" },
    );
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [particles, near]);

  useIsomorphicLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const text = textRef.current;
    if (reduced || prefersReducedMotionNow() || !wrapper || !text) return;
    gsap.registerPlugin(ScrollTrigger, SplitText);

    let context: gsap.Context | undefined;
    // Decorative: if the animation fails the wordmark just stays visible.
    try {
      context = gsap.context(() => {
        SplitText.create(text, {
          type: "lines,chars",
          mask: "lines",
          autoSplit: true,
          aria: "none",
          onSplit(split) {
            return gsap.from(split.chars, {
              yPercent: 110,
              ease: "none",
              stagger: 0.04,
              scrollTrigger: {
                trigger: wrapper,
                start: "top bottom",
                end: "bottom bottom",
                scrub: true,
              },
            });
          },
        });
      }, wrapper);
    } catch (error) {
      console.error("Footer wordmark animation failed", error);
      context?.revert();
      return;
    }

    return () => context?.revert();
  }, [reduced]);

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      className="mt-16 [container-type:inline-size] md:mt-24"
    >
      <div
        className={cn(
          "relative grid place-items-center",
          particles && "aspect-[4/3] md:aspect-[16/7]",
        )}
      >
        <span
          ref={textRef}
          className={cn(
            "block font-display leading-[0.8] whitespace-nowrap text-foreground uppercase transition-opacity duration-300 select-none",
            ready && particles && "opacity-0",
          )}
          style={{ fontSize: "25.2cqi", fontKerning: "none" }}
        >
          Chestly Ace
        </span>
        {particles && near && (
          <ParticleStageLazy
            fontSource={textRef}
            onReady={() => setReady(true)}
            onFail={() => {
              setReady(false);
              setFailed(true);
            }}
          />
        )}
      </div>
    </div>
  );
}

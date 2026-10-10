"use client";

import { BookOpen } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "@/components/shared/Button";
import { Container } from "@/components/shared/Container";
import { useLang } from "@/components/shared/LangProvider";
import { Link } from "@/components/shared/Link";
import { HeadingDoodle } from "@/components/creatives/home/HeadingDoodle";
import { splitLang, stripSitePrefix, type Lang } from "@/lib/i18n";
import { NOT_FOUND } from "@/lib/i18n/ui";
import { cn } from "@/lib/cn";

// The not-found pages (design.md §13.67, D91): a page of the site, with its header and
// footer, a giant 404 whose 0 is the site's own touch, a line in the site's voice and a
// way on. The status stays 404 (the catch-all and `notFound()` set it); the big number
// is decoration, the headline carries the meaning.

/** The address that was not found, as a visitor typed it (no language, no site prefix). */
function useMissingPath(): string {
  return splitLang(stripSitePrefix(usePathname())).rest;
}

function Frame({
  zero,
  line,
  buttons,
  extra,
  className,
}: {
  zero: ReactNode;
  line: string;
  buttons: ReactNode;
  extra?: ReactNode;
  className?: string;
}) {
  const lang = useLang();
  const missing = useMissingPath();
  const heading = useRef<HTMLHeadingElement>(null);
  // Focus moves to the headline on arrival, so a screen reader starts there.
  useEffect(() => heading.current?.focus({ preventScroll: true }), []);
  return (
    <div className={cn("relative flex-1 overflow-hidden", className)}>
      <Container className="relative flex min-h-[80dvh] flex-col items-center justify-center pt-32 pb-24 text-center">
        <div
          aria-hidden="true"
          className="relative flex items-center justify-center gap-[0.04em] font-display text-[clamp(8rem,28vw,22rem)] leading-[0.85] text-foreground/10 select-none"
        >
          <span>4</span>
          {zero}
          <span>4</span>
        </div>
        <h1
          ref={heading}
          tabIndex={-1}
          className="mt-4 font-display text-display-lg uppercase outline-none focus:outline-none focus-visible:outline-none"
        >
          {NOT_FOUND[lang].headline}
        </h1>
        <p className="mt-4 max-w-[48ch] text-lead text-muted">{line}</p>
        <p className="type-label mt-4 max-w-full truncate text-muted">
          {missing}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {buttons}
        </div>
        {extra}
      </Container>
    </div>
  );
}

/** The main site: the logo rolls in as the 0, over a faint grid. */
export function MainNotFound() {
  const lang = useLang();
  const t = NOT_FOUND[lang];
  return (
    <Frame
      line={t.lineMain}
      zero={
        <span className="nf-roll inline-grid size-[0.78em] place-items-center">
          <Image
            src="/brand/logo.png"
            alt=""
            width={240}
            height={240}
            priority
            className="size-full rounded-full dark:bg-foreground"
          />
        </span>
      }
      buttons={
        <>
          <Button href="/" size="lg">
            {t.home}
          </Button>
          <Button href="/#projects" variant="secondary" size="lg">
            {t.projects}
          </Button>
          <Button href="/#contact" variant="secondary" size="lg">
            {t.contact}
          </Button>
        </>
      }
      extra={
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(var(--border)_1px,transparent_1px)] bg-[length:24px_24px] opacity-40"
        />
      }
    />
  );
}

export type NotFoundWork = { href: string; title: string; image: string };

/** Creatives: doodles draw themselves around the number, and some work to look at. */
export function CreativesNotFound({
  work,
}: {
  work: Record<Lang, NotFoundWork[]>;
}) {
  const lang = useLang();
  const t = NOT_FOUND[lang];
  const items = work[lang].slice(0, 3);
  return (
    <Frame
      line={t.lineCreatives}
      zero={
        <>
          <span>0</span>
          <HeadingDoodle
            kind="star"
            className="absolute -top-2 right-[8%] text-primary-text md:-top-6"
          />
          <HeadingDoodle
            kind="squiggle"
            className="absolute -bottom-2 left-1/2 w-40 -translate-x-1/2 text-primary-text md:-bottom-6 md:w-64"
          />
        </>
      }
      buttons={
        <>
          <Button href="/design" size="lg">
            {t.design}
          </Button>
          <Button href="/photography" variant="secondary" size="lg">
            {t.photography}
          </Button>
          <Button href="/services" variant="secondary" size="lg">
            {t.services}
          </Button>
        </>
      }
      extra={
        items.length > 0 && (
          <div className="mt-16 w-full max-w-3xl">
            <p className="type-label mb-4 text-muted">{t.meanwhile}</p>
            <ul className="grid grid-cols-3 gap-3">
              {items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group block overflow-hidden rounded-lg bg-tile"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary thumbnail */}
                    <img
                      src={item.image}
                      alt=""
                      loading="lazy"
                      className="aspect-[4/5] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
                    />
                    <span className="block truncate px-3 py-2 text-left text-sm text-foreground">
                      {item.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )
      }
    />
  );
}

export type NotFoundPost = { slug: string; title: string; date: string };

/** The blog: a book as the 0, and the latest posts. */
export function BlogNotFound({
  posts,
}: {
  posts: Record<Lang, NotFoundPost[]>;
}) {
  const lang = useLang();
  const t = NOT_FOUND[lang];
  const items = posts[lang].slice(0, 3);
  return (
    <Frame
      line={t.lineBlog}
      zero={<BookOpen className="size-[0.7em]" strokeWidth={0.9} />}
      buttons={
        <>
          <Button href="/" size="lg">
            {t.allPosts}
          </Button>
          <Button href="/tags" variant="secondary" size="lg">
            {t.tags}
          </Button>
        </>
      }
      extra={
        items.length > 0 && (
          <div className="mt-16 w-full max-w-xl text-left">
            <p className="type-label mb-3 text-muted">{t.latest}</p>
            <ul className="divide-y divide-border border-y border-border">
              {items.map((post) => (
                <li key={post.slug}>
                  <Link
                    href={`/${post.slug}`}
                    className="flex items-baseline justify-between gap-4 py-3 text-foreground transition-colors duration-150 hover:text-primary-text"
                  >
                    <span className="truncate">{post.title}</span>
                    <time className="type-label shrink-0 text-muted">
                      {post.date}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )
      }
    />
  );
}

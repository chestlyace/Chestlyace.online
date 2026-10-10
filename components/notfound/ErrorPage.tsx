"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/shared/Button";
import { Container } from "@/components/shared/Container";
import { useLang } from "@/components/shared/LangProvider";
import { NOT_FOUND } from "@/lib/i18n/ui";

// The error page of a public site (design.md §13.67): "Something broke on our side", a
// Try again button (the route's `reset`) and a way home, inside the site's header and
// footer. Never shows the error's text to a visitor.
export function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const lang = useLang();
  const t = NOT_FOUND[lang];
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    console.error(error);
    heading.current?.focus({ preventScroll: true });
  }, [error]);
  return (
    <Container className="flex min-h-[80dvh] flex-1 flex-col items-center justify-center pt-32 pb-24 text-center">
      <p
        aria-hidden="true"
        className="font-display text-[clamp(6rem,22vw,16rem)] leading-[0.85] text-foreground/10 select-none"
      >
        {lang === "fr" ? "Oups" : "Oops"}
      </p>
      <h1
        ref={heading}
        tabIndex={-1}
        className="mt-4 font-display text-display-lg uppercase outline-none focus:outline-none focus-visible:outline-none"
      >
        {t.errorHeadline}
      </h1>
      <p className="mt-4 max-w-[48ch] text-lead text-muted">{t.errorLine}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button size="lg" onClick={reset}>
          {t.tryAgain}
        </Button>
        <Button href="/" variant="secondary" size="lg">
          {t.home}
        </Button>
      </div>
    </Container>
  );
}

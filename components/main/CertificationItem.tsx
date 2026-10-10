import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import type { HomepageData } from "@/lib/db";
import { imageSource } from "@/lib/hero";
import type { Lang } from "@/lib/i18n";
import { NEW_TAB } from "@/lib/i18n/ui";
import { isHttpUrl } from "@/lib/links";

type Certification = HomepageData["certifications"][number];

// One certification (design.md §13.17): badge, name, issuer · year. With a
// credential link the whole tile is that link (hover lifts the badge); without
// one it is static.
export function CertificationItem({
  certification,
  lang,
  verifyLabel,
}: {
  certification: Certification;
  lang: Lang;
  /** "verify credential", for screen readers. */
  verifyLabel: string;
}) {
  const badge = imageSource(certification.badgeUrl);
  const year = certification.issuedOn?.slice(0, 4);
  const href =
    certification.credentialUrl && isHttpUrl(certification.credentialUrl)
      ? certification.credentialUrl
      : null;

  const body = (
    <>
      <span className="block h-16">
        {badge.kind === "local" && (
          <Image
            src={badge.src}
            alt=""
            width={70}
            height={64}
            className={cn(
              "h-16 w-auto object-contain object-left",
              href &&
                "transition-transform duration-300 ease-out group-hover/cert:-translate-y-0.5 group-hover/cert:scale-[1.04] motion-reduce:transition-none",
            )}
          />
        )}
        {badge.kind === "remote" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={badge.src}
            alt=""
            height={64}
            loading="lazy"
            className="h-16 w-auto object-contain object-left"
          />
        )}
      </span>
      <span className="mt-4 block line-clamp-2 text-body font-medium text-foreground">
        {certification.name}
      </span>
      <span className="type-label mt-1.5 block text-muted">
        {certification.issuer}
        {year ? ` · ${year}` : ""}
      </span>
      {href && (
        <>
          <ArrowUpRight
            className="absolute top-6 right-6 size-[18px] text-muted transition-[translate,color] duration-200 ease-out group-hover/cert:translate-x-0.5 group-hover/cert:-translate-y-0.5 group-hover/cert:text-foreground"
            aria-hidden="true"
          />
          <span className="sr-only">
            {" "}
            — {verifyLabel} ({NEW_TAB[lang]})
          </span>
        </>
      )}
    </>
  );

  const classes =
    "group/cert relative block h-full rounded-lg bg-tile p-6 transition-colors duration-150";

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          classes,
          "hover:bg-tile-hover active:scale-[0.98] focus-visible:outline-offset-2",
        )}
      >
        {body}
      </a>
    );
  }
  return <div className={classes}>{body}</div>;
}

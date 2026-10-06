import { ArrowRight, BadgeCheck, ChevronDown, Mail } from "lucide-react";
import amazonwebservices from "devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg";
import android from "devicon/icons/android/android-original.svg";
import react from "devicon/icons/react/react-original.svg";
import typescript from "devicon/icons/typescript/typescript-original.svg";
import Image, { type StaticImageData } from "next/image";
import type { CSSProperties } from "react";
import { HERO_QUOTE, HERO_TAGLINE, heroIntro } from "@/content/copy";
import { Button } from "@/components/shared/Button";
import { Container } from "@/components/shared/Container";
import { MessageIcon } from "@/components/shared/IconlyIcon";
import { SocialIcon } from "@/components/shared/SocialIcon";
import { StatusPill } from "@/components/shared/StatusPill";
import { TextLink } from "@/components/shared/TextLink";
import { cn } from "@/lib/cn";
import type { HomepageData } from "@/lib/db";
import { heroSrText, imageSource, phoneHref, splitHeadline } from "@/lib/hero";
import { isHttpUrl } from "@/lib/links";
import { HeroGrid } from "./HeroGrid";
import { HeroMotion } from "./HeroMotion";
import { RotatingWords } from "./RotatingWords";

type Profile = NonNullable<HomepageData["profile"]>;

// One headline line: each letter in its own box so it can rise on entrance and
// lift toward the cursor (design.md §14.1).
function HeadlineLine({
  text,
  line,
  base,
}: {
  text: string;
  line: 1 | 2;
  base: number;
}) {
  let index = 0;
  const words = text.split(" ");
  return (
    <span className="hero-line" data-exit={`line-${line}`}>
      {words.map((word, wordIndex) => (
        <span key={wordIndex}>
          {wordIndex > 0 && " "}
          <span className="hero-word">
            {Array.from(word).map((char) => {
              const i = index++;
              return (
                <span
                  key={i}
                  className="hero-char"
                  style={{ "--i": i, "--base": `${base}ms` } as CSSProperties}
                >
                  {char}
                </span>
              );
            })}
          </span>
        </span>
      ))}
    </span>
  );
}

function fadeUp(delay: number, extra?: string) {
  return {
    className: cn("hero-fade", extra),
    style: { "--delay": `${delay}ms` } as CSSProperties,
  };
}

// A floating tech sticker (design.md §14.1): three nested layers, so cursor
// parallax (outer), float (middle), and entrance + tilt (inner) never fight over
// `transform`.
function Sticker({
  logo,
  index,
  rotate,
  float,
  depth,
  position,
  lightBacking = false,
}: {
  logo: StaticImageData;
  index: number;
  rotate: number;
  float: [seconds: number, delay: number];
  depth: number;
  position: string;
  lightBacking?: boolean;
}) {
  return (
    <div data-depth={depth} className={cn("absolute z-20", position)}>
      <div
        className="hero-float"
        style={
          {
            "--float": `${float[0]}s`,
            "--float-delay": `${float[1]}s`,
          } as CSSProperties
        }
      >
        <div
          className="hero-pop"
          style={{ "--rot": `${rotate}deg`, "--n": index } as CSSProperties}
        >
          <span
            className={cn(
              "grid size-12 scale-[0.8] place-items-center rounded-md border border-border bg-surface-raised shadow-float sm:scale-100",
              lightBacking && "dark:bg-white",
            )}
          >
            <Image src={logo} alt="" width={28} height={28} unoptimized />
          </span>
        </div>
      </div>
    </div>
  );
}

function Portrait({ profile }: { profile: Profile }) {
  const source = imageSource(profile.heroImageUrl);
  const imageClass =
    "hero-arch-image h-auto w-full object-cover grayscale contrast-125 transition-[filter] duration-700 ease-out group-hover:grayscale-0";

  return (
    <div
      data-exit="portrait"
      className="relative mt-12 flex justify-center lg:mt-0 lg:justify-end"
    >
      {/* Glow */}
      <div
        data-depth="-24"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 grid place-items-center"
      >
        <div className="hero-glow-in">
          <div className="hero-glow" />
        </div>
      </div>

      <div className="group relative w-[min(100%,420px)] lg:w-full lg:max-w-[480px]">
        <Sticker
          logo={react}
          index={0}
          rotate={-12}
          float={[5.2, 0]}
          depth={20}
          position="top-[15%] left-0 sm:-left-[5%]"
        />
        <Sticker
          logo={amazonwebservices}
          index={1}
          rotate={6}
          float={[6.1, -1.5]}
          depth={14}
          position="bottom-[20%] left-0 sm:-left-[2%]"
          lightBacking
        />
        <Sticker
          logo={android}
          index={2}
          rotate={-8}
          float={[6.8, -3]}
          depth={8}
          position="right-[10%] bottom-[10%]"
        />
        {/* PLACEHOLDER — TypeScript takes the old camera's place (software only). */}
        <Sticker
          logo={typescript}
          index={3}
          rotate={15}
          float={[5.6, -2.2]}
          depth={16}
          position="top-[40%] right-0 sm:top-[30%] sm:right-[max(-8%,-1.5rem)] lg:right-[max(-8%,-2rem)]"
        />

        {/* Arched portrait */}
        <div data-depth="-6">
          <div className="hero-arch relative overflow-hidden rounded-t-[14rem] rounded-b-full border-2 border-border bg-surface shadow-[0_24px_64px_rgb(0_0_0/0.12)] dark:shadow-none">
            {source.kind === "local" && (
              <Image
                data-portrait-image
                src={source.src}
                alt={profile.name}
                width={1200}
                height={1600}
                sizes="(min-width: 1024px) 480px, 420px"
                priority
                fetchPriority="high"
                className={imageClass}
              />
            )}
            {source.kind === "remote" && (
              // Remote hosts aren't configured for next/image; shown as is.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                data-portrait-image
                src={source.src}
                alt={profile.name}
                width={1200}
                height={1600}
                fetchPriority="high"
                decoding="async"
                className={imageClass}
              />
            )}
            {source.kind === "none" && (
              <div aria-hidden="true" className="aspect-[3/4] w-full" />
            )}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent"
            />
          </div>
        </div>

        {/* Speech-bubble quote card */}
        <div
          data-depth="10"
          className="absolute top-[5%] right-0 z-30 max-w-[180px] sm:right-[max(-10%,-1.5rem)] lg:right-[max(-10%,-2rem)]"
        >
          <div className="hero-pop" style={{ "--n": 4 } as CSSProperties}>
            <figure className="hero-quote material rounded-lg rounded-bl-none border border-border/60 p-4 shadow-float">
              <figcaption className="mb-2 flex items-center gap-1.5">
                <span className="text-sm font-medium text-muted">
                  {HERO_QUOTE.handle}
                </span>
                <BadgeCheck
                  className="size-3.5 text-primary-text"
                  aria-label="Verified"
                />
              </figcaption>
              <blockquote className="text-sm leading-relaxed italic">
                {HERO_QUOTE.text}
              </blockquote>
            </figure>
          </div>
        </div>
      </div>
    </div>
  );
}

// The homepage hero (design.md §14.1): the previous portfolio's hero, kept and
// restyled, with the new motion. Everything visible is in the server HTML; the
// entrance is CSS (globals.css), the rest is HeroMotion, HeroGrid, and
// RotatingWords.
export function Hero({
  profile,
  socials,
}: {
  profile: Profile;
  socials: HomepageData["socials"];
}) {
  const lines = splitHeadline(profile.headline);
  const phone = profile.phone ? phoneHref(profile.phone) : null;
  const links = socials.filter((social) => isHttpUrl(social.url));

  return (
    <HeroMotion
      id="top"
      className="relative isolate flex min-h-svh items-center overflow-x-clip pt-28 pb-12"
    >
      <HeroGrid />

      <Container className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="flex flex-col items-center gap-8 text-center lg:col-span-7 lg:items-start lg:text-left">
          {profile.tagline && profile.availability === "open" && (
            <div
              data-exit="fade"
              {...fadeUp(0, "[animation-duration:500ms] [--rise:12px]")}
            >
              <StatusPill label={profile.tagline} />
            </div>
          )}

          <h1 className="sr-only">
            {heroSrText(profile.name, profile.legalName, profile.headline)}
          </h1>
          <div aria-hidden="true" className="select-none">
            <div
              data-exit="headline"
              data-lift
              className="font-display text-display-2xl text-foreground uppercase [--rotor-justify:center] lg:[--rotor-justify:flex-start]"
              // Also capped by the screen's height, so the buttons stay on the
              // first screen of a laptop (the type scale's size still applies
              // on taller screens).
              style={{ fontSize: "min(var(--text-display-2xl), 19svh)" }}
            >
              {lines[0] && <HeadlineLine text={lines[0]} line={1} base={100} />}
              {lines[1] && <HeadlineLine text={lines[1]} line={2} base={220} />}
              {profile.headlineWords.length > 0 && (
                <span
                  data-exit="line-3"
                  className="hero-fade-in mt-2 block text-[0.5em] tracking-[0.02em] text-transparent opacity-40 [-webkit-text-stroke:1.5px_var(--foreground)]"
                  style={{ "--delay": "450ms" } as CSSProperties}
                >
                  <RotatingWords words={profile.headlineWords} />
                </span>
              )}
            </div>
          </div>

          <p
            className={cn(
              "type-label max-w-[56ch] text-muted",
              fadeUp(500).className,
            )}
            style={fadeUp(500).style}
          >
            {HERO_TAGLINE}
          </p>
          <p
            data-exit="fade"
            className={cn(
              "max-w-[56ch] text-sm text-muted",
              fadeUp(570).className,
            )}
            style={fadeUp(570).style}
          >
            {heroIntro(profile.name, profile.legalName)}
          </p>

          <div
            className={cn(
              "flex w-full flex-col gap-4 sm:w-auto sm:flex-row",
              fadeUp(640).className,
            )}
            style={fadeUp(640).style}
          >
            <Button
              href="#projects"
              size="lg"
              trailingIcon={<ArrowRight />}
              className="w-full sm:w-auto"
            >
              View Projects
            </Button>
            <Button
              href="#contact"
              variant="secondary"
              size="lg"
              trailingIcon={<MessageIcon />}
              className="w-full sm:w-auto"
            >
              Get In Touch
            </Button>
          </div>

          <div
            className={cn(
              "flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm lg:justify-start",
              fadeUp(710).className,
            )}
            style={fadeUp(710).style}
          >
            {phone && profile.phone && (
              <span className="inline-flex items-center gap-2 text-muted">
                <SocialIcon name="whatsapp" className="size-[18px]" />
                <TextLink href={phone} tone="footer">
                  {profile.phone}
                </TextLink>
              </span>
            )}
            <span className="inline-flex items-center gap-2 text-muted">
              <Mail className="size-[18px]" aria-hidden="true" />
              <TextLink href={`mailto:${profile.email}`} tone="footer">
                {profile.email}
              </TextLink>
            </span>
            {links.length > 0 && (
              <ul className="flex items-center">
                {links.map((social) => (
                  <li key={social.id}>
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${social.platform} (opens in a new tab)`}
                      className="relative grid size-8 place-items-center rounded-full text-muted transition-colors duration-150 before:absolute before:-inset-1.5 before:content-[''] hover:text-foreground"
                    >
                      <SocialIcon name={social.icon} className="size-5" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="lg:col-span-5">
          <Portrait profile={profile} />
        </div>
      </Container>

      <a
        href="#about"
        data-exit="cue"
        aria-label="Scroll to About"
        className="hero-fade absolute bottom-8 left-1/2 hidden -translate-x-1/2 rounded-full text-muted transition-colors duration-150 hover:text-foreground lg:block"
        style={{ "--delay": "1400ms" } as CSSProperties}
      >
        <span className="hero-bob block">
          <ChevronDown className="size-8" aria-hidden="true" />
        </span>
      </a>
    </HeroMotion>
  );
}

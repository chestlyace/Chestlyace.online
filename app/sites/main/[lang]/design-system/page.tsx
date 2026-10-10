import { BrandLoader } from "@/components/shared/BrandLoader";
import { ArrowRight, ArrowUpRight, Download, Mail } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Button } from "@/components/shared/Button";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { StatusPill } from "@/components/shared/StatusPill";
import { Tag, TagLink } from "@/components/shared/Tag";
import { TextLink } from "@/components/shared/TextLink";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

export const metadata: Metadata = { title: "Design system" };

const COLOR_TOKENS = [
  ["background", "bg-background"],
  ["background-alt", "bg-background-alt"],
  ["surface", "bg-surface"],
  ["surface-raised", "bg-surface-raised"],
  ["border", "bg-border"],
  ["foreground", "bg-foreground"],
  ["muted", "bg-muted"],
  ["primary", "bg-primary"],
  ["primary-hover", "bg-primary-hover"],
  ["primary-foreground", "bg-primary-foreground"],
  ["primary-text", "bg-primary-text"],
  ["secondary", "bg-secondary"],
  ["ring", "bg-ring"],
  ["danger", "bg-danger"],
] as const;

const TYPE_SCALE = [
  ["display-2xl", "font-display text-display-2xl uppercase", "Software"],
  ["display-xl", "font-display text-display-xl uppercase", "Chestly Ace"],
  ["display-lg", "font-display text-display-lg uppercase", "About me"],
  ["title", "text-title", "Project title"],
  ["h3", "text-h3", "Card title"],
  ["lead", "text-lead", "Intros, the hero tagline, and about text."],
  ["body", "text-body", "Default running text for the site."],
  ["sm", "text-sm text-muted", "Secondary text and captions"],
  ["label", "type-label text-muted", "Eyebrow · date · counter"],
  ["mono", "font-mono text-sm", "const stack = ['Next.js', 'Postgres'];"],
] as const;

function Section({
  title,
  children,
  band,
}: {
  title: string;
  children: ReactNode;
  band?: "alt";
}) {
  return (
    <section
      data-band={band}
      className={`border-t border-border py-12 ${band ? "bg-background-alt" : ""}`}
    >
      <Container>
        <h2 className="type-label mb-6 text-muted">{title}</h2>
        {children}
      </Container>
    </section>
  );
}

export default function DesignSystemPage() {
  if (process.env.VERCEL_ENV === "production") notFound();

  return (
    <div className="flex-1 pt-32">
      <Container className="pb-12">
        <h1 className="font-display text-display-lg uppercase">
          Design system
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          Tokens and shared components from docs/design.md (§1–§8, §13.1–13.9,
          §14.0). Preview-only — this page returns 404 in production. Use the
          theme toggle to check both themes; the header, footer and skip link
          above and below are the real components.
        </p>
      </Container>

      <Section title="Colour tokens">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {COLOR_TOKENS.map(([name, swatch]) => (
            <li key={name} className="text-sm">
              <span
                className={`block h-16 rounded-md border border-border ${swatch}`}
              />
              <span className="mt-2 block font-mono text-xs">{name}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Type scale">
        <dl className="flex flex-col gap-6">
          {TYPE_SCALE.map(([name, classes, sample]) => (
            <div
              key={name}
              className="grid gap-2 md:grid-cols-[10rem_1fr] md:items-baseline"
            >
              <dt className="font-mono text-xs text-muted">{name}</dt>
              <dd className={classes}>{sample}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Buttons — magnetic pills (§13.1)">
        <p className="mb-8 max-w-2xl text-sm text-muted">
          With a mouse or trackpad, a button leans toward the pointer within
          24px and springs back when it leaves. Press scales to 97%. Off on
          touch and under reduced motion.
        </p>
        <div className="flex flex-col gap-8">
          {(["primary", "secondary", "ghost"] as const).map((variant) => (
            <div key={variant} className="flex flex-wrap items-center gap-3">
              <span className="w-24 font-mono text-xs text-muted">
                {variant}
              </span>
              <Button variant={variant} size="sm">
                Small
              </Button>
              <Button variant={variant}>Medium</Button>
              <Button variant={variant} size="lg" trailingIcon={<ArrowRight />}>
                View Projects
              </Button>
              <Button
                variant={variant}
                href="/design-system"
                trailingIcon={<ArrowUpRight />}
                iconNudge="up-right"
              >
                As a link
              </Button>
              <Button variant={variant} loading>
                Loading
              </Button>
              <Button variant={variant} disabled>
                Disabled
              </Button>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-3">
            <span className="w-24 font-mono text-xs text-muted">icons</span>
            <Button size="lg" trailingIcon={<Download />} iconNudge="down">
              Download Resume
            </Button>
            <Button variant="secondary" size="lg" trailingIcon={<Mail />}>
              Get In Touch
            </Button>
          </div>
        </div>
      </Section>

      <Section title="Text links (§13.3)" band="alt">
        <div className="flex flex-col gap-6">
          <div className="grid gap-2 md:grid-cols-[10rem_1fr] md:items-center">
            <span className="font-mono text-xs text-muted">roll · nav</span>
            <div className="flex gap-6">
              <TextLink href="#about" tone="nav">
                About
              </TextLink>
              <TextLink href="#projects" tone="nav">
                Projects
              </TextLink>
              <TextLink href="#contact" tone="nav">
                Experience
              </TextLink>
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-[10rem_1fr] md:items-center">
            <span className="font-mono text-xs text-muted">roll · footer</span>
            <div className="flex gap-6">
              <TextLink href="/design-system" tone="footer">
                Resume
              </TextLink>
              <TextLink
                href="https://github.com/chestlyace"
                tone="footer"
                external
              >
                GitHub
              </TextLink>
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-[10rem_1fr] md:items-center">
            <span className="font-mono text-xs text-muted">
              roll · standalone
            </span>
            <TextLink href="/design-system" icon="up-right">
              All projects
            </TextLink>
          </div>
          <div className="grid gap-2 md:grid-cols-[10rem_1fr] md:items-center">
            <span className="font-mono text-xs text-muted">roll · menu</span>
            <TextLink href="/design-system" tone="menu">
              Experience
            </TextLink>
          </div>
          <div className="grid gap-2 md:grid-cols-[10rem_1fr] md:items-start">
            <span className="font-mono text-xs text-muted">inline</span>
            <p className="max-w-[68ch]">
              Links inside running text keep a faint underline and draw a full
              one on hover, like this{" "}
              <TextLink href="/design-system" variant="inline">
                project write-up
              </TextLink>{" "}
              or this{" "}
              <TextLink
                href="https://github.com/chestlyace"
                variant="inline"
                external
              >
                external link
              </TextLink>
              .
            </p>
          </div>
        </div>
      </Section>

      <Section title="Section heading (§14.0)">
        <SectionHeading
          index="02"
          label="Skills"
          title="Skills"
          intro="A mono index above a huge Bebas title. The letters rise as it scrolls into view."
        />
      </Section>

      <Section title="Brand loader (§13.64)">
        <div className="flex flex-wrap items-end gap-16">
          <BrandLoader size="lg" />
          <BrandLoader size="md" />
          <p className="flex items-center gap-3 text-sm text-muted">
            <BrandLoader size="sm" decorative /> sm, inside a button or next to
            a label
          </p>
        </div>
      </Section>

      <Section title="Tags and status pill (§13.4, §13.5)">
        <div className="flex flex-wrap items-center gap-2">
          <Tag>Next.js</Tag>
          <Tag>TypeScript</Tag>
          <Tag>PostgreSQL</Tag>
          <TagLink href="#tags">Linked tag</TagLink>
          <StatusPill label="Open to Remote Roles" className="ml-4" />
        </div>
      </Section>

      <Section title="Bands — tiles switch on a background-alt band (§14.0)">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-background p-6">
            <p className="type-label mb-4 text-muted">background</p>
            <div className="flex flex-wrap gap-2">
              <Tag>Tile on surface</Tag>
              <Button variant="secondary" size="sm">
                Secondary
              </Button>
            </div>
          </div>
          <div data-band="alt" className="rounded-lg bg-background-alt p-6">
            <p className="type-label mb-4 text-muted">background-alt</p>
            <div className="flex flex-wrap gap-2">
              <Tag>Tile on surface-raised</Tag>
              <Button variant="secondary" size="sm">
                Secondary
              </Button>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Materials (§5)" band="alt">
        <div className="relative isolate overflow-hidden rounded-lg p-8">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[repeating-linear-gradient(45deg,var(--primary)_0_16px,var(--foreground)_16px_32px)] opacity-60"
          />
          <div className="material max-w-sm rounded-full border border-border/60 px-6 py-4 shadow-float">
            material-bar + blur(20px) saturate(180%)
          </div>
        </div>
      </Section>

      <Section title="Radius and depth">
        <div className="flex flex-wrap gap-6">
          {(
            [
              ["sm 8", "rounded-sm"],
              ["md 12", "rounded-md"],
              ["lg 20", "rounded-lg"],
              ["xl 28", "rounded-xl"],
              ["full", "rounded-full"],
            ] as const
          ).map(([name, radius]) => (
            <div
              key={name}
              className={`flex size-24 items-center justify-center border border-border bg-surface font-mono text-xs shadow-float ${radius}`}
            >
              {name}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Theme toggle (§13.2)">
        <div className="flex items-center gap-3 text-sm text-muted">
          <ThemeToggle />
          Cycles system → light → dark. Shared across *.chestlyace.online.
        </div>
      </Section>
    </div>
  );
}

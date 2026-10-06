import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Button } from "@/components/shared/Button";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { StatusPill } from "@/components/shared/StatusPill";
import { Tag } from "@/components/shared/Tag";
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
  ["primary-foreground", "bg-primary-foreground"],
  ["primary-text", "bg-primary-text"],
  ["secondary", "bg-secondary"],
  ["ring", "bg-ring"],
  ["danger", "bg-danger"],
] as const;

const TYPE_SCALE = [
  ["display-xl", "font-display text-display-xl uppercase", "Chestly Ace"],
  ["display-lg", "font-display text-display-lg uppercase", "About me"],
  ["h3", "text-h3 font-semibold", "Card title"],
  ["body-lg", "text-body-lg", "Hero tagline and about text."],
  ["body", "text-base", "Default paragraph text for the site."],
  ["sm", "text-sm text-muted", "Meta, dates and tags"],
  [
    "xs eyebrow",
    "font-eyebrow text-xs font-semibold tracking-widest text-muted uppercase",
    "Eyebrow label",
  ],
  ["mono", "font-mono text-sm", "const stack = ['Next.js', 'Postgres'];"],
] as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-border py-12">
      <h2 className="mb-6 font-eyebrow text-xs font-semibold tracking-widest text-muted uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function DesignSystemPage() {
  if (process.env.VERCEL_ENV === "production") notFound();

  return (
    <main className="flex-1 py-16">
      <Container>
        <h1 className="font-display text-display-lg uppercase">
          Design system
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          Tokens and shared components from docs/design.md. Preview-only — this
          page returns 404 in production. Use the theme toggle to check both
          themes.
        </p>

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

        <Section title="Buttons">
          <div className="flex flex-col gap-6">
            {(["primary", "secondary", "ghost"] as const).map((variant) => (
              <div key={variant} className="flex flex-wrap items-center gap-3">
                <span className="w-24 font-mono text-xs text-muted">
                  {variant}
                </span>
                <Button variant={variant} size="sm">
                  Small
                </Button>
                <Button variant={variant}>Medium</Button>
                <Button
                  variant={variant}
                  size="lg"
                  trailingIcon={
                    <ArrowRight className="size-4" aria-hidden="true" />
                  }
                >
                  Large with icon
                </Button>
                <Button variant={variant} disabled>
                  Disabled
                </Button>
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-3">
              <span className="w-24 font-mono text-xs text-muted">link</span>
              <Button
                variant="link"
                href="/design-system"
                trailingIcon={
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                }
              >
                Link button (renders an anchor)
              </Button>
            </div>
          </div>
        </Section>

        <Section title="Section heading">
          <SectionHeading
            eyebrow="What I do"
            title="Services"
            intro="Eyebrow label in Outfit, title in Bebas Neue, optional intro paragraph."
          />
        </Section>

        <Section title="Tags and status pill">
          <div className="flex flex-wrap items-center gap-2">
            <Tag>Next.js</Tag>
            <Tag>TypeScript</Tag>
            <Tag>PostgreSQL</Tag>
            <StatusPill label="Open to Remote Roles" className="ml-4" />
          </div>
        </Section>

        <Section title="Theme toggle">
          <div className="flex items-center gap-3 text-sm text-muted">
            <ThemeToggle />
            Cycles system → light → dark. Shared across *.chestlyace.online.
          </div>
        </Section>

        <Section title="Radius and depth">
          <div className="flex flex-wrap gap-6">
            {(
              [
                ["sm", "rounded-sm"],
                ["md", "rounded-md"],
                ["lg", "rounded-lg"],
                ["full", "rounded-full"],
              ] as const
            ).map(([name, radius]) => (
              <div
                key={name}
                className={`flex size-24 items-center justify-center border border-border bg-surface font-mono text-xs shadow-card ${radius}`}
              >
                {name}
              </div>
            ))}
          </div>
        </Section>
      </Container>
    </main>
  );
}

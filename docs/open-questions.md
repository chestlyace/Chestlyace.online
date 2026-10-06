# Open Questions

Things deliberately left undecided. Numbers are stable — other docs refer to
them (e.g. "Q4"). When one is decided: move the answer into the relevant doc, add
it to the decisions log in `README.md`, and mark it **Decided** here with the
date. Don't renumber.

Status key: **Open** · **Proposed** (recommendation exists, needs your yes) ·
**Decided**

---

## Platform & tooling

### Q1 — Which headless CMS for the creatives site? · Open
Candidates: **Sanity** (generous free tier, strong image pipeline, schema in
code), **Payload** (open source, self-hosted, own your data, more setup),
**Storyblok** (visual editor, built-in image service).
Needed before building the creatives site, not before the main site.
Content model to satisfy: `content-schema.md` §5.

### Q2 — Database access layer · Decided 2026-10-05 (D15)
**Answer: Drizzle ORM.**
Recommendation: **Drizzle ORM** with the Neon serverless driver. Type-safe,
schema in TypeScript, plain-SQL feel, small. Alternative: Prisma (heavier,
slower cold starts on serverless).

### Q3 — Styling: Tailwind or SCSS? · Decided 2026-10-05 (D14)
**Answer: Tailwind CSS v4.**
Recommendation: **Tailwind CSS** — the old site already uses it and D13 says stay
close to it. Your general preference for separate `.scss` files would point to
**SCSS Modules** (`Component.module.scss` next to each component) instead.
They can coexist, but picking one keeps the codebase consistent. Needs your call
before any component is written.

### Q14 — Upload storage · Proposed
Recommendation: **keep Cloudinary** — existing images are already there and it
handles resizing/format conversion. Alternative: Vercel Blob (simpler, same
platform, but no transforms).

### Q15 — Admin authentication · Proposed
Recommendation: single admin, bcrypt-hashed password in an env var, signed
`httpOnly` session cookie, rate-limited login (`architecture.md` §6).
Alternatives: Auth.js with GitHub sign-in restricted to your account (no password
to manage at all), or passkeys. GitHub sign-in is worth considering.

### Q16 — Blog tooling and features · Open
- MDX pipeline: `@next/mdx` vs. a content layer (Velite / Content Collections)
  that gives typed frontmatter for free. Leaning content layer.
- Syntax highlighting: Shiki (build-time, zero JS) — proposed.
- Comments? (Giscus = GitHub Discussions, free) — open.
- Newsletter? The old footer had a non-functional Subscribe box — open.
- Categories as well as tags? — open.

### Q17 — Analytics · Open
Vercel Web Analytics (simplest, privacy-friendly), Plausible, or none.

### Q21 — Where does the admin live? · Proposed
Recommendation: `chestlyace.online/admin`. Alternative: `admin.chestlyace.online`
(cleaner separation, one more host to route).

---

## Content

### Q4 — Main-site hero headline · Open
Old: "Developer / Designer / & PHOTOGRAPHER". The main site is software-only now.
Some directions:
- "Software Engineer" (plain, recruiter-friendly)
- "Full-Stack Developer" / "Backend Engineer" (more specific — you're currently a
  backend intern at NHA Health Tech)
- A three-word stack in the old style: "Backend / Full-Stack / Mobile"

### Q5 — About text · Open
The current body describes "a multidisciplinary creator blending software
development, graphic design, and photography". Options: rewrite as engineer-only,
or keep one sentence acknowledging the creative side with a link to the
creatives site. The quote ("Blending logic with creativity…") can stay either way.

### Q6 — Creative roles in the experience timeline · Open
- **Photographer/Designer — CEY2 Youth Church** (2024–Present)
- **Graphic Designer — Kris Kitchen** (2024–Present)

Options for each: keep on main Experience, move to main **Volunteering** (CEY2
sounds like volunteer work), or move to the creatives site only.

### Q7 — Creative tools in Skills · Open
Photoshop, Lightroom, Canva → creatives site? Figma is common for engineers too —
keep on main?

### Q8 — Which socials appear on the main site? · Open
Current: Instagram, LinkedIn, GitHub, TikTok. Suggestion: main shows GitHub +
LinkedIn (+ X/email); Instagram and TikTok show on creatives. Handled by
`socials.show_on`.

### Q9 — Which email address? · Open
The old site is inconsistent: the visible text and database say
`developerace0@gmail.com`, but the contact tile's `mailto:` link points to
`chestlyace@gmail.com`. Which is canonical? (A custom-domain address like
`hello@chestlyace.online` is also an option now that the domain is on Vercel.)

### Q10 — Contact form behaviour · Open
Currently opens WhatsApp with the message prefilled — nothing is stored or emailed.
Options: keep WhatsApp only; add email delivery (e.g. Resend) as the primary path
with WhatsApp as an alternative; also store messages in a `messages` table viewable
in admin (needs spam protection, e.g. Turnstile). Subject options proposed in
`ia-content.md` §2.8.

### Q11 — Project detail pages? · Open
`/projects/[slug]` with screenshots, problem/approach/outcome, stack. Better for
showing engineering depth and for SEO; more writing per project. Schema already
supports it (`slug`, `description`). Could launch without and add later.

### Q19 — Volunteering storage · Proposed
Recommendation: same `journey` table with `type = 'volunteer'` (one admin form,
one component). Alternative: a separate `volunteering` table — only worth it if
volunteering later needs fields Journey doesn't (cause, hours, photos).

### Q22 — Certifications section? · Open
`assets/certs/` holds Google certification badges (Gen AI, LLM, Responsible AI,
Google Workspace, …) that the old site never displayed. Add a Certifications
block (e.g. under Skills), or leave them out?

---

## Design

### Q12 — Accent colours for creatives and blog · Open
Main is royal blue `#2563EB`. Each other site overrides only the accent
(`design.md` §4). Ideas: creatives → warm (amber/orange) to feel expressive;
blog → emerald (the old `secondary`) or keep blue for one family feel.

### Q13 — Drop the Outfit font? · Decided 2026-10-06 (D22)
**Answer: keep all three old fonts and add JetBrains Mono.** Outfit is used for
eyebrow labels and small uppercase text, as on the old site.
The old site loaded three fonts (Bebas Neue, Inter, Outfit). Recommendation: keep
Bebas Neue + Inter, drop Outfit, add a monospace for code.

### Q18 — Brand wordmark · Decided 2026-10-06 (D23)
**Answer: "Chestly Ace" on all three sites**, next to the old DA logo (light
backing in dark mode so it stays visible).
The logo wordmark is "DEV.ACE" (and "Dev.ACE · Since 2023" in the footer). Keep it
for all three sites, or use "Chestly Ace" on creatives/blog where "DEV" fits less?

---

## Migration

### Q20 — Cutover plan · Open
- Who runs the `pg_dump` on the EC2 host, and when? (Live data ≠ seed file.)
- Do we launch all three subdomains at once, or main first with creatives/blog
  following?
- How long does the old EC2 site stay up after DNS moves?

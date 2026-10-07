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
**Answer: Drizzle ORM**, with the `pg` driver on Prisma Postgres (D31, D32 —
updated 2026-10-06 when Neon was dropped).
Original recommendation: **Drizzle ORM** with the Neon serverless driver. Type-safe,
schema in TypeScript, plain-SQL feel, small. Alternative: Prisma (heavier,
slower cold starts on serverless).

### Q3 — Styling: Tailwind or SCSS? · Decided 2026-10-05 (D14)
**Answer: Tailwind CSS v4.**
Recommendation: **Tailwind CSS** — the old site already uses it and D13 says stay
close to it. Your general preference for separate `.scss` files would point to
**SCSS Modules** (`Component.module.scss` next to each component) instead.
They can coexist, but picking one keeps the codebase consistent. Needs your call
before any component is written.

### Q14 — Upload storage · Decided 2026-10-06
**Answer: Cloudinary.**
Recommendation: **keep Cloudinary** — existing images are already there and it
handles resizing/format conversion. Alternative: Vercel Blob (simpler, same
platform, but no transforms).

### Q15 — Admin authentication · Decided 2026-10-06
**Answer: password and a signed cookie** (as recommended; no Auth.js, no passkeys).
Recommendation: single admin, bcrypt-hashed password in an env var, signed
`httpOnly` session cookie, rate-limited login (`architecture.md` §6).
Alternatives: Auth.js with GitHub sign-in restricted to your account (no password
to manage at all), or passkeys. GitHub sign-in is worth considering.

### Q16 — Blog tooling and features · Decided 2026-10-07 (revised)
**Answer (D82–D85):** posts are written in the admin's block editor and stored in
Postgres as custom markdown; Shiki highlighting; tag pages; table of contents and a
copy button on code; **readers' own comments and likes** with GitHub/Google sign-in
(Better Auth), replacing Giscus; a newsletter (Resend Audience, double opt-in);
dev.to import/export; rich blocks and agent-session embeds. Categories: tags only
(proposed, not asked). *First answer, superseded the same day:* Velite content layer
and Giscus.
Original options: `@next/mdx` vs. a content layer (Velite / Content Collections);
Shiki; comments (Giscus); newsletter; categories.

### Q17 — Analytics · Decided 2026-10-07
**Answer: Vercel Web Analytics** (D79).
Options were Vercel Web Analytics (simplest, privacy-friendly), Plausible, or none.

### Q21 — Where does the admin live? · Decided 2026-10-06
**Answer: `admin.chestlyace.online`** (not the recommended `/admin` path). It is
a fourth host in the same app; see `architecture.md` §3 and §6.
Recommendation was `chestlyace.online/admin`. Alternative: `admin.chestlyace.online`
(cleaner separation, one more host to route).

---

## Content

### Q4 — Main-site hero headline · Decided 2026-10-06
**Answer: Software Engineer.** Hero headline lines are "SOFTWARE / ENGINEER" plus a rotating outlined line (`design.md` §14.1, D54).
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

### Q6 — Creative roles in the experience timeline · Decided 2026-10-06
**Answer: both creative roles move to the creatives site.** Removed from the main dev seed.
- **Photographer/Designer — CEY2 Youth Church** (2024–Present)
- **Graphic Designer — Kris Kitchen** (2024–Present)

Options for each: keep on main Experience, move to main **Volunteering** (CEY2
sounds like volunteer work), or move to the creatives site only.

### Q7 — Creative tools in Skills · Decided 2026-10-06
**Answer: keep Figma on main; Photoshop, Lightroom, and Canva move to the creatives site.**
Photoshop, Lightroom, Canva → creatives site? Figma is common for engineers too —
keep on main?

### Q8 — Which socials appear on the main site? · Decided 2026-10-06
**Answer: all four socials (Instagram, LinkedIn, GitHub, TikTok) show on the main site.**
Current: Instagram, LinkedIn, GitHub, TikTok. Suggestion: main shows GitHub +
LinkedIn (+ X/email); Instagram and TikTok show on creatives. Handled by
`socials.show_on`.

### Q9 — Which email address? · Decided 2026-10-06
**Answer: `chestlyace@gmail.com`.**
The old site is inconsistent: the visible text and database say
`developerace0@gmail.com`, but the contact tile's `mailto:` link points to
`chestlyace@gmail.com`. Which is canonical? (A custom-domain address like
`hello@chestlyace.online` is also an option now that the domain is on Vercel.)

### Q10 — Contact form behaviour · Decided 2026-10-06
**Answer: email plus WhatsApp.** The email service and spam protection still need the owner's approval before they are built (Phase 5b.5).
Currently opens WhatsApp with the message prefilled — nothing is stored or emailed.
Options: keep WhatsApp only; add email delivery (e.g. Resend) as the primary path
with WhatsApp as an alternative; also store messages in a `messages` table viewable
in admin (needs spam protection, e.g. Turnstile). Subject options proposed in
`ia-content.md` §2.8.

### Q11 — Project detail pages? · Decided 2026-10-06
**Answer: project pages at launch** (`/projects/[slug]`, `design.md` §14.10).
`/projects/[slug]` with screenshots, problem/approach/outcome, stack. Better for
showing engineering depth and for SEO; more writing per project. Schema already
supports it (`slug`, `description`). Could launch without and add later.

### Q19 — Volunteering storage · Decided 2026-10-06 (D33)
**Answer: a separate `volunteering` table.**
Original recommendation: same `journey` table with `type = 'volunteer'` (one admin form,
one component). Alternative: a separate `volunteering` table — only worth it if
volunteering later needs fields Journey doesn't (cause, hours, photos).

### Q22 — Certifications section? · Decided 2026-10-06
**Answer: add a Certifications block under Skills** (`design.md` §13.17, §14.3; seven Google badges seeded).
`assets/certs/` holds Google certification badges (Gen AI, LLM, Responsible AI,
Google Workspace, …) that the old site never displayed. Add a Certifications
block (e.g. under Skills), or leave them out?

---

## Design

### Q12 — Accent colours for creatives and blog · Blog decided 2026-10-07; creatives open
**Blog: keep the main blue** (no override, `design.md` §4; D82). Creatives still open.
Main is royal blue `#2563EB`. Each other site overrides only the accent
(`design.md` §4). Ideas: creatives → warm (amber/orange) to feel expressive;
blog → emerald (the old `secondary`) or keep blue for one family feel.

### Q13 — Drop the Outfit font? · Decided 2026-10-06 (D38, revised)
**Final answer (Phase 5a.1): drop Outfit** — Bebas Neue + system UI/Inter +
JetBrains Mono (D38). Earlier answer, superseded: keep all three old fonts and add JetBrains Mono. Outfit was used for
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

### Q20 — Cutover plan · Decided 2026-10-07
**Answer: the owner migrates locally; main + admin go first; the old site stays up 14 days.**
- The owner runs the `pg_dump` on the EC2 host and the migration on their own machine (`docs/migration.md`, D78).
- `chestlyace.online` (with `www` and the old-URL redirects) and `admin.chestlyace.online` move to Vercel first; creatives and blog follow with Phases 9–10. **Amended 2026-10-07 (D81):** creatives and blog are added to Vercel at the same cutover, as short "coming soon" pages, and are indexed from launch.
- The old EC2 site stays up, read-only, for 14 days after DNS moves, then is shut down.
Original questions: who runs the `pg_dump` (live data ≠ seed file), launch all subdomains at once or main first, and how long the old site stays up.

### Q23 — The public email address · Open
`hello@chestlyace.online` is a requirement (owner, 2026-10-07; mailbox on Zoho Mail's
free plan, `docs/launch.md`). Q9 chose `chestlyace@gmail.com` as the address shown
on the site. Once `hello@` works, does it **replace** `chestlyace@gmail.com`
everywhere the site shows or uses an email (profile, contact tile, footer,
JSON-LD, where the contact form delivers), or only send the contact form's mail
and receive it alongside the Gmail address? It is one field in the admin
(Profile → Email) either way.

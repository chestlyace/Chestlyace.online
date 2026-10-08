# Development Phases

**Status: approved by the owner (PR #4).**

Work moves one phase at a time. A phase is **Done** only when the owner has
merged its pull request (`instructions.md` §1). Each phase is one GitHub issue
and one pull request unless the owner agrees to split it.

**Blocking questions** must be answered by the owner (see `open-questions.md`)
before the phase starts.

| # | Phase | Status | Blocking questions |
|---|---|---|---|
| 0 | Planning & workflow | Done | — |
| 1 | Project scaffold | Done | Q2, Q3 (decided) |
| 2 | Multi-tenant routing | Done | — |
| 3 | Design system & shared layout | Done (placeholder baseline, D30) | Q13, Q18 (decided) |
| 4 | Database | Done | Q19 (decided) |
| 5 | Main site homepage | Done (5a: PRs #18–#24; 5b: PRs #26–#36). Q5 stays open: the About text is a placeholder | Q4, Q6–Q11, Q22 answered (issue #15); Q5 open |
| 6 | Admin panel | 6a done (PR #38); 6b.1 done (PR #40); 6b.2 done (PR #42); 6b.3 done (PR #44); 6b.4 in review | Q14, Q15, Q21 (decided) |
| 7 | SEO & redirects | Done (7.1: PR #48; 7.2: PR #50) | — |
| 8 | Main site launch | 8.1 done (PR #52); 8.2 done (PR #54); 8.3 done (PR #56); 8.4a done (PR #58); 8.4b in review (issue #59); then the owner runs the cutover (`docs/launch.md`) | Q17, Q20 (answered 2026-10-07) |
| 9 | Blog | 9a done (PR #62); 9b.1 done (PR #64); 9b.2 done (PR #66); 9b.3a done (PR #68); 9b.3b done (PR #70); 9b.3c done (PR #72); 9b.4 done (PR #74); 9b.5a done (PR #76); 9b.5b done (PR #78); 9b.5c done (PR #80); 9b.6a done (PR #82); 9b.6b done (PR #84); 9b.7 in review (issue #85) | Q12 (blog: decided), Q16 (decided) |
| 10 | Creatives site | 10a done (PR #88); 10b.1 in review (issue #89); 10b.2–10b.7 after it | Q1, Q12 (decided 2026-10-08) |

The main site ships first (Phases 1–8). The blog and creatives site follow on
the same foundation.

**Design steps (D30).** Every phase that builds pages (5, 6, 9, 10) starts with a
**design step** (`a`): a docs-only pull request that writes the specs into
`design.md` §13–14 — components first, then sections — from the owner's
references. The **build step** (`b`) starts only after the owner merges the
design step. A design step may be split into several issues if the owner wants
(e.g. one per component group). See `instructions.md` §8 and `design.md` §12.

---

## Phase 0 — Planning & workflow

**Goal:** agree on what we're building and how agents work.

- Planning docs (`docs/`) — issue #1, PR #2 (merged)
- `instructions.md`, `chestlyace-workflow` skill, this phase plan — issue #3, PR #4 (merged)

**Done when:** both PRs are merged.

## Phase 1 — Project scaffold — issue #5, PR #6 (merged)

**Goal:** an empty Next.js app that builds, lints, and deploys.

- Next.js 16 (App Router) + TypeScript `strict`, pnpm 10, Node 24 (D16)
- Styling setup: Tailwind CSS v4 (D14), no tokens yet
- ESLint + Prettier, `typecheck` / `lint` / `format` / `build` scripts
- Folder skeleton from `architecture.md` §4 (only folders this phase needs)
- `.env.example` listing every variable from `architecture.md` §8, with no values
- CI: Vercel's build on every pull request (D17)
- Vercel project connected; preview deploys working

**Done when:** a placeholder page deploys on a Vercel preview URL and its Vercel
build is green.
**Refs:** `architecture.md` §2, §4, §8, §9.

## Phase 2 — Multi-tenant routing — issue #7, PR #8 (merged)

**Goal:** one app answers as three sites depending on the host.

- `lib/sites.ts` with the three sites and URL helpers
- `proxy.ts` rewriting to `app/sites/<site>/` (D19); unknown hosts → main
- `/api/*` and `/admin/*` return 404 on creatives and blog hosts
- Placeholder root layout + page + 404 for each site, each with its own metadata
- `*.localhost` local dev; `?site=` override on preview deployments only,
  remembered in a cookie (D21)
- Tests for host → site resolution and routing decisions, with Vitest (D20)

**Done when:** `localhost:3000`, `creatives.localhost:3000`, and
`blog.localhost:3000` each show their own placeholder, locally and on preview.
**Refs:** `architecture.md` §3, §4.

## Phase 3 — Design system & shared layout — issue #9, PR #10 (merged)

**Goal:** the visual foundation every page is built from. Its visual values are
a placeholder baseline (D30); the design steps of later phases replace them.

- Colour tokens for light and dark (`design.md` §2), main-site accent (§4)
- Fonts via `next/font` (§3, D22), type scale
- Radius, spacing, shadow rules (§5)
- Icon setup: Lucide (§6, D24)
- Theme: system / light / dark, no flash, cookie shared across subdomains (§7)
- Shared components: `Container`, `Button`, `SectionHeading`, `Tag`,
  `StatusPill` (open state, D29), `ThemeToggle`, `SiteHeader`, `SiteFooter` (§9)
- Header and footer on all three placeholder sites, with cross-site links —
  structure only (D26); preview links stay on the preview (D28)
- `/design-system` showcase page, previews only (D27)

**Done when:** the shared components render correctly in both themes at phone
and desktop widths, on all three hosts, and the theme carries across hosts.
**Refs:** `design.md`, `ia-content.md` §3.

## Phase 4 — Database — issue #13, PR #14 (merged)

**Goal:** the main site's data layer, empty but ready.

- Prisma Postgres via the Vercel Marketplace (D31): one database for
  Production, one for Preview + Development — provisioned by the owner
- Drizzle schema for all tables in `content-schema.md` §1, incl. `volunteering`
  (D33) and timestamps + `updated_at` trigger on every table (D34)
- Migrations and the commands to run them (`db:generate`, `db:migrate`)
- Typed query functions for the homepage (read only), over `pg` (D32)
- Dev-only seed script using the old site's data, adapted to the new schema
- Tests against PGlite (D35)

**Done when:** migrations run cleanly on a fresh database and the seed loads.
**Refs:** `content-schema.md` §1, §6; `architecture.md` §5.

## Phase 5 — Main site homepage

**Goal:** the full public homepage, reading from the database.

**5a — Design (docs only).** Specs for every component the homepage uses —
including the shared header, footer, buttons, links, and cards — then every
section, from the owner's references. Tools the owner names (e.g. Framer Motion)
are recorded here. Split into four PRs (owner, 2026-10-06):

| Step | Covers | Status |
|---|---|---|
| 5a.1 Foundations — issue #15 | Direction, colour, type, spacing, depth, icons, theming, motion (`design.md` §1–§8) | Done (PR #18) |
| 5a.2 Core components — issue #19 | Buttons, links, tags, header/nav, footer (`design.md` §13.1–13.9) | Done (PR #20) |
| 5a.3 Content components — issue #21 | Project card, service card, timeline item, contact tiles, form fields, FAQ, certification item (`design.md` §13.10–13.17) | Done (PR #22) |
| 5a.4 Sections — issue #23 | Every homepage section and the project detail page (`design.md` §14) | Done (PR #24) |

Design skills (D36) were installed beforehand (issue #16, PR #17).

**5b — Build**, after 5a is merged. Split into six PRs (owner, 2026-10-06):

| Step | Covers | Status |
|---|---|---|
| 5b.1 Foundations + core components — issue #25 | Packages (`motion`, `gsap`, `lenis`); tokens and fonts; smooth scroll; button, icon button, text link, tag, status pill, skip link, section heading; header capsule + Sites menu; giant-wordmark footer; `/design-system` (`design.md` §1–§8, §13.1–13.9, §14.0) | Done (PR #26) |
| 5b.2 Data layer — issue #27 | Certifications table; `problem`, `approach`, `outcome`, `gallery_urls` on `projects`; `profile.headline_words`; migrations; seed (Q4, Q6, Q7, Q9, certifications); queries (project by slug, next project); footer link mapper; cached reads with the `portfolio` tag; tests. Pages and layouts are wired to the data from 5b.3 | Done (PR #28) |
| 5b.3 Hero — issue #29 | `design.md` §14.1 with all its motion and the WebGL grid; installs `ogl`, `devicon`, `simple-icons`, `react-iconly`; the homepage and the footer now read the database | Done (PR #30) |
| 5b.4 About · Skills · Services · Projects — issue #31 | §13.10–13.12, §13.17, §14.2–14.5, including the project ripple; the Devicon sync script; page wiring (numbers and bands follow the sections shown); seed placeholders for services and About | Done (PR #32) |
| 5b.5 Experience · Volunteering · Contact · FAQ — issue #33 | §13.13–13.16, §14.6–14.9; the contact route (Resend email; honeypot, minimum time and per-IP limit), WhatsApp QR (`qrcode`), logo images in `public/logos/` | Done (PR #34) |
| 5b.6 Project page — issue #35 | §14.10, including the card → page morph (and back); `/projects/[slug]` for every published project | Done (PR #36) |

Also part of 5b, in the PR that needs it:

- Wiring the pages and the footer to the data (from 5b.3, once both databases are migrated)
- Contact form behaviour per Q10 (5b.5)
- Copy edits from `ia-content.md` §7 using the owner's wording. Until it arrives,
  placeholder copy lives in one marked file, `content/copy.ts` (D63)
- Each PR installs only the packages it uses (D24). `@rive-app/react-canvas` (D39)
  is not installed unless a section spec calls for it; none does yet

**Done when:** the homepage matches `ia-content.md` §2 with seeded data, in both
themes and at all widths, and passes the accessibility checklist (`design.md` §10).
**Refs:** `ia-content.md` §2, §7; `design.md` §8–10.
This phase is large. Splitting it into sub-issues is an option for the owner.

## Phase 6 — Admin panel

**Goal:** the owner can edit all main-site content without SQL.

**6a — Design (docs only) — issue #37.** Specs for the admin's components and
screens (`design.md` §13.18–13.26, §14.11), the owner's answers to Q14, Q15 and
Q21 (decisions D71, D72), and the doc changes that follow from the admin moving to
`admin.chestlyace.online`.

**6b — Build**, after 6a is merged. Split into four PRs (owner, 2026-10-06):

| Step | Covers | Status |
|---|---|---|
| 6b.1 Host, login, shell — issue #39 | The `admin` host and per-host API routing; login/logout, session cookie, rate limit; the shell, dashboard and admin 404; `pnpm admin:hash` | Done (PR #40) |
| 6b.2 API and simple resources — issue #41 | `/api/admin/*` with Zod; the list, editor, switch, field, dialog, toast and save-bar components; skills, services, certifications, socials, FAQ; revalidation | Done (PR #42) |
| 6b.3 Projects, experience, volunteering, profile — issue #43 | The remaining resources, with the slug and gallery fields, the Experience tabs, and the profile editor | Done (PR #44) |
| 6b.4 Uploads — issue #45 | Cloudinary signature route and the upload field wired into every image and file field | In review |

The whole of 6b covers:

- The `admin` host: site key, `lib/sites.ts` and `proxy.ts` routing (API routes
  per host), its own root layout, `noindex`
- Login/logout, session cookie, rate limiting (per Q15)
- Admin API for every resource (`content-schema.md` §2), Zod-validated
- Admin UI: list, create, edit, delete, reorder, publish toggle
- Uploads per Q14 (`content-schema.md` §3)
- Revalidation of the homepage after each write

**Done when:** every homepage section can be edited from the admin and the change
shows on the public page.
**Refs:** `architecture.md` §6; `content-schema.md` §2, §3; `design.md` §9 (Admin).

## Phase 7 — SEO & redirects

**Goal:** search engines keep finding the site after the move.

- Per-site metadata, canonical URLs, Open Graph/Twitter tags
- JSON-LD: `Person`, `WebSite`, `FAQPage`
- Per-host `sitemap.xml` and `robots.txt`
- Redirects for old URLs (`ia-content.md` §6); `/resume.pdf` route
- Favicons and static files moved per `ia-content.md` §5

Split into two PRs (owner, 2026-10-07):

| Step | Covers | Status |
|---|---|---|
| 7.1 Metadata, structured data, sitemap, robots — issue #47 | Per-site metadata, canonical and Open Graph/Twitter tags; JSON-LD; per-host `sitemap.xml` and `robots.txt`; the `SITE_INDEXING` switch; `public/og/main.webp` | Done (PR #48) |
| 7.2 Redirects and static files — issue #49 | Old-URL redirects (308), `www` → apex, `/resume.pdf`, favicons, the `#work` / `#journey` anchors | Done (PR #50) |

**Done when:** every old URL redirects correctly and the structured data validates.
**Refs:** `ia-content.md` §4–6.

## Phase 8 — Main site launch

**Goal:** chestlyace.online runs on the new app with real data.

- One-off migration script: live EC2 database → new schema (`content-schema.md` §6)
- Load into Prisma Postgres; move files referenced by bare filenames
- Analytics per Q17
- Domains on Vercel; DNS cutover; old server shutdown plan (Q20)

Split into PRs (owner, 2026-10-07; Q17 and Q20 answered; 8.4 added for the launch decisions):

| Step | Covers | Status |
|---|---|---|
| 8.1 Migration from the old live database — issue #51 | `pnpm migrate:old` (dry run by default, `--write` to load), tests, the runbook `docs/migration.md` | Done (PR #52) |
| 8.2 Analytics — issue #53 | Vercel Web Analytics on the public sites (not the admin) | Done (PR #54) |
| 8.3 Launch runbook — issue #55 | Per-site `SITE_INDEXING`; `docs/launch.md`: accounts, environment variables, preview checks, DNS and Vercel domains for main + admin, verification, the 14-day grace period and shutdown of the old EC2 site | Done (PR #56) |
| 8.4a Placeholder design and launch decisions — issue #57 | Docs only: `design.md` §14.12 (the coming-soon page for creatives and blog), `docs/launch.md` (creatives and blog at cutover and indexed; `hello@chestlyace.online` on Zoho Mail), D81, Q23 | Done (PR #58) |
| 8.4b Placeholder pages — issue #59 | Build §14.12: the `ComingSoon` page on creatives (`/` and `/services`) and blog | In review |

**Done when:** chestlyace.online is served by Vercel with the owner's real
content, and the owner has checked it. (The cutover itself is the owner's,
following `docs/launch.md`.)
**Refs:** `architecture.md` §9, §10.

## Phase 9 — Blog

**Goal:** blog.chestlyace.online: posts written in the admin without typing
markdown, with rich interactive blocks, dev.to import/export, and readers'
likes, comments and sharing (D82–D85).

**9a — Design (docs only) — issue #61.** Specs for the blog's components and
pages (`design.md` §13.27–13.50, §14.13–14.19), the custom markdown
(`docs/blog-markdown.md`), the database model (`content-schema.md` §4), the blog
accent (Q12) and the decisions D82–D85 (Q16). Revised on 2026-10-07 after the
owner's references (linear.app/blog, dev.to, two yokwejuste.me posts).

**9b — Build**, after 9a is merged, in separate PRs (owner, 2026-10-07), each
reviewed and merged before the next:

| Step | Covers | Status |
|---|---|---|
| 9a Design | The specs above | Done (PR #62) |
| 9b.1 Database and public blog | `blog_*` tables and migration; the markdown renderer (CommonMark + GFM, Shiki, heading ids, the plain blocks: callout, image, code); blog home, post page, tags, RSS, sitemap, `BlogPosting` JSON-LD, header/footer, the coming-soon fallback; a sample post by seed | Done (PR #64) |
| 9b.2 Rich blocks | Steps, compare, file tree, typewriter, code group, diff, terminal, flow canvas, quiz: parsers, server dispatcher, client components, the sample post showing each | Done (PR #66) |
| 9b.3a Admin: posts, editor core, publishing | The Blog group in the admin: posts list and API, post details, the block list (drag, move, insert menu, `/`), forms for the text and media blocks, Raw markdown, preview, Markdown tab, autosave, publish, cover and image uploads | Done (PR #68) |
| 9b.3b Admin: interactive block forms | Forms for code group, diff (adds the `diff` package), terminal, typewriter, file tree, steps, compare and quiz | Done (PR #70) |
| 9b.3c Admin: flow canvas editor | The flow-canvas editor | Done (PR #72) |
| 9b.4 DEV import and export | Import dialog, "Publish to DEV", the conversions of `docs/blog-markdown.md` §3–§4 | Done (PR #74) |
| 9b.5a Likes and share | The reaction bar: likes without an account (a hashed cookie, `blog_likes`, the blog API, a rate limit) and share (the system sheet or a menu) | Done (PR #76) |
| 9b.5b Readers: sign-in and comments | Better Auth with GitHub and Google, comments (composer, replies, likes on comments, reports, delete, the owner's email), the signed-in chip, the privacy page | Done (PR #78) |
| 9b.5c Comment moderation | The Comments screen in the admin: hide, show, delete, ban a reader, mark the author's account | Done (PR #80) |
| 9b.6a Agent sessions: upload | The session file parser, the redaction rules, the `agent_sessions` table, upload, and the editor's Agent session form (turn picker, redaction review) | Done (PR #82) |
| 9b.6b Agent sessions: replay | The public replay block and the markdown `session` block | Done (PR #84) |
| 9b.7 Newsletter | The signup box, double opt-in, the confirmation page | In review (issue #85) |

**Dependencies 9b adds** (named here so merging 9a approves them, D82–D85; each
is installed in the step that first needs it): `unified`, `remark-parse`,
`remark-gfm`, `remark-rehype`, `rehype-slug` and `hast-util-to-jsx-runtime` (the
markdown renderer, 9b.1); `shiki` and `@shikijs/rehype` (highlighting, 9b.1);
`diff` (the editor's before/after view, so 9b.3b: the Diff block itself reads the
`+`/`-` lines the author marked and needs no package); `better-auth` (reader sign-in,
9b.5). No editor, canvas or diagram library: the block editor, flow canvas and
replay are built from what the project already uses (Motion, GSAP, Lucide, Simple
Icons). Newsletter and DEV use `fetch`, as the contact form does.

**New environment variables, and what the owner sets up** (each step's PR says
when): `BETTER_AUTH_SECRET`, `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` (a GitHub
OAuth app with its callback on the blog host) and `GOOGLE_CLIENT_ID` /
`GOOGLE_CLIENT_SECRET` (a Google OAuth client) for 9b.5; `DEVTO_API_KEY` for 9b.4;
`RESEND_AUDIENCE_ID` and `NEWSLETTER_SECRET` for 9b.7.

**Done when:** a post written in the editor — with a steps block, a terminal, a
quiz and an agent session — publishes, renders in both themes, appears in RSS and
can be liked, commented on and shared; a DEV article imports and a post exports.

## Phase 10 — Creatives site

**Goal:** creatives.chestlyace.online with design and photography work.

**10a — Design (docs only).** Specs for the creatives site's components (masonry
gallery, tile, filters, event tile, lightbox, details and credits, the home page's
animation pieces, contact block) and pages (home, Graphic design, Photography and
its event pages, Services, admin screens), plus its accent colour (Q12). Decisions:
D86, D87.

**10b — Build**, after 10a is merged (split further, with the owner's agreement, as
the blog's 9b was):

- The creatives tables and their admin screens (D86, `content-schema.md` §5), with
  images on Cloudinary and revalidation of the creatives pages
- Gallery with filters, lightbox and piece pages; photography events and event pages;
  the services page; the home page and its animations; the contact block
- Import of the old design/event entries and service copy
- Accent colour (Q12), SEO, redirects from the old design/photography pages

| Step | Content | Status |
|---|---|---|
| 10b.1 Tables and admin API | The creatives tables, their admin API, the upload folder and the cache tag | In review (issue #89) |
| 10b.2 Admin screens | The Creatives group: design pieces, events, services and questions, settings | Not started |
| 10b.3 Graphic design | The gallery, tiles, filters, lightbox, header and footer, contact block, the orange accent | Not started |
| 10b.4 Photography | The events page and the event pages | Not started |
| 10b.5 Services and launch work | The services page, the import of the old entries, SEO and redirects | Not started |
| 10b.6 Home: the doodle hero | The full-screen doodle scene and the hero | Not started |
| 10b.7 Home: the rest | The marquee, the portals, the pinned strip, the services teaser | Not started |

**Done when:** content published in the admin appears on the site without a deploy.

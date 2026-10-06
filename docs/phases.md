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
| 5 | Main site homepage | 5a.1 in review | Q4, Q6–Q11, Q22 answered (issue #15); Q5 open |
| 6 | Admin panel | Not started | Q14, Q15, Q21 |
| 7 | SEO & redirects | Not started | — |
| 8 | Main site launch | Not started | Q17, Q20 |
| 9 | Blog | Not started | Q12, Q16 |
| 10 | Creatives site | Not started | Q1, Q12 |

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
| 5a.1 Foundations — issue #15 | Direction, colour, type, spacing, depth, icons, theming, motion (`design.md` §1–§8) | In review |
| 5a.2 Core components | Buttons, links, tags, header/nav, footer | Not started |
| 5a.3 Content components | Project card, service card, timeline item, contact tiles, form fields, FAQ, certification item | Not started |
| 5a.4 Sections | Every homepage section and the project detail page (Q11) | Not started |

Design skills (D36) were installed beforehand (issue #16, PR #17).

**5b — Build**, after 5a is merged:

- Sections in order: Hero, About, Skills, Services (+ creatives card),
  Projects, Experience, Volunteering, Contact, FAQ (`ia-content.md` §2)
- Section components from `design.md` §9
- Header: main's in-page links. Footer: socials, email, resume, per-site
  descriptions (D26)
- Install devicon and Simple Icons for Skills and socials (D24), `react-iconly`
  (D40), and the motion stack — `motion`, `gsap`, `lenis`, `ogl`,
  `@rive-app/react-canvas` (D39); apply the foundations (`design.md` §1–§8) to the
  tokens and fonts
- Caching with the `portfolio` tag
- Contact form behaviour per Q10
- Copy edits from `ia-content.md` §7, using the owner's wording

**Done when:** the homepage matches `ia-content.md` §2 with seeded data, in both
themes and at all widths, and passes the accessibility checklist (`design.md` §10).
**Refs:** `ia-content.md` §2, §7; `design.md` §8–10.
This phase is large. Splitting it into sub-issues is an option for the owner.

## Phase 6 — Admin panel

**Goal:** the owner can edit all main-site content without SQL.

**6a — Design (docs only).** Specs for the admin's components and screens.

**6b — Build**, after 6a is merged:

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

**Done when:** every old URL redirects correctly and the structured data validates.
**Refs:** `ia-content.md` §4–6.

## Phase 8 — Main site launch

**Goal:** chestlyace.online runs on the new app with real data.

- One-off migration script: live EC2 database → new schema (`content-schema.md` §6)
- Load into Prisma Postgres; move files referenced by bare filenames
- Analytics per Q17
- Domains on Vercel; DNS cutover; old server shutdown plan (Q20)

**Done when:** chestlyace.online is served by Vercel with the owner's real
content, and the owner has checked it.
**Refs:** `architecture.md` §9, §10.

## Phase 9 — Blog

**Goal:** blog.chestlyace.online with MDX posts.

**9a — Design (docs only).** Specs for the blog's components (post card, post
header, prose, code block, callout, table of contents) and pages, plus its accent
colour (Q12).

**9b — Build**, after 9a is merged:

- MDX pipeline and frontmatter validation (`content-schema.md` §4, Q16)
- Post list, post page, tag pages, RSS feed
- Blog components (`design.md` §9) and accent colour (Q12)
- Blog SEO: metadata, `BlogPosting` JSON-LD, sitemap

**Done when:** a sample post builds, renders in both themes, and appears in RSS.

## Phase 10 — Creatives site

**Goal:** creatives.chestlyace.online with design and photography work.

**10a — Design (docs only).** Specs for the creatives site's components (gallery,
filters, lightbox, piece page) and pages, plus its accent colour (Q12).

**10b — Build**, after 10a is merged:

- CMS set up per Q1, with the content model from `content-schema.md` §5
- Gallery with filters, piece pages, lightbox, services page
- Import of the old design/event entries and service copy
- Publish webhook → revalidation
- Accent colour (Q12), SEO, redirects from the old design/photography pages

**Done when:** content published in the CMS appears on the site without a deploy.

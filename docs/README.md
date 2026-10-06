# chestlyace.online — Planning Docs

These documents are the source of truth for building the new chestlyace.online.
Read them before writing code. When code and docs disagree, either the code is
wrong or the doc needs updating in the same change.

The old site (`chestlyace/portfolio-webpage`) is **reference only**: plain
HTML/Tailwind CDN + vanilla JS, an Express API, PostgreSQL on an EC2 box,
Cloudinary uploads, and a password-gated admin panel. Nothing from it is reused
as code; its content and data are migrated.

## Documents

| File | What it covers |
|---|---|
| [`architecture.md`](./architecture.md) | One Next.js app serving three subdomains, routing by host, folder layout, hosting on Vercel, environments, migration off EC2 |
| [`content-schema.md`](./content-schema.md) | Postgres schema for the main site, admin API, uploads, MDX frontmatter for the blog, draft content model for the creatives site, old → new data mapping |
| [`design.md`](./design.md) | Visual direction, design tokens (light + dark), typography, component inventory, theming across subdomains |
| [`ia-content.md`](./ia-content.md) | Sitemap per subdomain, section-by-section page breakdown, navigation, SEO, redirects from old URLs, copy that has to change |
| [`open-questions.md`](./open-questions.md) | Everything deliberately left undecided, with options and a recommendation where there is one |
| [`phases.md`](./phases.md) | Development phases in order, what each delivers, and which open questions block it |

Agents: read [`../instructions.md`](../instructions.md) before any work.

## Decisions log

Settled during the planning session. Change one only by updating this table and
every doc that depends on it.

| # | Decision | Notes |
|---|---|---|
| D1 | **Monorepo, single Next.js app, multi-tenant routing by host** | `chestlyace.online`, `creatives.chestlyace.online`, `blog.chestlyace.online` all served by one app |
| D2 | **Hosted on Vercel**; EC2 + nginx retired | Postgres moves to a managed provider — **Prisma Postgres** (D31; was Neon) |
| D3 | **Main site stays database-driven** | Same Postgres approach as before, rebuilt with Next.js Route Handlers and a rebuilt admin panel |
| D4 | **Main site sells Chestly as a software engineer only** | No design or photography work on it |
| D5 | **Design + photography move to `creatives.chestlyace.online`** | Own content source, separate from the main database |
| D6 | **Creatives site uses a headless CMS** | Which one is open (see `open-questions.md` Q1) |
| D7 | **Blog lives at `blog.chestlyace.online`, posts are MDX files in the repo** | Publishing = committing |
| D8 | **`works` narrows to software projects only** | Design and event rows leave the main database |
| D9 | **Services: condensed, software only, with one link out to the creatives site** | The old `software-development.html` page folds into the homepage — no separate services page |
| D10 | **Volunteering is a new top-level section on the main site** | Same fields as a Journey entry, rendered in its own section |
| D11 | **Shared header/footer across all three subdomains** | Each links to the other two |
| D12 | **Existing copy and data carry over; the redesign is visual** | Copy that mentions design/photography still needs editing — see `ia-content.md` |
| D13 | ~~**Visual direction stays close to the current site**~~ | **Superseded by D30.** Dark/light toggle kept, rounded cards, Tailwind — a polish and consistency pass |
| D14 | **Styling: Tailwind CSS v4** | Q3. Tokens in `app/globals.css` via `@theme` |
| D15 | **Database access: Drizzle ORM** | Q2. With the standard `pg` driver (D32; was the Neon serverless driver) |
| D16 | **Tooling: Next.js 16, Node 24 LTS, pnpm 10** | pnpm 10 because it's the newest major Vercel supports without extra settings |
| D17 | **CI: Vercel's build on each PR only — no GitHub Actions** | Lint, format, and tests run locally before every PR |
| D18 | **Keep Next.js's managed block in `AGENTS.md`** | Points agents to the bundled Next.js 16 docs; `next dev` re-adds it anyway |
| D19 | **Site folders are `app/sites/<site>/`, not `app/_sites/<site>/`** | Next.js excludes `_` folders from routing, so the original path could never render. No `app/layout.tsx`; each site is its own root layout with its own 404 |
| D20 | **Tests: Vitest** | `pnpm test`; run locally before every PR |
| D21 | **Preview `?site=` is remembered in a `preview-site` cookie** | Non-production only; `?site=main` switches back |
| D22 | ~~**Fonts: Bebas Neue, Inter, Outfit, JetBrains Mono**~~ | **Superseded by D38.** Q13. Outfit = eyebrow labels / small uppercase text |
| D23 | **Wordmark: "Chestly Ace" everywhere, beside the old DA logo** | Q18. Light backing behind the logo in dark mode |
| D24 | **Icons installed when first needed** | Lucide in Phase 3; devicon + Simple Icons in Phase 5 |
| D25 | **Site labels: Dev · Creatives · Blog** | Same in header and footer; replaces "Software" / "Main" |
| D26 | **Header/footer: structure in Phase 3, data in Phase 5** | Main's in-page links, footer socials, email, resume, and per-site descriptions arrive with the homepage |
| D27 | **`/design-system` showcase page, previews only** | Returns 404 in production |
| D28 | **On Vercel previews, cross-site links stay on the preview via `?site=`** | `siteUrl()` uses `VERCEL_BRANCH_URL` when `VERCEL_ENV === "preview"` |
| D29 | **StatusPill: "open" state only for now** | Other availability states decided with the profile data |
| D30 | **Design is owner-led; no design is final** | Phase 3's look is a placeholder baseline. Each page is designed component by component, then section by section, from the owner's references and tools, written into `design.md` and approved by merge before anything is built. Supersedes D13. See `instructions.md` §8 |
| D31 | **Database: Prisma Postgres via the Vercel Marketplace (replaces Neon)** | Free plan: 500 MB, 200k operations/month, no sleeping. One database for Production, a second shared by Preview + local Development |
| D32 | **Driver: `pg` (node-postgres) with Drizzle** | As Prisma's and Drizzle's docs recommend. `DATABASE_URL` at runtime; migrations use `DIRECT_URL` when set |
| D33 | **Volunteering has its own table** | Q19. Same columns as `journey`, without `type` |
| D34 | **`created_at` / `updated_at` on every table; a DB trigger keeps `updated_at` current** | Correct even for edits made outside the app |
| D35 | **DB tests run on PGlite** | Real migrations and queries against in-process Postgres; no database needed to run `pnpm test` |
| D36 | **Design skills vendored in `.claude/skills/`, advisory only** | Emil Kowalski's web skills, `ui-ux-pro-max`, `design-taste-frontend`, `impeccable` (PR #17). Owner specs win; skills never add dependencies or styles (`instructions.md` §8.6) |
| D37 | **Palette: black, white, greys + blue accent** | The old site's colours with Apple-like neutral greys; blue `#2563EB` is the only accent. `design.md` §2 |
| D38 | **Fonts: Bebas Neue (display) + system UI → Inter (text) + JetBrains Mono (labels, code)** | SF on Apple devices via the system font. Outfit dropped. Supersedes D22. `design.md` §3 |
| D39 | **Motion stack: Motion + GSAP (ScrollTrigger, SplitText, Flip) + Lenis + OGL/Rive** | Each with one job; installed in Phase 5b. Curves, durations, principles, reduced motion in `design.md` §8 |
| D40 | **Icons: Lucide (functional) + free Iconly v2 Light (featured)** | Amends D24: `react-iconly` joins devicon and Simple Icons in Phase 5b. `design.md` §6 |
| D41 | **Direction: airy, minimal, Apple-like, with signature smooth motion** | References: anubi.io (home, lab, work) and Apple. Supersedes the baseline direction. `design.md` §1 |

## Status

Planning phase. No application code yet.

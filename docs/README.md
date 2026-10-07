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
| [`launch.md`](./launch.md) | The owner's cutover checklist: Vercel, environment variables, DNS, verification, retiring the old server |
| [`migration.md`](./migration.md) | Runbook for loading the old site's live data into the new database |
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
| D42 | **Buttons: magnetic pills** | Pull toward the cursor (fine pointers only), spring back; `primary` / `secondary` / `ghost`; new `primary-hover` token. `design.md` §13.1 |
| D43 | **Links: text roll; inline links draw an underline** | Text roll for nav, footer, standalone links; links in running text keep a faint underline and draw a full one on hover. `design.md` §13.3 |
| D44 | **Header: floating glass capsule in the old site's shape and position** | Centred, 16px from the top, max 896px, `rounded-full`. Key links + "Sites" chip (replaces the header's separate cross-site links); expands into the menu on phones. `design.md` §13.6–13.7, `ia-content.md` §3 |
| D45 | **Footer: giant wordmark** | Sites, Connect, Contact columns and a full-width "CHESTLY ACE" revealed on scroll; Quick links column dropped. `design.md` §13.8, `ia-content.md` §3 |
| D46 | **Tags: mono label chips** | JetBrains Mono `label` step, `sm` radius, neutral fill. `design.md` §13.4 |
| D47 | **Project card: image-forward tile** | anubi.io/work style: image, mono label, title + `↗`; hover zoom and a "View ↗" cursor label. Summary, tags, and links move to the project page. `design.md` §13.10 |
| D48 | **Services: cards that stack on scroll** | Sticky cards with scrubbed scale/dim; plain list on short screens and under reduced motion. `design.md` §13.11 |
| D49 | **Creatives card: last card of the service stack, inverted** | `design.md` §13.12 |
| D50 | **Timeline: rail that fills on scroll** | Same component for Experience and Volunteering; dots light up at mid-screen. `design.md` §13.13 |
| D51 | **Contact: tiles with copy** | Email, phone, WhatsApp; copy buttons with "Copied" feedback. `design.md` §13.14 |
| D52 | **Form fields: filled (Apple style), label above** | Soft inset edge; `muted` edge under `prefers-contrast: more`. `design.md` §13.15 |
| D53 | **FAQ: hairline accordion; certifications: badge grid** | Native `<details>`; several answers open at once. `design.md` §13.16–13.17 |
| D54 | **Hero: the old portfolio's hero, kept, with motion added** | Giant stacked headline + arched portrait + stickers + quote card + glow. Headline "SOFTWARE / ENGINEER" with a rotating outlined line; camera sticker swapped for a software one; purple glow dropped. `design.md` §14.1 |
| D55 | **Hero motion: CSS letter entrance, cursor parallax, WebGL dot grid, scroll exit** | The entrance is pure CSS so LCP is never delayed; the OGL grid is lazy with a static fallback; touch devices colour the portrait on scroll. `design.md` §14.1 |
| D56 | **Section headings: mono index + Bebas title** | "02 — SKILLS" over a `display-xl` title with a letter reveal; indices computed from visible sections. `design.md` §14.0 |
| D57 | **Alternating bands, counted up from the footer** | `background` / `background-alt`; `surface` becomes `surface-raised` on alt bands. `design.md` §14.0 |
| D58 | **About: scroll-lit statement + facts list** | Words light up as you scroll; the facts list (location, role, status) is a proposal. `design.md` §14.2 |
| D59 | **Skills: grouped logo grid, certifications beneath** | Logos mono → colour on hover. Resolves Q22 (certifications added). `design.md` §14.3 |
| D60 | **Projects: staggered two-column grid + WebGL ripple on hover** | Right column offset 96px; featured projects full width; one shared ripple canvas. `design.md` §14.5 |
| D61 | **Contact: two columns** | Heading, tiles, socials left; form right; QR popover on desktop (proposed). `design.md` §14.8 |
| D62 | **Project pages: case-study layout, with card → page morph** | Title, facts, hero image, Problem / Approach / Outcome, gallery, next project. Resolves Q11. New fields proposed for 5b. `design.md` §14.10 |
| D63 | **5b build split into six PRs; placeholder copy in one file** | Foundations + core components, data, hero, four sections, four sections, project page. Placeholder strings live in `content/copy.ts`, marked `PLACEHOLDER`, until the owner's wording arrives. Rive is not installed (no spec uses it). `phases.md` |
| D64 | **Caching: `unstable_cache` with the `portfolio` tag** | Chosen over Cache Components to avoid a global rendering change. Key includes the deployment's commit; `next dev` skips it. `revalidateTag('portfolio', { expire: 0 })` from the admin. `architecture.md` §5 |
| D65 | **The hero's rotating words live in `profile.headline_words`** | Editable in the admin without a deploy. `content-schema.md` §1.1 |
| D66 | **No project `year` column; certifications seeded from the badge images** | The card label is the category only. Seven Google badges: names and issuers from the images, dates and links left empty; PNGs in `public/certs/`. `content-schema.md` §1.4, §1.5b |
| D67 | **Hero built to the spec; the pages read the database from here on** | The hero is the first reader of the data. Icons: Devicon (sticker logos, LinkedIn) and Simple Icons (Instagram, GitHub, TikTok, WhatsApp) — Simple Icons has dropped LinkedIn and AWS. The portrait is `public/hero.webp`. A build needs `DATABASE_URL`; with a migrated but empty database the home page shows a notice. `design.md` §14.1 (build notes) |
| D68 | **Skill logos are a synced copy of Devicon; services and About are seeded placeholders** | `scripts/sync-devicon.mjs` copies the Devicon SVGs into the git-ignored `public/devicon/` before `dev`, `build` and `test`; logos render as a CSS mask (mono) with the colour version fading in on hover, and near-black or near-white logos stay mono. Services store a `react-iconly` icon name in `services.icon`. The four services and the software-only About text are marked placeholders in the seed until the owner supplies copy. Files (e.g. `/resume.pdf`) are plain anchors, not `next/link`. Project card links go to `/projects/[slug]` and stay un-prefetched until 5b.6. `design.md` §14.2–14.5 |
| D69 | **Contact form: Resend email, then WhatsApp; spam protection without a third party** | `POST /api/contact` emails the profile address through Resend's HTTP API (no SDK) and sets the visitor as reply-to; the thank-you panel then offers "Continue on WhatsApp" with the message prefilled. Nothing is stored. Spam: a hidden field, a 3-second minimum on the form (the form waits it out for fast fillers) and 5 messages per hour per IP (in memory, per server instance). Env: `RESEND_API_KEY` (required), `CONTACT_TO_EMAIL` and `CONTACT_FROM_EMAIL` (optional). The WhatsApp QR is drawn from `qrcode` data on the server. `design.md` §13.14–13.15, §14.8 |
| D70 | **The card ↔ project page morph is a flying copy of the image** | The leaving page records the image's box; the arriving page draws a fixed, cover-fitted copy there and flies it to its own box (800ms), then swaps in the real image. No View Transitions flag, no distortion. Closing flies it back when the card is on screen, otherwise a plain page change. Reduced motion, new tabs and direct opens skip it. The seed leaves Problem / Approach / Outcome / gallery empty, so a page shows the description until they are filled in. `design.md` §14.10 |
| D71 | **Admin: `admin.chestlyace.online`, Cloudinary, password and signed cookie** | Q21: the admin is a fourth host and site key (`admin`) in the same app, with its own root layout, not a `/admin` path on main. Its API routes (`/api/auth/*`, `/api/admin/*`) answer on that host only; `/api/contact` on main only. The session cookie has no `Domain`, so it is never sent to the public sites. Q14: Cloudinary, direct browser uploads with a short-lived signature. Q15: one admin, bcrypt hash in `ADMIN_PASSWORD_HASH`, signed `httpOnly` cookie, rate-limited login. `architecture.md` §3, §6 |
| D72 | **Admin design: plain and functional, on our tokens** | Sidebar of resources, lists with drag-to-reorder and publish switches, one editor page per entry, a save bar, an upload field, a confirm dialog, toasts; the main blue accent; no scroll-driven or showpiece motion. Proposed values to confirm in 6b: sessions last 7 days, 5 login attempts per 15 minutes per IP. `design.md` §13.18–13.26, §14.11 |
| D73 | **Admin build: four PRs; `bcryptjs`; sessions are HMAC-signed tokens** | 6b is split foundations → API and simple resources → the rest → uploads. `bcryptjs` (pure JS, standard bcrypt hashes) checks the password against `ADMIN_PASSWORD_HASH`; `pnpm admin:hash` prints the hash (a `.env` file needs each `$` escaped, Vercel does not). The session is `v1.<payload>.<HMAC-SHA256>` under `SESSION_SECRET` in an `httpOnly` cookie with no `Domain`, 7 days; no session library. `proxy.ts` adds `X-Robots-Tag: noindex` for the admin host and passes the requested path to the pages (`x-admin-path`) so a sign-in returns to it. `architecture.md` §6 |
| D74 | **Admin API and editors are generic over a resource definition** | `lib/admin/schemas.ts` (Zod, strict: unknown fields refused) is the one definition of what each resource accepts, used by the API to validate and by the editor to check fields as they are typed; `lib/admin/config.ts` holds each resource's fields and list rows; `lib/admin/api.ts` does the database work (testable with PGlite) and the `app/api/admin/[resource]` handlers only check the session and origin, call it and revalidate the `portfolio` tag. New entries start unpublished and go to the end; a reorder takes the ids in their new order and gives them the positions the same entries held, so a filtered list reorders without disturbing the rest. Image fields start as an address box; 6b.4 makes them the upload field (D75). A list the body of an update leaves out (service items, tech stack, gallery, hero words) is left alone: defaults for new entries live in `lib/admin/api.ts`, not in the schemas. A web address may not contain whitespace (browsers accept it, Node does not). `design.md` §13.19–13.25, §14.11 |
| D75 | **Uploads: signed direct upload, no SDK** | `POST /api/admin/upload-signature` `{ use }` (`project`, `logo`, `profile`, `badge`, `icon`, `resume`) checks the admin session and origin and returns a SHA-1 signature (`lib/cloudinary.ts`, computed with `node:crypto`, the API secret never leaves the server) with the folder, transformation and allowed formats for that use; 503 when `CLOUDINARY_*` is not set. The browser posts the file straight to Cloudinary (XHR, for progress and Cancel) and keeps the `secure_url` with `f_auto,q_auto` inserted. Every image and file field is the upload field of `design.md` §13.22 (drag or choose, progress, preview, Replace, Remove, "Use an address instead"); without Cloudinary it says so and falls back to the address box. Badges and skill icons go in `portfolio/profile`; only skill icons accept SVG. Nothing is stored until the entry is saved. `content-schema.md` §3 |
| D76 | **SEO: off until launch, per-host metadata, one JSON-LD graph** | `lib/seo.ts` holds each public site's title, description, canonical and Open Graph/Twitter tags (copy from `ia-content.md` §4), the JSON-LD and the text of `sitemap.xml` / `robots.txt`. Indexing is off (meta `noindex`, `robots.txt` disallows all) until `SITE_INDEXING=on` is set, which is read at build, so the switch takes a redeploy; Vercel previews are never indexable; the admin never is. The main homepage carries one server-rendered `@graph` of `Person` (name, alternate name, job title, hero image, `sameAs` from the socials), `WebSite` and `FAQPage`; project pages get their own canonical, title, description and image. Sitemaps are route handlers per host (`app/sites/<site>/sitemap.xml/route.ts`) that follow admin changes through the `portfolio` tag; creatives and blog list only `/` until they have pages. The main Open Graph image is the old `hero-optimized.webp` at `public/og/main.webp`. `ia-content.md` §4–5 |
| D77 | **Old addresses redirect in `proxy.ts`; `/resume.pdf` follows the profile** | `decideRoute` (`lib/sites.ts`) returns a `redirect` for the main host's old addresses, and `proxy.ts` answers 308 (`ia-content.md` §6): `/software-development.html` → `/#services`; `/graphic-design.html` and `/photography.html` → `creatives.chestlyace.online/services`; `/admin`, `/admin/…` → `admin.chestlyace.online`; `www.chestlyace.online/*` → `chestlyace.online/*` (the Vercel domain redirect in `architecture.md` §3 does the same first; this keeps it in the repo). `/resume.pdf` (main host, a route, so `.pdf` is no longer excluded from the proxy) answers 307 to `profile.resume_url`, and 404 when that points back at `/resume.pdf` itself or is empty. `Section` can carry a second id so `#work` and `#journey` still land on Projects and Experience. Favicon, `icon.png` and `apple-icon.png` are Next metadata files in `app/`, shared by every host. `ia-content.md` §5–6 |
| D78 | **Launch: the owner migrates locally; main + admin go first; the old site stays up 14 days** | Q20. The owner runs `pg_dump` on the EC2 host and the migration on their own machine (`docs/migration.md`); nothing private leaves it. `pnpm migrate:old` is a dry run unless given `--write`, refuses a target that already has content unless given `--replace`, and loads only what the old database held (contact details, skills, projects, timeline, socials); the rest keeps the reviewed dev-seed content, and creatives material is exported to a JSON file for Phase 10. At the DNS cutover only `chestlyace.online` (with `www` and the old-URL redirects) and `admin.chestlyace.online` move to Vercel; creatives and blog follow with Phases 9–10. The old EC2 site stays up, read-only, for 14 days after DNS moves, then the Node process and the instance are shut down. `architecture.md` §10 |
| D79 | **Analytics: Vercel Web Analytics on the public sites** | Q17. `@vercel/analytics` (approved as a new dependency by the owner's answer) renders `<Analytics />` in `SiteDocument`, so main, creatives and blog are counted and the admin (its own document) is not. It is cookie-free, so no consent banner. `proxy.ts` leaves `/_vercel/*` alone so the platform's script and event routes are never rewritten. One owner step, at launch: turn on Web Analytics for the project in the Vercel dashboard (Analytics tab); until then the script request answers 404 and nothing is recorded. Locally the script 404s too, which shows up as a console error in browser tests. |
| D80 | **Indexing is chosen per site; the launch is a runbook** | `SITE_INDEXING` takes site names (`main`, `main,blog`) or `on`/`all`, read at build; with `main` the main site is indexable while creatives and blog stay closed until they have content (Q20, D78); previews and the admin are never indexable. `docs/launch.md` is the owner's cutover checklist: accounts, environment variables, preview checks, DNS and Vercel domains, verification, rollback, and the shutdown of the old EC2 site after 14 days. Creatives and blog are added to the Vercel project at the same time (placeholders), so the old design and photography URLs land on a live host. |

## Status

Planning phase. No application code yet.

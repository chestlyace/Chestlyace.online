# Architecture

## 1. Overview

One Next.js application in one repository serves three websites. Which site a
request belongs to is decided by its **host name**, not its path.

| Host | Site | Purpose | Content source |
|---|---|---|---|
| `chestlyace.online` | **main** | Chestly as a software engineer: about, skills, services, projects, experience, volunteering, contact | Postgres (admin-edited) |
| `creatives.chestlyace.online` | **creatives** | Graphic design, photography, event coverage | Headless CMS (TBD — `open-questions.md` Q1) |
| `blog.chestlyace.online` | **blog** | Writing, with readers' likes and comments | Postgres (admin-written posts, D83) |
| `admin.chestlyace.online` | **admin** | The owner's panel for the main site's data (D71) | Postgres (reads and writes), Cloudinary (uploads) |

```
                        ┌────────────────────────── Vercel ───────────────────────────┐
 chestlyace.online ───▶ │                                                              │
 creatives.… ─────────▶ │  proxy.ts ── reads Host ──▶ rewrite to /sites/<site>/<path>  │
 blog.… ──────────────▶ │                                                              │
                        │   app/sites/main ───────▶ Prisma Postgres + Cloudinary       │
                        │   app/sites/creatives ──▶ Headless CMS API                   │
                        │   app/sites/blog ───────▶ Prisma Postgres (posts, comments)   │
                        └──────────────────────────────────────────────────────────────┘
```

Why one app instead of three: one deploy, one design system, one header/footer,
one dependency tree. The cost is that the routing layer has to keep the three
sites from leaking into each other (see §3).

## 2. Tech stack

| Concern | Choice | Status |
|---|---|---|
| Framework | Next.js 16 (App Router), React 19, React Server Components | Decided (D16) |
| Runtime | Node.js 24 LTS (`.nvmrc`, `engines`) | Decided (D16) |
| Language | TypeScript, `strict: true` | Decided |
| Styling | Tailwind CSS (v4, tokens in CSS via `@theme`) | Decided (D14) |
| Database | Prisma Postgres, provisioned through the Vercel Marketplace | Decided (D2, D31) |
| DB access | Drizzle ORM + `pg` (node-postgres) driver; migrations with Drizzle Kit | Decided (D15, D32) |
| Validation | Zod (request bodies, post fields, CMS responses) | Proposed |
| Image/file uploads | Cloudinary (existing assets already live there) | Proposed — Q14 |
| Blog | Posts in Postgres, written in the admin's block editor as custom markdown; rendered on the server (unified/remark/rehype + Shiki), cached with the `blog` tag | Decided (D83, supersedes D7) |
| Creatives content | Headless CMS | CMS choice open — Q1 |
| Hosting | Vercel | Decided (D2) |
| Package manager | pnpm 10 (pinned in `packageManager`; newest major Vercel supports) | Decided (D16) |
| Lint / format | ESLint (`eslint-config-next`) + Prettier (Markdown excluded) | Decided |
| Tests | Vitest (`pnpm test`), `*.test.ts` next to the code | Decided (D20) |

## 3. Multi-tenant routing

### How a request is resolved

1. `proxy.ts` at the project root (Next.js 16+; called `middleware.ts` in older
   versions) runs on every request except `_next/static`, `_next/image`, and
   image/font/PDF files. (`.xml`/`.txt` paths do go through it, because
   `sitemap.xml`, `robots.txt`, and `rss.xml` are per-site routes.)
2. It reads the `Host` header and maps it to a site key using `lib/sites.ts`
   (matching on host name, ignoring the port).
3. It **rewrites** (not redirects) the request to `/sites/<site>/<original path>`.
   The visitor's URL bar never changes.
4. Unknown hosts fall through to `main`.
5. The decision itself is a pure function, `decideRoute()` in `lib/sites.ts`, so
   it is unit-tested without a server; `proxy.ts` only applies it.

```ts
// lib/sites.ts — single source of truth for hosts
export const SITES = {
  main:      { host: 'chestlyace.online',           devHost: 'localhost:3000' },
  admin:     { host: 'admin.chestlyace.online',     devHost: 'admin.localhost:3000' },
  creatives: { host: 'creatives.chestlyace.online', devHost: 'creatives.localhost:3000' },
  blog:      { host: 'blog.chestlyace.online',      devHost: 'blog.localhost:3000' },
} as const;
```

### Rules that keep sites separate

- Site folders live in `app/sites/<site>/` (D19). They can't be reached directly
  by path: the proxy always adds the `/sites/<site>` prefix, so a request for
  `/sites/blog` on the main host becomes `/sites/main/sites/blog` and 404s.
  (Folders starting with `_` can't be used — Next.js excludes them from routing.)
- There is **no `app/layout.tsx`**. Each site has its **own root layout**
  (`app/sites/<site>/layout.tsx`) with its own metadata, so `<title>`, canonical
  URLs, and Open Graph tags never mix.
- Each site has its **own 404**: `app/sites/<site>/[...notFound]/page.tsx` calls
  `notFound()`, which renders `app/sites/<site>/not-found.tsx` inside that site's
  layout with a 404 status. More specific routes (e.g. `[slug]`) take priority
  over the catch-all.
- API routes belong to one host each (D71). The proxy returns 404 for a route on
  any other host, and lets it through to `app/api/` untouched on its own:
  `/api/auth/*` and `/api/admin/*` on **admin**; `/api/contact` on **main**;
  `/api/revalidate` (the creatives CMS webhook) is host-independent. The admin's
  pages are the admin host's ordinary pages, rewritten into `app/sites/admin/`
  like any other site; the old `/admin` path on main no longer exists.
- Links that cross sites are always **absolute URLs** built from `lib/sites.ts`
  (`siteUrl('blog', '/some-post')`). Relative links stay within a site.
- `www.chestlyace.online` permanently redirects to `chestlyace.online` (Vercel
  domain setting, not code).

### Local development

Browsers resolve `*.localhost` to `127.0.0.1`, so no hosts-file edits are needed:

| URL | Site |
|---|---|
| `http://localhost:3000` | main |
| `http://creatives.localhost:3000` | creatives |
| `http://blog.localhost:3000` | blog |

Vercel preview deployments get one URL. Previews use a `?site=creatives` query
parameter (honoured only when `VERCEL_ENV !== 'production'`) to pick a site. The
choice is remembered in a `preview-site` cookie so internal links stay on that
site; `?site=main` switches back (D21). Production ignores both.

`siteUrl()` follows the same model (D28): on a Vercel preview
(`VERCEL_ENV === "preview"`) it returns the branch URL (`VERCEL_BRANCH_URL`) with
`?site=<site>`, so cross-site links stay on the preview. Order of precedence:
`NEXT_PUBLIC_*_URL` override → preview branch URL → `*.localhost` in development →
production subdomains.

## 4. Folder layout

```
chestlyace.online/
├─ app/
│  ├─ sites/                       # no app/layout.tsx — each site is a root layout
│  │  ├─ main/
│  │  │  ├─ layout.tsx            # main root layout + metadata, header/footer
│  │  │  ├─ page.tsx              # homepage, all sections
│  │  │  ├─ not-found.tsx         # main's 404
│  │  │  ├─ [...notFound]/page.tsx # unmatched paths → notFound()
│  │  │  ├─ design-system/page.tsx # token/component showcase, 404 in production
│  │  │  ├─ sitemap.xml/route.ts
│  │  │  └─ robots.txt/route.ts
│  │  ├─ creatives/
│  │  │  ├─ layout.tsx
│  │  │  ├─ page.tsx              # gallery
│  │  │  ├─ not-found.tsx, [...notFound]/page.tsx
│  │  │  ├─ [slug]/page.tsx       # single piece
│  │  │  └─ services/page.tsx
│  │  ├─ admin/                   # admin host: its own root layout, login, screens (D71)
│  │  └─ blog/
│  │     ├─ layout.tsx
│  │     ├─ page.tsx              # post list
│  │     ├─ not-found.tsx, [...notFound]/page.tsx
│  │     ├─ [slug]/page.tsx
│  │     ├─ tags/[tag]/page.tsx
│  │     └─ rss.xml/route.ts
│  ├─ api/                         # main host only
│  │  ├─ portfolio/route.ts        # public read (optional, see §5)
│  │  ├─ auth/{login,logout}/route.ts
│  │  ├─ admin/<resource>/route.ts
│  │  └─ revalidate/route.ts       # CMS webhook for creatives
│  └─ globals.css                  # Tailwind + design tokens
├─ components/
│  ├─ shared/                      # SiteDocument (html/head/body shell), SiteHeader,
│  │                               # SiteFooter, Brand, MobileMenu, ThemeToggle, Button…
│  ├─ main/                        # Hero, ProjectCard, TimelineItem…
│  ├─ creatives/                   # Gallery, Lightbox…
│  └─ blog/                        # PostItem, Prose, rich blocks, Comments…
├─ content/
│  └─ copy.ts                      # placeholder copy
├─ db/
│  ├─ schema.ts                    # Drizzle schema
│  ├─ migrations/
│  └─ seed.ts                      # dev seed only, never run against prod
├─ lib/
│  ├─ sites.ts                     # site registry, host resolution, siteUrl, decideRoute
│  ├─ sites.test.ts
│  ├─ theme.ts                     # theme cookie, applyTheme, no-flash init script
│  ├─ theme.test.ts
│  ├─ fonts.ts                     # next/font setup
│  ├─ cn.ts                        # class-name join helper
│  ├─ db.ts
│  ├─ auth.ts
│  ├─ cloudinary.ts
│  ├─ cms.ts                       # creatives CMS client
│  └─ blog/                        # markdown parsing/rendering, DEV client, session parser
├─ public/                         # brand/logo.png, favicons, resume, OG images
├─ docs/                           # these documents
├─ proxy.ts
└─ vitest.config.mts
```

## 5. Data flow per site

### main — Postgres

- **Reads**: Server Components query the database directly through `lib/db.ts`
  (`getHomepageData()`). They do not call the app's own API over HTTP.
- **Connection**: `lib/db.ts` creates one `pg` pool per server instance from
  `DATABASE_URL`, lazily on first use. Query functions accept the database as a
  parameter, so tests can pass a PGlite database instead (D35).
- **Schema and migrations**: `db/schema.ts` (Drizzle) → `db/migrations/`. Every
  table has `created_at`/`updated_at`; a trigger keeps `updated_at` current (D34).
- **Commands**: `pnpm db:generate` (new migration after a schema change),
  `pnpm db:migrate` (apply; uses `DIRECT_URL` if set, else `DATABASE_URL`),
  `pnpm db:seed` (dev only — wipes the tables and loads the old site's data;
  refuses to run in production). All read `.env.local`.
- **Caching** (D64): the pages read through `lib/portfolio.ts`, which wraps the
  queries in `unstable_cache` with the `portfolio` tag. Every admin write calls
  `revalidateTag('portfolio', { expire: 0 })`, so the public page is static until
  something changes. The cache key includes `VERCEL_GIT_COMMIT_SHA` (Next's data
  cache outlives deployments, so a redeploy must not show an older deployment's
  data), and `next dev` skips the cache. `unstable_cache` is marked replaced by
  `use cache` in Next 16; moving to Cache Components later only changes that file.
- **Writes**: only through `/api/admin/*` Route Handlers (on the admin host), all behind the admin
  session check, all validating the body with Zod against an explicit field list.
  (The old API turned every key in the request body into a SQL column name — that
  pattern is banned.)
- `/api/portfolio` exists only if something outside the app needs the data.

Full schema and endpoints: `content-schema.md`.

### creatives — headless CMS

- Pages fetch from the CMS on the server and are statically generated.
- The CMS calls `/api/revalidate` (shared secret) on publish, which revalidates
  the affected pages.
- CMS images are served through the CMS's own image CDN.

### blog — database and block editor (D83)

- Posts are rows in `blog_posts` (`content-schema.md` §4), written in the admin's
  block editor (`design.md` §13.48), stored as custom markdown
  (`docs/blog-markdown.md`).
- Post pages, tag pages, the list and `rss.xml` are rendered on the server and
  cached with a `blog` tag; publishing, editing and hiding a comment revalidate it
  (as `portfolio` for the main site, D74). Likes and comments load after the page
  from the blog's own API (`/api/blog/*`), so the page itself stays cacheable.
- **Readers** sign in with GitHub or Google through Better Auth, on the blog host
  only (`/api/reader/*`, its own cookie; never the admin's). Commenting and liking
  comments need an account; liking a post does not.
- DEV import/export and agent-session upload are admin API routes
  (`/api/admin/blog/*`); the DEV API key (`DEVTO_API_KEY`) is a server secret.

## 6. Admin

- Lives at `admin.chestlyace.online` (Q21, D71): its own site key, root layout and
  host; `noindex` (meta and `X-Robots-Tag`) and `robots.txt` disallows everything.
  Screens: `design.md` §13.18–13.26 and §14.11.
- Manages the **main site's data and the blog** (posts, comments, imports);
  creatives content is edited in the CMS's own studio.
- **Auth** (replaces the old shared password compared with `===` and a JWT in
  `localStorage`):
  - single admin user; password stored as a bcrypt hash in `ADMIN_PASSWORD_HASH`
  - successful login sets an `httpOnly`, `Secure`, `SameSite=Lax` session cookie
    signed with `SESSION_SECRET`, with **no `Domain` attribute**, so the browser
    sends it to the admin host only and never to the public sites
  - login endpoint is rate-limited
  - details: `open-questions.md` Q15

## 7. Shared UI across subdomains

- `SiteHeader` and `SiteFooter` live in `components/shared/` and render on all
  three sites, highlighting the current one.
- **Theme preference** is stored in a cookie scoped to `Domain=.chestlyace.online`
  so choosing dark mode on the main site carries over to the blog and creatives
  site. (`localStorage` is per-origin and would not carry over.)
- Design tokens are shared; each site may override its accent colour
  (`design.md` §4).

## 8. Environments and configuration

| Variable | Used by | Notes |
|---|---|---|
| `DATABASE_URL` | main | Prisma Postgres connection string; set by the Vercel–Prisma integration |
| `DIRECT_URL` | `pnpm db:migrate`, `db:seed` | Optional direct (unpooled) Prisma Postgres connection; falls back to `DATABASE_URL` |
| `ADMIN_PASSWORD_HASH` | admin | bcrypt hash, never the plain password |
| `SESSION_SECRET` | admin | 32+ random bytes |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | admin uploads | |
| `CMS_*` | creatives | Depends on the CMS chosen |
| `REVALIDATE_SECRET` | `/api/revalidate` | Shared with the CMS webhook |
| `NEXT_PUBLIC_MAIN_URL`, `NEXT_PUBLIC_CREATIVES_URL`, `NEXT_PUBLIC_BLOG_URL` | cross-site links | Override `lib/sites.ts` per environment |

- `.env.example` is committed with every key and no values. Real values live in
  Vercel project settings and a git-ignored `.env.local`.
- **Two databases (D31):** one Prisma Postgres database connected to the
  **Production** environment, and a second one connected to **Preview** and
  **Development** (local dev pulls it with `vercel env pull .env.local`). Previews
  and local dev never touch production data. (On the old site any non-localhost
  hostname hit the live database.)

## 9. Deployment

- One Vercel project connected to this repo. `main` branch → production; every
  other branch → preview.
- Domains attached to the project: `chestlyace.online`, `www.chestlyace.online`
  (redirect), `creatives.chestlyace.online`, `blog.chestlyace.online`.
- Database migrations run with Drizzle Kit as an explicit step (`pnpm db:migrate`
  against each database), not on app boot or during the Vercel build.
- CI: Vercel's build on every pull request is the only automated check (D17) —
  it compiles and typechecks. Lint, format, and tests are run locally before
  opening a PR (`instructions.md` §6). Tests where logic warrants them (host
  resolution, admin validation, frontmatter parsing).

## 10. Migrating off the old site

The old live database is a local Postgres on the EC2 host and **its live data
differs from the seed file** (`db/neon_setup.sql`). Migrate from the live data,
not the seed.

1. `pg_dump` the live `portfolio_db` on the EC2 host.
2. Transform it into the new schema with a one-off script (mapping in
   `content-schema.md` §6). Design/event `works` rows are exported to a file for
   loading into the creatives CMS later.
3. Load into the preview/dev Prisma Postgres database, check it, then load into
   the production database.
4. Move files that database rows point to by bare filename (`resume.pdf`, the
   hero image, journey logos) into `public/` or Cloudinary and update the rows.
5. Deploy to Vercel on the preview URL; verify all three hosts.
6. Point DNS at Vercel. Old URLs are covered by the redirect map in
   `ia-content.md` §6.
7. Keep the EC2 box running read-only for a short grace period, then shut down
   the instance and the Node process.

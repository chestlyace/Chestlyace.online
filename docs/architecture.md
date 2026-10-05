# Architecture

## 1. Overview

One Next.js application in one repository serves three websites. Which site a
request belongs to is decided by its **host name**, not its path.

| Host | Site | Purpose | Content source |
|---|---|---|---|
| `chestlyace.online` | **main** | Chestly as a software engineer: about, skills, services, projects, experience, volunteering, contact | Postgres (admin-edited) |
| `creatives.chestlyace.online` | **creatives** | Graphic design, photography, event coverage | Headless CMS (TBD — `open-questions.md` Q1) |
| `blog.chestlyace.online` | **blog** | Writing | MDX files in the repo |

```
                        ┌────────────────────────── Vercel ───────────────────────────┐
 chestlyace.online ───▶ │                                                              │
 creatives.… ─────────▶ │  proxy.ts ── reads Host ──▶ rewrite to /_sites/<site>/<path> │
 blog.… ──────────────▶ │                                                              │
                        │   app/_sites/main ──────▶ Postgres (Neon) + Cloudinary       │
                        │   app/_sites/creatives ─▶ Headless CMS API                   │
                        │   app/_sites/blog ──────▶ content/blog/*.mdx (build time)    │
                        └──────────────────────────────────────────────────────────────┘
```

Why one app instead of three: one deploy, one design system, one header/footer,
one dependency tree. The cost is that the routing layer has to keep the three
sites from leaking into each other (see §3).

## 2. Tech stack

| Concern | Choice | Status |
|---|---|---|
| Framework | Next.js (App Router), React Server Components | Decided |
| Language | TypeScript, `strict: true` | Decided |
| Styling | Tailwind CSS (v4, tokens in CSS via `@theme`) | Proposed — `open-questions.md` Q3 |
| Database | PostgreSQL on Neon, provisioned through the Vercel Marketplace | Decided (D2) |
| DB access | Drizzle ORM + `@neondatabase/serverless` driver | Proposed — Q2 |
| Validation | Zod (request bodies, MDX frontmatter, CMS responses) | Proposed |
| Image/file uploads | Cloudinary (existing assets already live there) | Proposed — Q14 |
| Blog | MDX compiled at build time | Decided (D7); tooling — Q16 |
| Creatives content | Headless CMS | CMS choice open — Q1 |
| Hosting | Vercel | Decided (D2) |
| Package manager | pnpm | Proposed |

## 3. Multi-tenant routing

### How a request is resolved

1. `proxy.ts` at the project root (Next.js 16+; called `middleware.ts` in older
   versions) runs on every request except static assets.
2. It reads the `Host` header and maps it to a site key using `lib/sites.ts`.
3. It **rewrites** (not redirects) the request to `/_sites/<site>/<original path>`.
   The visitor's URL bar never changes.
4. Unknown hosts fall through to `main`.

```ts
// lib/sites.ts — single source of truth for hosts
export const SITES = {
  main:      { host: 'chestlyace.online',           devHost: 'localhost:3000' },
  creatives: { host: 'creatives.chestlyace.online', devHost: 'creatives.localhost:3000' },
  blog:      { host: 'blog.chestlyace.online',      devHost: 'blog.localhost:3000' },
} as const;
```

### Rules that keep sites separate

- Folders under `app/_sites/` are prefixed with `_` so they can never be reached
  directly by path; only the rewrite reaches them.
- Each site has its **own root layout** (`app/_sites/<site>/layout.tsx`) with its
  own metadata, so `<title>`, canonical URLs, and Open Graph tags never mix.
- `/api/*` and `/admin/*` are **main-host only**. The proxy returns 404 for them on
  the creatives and blog hosts.
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
parameter (honoured only when `VERCEL_ENV !== 'production'`) to pick a site.

## 4. Folder layout

```
chestlyace.online/
├─ app/
│  ├─ _sites/
│  │  ├─ main/
│  │  │  ├─ layout.tsx            # main metadata, header/footer
│  │  │  ├─ page.tsx              # homepage, all sections
│  │  │  ├─ admin/                # admin panel (auth-gated)
│  │  │  ├─ sitemap.xml/route.ts
│  │  │  └─ robots.txt/route.ts
│  │  ├─ creatives/
│  │  │  ├─ layout.tsx
│  │  │  ├─ page.tsx              # gallery
│  │  │  ├─ [slug]/page.tsx       # single piece
│  │  │  └─ services/page.tsx
│  │  └─ blog/
│  │     ├─ layout.tsx
│  │     ├─ page.tsx              # post list
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
│  ├─ shared/                      # SiteHeader, SiteFooter, ThemeToggle, Button…
│  ├─ main/                        # Hero, ProjectCard, TimelineItem…
│  ├─ creatives/                   # Gallery, Lightbox…
│  └─ blog/                        # PostCard, MDX components…
├─ content/
│  └─ blog/                        # *.mdx posts
├─ db/
│  ├─ schema.ts                    # Drizzle schema
│  ├─ migrations/
│  └─ seed.ts                      # dev seed only, never run against prod
├─ lib/
│  ├─ sites.ts
│  ├─ db.ts
│  ├─ auth.ts
│  ├─ cloudinary.ts
│  ├─ cms.ts                       # creatives CMS client
│  └─ blog.ts                      # MDX loading + frontmatter validation
├─ public/                         # favicons, resume, OG images
├─ docs/                           # these documents
└─ proxy.ts
```

## 5. Data flow per site

### main — Postgres

- **Reads**: Server Components query the database directly through `lib/db.ts`.
  They do not call the app's own API over HTTP.
- **Caching**: homepage queries are cached and tagged (e.g. `portfolio`). Every
  admin write calls `revalidateTag('portfolio')`, so the public page is static
  until something changes.
- **Writes**: only through `/api/admin/*` Route Handlers, all behind the admin
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

### blog — MDX

- Posts live in `content/blog/<slug>.mdx`.
- Frontmatter is validated with Zod at build time; a bad post fails the build.
- All post pages, tag pages, and the RSS feed are statically generated.

## 6. Admin

- Lives at `chestlyace.online/admin` (main host only; `noindex` + disallowed in
  `robots.txt`). Alternative location: `open-questions.md` Q21.
- Manages **main-site data only**. Blog posts are edited as files; creatives
  content is edited in the CMS's own studio.
- **Auth** (replaces the old shared password compared with `===` and a JWT in
  `localStorage`):
  - single admin user; password stored as a bcrypt hash in `ADMIN_PASSWORD_HASH`
  - successful login sets an `httpOnly`, `Secure`, `SameSite=Lax` session cookie
    signed with `SESSION_SECRET`
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
| `DATABASE_URL` | main | Neon pooled connection string; set by the Vercel–Neon integration |
| `ADMIN_PASSWORD_HASH` | admin | bcrypt hash, never the plain password |
| `SESSION_SECRET` | admin | 32+ random bytes |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | admin uploads | |
| `CMS_*` | creatives | Depends on the CMS chosen |
| `REVALIDATE_SECRET` | `/api/revalidate` | Shared with the CMS webhook |
| `NEXT_PUBLIC_MAIN_URL`, `NEXT_PUBLIC_CREATIVES_URL`, `NEXT_PUBLIC_BLOG_URL` | cross-site links | Override `lib/sites.ts` per environment |

- `.env.example` is committed with every key and no values. Real values live in
  Vercel project settings and a git-ignored `.env.local`.
- **Preview deployments use a separate Neon branch**, never the production
  database. (On the old site any non-localhost hostname hit the live database.)

## 9. Deployment

- One Vercel project connected to this repo. `main` branch → production; every
  other branch → preview.
- Domains attached to the project: `chestlyace.online`, `www.chestlyace.online`
  (redirect), `creatives.chestlyace.online`, `blog.chestlyace.online`.
- Database migrations run with Drizzle Kit as an explicit step, not on app boot.
- CI (GitHub Actions or Vercel checks): typecheck, lint, build. Tests where
  logic warrants them (host resolution, admin validation, frontmatter parsing).

## 10. Migrating off the old site

The old live database is a local Postgres on the EC2 host and **its live data
differs from the seed file** (`db/neon_setup.sql`). Migrate from the live data,
not the seed.

1. `pg_dump` the live `portfolio_db` on the EC2 host.
2. Transform it into the new schema with a one-off script (mapping in
   `content-schema.md` §6). Design/event `works` rows are exported to a file for
   loading into the creatives CMS later.
3. Load into a Neon branch, check it, promote to production.
4. Move files that database rows point to by bare filename (`resume.pdf`, the
   hero image, journey logos) into `public/` or Cloudinary and update the rows.
5. Deploy to Vercel on the preview URL; verify all three hosts.
6. Point DNS at Vercel. Old URLs are covered by the redirect map in
   `ia-content.md` §6.
7. Keep the EC2 box running read-only for a short grace period, then shut down
   the instance and the Node process.

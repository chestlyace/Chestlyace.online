# Content Schema

Three content sources, one per site (decisions D3, D6, D7):

| Site | Source | Edited through |
|---|---|---|
| main | Postgres (Prisma Postgres, D31) | Admin panel at `admin.chestlyace.online` |
| blog | MDX files in `content/blog/` | Git commits |
| creatives | Headless CMS (TBD) | The CMS's own editor |

---

## 1. Main site — Postgres

The tables below are the target. SQL is shown for readability; the real
definitions live in `db/schema.ts` (Drizzle) and are applied with migrations.
**No file in this repo drops tables** — the old `neon_setup.sql` mixed schema,
seed data, and `DROP TABLE`, so re-running it wiped production.

Conventions for every table:

- `id` — `serial` primary key
- `created_at`, `updated_at` — `timestamptz NOT NULL DEFAULT now()` on **every**
  table (D34), not repeated in each definition below. The
  `set_updated_at()` trigger refreshes `updated_at` on every `UPDATE`.
- `order_index` — `integer`, ascending = shown first, wherever order matters
- `is_published` — `boolean default true`, so entries can be hidden without
  deleting them

### 1.1 `profile` (exactly one row)

```sql
CREATE TABLE profile (
  id              integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name            text NOT NULL,          -- 'Chestly Ace'
  legal_name      text,                   -- 'Amahndong Chestly' (SEO + JSON-LD)
  display_name    text,                   -- 'DEV.ACE' (logo wordmark)
  headline        text NOT NULL,          -- replaces title_1/2/3, see note
  tagline         text,                   -- 'Open to Remote Roles' status pill
  availability    text,                   -- 'open' | 'limited' | 'closed', drives pill colour
  hero_image_url  text,
  about_quote     text,
  about_body      text,                   -- replaces about_text_1/2; paragraphs split on blank lines
  resume_url      text,
  email           text NOT NULL,
  phone           text,
  whatsapp_number text,                   -- digits only, for wa.me links
  location        text,                   -- e.g. 'Yaoundé, Cameroon'
  headline_words  text[] NOT NULL DEFAULT '{}',  -- hero's rotating outlined line: 'Backend', 'Full-Stack', …
  updated_at      timestamptz NOT NULL DEFAULT now()
);
```

Changed from the old table:

- `id` is pinned to `1` by a check constraint instead of being hardcoded in the API.
- `title_1/2/3` (`Developer` / `Designer` / `PHOTOGRAPHER`) become one `headline`
  — the main site is software-only now. Wording: `open-questions.md` Q4.
- `about_text_1/2` become one `about_body`.
- New: `legal_name`, `availability`, `location`.
- New: `headline_words` — the words that rotate in the hero's outlined line
  (`design.md` §14.1; the component adds the "& "). Empty means the line is hidden.
  Seeded with placeholders until the owner supplies them.

### 1.2 `skills`

```sql
CREATE TABLE skills (
  id           serial PRIMARY KEY,
  name         text NOT NULL,
  category     text NOT NULL CHECK (category IN ('language','framework','tool','cloud','database')),
  icon_slug    text,          -- devicon slug, e.g. 'python', 'nextjs'
  icon_url     text,          -- only when no devicon exists (e.g. AWS)
  order_index  integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true
);
```

Changed: the old `icon` column held three different things — image URLs,
Font Awesome classes, and bare Tailwind colour classes (`'text-teal-400'` for
Canva). It is replaced by `icon_slug` / `icon_url`. Categories gain `cloud` and
`database` so Postgres/AWS stop being filed under "tool".

### 1.3 `services`

```sql
CREATE TABLE services (
  id           serial PRIMARY KEY,
  title        text NOT NULL,
  description  text NOT NULL,
  icon         text NOT NULL,     -- icon name from the site's icon set (design.md §6)
  items        text[] NOT NULL DEFAULT '{}',
  order_index  integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true
);
```

Software services only (D9). The "design & photography → creatives site" card
is **not** a row here; it is a fixed component so it can't be deleted by accident.

### 1.4 `projects` (was `works`)

```sql
CREATE TABLE projects (
  id                    serial PRIMARY KEY,
  slug                  text NOT NULL UNIQUE,
  title                 text NOT NULL,
  summary               text NOT NULL,          -- one or two sentences, for the card
  description           text,                   -- longer text, for a detail page if we add one
  image_url             text,
  tech_stack            text[] NOT NULL DEFAULT '{}',
  category_label        text,                   -- 'Full Stack', 'Mobile App', 'Backend'
  live_url              text,
  source_url            text,
  is_live_url_private   boolean NOT NULL DEFAULT false,
  is_source_url_private boolean NOT NULL DEFAULT false,
  is_featured           boolean NOT NULL DEFAULT false,
  problem               text,                   -- case study, for the project page
  approach              text,
  outcome               text,
  gallery_urls          text[] NOT NULL DEFAULT '{}',  -- extra screenshots, in order
  order_index           integer NOT NULL DEFAULT 0,
  is_published          boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
```

Changed: renamed because it holds only software projects now (D8). Dropped
`type`, `highlights`, `design_tool`, `client_name` (design/event only). Added
`slug`, `summary`, `is_featured`. Placeholder links (`'#'`) become `NULL`.

The project page (`/projects/[slug]`, Q11, `design.md` §14.10) shows `problem`,
`approach`, and `outcome` as three sections and `gallery_urls` as a gallery. A
section with no text is hidden; when all three are empty the page shows
`description` instead. There is no `year` column (owner, 2026-10-06): the card's
label is just `category_label`.

### 1.5 `journey` (experience and education)

```sql
CREATE TABLE journey (
  id           serial PRIMARY KEY,
  type         text NOT NULL CHECK (type IN ('work','education')),
  role         text NOT NULL,
  organization text NOT NULL,        -- was 'company'
  location     text,
  start_date   date,                 -- for sorting/'Present' logic
  end_date     date,                 -- NULL = present
  dates_label  text,                 -- optional override, e.g. '2024 – Present'
  description  text,
  logo_url     text,
  link_url     text,                 -- organization website
  order_index  integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true
);
```

- Free-text `dates` is replaced by real dates plus an optional label, so "Present"
  and ordering stop depending on hand-typed strings.

### 1.5a `volunteering` (new)

```sql
CREATE TABLE volunteering (
  id           serial PRIMARY KEY,
  role         text NOT NULL,
  organization text NOT NULL,
  location     text,
  start_date   date,
  end_date     date,                 -- NULL = present
  dates_label  text,
  description  text,
  logo_url     text,
  link_url     text,
  order_index  integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true
);
```

- Its own table (Q19, D33), shown in its own section (D10). Same columns as
  `journey` without `type`, so the same timeline component renders both. Extra
  fields (cause, hours, photos) can be added here later without touching `journey`.

### 1.5b `certifications` (new)

```sql
CREATE TABLE certifications (
  id             serial PRIMARY KEY,
  name           text NOT NULL,          -- 'Introduction to Generative AI'
  issuer         text NOT NULL,          -- 'Google Cloud'
  issued_on      date,                   -- shown as the year when set
  badge_url      text,                   -- badge image
  credential_url text,                   -- 'Verify ↗' link; the tile is static without it
  order_index    integer NOT NULL DEFAULT 0,
  is_published   boolean NOT NULL DEFAULT true
);
```

Shown under Skills (Q22, `design.md` §13.17, §14.3). The dev seed has the seven
Google badges from the old repo's `assets/certs/`: names and issuers are read
from the badge images, the images are in `public/certs/`, and `issued_on` and
`credential_url` are empty because the images don't carry them.

### 1.6 `socials`

```sql
CREATE TABLE socials (
  id           serial PRIMARY KEY,
  platform     text NOT NULL,       -- 'GitHub', 'LinkedIn', …
  url          text NOT NULL,
  icon         text NOT NULL,       -- icon name from the site's icon set
  order_index  integer NOT NULL DEFAULT 0,
  show_on      text[] NOT NULL DEFAULT '{main,creatives,blog}'
);
```

New: `show_on` lets Instagram/TikTok appear on the creatives site but not the
main site (`open-questions.md` Q8).

### 1.7 `faqs` (new)

```sql
CREATE TABLE faqs (
  id           serial PRIMARY KEY,
  question     text NOT NULL,
  answer       text NOT NULL,
  order_index  integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true
);
```

The FAQ was hardcoded HTML that JavaScript scraped to build `FAQPage` structured
data. Now it's data, rendered and turned into JSON-LD on the server.

---

## 2. Admin API

All routes live on the admin host (`admin.chestlyace.online`, D71) under `/api/admin/`, require a valid admin
session cookie, and validate bodies with Zod against an explicit field list.
Every successful write calls `revalidateTag('portfolio', { expire: 0 })` (Next 16
requires the second argument; `{ expire: 0 }` makes the next visit read fresh
data instead of serving the old page while it refreshes).

| Resource | GET (list) | POST | PATCH `/:id` | DELETE `/:id` | Reorder |
|---|---|---|---|---|---|
| `profile` | ✓ (the row) | — | ✓ (no id) | — | — |
| `skills` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `services` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `projects` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `journey` | ✓ (`?type=`) | ✓ | ✓ | ✓ | ✓ |
| `volunteering` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `certifications` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `socials` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `faqs` | ✓ | ✓ | ✓ | ✓ | ✓ |

- **Reorder**: `POST /api/admin/<resource>/reorder` with `{ ids: number[] }` sets
  `order_index` to each id's position.
- Every resource is fully editable. (Old site: skills had no update, services and
  socials had no write endpoints at all and needed raw SQL.)
- Bodies are JSON. Booleans are real booleans. (Old site sent FormData and read
  checkboxes as the string `'true'`.)
- Auth: `POST /api/auth/login` `{ password }` → sets session cookie;
  `POST /api/auth/logout` clears it.

## 3. Uploads

Uploads go straight from the admin's browser to Cloudinary using a short-lived
signature from `POST /api/admin/upload-signature`; the app only stores the
returned URL. This avoids pushing large files through a serverless function.

| Use | Cloudinary folder | Transform |
|---|---|---|
| Project image | `portfolio/projects` | max 1600×1600, WebP/AVIF auto |
| Journey logo | `portfolio/journey` | max 600×600 |
| Profile hero | `portfolio/profile` | max 1600×1600 |
| Resume | `portfolio/profile` | raw PDF |

Limit 10 MB. Images render through `next/image` (Cloudinary loader), replacing the
old `optimizeCloudinaryImage()` string rewriting.

---

## 4. Blog — MDX frontmatter

File: `content/blog/<slug>.mdx`. The filename is the slug.

```yaml
---
title: "Building a multi-tenant Next.js site"   # required
description: "How one app serves three subdomains"  # required, used for meta + cards
date: 2026-10-20                                # required, publish date
updated: 2026-11-02                             # optional
tags: [nextjs, architecture]                    # optional, lowercase kebab-case
cover: /blog/multi-tenant/cover.webp            # optional, path under public/
draft: false                                    # optional, drafts excluded from production builds
canonical: https://…                            # optional, when cross-posted
---
```

Validated with Zod at build time. Reading time is computed, not stored. Post
images live in `public/blog/<slug>/`.

---

## 5. Creatives — draft content model

CMS-agnostic until the CMS is picked (`open-questions.md` Q1). Whichever CMS is
chosen should express these types.

**`piece`** — one design or photography work

| Field | Type | Notes |
|---|---|---|
| `title` | string | |
| `slug` | slug | |
| `discipline` | `'design' \| 'photography' \| 'event'` | gallery filter |
| `category` | string | e.g. 'Brand Identity', 'Portrait', 'Poster' |
| `cover` | image | |
| `images` | image[] | ordered |
| `description` | rich text | |
| `client` | string? | |
| `tools` | string[] | Figma, Photoshop, Lightroom… |
| `highlights` | string[] | for events, e.g. 'Photography', 'Videography' |
| `date` | date | |
| `featured` | boolean | |

**`service`** — design/photo services (absorbs the old `graphic-design.html` and
`photography.html` content, plus the old UI/UX, Photography, and Event Coverage
service rows): `title`, `description`, `icon`, `items[]`, `order`.

**`settings`** — singleton: hero text, about blurb, contact CTA.

---

## 6. Old → new data mapping

Source is the **live** EC2 database, not `db/neon_setup.sql` (see
`architecture.md` §10).

| Old | New | Handling |
|---|---|---|
| `profile.name`, `display_name`, `tagline`, `hero_image`, `about_quote`, `resume_url`, `phone`, `email`, `whatsapp_number` | `profile`, same meaning | Copy. Move `hero_image` and `resume_url` off bare root filenames (to Cloudinary or `public/`). |
| `profile.title_1/2/3` | `profile.headline` | Rewrite — Q4 |
| `profile.about_text_1/2` | `profile.about_body` | Join; copy needs editing — Q5 |
| `skills` (languages, frameworks) | `skills` | Copy; convert `icon` to `icon_slug`/`icon_url` |
| `skills` Ps, Lr, Canva | creatives site | Remove from main — Q7 (decided; Figma stays on main) |
| `skills` MongoDB/MySQL/PostgreSQL, Google Cloud/AWS | `skills` | Recategorise to `database` / `cloud` |
| `services` 'Software Development' | `services` | Split into a few software services — `ia-content.md` §2.4 |
| `services` 'UI/UX & Graphic Design', 'Photography', 'Event Coverage' | creatives `service` | Move |
| `works` `type='project'` | `projects` | Copy; generate `slug`; `'#'` links → `NULL`; first sentence → `summary` |
| `works` `type='design'`, `type='event'` | creatives `piece` | Export to JSON for CMS import. Seed rows are Unsplash placeholders — check live data. |
| `journey` `type='work'`/`'education'` | `journey` | Copy; `company` → `organization`; parse `dates` into `start_date`/`end_date` |
| `journey` 'Photographer/Designer — CEY2 Youth Church', 'Graphic Designer — Kris Kitchen' | creatives site | Q6 (decided). Removed from the dev seed |
| — | `certifications` | New; no old rows. The seven Google badges in `assets/certs/` are seeded — Q22 |
| — | `volunteering` | No volunteering entries exist in the old data |
| `socials` | `socials` | Copy; set `show_on` — Q8 |
| FAQ (hardcoded in `index.html`) | `faqs` | Keep software questions; design/photo questions move to the creatives site (removed from the dev seed) |

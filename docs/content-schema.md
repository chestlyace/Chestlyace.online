# Content Schema

Three content sources, one per site (decisions D3, D6, D7):

| Site | Source | Edited through |
|---|---|---|
| main | Postgres (Prisma Postgres, D31) | Admin panel at `admin.chestlyace.online` |
| blog | Postgres (posts, likes, comments, agent sessions; D83) | The admin's block editor; readers write comments |
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
| Certification badge, skill icon | `portfolio/profile` | max 600×600 (skill icons may also be SVG) |
| Blog image | `portfolio/blog` | max 1600×1600 (added in 9b) |
| Resume | `portfolio/profile` | raw PDF |

Limit 10 MB. Images are JPG, PNG, WebP or AVIF; the résumé is a PDF. The stored
address gets `f_auto,q_auto` after `/image/upload/`, so Cloudinary serves each
browser the best format. Images render through `next/image` (Cloudinary loader), replacing the
old `optimizeCloudinaryImage()` string rewriting.

---

## 4. Blog — database tables

Posts live in Postgres next to the main site's tables (D83) and are written in the
admin's block editor (`design.md` §13.48). A post's `content` is **custom
markdown** (`docs/blog-markdown.md`). Reading time is computed from it, not stored.

```sql
blog_posts
  id                serial primary key
  slug              text unique not null      -- lowercase, hyphens
  title             text not null
  description       text not null             -- meta + list item
  content           text not null default ''  -- custom markdown
  cover_url         text                      -- Cloudinary address
  cover_alt         text                      -- empty = decorative
  tags              text[] not null default '{}'  -- lowercase kebab-case; no categories (Q16)
  status            text not null default 'draft'   -- 'draft' | 'published'
  published_at      timestamptz               -- shown date and sort order
  comments_enabled  boolean not null default true
  canonical_url     text                      -- when cross-posted
  series            text
  devto_id          integer                   -- set after an import or export (§13.49)
  devto_url         text
  like_count        integer not null default 0   -- kept in step with blog_likes
  created_at, updated_at

blog_likes                                      -- anyone can like, no account
  post_id           integer references blog_posts on delete cascade
  visitor_hash      text                      -- a hash of the browser's likes cookie
  created_at
  primary key (post_id, visitor_hash)

agent_sessions                                  -- redacted Claude Code sessions (§13.47)
  id                text primary key          -- short id used by the `session` block
  title             text not null
  source            text not null default 'claude-code'
  turns             jsonb not null            -- the redacted turns
  turn_count        integer not null
  tool_call_count   integer not null
  started_at        timestamptz
  created_at

newsletter_settings                             -- the newsletter's wording and switch (§14.19)
  id                integer primary key       -- always 1 (check id = 1); the row may not exist yet
  enabled           boolean not null default true   -- off hides the signup box and refuses signups
  box_*, confirmed_*, failed_*, email_*   text   -- the signup box, the two confirmation pages
                                            -- and the email (design.md §13.34, §14.16); null = the
                                            -- built-in wording in content/copy.ts
  created_at, updated_at

blog_comments
  id                serial primary key
  post_id           integer references blog_posts on delete cascade
  user_id           text references reader_user on delete set null   -- null = deleted account
  parent_id         integer references blog_comments on delete cascade  -- one level of replies
  body              text not null             -- plain text
  status            text not null default 'visible'   -- 'visible' | 'hidden'
  like_count        integer not null default 0
  created_at, updated_at

blog_comment_likes   (comment_id, user_id, primary key (comment_id, user_id))
blog_comment_reports (comment_id, user_id, created_at, primary key (comment_id, user_id))
```

**Readers.** Reader accounts (GitHub or Google sign-in, D83) use **Better Auth**'s
own tables in the same database (`reader_user`, `reader_session`,
`reader_account`, `reader_verification`; exact names fixed in 9b.5), with two
extra columns on the user: `banned` and `is_author` (marks the owner's own
account, §13.37). The admin sign-in is separate (D71): readers are never admins.
The newsletter's subscribers are not stored here: they are a **Resend segment**
(what Resend used to call an audience; its id is `RESEND_AUDIENCE_ID`); pending confirmations are signed links
(`NEWSLETTER_SECRET`), not rows.

**Images.** Uploaded through the admin to Cloudinary (§3 above uses the same
signature route, with a `blog` folder, `portfolio/blog`, max 1600×1600).

**Validation.** Zod on every write (as D74): `slug` unique and not one of the
blog's own paths (`tags`, `privacy`, `newsletter`, `rss.xml`, `sitemap.xml`,
`robots.txt`, `api`), at most 8 tags,
`title` ≤ 120 characters, `description` ≤ 300; the editor also checks each block
(`docs/blog-markdown.md`) before a post can be published, including that every
image has alt text.

---

## 5. Creatives — content model

Decided at 10a (Q1, D86): **no external CMS**. The creatives content lives in the
same Postgres database and is edited in the same admin as everything else
(`design.md` §14.26), with images on Cloudinary through the existing signed upload
(`portfolio/creatives`). Every table has `created_at` and `updated_at` (with the
trigger) like the rest; every list table has `order_index` and `is_published`.

```
design_pieces                                   -- Graphic design gallery (§14.21)
  id                serial primary key
  slug              text unique not null
  title             text not null
  category          text not null             -- 'Brand identity', 'Poster', 'Social'… filter chips
  cover_url         text not null             -- Cloudinary
  cover_width       integer not null          -- pixel size, so the grid reserves space
  cover_height      integer not null
  cover_alt         text not null
  images            jsonb not null default '[]'   -- more images: [{ url, width, height, alt }]
  description       text                      -- plain text, blank lines make paragraphs
  client            text
  role              text
  tools             text[] not null default '{}'  -- Figma, Photoshop, Illustrator…
  year              integer
  link_url          text
  is_featured       boolean not null default false  -- shown on the home page
  order_index, is_published, created_at, updated_at

photo_events                                    -- Photography (§14.22–14.23)
  id                serial primary key
  slug              text unique not null
  title             text not null             -- 'PyCon Cameroon 2026'
  event_date        date not null
  place             text
  kind              text                      -- 'Conference', 'Community', 'Portrait'…
  cover_url, cover_width, cover_height, cover_alt   -- as design_pieces
  description       text
  role              text                      -- 'Event photographer'
  covered           text[] not null default '{}'  -- 'Photography', 'Portraits'…
  images            jsonb not null default '[]'   -- selected pictures: [{ url, width, height, alt, caption }]
  credits           jsonb not null default '[]'   -- [{ role, name, url? }]
  album_url         text                      -- the full album (Google Photos, Drive, Behance…)
  album_label       text                      -- 'Google Photos' …
  is_featured, order_index, is_published, created_at, updated_at

creative_services                               -- Services page (§14.24)
  id                serial primary key
  title, description, icon  text
  group_name        text not null             -- 'design' | 'photography'
  items             text[] not null default '{}'   -- what is offered
  order_index, is_published, created_at, updated_at

creative_faqs                                   -- the old pages' design/photography questions
  id, question, answer, group_name, order_index, is_published, created_at, updated_at

creatives_settings                              -- one row (id = 1), like the profile
  hero_statement, hero_line, design_intro, photography_intro,
  portals_title, portal_design_text, portal_photography_text, marquee_words text[],
  contact_statement, contact_text, contact_note, seo_description
```

The photography entries are **events with a selection of pictures**, not one row per
photo: the owner picks the pictures to show and links the full album elsewhere
(`album_url`). The filter categories are the distinct `category` values of published
design pieces. Videography will add its own table when it is designed (D87).

**Validation.** Zod on every write (as D74): `slug` unique and URL-safe, `title` ≤ 120
characters, at most 60 pictures per event and 12 images per piece, every image with
alt text and its pixel size, an album address that is an `https://` URL.

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
| `services` 'UI/UX & Graphic Design', 'Photography', 'Event Coverage' | `creative_services` | Move; the old `graphic-design.html` and `photography.html` copy becomes the Services page's text and `creative_faqs` |
| `works` `type='project'` | `projects` | Copy; generate `slug`; `'#'` links → `NULL`; first sentence → `summary` |
| `works` `type='design'`, `type='event'` | `design_pieces` / `photo_events` | Export to JSON and import into the creatives tables (10b). Seed rows are Unsplash placeholders — check live data. |
| `journey` `type='work'`/`'education'` | `journey` | Copy; `company` → `organization`; parse `dates` into `start_date`/`end_date` |
| `journey` 'Photographer/Designer — CEY2 Youth Church', 'Graphic Designer — Kris Kitchen' | creatives site | Q6 (decided). Removed from the dev seed |
| — | `certifications` | New; no old rows. The seven Google badges in `assets/certs/` are seeded — Q22 |
| — | `volunteering` | No volunteering entries exist in the old data |
| `socials` | `socials` | Copy; set `show_on` — Q8 |
| FAQ (hardcoded in `index.html`) | `faqs` | Keep software questions; design/photo questions move to the creatives site (removed from the dev seed) |

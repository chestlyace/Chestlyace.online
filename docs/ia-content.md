# Information Architecture & Content

What exists on each site, in what order, and where every piece of content comes
from. Copy marked **carry over** is taken from the old site as-is (D12). Copy
marked **edit** has to change because it describes design or photography work,
which no longer belongs on the main site (D4).

## 1. Sitemap

### `chestlyace.online` — main

| Route | Purpose |
|---|---|
| `/` | Single-page portfolio, all sections below |
| `/admin` | Admin panel (`noindex`, auth-gated) |
| `/resume.pdf` | Redirect to `profile.resume_url` so the link never changes |
| `/sitemap.xml`, `/robots.txt` | Generated |
| `/projects/[slug]` | **Maybe later** — project detail pages (`open-questions.md` Q11) |

### `creatives.chestlyace.online`

| Route | Purpose |
|---|---|
| `/` | Hero + filterable gallery (design / photography / events) |
| `/[slug]` | Single piece: images, description, client, tools |
| `/services` | Design & photography services (absorbs the old `graphic-design.html` and `photography.html`) |
| `/sitemap.xml`, `/robots.txt` | Generated |

Contact on the creatives site reuses the WhatsApp/email contact pattern; whether
it gets its own page or a section on `/` is decided when that site is built.

### `blog.chestlyace.online`

| Route | Purpose |
|---|---|
| `/` | Post list, newest first |
| `/[slug]` | Post |
| `/tags/[tag]` | Posts with a tag |
| `/rss.xml` | RSS feed |
| `/sitemap.xml`, `/robots.txt` | Generated |

## 2. Main site — homepage sections

In page order. Every section has an `id` so the nav and external links can jump
to it.

### 2.1 Hero — `#top`

| Element | Source | Copy status |
|---|---|---|
| Status pill "Open to Remote Roles" | `profile.tagline` + `availability` | carry over |
| Name "Chestly Ace" | `profile.name` | carry over |
| Headline (was "Developer / Designer / & PHOTOGRAPHER") | `profile.headline` | **edit** — Q4 |
| Intro line (was "Software developer, graphic designer, and photographer crafting modern digital experiences.") | `profile.about_quote` or new field | **edit** |
| SEO line "Amahndong Chestly, known professionally as Chestly Ace, builds…" | static | **edit** — drop "brand visuals and photography-driven" |
| CTAs: View Projects → `#projects`, Get In Touch → `#contact` | static | carry over ("View My Work" → "View Projects") |
| Phone, email, socials row | `profile`, `socials` | carry over |
| Portrait | `profile.hero_image_url` | carry over |

The old hero's floating icons included a camera — replace with software-only
icons or remove.

### 2.2 About — `#about`

| Element | Source | Copy status |
|---|---|---|
| Heading "ABOUT ME" | static | carry over |
| Quote "Blending logic with creativity to craft digital experiences that matter." | `profile.about_quote` | carry over (works for an engineer) |
| Body | `profile.about_body` | **edit** — currently "a multidisciplinary creator blending software development, graphic design, and photography". Q5 |
| Download resume button | `profile.resume_url` | carry over |

### 2.3 Skills — `#skills`

Was "My Arsenal" inside About; becomes its own section so it can be linked.

| Group | Source |
|---|---|
| Languages | `skills` where `category='language'` |
| Frameworks | `category='framework'` |
| Databases | `category='database'` (new group) |
| Cloud & DevOps | `category='cloud'` (new group) |
| Tools | `category='tool'` — minus creative tools (Q7) |

### 2.4 Services — `#services`

Software services only (D9), followed by one fixed card pointing to the creatives
site. Proposed starting rows, built from the old Software Development service
and the old `software-development.html` page:

| Service | Items (carry over / adapted) |
|---|---|
| **Web Applications** | Full-stack web apps, dashboards, custom interfaces |
| **Websites & Landing Pages** | Business websites, landing pages, portfolio sites — fast, responsive, built to convert |
| **Backend & APIs** | API design and integration, databases, scalable backend architecture |
| **Mobile Apps** | Cross-platform apps (Flutter, React Native) |

Section intro (adapted from the old page): "I help businesses, founders, and teams
launch responsive websites and custom web applications, with attention to
performance, maintainable code, and clean delivery."

**Creatives card** (fixed component): "Looking for design or photography? → See my
creative work at creatives.chestlyace.online".

### 2.5 Projects — `#projects`

- Grid of `ProjectCard`s from `projects` (published, ordered; featured first).
- No tabs — design and events moved out (D8).
- Heading: "Projects" (old: "Work").

### 2.6 Experience — `#experience`

- Timeline from `journey` where `type IN ('work','education')`.
- Heading: "Experience" (old nav label "EXPERIENCE", section heading "Journey").
- Whether education is merged in the same timeline or shown as a sub-group:
  decided during build, default is one timeline with an "Education" badge.

### 2.7 Volunteering — `#volunteering` (new)

- Timeline from the `volunteering` table (D33), same `TimelineItem` component.
- Short intro line (new copy needed).
- No volunteering entries exist in the old data. Candidates: CEY2 Youth Church
  (Q6), plus anything new you add.
- Hidden automatically while it has no published entries.

### 2.8 Contact — `#contact`

| Element | Source | Copy status |
|---|---|---|
| Heading "Let's Work Together" | static | carry over |
| Intro "Have a project in mind? Let's create something extraordinary. Whether it's development, design, or photography." | static | **edit** — drop "design, or photography" |
| Email / Call tiles | `profile.email`, `profile.phone` | carry over — fix email mismatch (Q9) |
| Social links | `socials` with `main` in `show_on` | carry over |
| WhatsApp QR "Scan To Connect" | static image | carry over |
| Form: name, email, subject, message → WhatsApp | static | carry over; subjects become "General Inquiry", "Web Development Project", "Job Opportunity", "Collaboration" (Q10) |

### 2.9 FAQ — `#faq`

From `faqs`. Rendered as `FAQPage` JSON-LD. Starting content:

| Question | From |
|---|---|
| What kind of software development projects do you handle? | old homepage FAQ — carry over |
| Can clients hire you remotely? | old homepage FAQ — **edit** (drop "design, and digital content") |
| Can you build a portfolio website or business landing page? | old `software-development.html` — carry over |
| Do you also help with UI and presentation? | old `software-development.html` — carry over |
| Do you offer graphic design services…? / Are you available for photography…? | **move** to creatives site |

## 3. Navigation

### Header — main site

`Home · About · Skills · Services · Projects · Experience · Volunteering · Contact`
then a divider, then `Creatives ↗` `Blog ↗`, then the theme toggle.

Site labels are **Dev · Creatives · Blog** everywhere (D25). The in-page links
arrive in Phase 5 with the sections; until then the header shows the cross-site
links and theme toggle only (D26).

On mobile the in-page links collapse into a menu; the cross-site links and theme
toggle stay in the menu too. Volunteering drops out of the nav when the section
is hidden.

### Header — creatives and blog

Site's own links (e.g. `Work · Services · Contact` / `Posts · Tags`), then
`Dev ↗` (main site) and the other subdomain, then the theme toggle.

The old header also showed a "chestlyace.online" globe link pointing at itself —
drop it.

### Footer — all sites

| Column | Content |
|---|---|
| Brand | Logo, "DEV.ACE", one-line description (old: "Crafting digital experiences with precision code and creative design…" — **edit** per site) |
| Sites | Dev, Creatives, Blog |
| Quick links | The current site's own nav |
| Connect | Socials filtered by `show_on`, email |
| Bottom bar | © year Chestly Ace · Resume |

Phase 3 builds the brand, Sites column, and © line. The description, quick links,
socials, email, and resume link arrive in Phase 5 (D26).

Dropped from the old footer: the newsletter "Subscribe" box (it wasn't wired to
anything; Q16 covers a blog newsletter), and the "Privacy Policy" / "Terms of
Service" links (they pointed nowhere; add real pages only if a form starts storing
data).

## 4. SEO

### Titles and descriptions

| Site | `<title>` | Description (draft) |
|---|---|---|
| main | Chestly Ace (Amahndong Chestly) — Software Engineer | Chestly Ace (Amahndong Chestly) is a software engineer building fast, reliable web applications, backends, and APIs. Open to remote roles. |
| creatives | Chestly Ace — Design & Photography | Graphic design, branding, and photography by Chestly Ace (Amahndong Chestly). |
| blog | Chestly Ace — Blog | Writing on software engineering, web development, and building things. |

Keep both name forms ("Chestly Ace" and "Amahndong Chestly") in titles,
descriptions, and JSON-LD — the old site deliberately targeted both.

### Structured data

- main: `Person` (name, alternateName, jobTitle "Software Engineer", sameAs →
  socials, url) + `WebSite` + `FAQPage`.
- creatives: `Person` (same `@id`) + `CreativeWork` per piece.
- blog: `Blog` + `BlogPosting` per post.

Generated on the server from data. The old site generated JSON-LD in the browser
after load.

### Other

- Each site has its own canonical URLs, sitemap, and Open Graph image.
- Generated OG images per project / post / piece (`opengraph-image.tsx`) are a
  nice-to-have.

## 5. Static files

| File | New location |
|---|---|
| `favicon.ico`, `favicon-32x32.png`, `apple-touch-icon.png` | `app/` (Next.js metadata files) |
| Logo (`assets/img/69059dfc-….png`) | `public/brand/logo.png` |
| WhatsApp QR (`assets/img/wa_logo.jpeg`) | `public/brand/whatsapp-qr.jpeg` |
| `hero-optimized.webp` (OG image) | `public/og/main.webp` |
| `assets/og/graphic-design-og.webp`, `photography-og.webp` | `public/og/` for the creatives site |
| `resume.pdf` | Cloudinary (via admin) or `public/resume.pdf`; `/resume.pdf` route redirects to `profile.resume_url` |
| Google certification badges (`assets/certs/`, 7 PNGs + 10 SVGs) | Not referenced anywhere on the old site. Whether to add a Certifications section: Q22 |
| Journey logos (`digimark.jpeg`, `yibs.png`, …) | Cloudinary via admin; `journey.logo_url` updated |

## 6. Redirects from the old site

Old URLs are indexed. All redirects are permanent (308) and live in
`next.config.ts` / `proxy.ts`.

| Old URL | New URL |
|---|---|
| `chestlyace.online/software-development.html` | `chestlyace.online/#services` |
| `chestlyace.online/graphic-design.html` | `creatives.chestlyace.online/services` |
| `chestlyace.online/photography.html` | `creatives.chestlyace.online/services` |
| `chestlyace.online/admin/` and `/admin/index.html` | `chestlyace.online/admin` |
| `chestlyace.online/#work` | can't redirect (fragment); keep an empty `id="work"` anchor on Projects |
| `chestlyace.online/#journey` | same — keep `id="journey"` anchor on Experience |
| `www.chestlyace.online/*` | `chestlyace.online/*` |

## 7. Copy edit checklist

Everything that has to be rewritten before launch because it mentions design or
photography on the main site:

- [ ] Hero headline (Q4)
- [ ] Hero intro line and SEO line
- [ ] About body (Q5)
- [ ] Contact intro
- [ ] Contact form subjects (Q10)
- [ ] FAQ "remote" answer
- [ ] Footer description
- [ ] Page `<title>`, meta description, OG/Twitter text, JSON-LD `jobTitle`
- [ ] Volunteering intro (new)

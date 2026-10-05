# Design

## 1. Direction

**Evolve the current site, don't replace it** (D13). The old site's bones stay:
big condensed display headings, rounded cards, a royal-blue primary, deep-black
dark mode, and a dark/light toggle. The redesign is a **polish and consistency
pass**:

- one set of design tokens instead of colours hand-picked per section
- one icon set instead of three
- consistent spacing, card styles, and section rhythm
- every component works in both themes and at phone width
- accessible by default: contrast, focus states, reduced motion

Personality: confident and clean, more "engineer" than "agency". The creative,
expressive visuals now belong on `creatives.chestlyace.online`.

## 2. Colour tokens

Defined once as CSS custom properties in `app/globals.css` and exposed to
Tailwind through `@theme`. Components use token names (`bg-surface`,
`text-muted`), never raw hex values or `dark:` colour pairs.

| Token | Light | Dark | Use |
|---|---|---|---|
| `background` | `#F8FAFC` | `#0A0A0A` | Page background |
| `background-alt` | `#F1F5F9` | `#121212` | Alternating section bands |
| `surface` | `#FFFFFF` | `#171717` | Cards, form fields, menus |
| `surface-raised` | `#FFFFFF` | `#1F1F1F` | Hover state, modals |
| `border` | `#E2E8F0` | `#262626` | Card and field borders, dividers |
| `foreground` | `#0F172A` | `#FAFAFA` | Headings, body text |
| `muted` | `#475569` | `#A3A3A3` | Secondary text, captions, dates |
| `primary` | `#2563EB` | `#2563EB` | Buttons, fills, active nav |
| `primary-foreground` | `#FFFFFF` | `#FFFFFF` | Text on `primary` |
| `primary-text` | `#1D4ED8` | `#60A5FA` | Links and accent **text** (plain `#2563EB` on `#0A0A0A` fails contrast) |
| `secondary` | `#10B981` | `#34D399` | "Available" pulse dot, success states |
| `ring` | `#2563EB` | `#60A5FA` | Focus outline |
| `danger` | `#DC2626` | `#F87171` | Form errors, admin delete |

Carried over from the old Tailwind config: `primary #2563EB`, `secondary #10B981`,
`background-light #F8FAFC`, `background-dark #0A0A0A`, `card-dark #171717`.

Contrast rule: body text and `muted` must meet WCAG AA (4.5:1) on `background`
and `surface` in both themes. Check every new token pair before adding it.

## 3. Typography

| Role | Font | Notes |
|---|---|---|
| Display | **Bebas Neue** | Section titles ("ABOUT ME", "LET'S WORK TOGETHER"), hero name. Uppercase, tight leading. Never for body text. |
| Body / UI | **Inter** | Paragraphs, nav, buttons, forms |
| Code | **JetBrains Mono** (proposed) | Blog code blocks, tech-stack tags |

The old site also loaded **Outfit**; dropping it is proposed (`open-questions.md`
Q13). Fonts are self-hosted through `next/font` — no Google Fonts request at runtime.

Type scale (rem, mobile → desktop):

| Step | Size | Use |
|---|---|---|
| `display-xl` | 4.5 → 8 | Hero name, giant section headings |
| `display-lg` | 3 → 5 | Section headings |
| `h3` | 1.5 → 1.875 | Card titles |
| `body-lg` | 1.125 | Hero tagline, about text |
| `body` | 1 | Default |
| `sm` | 0.875 | Meta, dates, tags |
| `xs` | 0.75 | Eyebrow labels (uppercase, wide tracking) |

## 4. Per-site accents

All three sites share every token. Each site may override **only** `primary`,
`primary-text`, and `ring`, so they feel related but distinguishable:

| Site | Accent | Status |
|---|---|---|
| main | Royal blue `#2563EB` | Decided |
| creatives | TBD | Q12 |
| blog | TBD | Q12 |

Applied by a `data-site="main|creatives|blog"` attribute on `<html>` set in each
site's root layout.

## 5. Shape, spacing, depth

- **Radius**: `sm 0.5rem` (inputs, tags), `md 1rem` (buttons, small cards),
  `lg 1.5rem` (cards, images), `full` (pills, avatar, icon buttons). Same scale as
  the old config.
- **Spacing**: Tailwind's default 4px scale. Sections use `py-20 md:py-28`;
  content width `max-w-7xl` with `px-4 sm:px-6` gutters (16px on phones).
- **Shadows**: light theme uses soft shadows on cards; dark theme uses borders and
  `surface-raised` instead of shadows (shadows are invisible on near-black).
- **Background texture**: the old faint "swirl" SVG pattern is kept as an optional
  hero background at ≤5% opacity, drawn with `currentColor` so it works in both
  themes.

## 6. Icons

The old site mixed Material Icons (two styles), Font Awesome, and devicon, loaded
from three CDNs. The new site uses:

- **Lucide** (`lucide-react`) for all UI icons — tree-shaken, no CDN
- **devicon** SVGs for technology logos in Skills and project tech stacks
- **Simple Icons** for brand/social logos (GitHub, LinkedIn, …), since Lucide
  doesn't ship brand marks

`services.icon` and `socials.icon` in the database store names from these sets.

## 7. Theming (dark/light)

- Three states: **system** (default), light, dark. The toggle cycles through them.
- Dark mode is class-based (`.dark` on `<html>`) so the toggle can override the
  system setting.
- **No flash of the wrong theme**: a tiny inline script in `<head>` reads the
  preference before first paint.
- The preference is stored in a cookie on `.chestlyace.online` so it carries across
  all three subdomains (`architecture.md` §7).
- `meta[name=theme-color]` updates with the theme (`#F8FAFC` / `#0A0A0A`).

## 8. Motion

- Subtle only: fade/slide-up as sections enter the viewport (~300ms, ease-out),
  hover lift on cards, the pulsing "available" dot.
- Everything respects `prefers-reduced-motion: reduce` — animations off,
  content visible immediately.
- No scroll-jacking, no parallax on text.

## 9. Component inventory

### Shared (`components/shared/`) — all three sites

| Component | Notes |
|---|---|
| `SiteHeader` | Logo + wordmark, in-page links (main only), cross-site links (Creatives ↗, Blog ↗), theme toggle, mobile menu. Sticky, blurred background on scroll. |
| `SiteFooter` | Copyright, socials (filtered by `show_on`), links to all three sites, resume link |
| `ThemeToggle` | system / light / dark, accessible label that states the current mode |
| `Button` | Variants: `primary`, `secondary` (outline), `ghost`, `link`. Sizes `sm`/`md`/`lg`. Optional trailing icon. Renders `<a>` when given `href`. |
| `SectionHeading` | Eyebrow label + Bebas display title + optional intro paragraph |
| `Tag` | Small pill for tech stack, blog tags |
| `StatusPill` | "Open to Remote Roles" with pulsing dot; colour from `profile.availability` |
| `Container` | `max-w-7xl` + gutters |

### Main site (`components/main/`)

| Component | Notes |
|---|---|
| `Hero` | Status pill, name in display type, headline, short intro, CTAs (View Projects, Get In Touch), quick contact row, portrait |
| `About` | Quote, body text, resume download button |
| `SkillGroup` | Category label + grid of devicon logo + name |
| `ServiceCard` | Icon, title, description, bullet items |
| `CreativesCard` | Fixed card in Services linking to `creatives.chestlyace.online` |
| `ProjectCard` | Image, category label, title, summary, tech tags, live/source buttons (hidden or "Private" badge when `is_*_private`) |
| `Timeline` + `TimelineItem` | Used by both Experience and Volunteering. Logo, role, organization, dates, description. Vertical line on desktop, stacked on mobile. |
| `ContactCard` | Email / phone / WhatsApp tiles |
| `ContactForm` | Name, email, subject, message → opens WhatsApp prefilled (current behaviour; `open-questions.md` Q10) |
| `FaqList` | Native `<details>/<summary>` accordion |

### Creatives (`components/creatives/`)

`GalleryGrid` (masonry), `GalleryFilter` (design / photography / events),
`Lightbox` (the old one, rebuilt: keyboard arrows, swipe, Escape, focus trap,
counter).

### Blog (`components/blog/`)

`PostCard`, `PostHeader` (title, date, reading time, tags), `Prose` (typography
for MDX output in both themes), `CodeBlock` (syntax highlighting, copy button),
`Callout`, `TableOfContents`.

### Admin (`app/_sites/main/admin/`)

Plain and functional, built from the same tokens: sidebar of resources, list
views with drag-to-reorder and publish toggles, edit forms with inline validation
errors, image upload field with preview.

## 10. Accessibility checklist

- One `<h1>` per page; heading levels don't skip.
- Every interactive element is reachable by keyboard and shows a visible
  `ring` focus outline.
- Images have meaningful `alt`; decorative images use `alt=""`.
- Icon-only buttons have `aria-label`.
- Colour is never the only signal (private links also show a "Private" label).
- Mobile menu and lightbox trap focus and close on Escape.
- Tap targets at least 44×44px.

## 11. What we are deliberately leaving behind

- Sections hidden and toggled with `showSection()` — every section is visible and
  linkable now.
- Tabs for Projects / Design / Events — main site has projects only.
- "SEO FAQ" as a visible heading — it becomes plain "FAQ".
- Tailwind via CDN, inline `onclick` handlers, three icon CDNs.

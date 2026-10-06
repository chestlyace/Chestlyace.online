# Design

> **Status: foundations approved in Phase 5a.1 (D37–D41); components and sections
> pending (D30).** §1–§8 below are the owner-approved foundations: direction,
> colour, typography, spacing, depth, icons, theming, and motion. Components (§9,
> §13) and page sections (§14) are still the Phase 3 placeholder baseline until
> their specs are approved in Phase 5a.2–5a.4. Nothing visual is built or restyled
> until its spec is written in this file and approved by the owner
> (`instructions.md` §8). The process is in §12.

## 1. Direction

**Airy, minimal, and Apple-like — with insanely smooth motion** (D41). The site
keeps the old portfolio's colours (black, white, greys, blue accent) and its bold
condensed headings, and combines them with Apple's restraint and craft and the
scroll-driven motion of the reference sites.

- **Restraint.** Lots of space, few colours, one accent. Every element earns its
  place; content (work, words) carries the page.
- **Craft.** Every spacing, timing, and type value is deliberate and defensible.
  Details compound: press feedback, translucent chrome, tight display tracking,
  springs that can be interrupted.
- **Motion as a signature.** Smooth inertial scrolling, scroll-choreographed
  reveals, and a few standout WebGL/Rive moments make the site feel alive — never
  at the cost of speed, readability, or accessibility.
- Personality: confident, precise, engineer-made. Expressive photography/design
  visuals belong on `creatives.chestlyace.online`.

### References (owner-supplied)

Described and linked, not committed (owner decision, 2026-10-06).

| Reference | What we take from it |
|---|---|
| [anubi.io](https://anubi.io/) | Overall layout rhythm: big statements, generous whitespace, image-forward work tiles with `↗` links, minimal top bar. Motion stack and feel: **Lenis** smooth scrolling, **GSAP + ScrollTrigger** scroll choreography, **Flip** layout transitions, **WebGL (OGL)** and **Rive** accents. Small **mono labels** (it uses IBM Plex Mono; we use JetBrains Mono). Built with Next.js. |
| [anubi.io/lab](https://anubi.io/lab) | Experimental, interaction-led pieces — the bar for the site's signature motion moments. |
| [anubi.io/work/all](https://anubi.io/work/all) | Project index: dense-but-calm grid of work, Flip-style transitions between views. Reference for the Projects section and project pages. |
| Apple (apple.com, Apple HIG — via the `apple-design` skill) | Airy layout, system typography (SF), translucent blurred navigation, large confident type with tight tracking, pill-shaped controls, critically damped springs, reduced-motion and reduced-transparency care. |

## 2. Colour tokens

**Black, white, and greys in their different shades, with blue wherever a
brighter colour is needed** — the old site's colours, tuned to Apple-like neutral
greys (D37). Defined once as CSS custom properties in `app/globals.css`, exposed to
Tailwind through `@theme`. Components use token names (`bg-surface`,
`text-muted`), never raw hex values or `dark:` colour pairs.

| Token | Light | Dark | Use |
|---|---|---|---|
| `background` | `#FFFFFF` | `#0A0A0A` | Page background |
| `background-alt` | `#F5F5F7` | `#121212` | Alternating section bands |
| `surface` | `#F5F5F7` | `#171717` | Tiles and cards on `background`, form fields |
| `surface-raised` | `#FFFFFF` | `#1F1F1F` | Tiles on `background-alt`, menus, modals, hover states |
| `border` | `#D2D2D7` | `#262626` | Dividers and card edges (decorative) |
| `foreground` | `#1D1D1F` | `#F5F5F7` | Headings, body text |
| `muted` | `#6E6E73` | `#A1A1A6` | Secondary text, captions, dates, labels |
| `primary` | `#2563EB` | `#2563EB` | The blue accent: primary buttons, active states, highlights |
| `primary-foreground` | `#FFFFFF` | `#FFFFFF` | Text/icons on `primary` |
| `primary-text` | `#2563EB` | `#60A5FA` | Links and accent **text** (`#2563EB` on near-black fails contrast) |
| `secondary` | `#10B981` | `#34D399` | "Available" status dot, success states only |
| `ring` | `#2563EB` | `#60A5FA` | Focus outline |
| `danger` | `#B91C1C` | `#F87171` | Form errors |

**Materials** (translucent chrome, §5):

| Token | Light | Dark |
|---|---|---|
| `material-bar` | `rgb(255 255 255 / 0.72)` | `rgb(10 10 10 / 0.72)` |
| `material-blur` | `blur(20px) saturate(180%)` | same |

Rules:

- **Blue is the only colour accent**, and it's used sparingly — one primary action
  per view, links, focus, active states. Greys do the rest of the work.
- `secondary` green exists only for the availability dot and success feedback.
- Kept from the old site: `#2563EB` blue, `#0A0A0A` dark background, `#171717`
  dark cards, `#10B981` green. Greys moved from Tailwind's blue-tinted slate to
  Apple's true neutrals (`#F5F5F7`, `#D2D2D7`, `#6E6E73`, `#1D1D1F`).
- **Contrast** (checked, WCAG AA 4.5:1): `foreground`, `muted`, `primary-text`,
  and `danger` pass on `background`, `background-alt`, `surface`, and
  `surface-raised` in both themes; white on `primary` is 5.2:1. `border` is
  decorative only — form-field outlines need a 3:1 edge, defined in the form-field
  component spec.
- Check every new token pair before adding it.

## 3. Typography

**The same bold and mono faces as the old site, with an Apple-like body** (D38).

| Role | Font | Notes |
|---|---|---|
| Display | **Bebas Neue** | The bold voice: hero, section titles, the "Chestly Ace" wordmark, big statements. Uppercase by design. Never below 2.5rem, never for running text. |
| Text | **System UI → Inter** | Everything else: body, headings below display, nav, buttons, forms. Stack: `-apple-system, BlinkMacSystemFont, var(--font-inter), "Segoe UI", Roboto, sans-serif` — SF Pro on Apple devices (Apple's font can't be embedded on the web, but the system font shows it), Inter elsewhere. |
| Mono | **JetBrains Mono** | Labels and metadata in the anubi.io style (eyebrows, dates, tech tags, counters), code blocks. |

- **Outfit is dropped** (supersedes D22). Its old job — small uppercase labels — is
  now done by the mono face.
- Fonts are self-hosted through `next/font` (`lib/fonts.ts`); Inter is loaded only
  as the fallback for the system stack.
- Tailwind classes: `font-display`, `font-sans` (default text), `font-mono`.

**Type scale** — fluid between a 375px phone and a 1280px desktop:

| Step | Font | Size (rem) | Leading | Tracking | Use |
|---|---|---|---|---|---|
| `display-2xl` | Display | 5 → 11 | 0.85 | 0 | Hero statement |
| `display-xl` | Display | 4 → 8 | 0.9 | 0 | Section titles |
| `display-lg` | Display | 3 → 5 | 0.95 | 0 | Sub-section titles, big numbers |
| `title` | Text, semibold 600 | 2 → 3 | 1.1 | −0.02em | Headings in text style (project names, page titles) |
| `h3` | Text, semibold 600 | 1.375 → 1.75 | 1.2 | −0.01em | Card titles |
| `lead` | Text, regular 400 | 1.1875 → 1.3125 | 1.45 | −0.005em | Intros, hero tagline, about text |
| `body` | Text, regular 400 | 1.0625 (17px) | 1.55 | 0 | Default running text (Apple's 17px body) |
| `sm` | Text, regular 400 | 0.875 | 1.45 | 0 | Secondary text, captions |
| `label` | Mono, medium 500 | 0.75 | 1.3 | +0.08em, uppercase | Eyebrows, dates, tags, counters |

- Tracking is size-specific: tighter as text grows, near `0` for body, positive for
  small uppercase mono.
- Hierarchy comes from weight + size + leading together, not size alone.
- Sizes are in `rem` so the user's text-size setting scales the layout.
- Reading measure: running text never wider than ~68ch (`max-w-[68ch]`).

## 4. Per-site accents

All three sites share every token. Each site may override **only** `primary`,
`primary-text`, and `ring`, so they feel related but distinguishable:

| Site | Accent | Status |
|---|---|---|
| main | Blue `#2563EB` | Decided |
| creatives | TBD — uses the main accent until decided | Q12 |
| blog | TBD — uses the main accent until decided | Q12 |

Applied by a `data-site="main|creatives|blog"` attribute on `<html>` set in each
site's root layout.

## 5. Space, layout, shape, depth

**Spacing** — 4px base (Tailwind's scale), used generously:

| Use | Phone | Desktop |
|---|---|---|
| Section padding (top/bottom) | 96px (`py-24`) | 160px (`md:py-40`) |
| Section title → content | 48px | 64px |
| Between related blocks | 24px | 32px |
| Card padding | 20px | 32px |

**Layout:**

- Wide container `max-w-7xl` (1280px) for grids and media; narrow container
  `max-w-[980px]` for text-led sections (Apple's content width).
- Side gutters: 16px phones (`px-4`), 24px tablets (`sm:px-6`), 32px desktop
  (`lg:px-8`).
- 12-column grid on desktop, 4 on phones; gaps 16px phone, 24–32px desktop.

**Radius:**

| Token | Value | Use |
|---|---|---|
| `sm` | 8px | Tags, inputs, small chips |
| `md` | 12px | Menus, popovers, small cards |
| `lg` | 20px | Cards, media |
| `xl` | 28px | Large tiles, hero media |
| `full` | 9999px | Pill buttons, toggles, avatar, status pill |

**Depth:**

- **Light:** soft, low shadows only where something floats —
  `0 1px 2px rgb(0 0 0 / 0.04), 0 8px 24px rgb(0 0 0 / 0.06)`.
- **Dark:** no shadows (invisible on near-black); separation comes from
  `surface` / `surface-raised` steps and `border`.
- **Translucent chrome** (Apple materials): the sticky header and floating menus
  use `material-bar` + `material-blur`, with content scrolling underneath. Under a
  sticky bar, a soft fade/blur where content meets it — not a hard 1px line.
  Never stack one translucent layer on another.
- **Materialize, don't just fade:** translucent surfaces animate blur and scale
  together when they appear.
- `prefers-reduced-transparency: reduce` → materials become solid
  (`surface-raised`), no blur. `prefers-contrast: more` → solid backgrounds with a
  visible `foreground`-coloured border.

## 6. Icons

**Lucide + free Iconly** (D40):

| Set | Package | Use |
|---|---|---|
| **Lucide** | `lucide-react` | Functional UI icons: menu, close, arrows (`↗`), theme toggle, form icons, chevrons. 1.5px stroke. |
| **Iconly** (free v2) | `react-iconly` | Featured/decorative icons: service cards, contact tiles, feature callouts. Style: **Light** (outline, closest to Lucide's stroke). |
| **devicon** | SVGs | Technology logos in Skills and project tech stacks (Phase 5b, D24) |
| **Simple Icons** | `simple-icons` | Brand/social logos (Phase 5b, D24) |

- One set per job — never mix Lucide and Iconly within the same component.
- `services.icon` and `socials.icon` in the database store names from these sets.
- Packages are installed when first used (D24): `react-iconly`, devicon, and
  Simple Icons in Phase 5b.

## 7. Theming (dark/light)

- Three states: **system** (default), light, dark. The toggle cycles through them.
- Dark mode is class-based (`.dark` on `<html>`) so the toggle can override the
  system setting.
- **No flash of the wrong theme**: a tiny inline script in `<head>` reads the
  preference before first paint.
- The preference is stored in a `theme` cookie on `.chestlyace.online` so it carries
  across all three subdomains (`architecture.md` §7). On `*.localhost` and Vercel
  preview hosts the cookie is host-only — browsers don't share cookies across
  `localhost` subdomains. Logic lives in `lib/theme.ts`.
- `meta[name=theme-color]` updates with the theme (`#FFFFFF` / `#0A0A0A`).
- Theme changes ease the brightness jump (short cross-fade) instead of snapping.

## 8. Motion

**Insanely smooth motion, effects, and interactions** — the site's signature
(D39). Built on four tools, each with one job:

| Tool | Package | Job |
|---|---|---|
| **Motion** (Framer Motion) | `motion` (`motion/react`) | Component interactions: press/hover feedback, enter/exit, layout and shared-element transitions, gestures (drag, swipe), springs. |
| **GSAP** + ScrollTrigger, SplitText, Flip | `gsap` | Scroll-driven choreography: section reveals, pinned sequences, scrubbed timelines, split-text reveals, Flip transitions between layouts (e.g. grid ↔ list, card → project page). |
| **Lenis** | `lenis` | Site-wide smooth inertial scrolling, driven by GSAP's ticker so ScrollTrigger stays in sync. Anchor links scroll through Lenis. |
| **OGL** (WebGL) and **Rive** | `ogl`, `@rive-app/react-canvas` | A few signature moments only (e.g. hero visual, project-media hover distortion, an interactive illustration). Exact moments are chosen in the section specs. |

Packages are installed in Phase 5b when first used. GSAP uses its own free
"standard no-charge" licence (covers this site); the others are MIT/Unlicense.

**Curves** (CSS variables + equivalents in each library):

| Name | Value | Use |
|---|---|---|
| `ease-out` | `cubic-bezier(0.23, 1, 0.32, 1)` | Default for UI: anything entering or responding to input |
| `ease-in-out` | `cubic-bezier(0.77, 0, 0.175, 1)` | Elements moving across the screen |
| `ease-drawer` | `cubic-bezier(0.32, 0.72, 0, 1)` | Sheets, drawers, menus sliding in |
| Scroll reveals (GSAP) | `expo.out` / `power3.out` | Editorial reveals tied to scroll |
| Spring — default | Motion `{ type: "spring", bounce: 0, duration: 0.4 }` | Anything the user touches (critically damped, Apple damping 1.0) |
| Spring — momentum | `{ type: "spring", bounce: 0.2, duration: 0.4 }` | Only after a flick/drag that carried momentum |

`ease-in` is never used for UI.

**Durations:**

| Interaction | Duration |
|---|---|
| Press feedback (`scale(0.97)` on press) | 100–160ms |
| Hover, tooltips, small popovers | 150–200ms |
| Menus, dropdowns | 200–250ms |
| Modals, drawers | 300–500ms (spring preferred) |
| Scroll-linked reveals | 600–900ms (or scrubbed to scroll position) |
| Page / route transitions | 500–800ms |

UI responses stay under 300ms; only scroll and page choreography — which isn't
waiting on a click — runs longer.

**Principles** (from the `emil-design-eng` and `apple-design` skills):

1. **Purpose first.** Motion explains (where something came from, what changed)
   or delights at a deliberate moment. Decorative motion is reserved for signature
   moments.
2. **Respond instantly.** Feedback on press, not release.
3. **Interruptible.** Anything the user can touch uses springs that start from the
   current on-screen value and can be reversed mid-flight.
4. **Spatial consistency.** Things leave the way they came; menus and popovers grow
   from their trigger.
5. **Nothing appears from nothing.** Enter from `scale(0.95)` + `opacity: 0`, never
   `scale(0)`.
6. **Compositor-only.** Animate `transform`, `opacity`, `filter`/`clip-path` — never
   layout properties. `will-change` only when motion is imminent.
7. **Never animate keyboard-initiated actions** (shortcuts, focus moves).
8. **Content is never hostage to motion.** Text is in the HTML from the first paint
   (no blank hero waiting for JS); LCP is never delayed by an animation.
9. **Smooth means 60fps.** Heavy pieces (WebGL, Rive) are lazy-loaded, paused when
   off-screen, and skipped on `Save-Data`; each has a static fallback image.

**Reduced motion** (`prefers-reduced-motion: reduce`):

- Lenis off → native scrolling.
- No parallax, pinning, scrubbing, or split-text reveals; content shows in its
  final state.
- Springs and slides become short (≤200ms) opacity cross-fades.
- WebGL and Rive show their static fallback.
- Press feedback and colour/opacity changes that aid understanding stay.

## 9. Component inventory

### Shared (`components/shared/`) — all three sites

| Component | Notes |
|---|---|
| `SiteHeader` | Logo + "Chestly Ace" wordmark (D23), in-page links (main only — added in Phase 5), cross-site links to the other two sites (Dev ↗ · Creatives ↗ · Blog ↗, D25), theme toggle, mobile menu. Sticky, translucent background with backdrop blur. |
| `SiteFooter` | Logo + wordmark, links to all three sites (current one highlighted), © line. Added in Phase 5: socials (filtered by `show_on`), email, resume link, per-site description. |
| `Brand` | The old DA logo (`public/brand/logo.png`) + "Chestly Ace" wordmark in Bebas Neue. The logo's lettering is transparent, so dark mode puts a light backing behind it, which also reads as an outline. |
| `ThemeToggle` | system / light / dark, accessible label that states the current mode |
| `Button` | Variants: `primary`, `secondary` (outline), `ghost`, `link`. Sizes `sm`/`md`/`lg`. Optional trailing icon. Renders `<a>` when given `href`. |
| `SectionHeading` | Eyebrow label + Bebas display title + optional intro paragraph |
| `Tag` | Small pill for tech stack, blog tags |
| `StatusPill` | "Open to Remote Roles" with pulsing green dot. Only the "open" state exists for now; other `profile.availability` states are decided when that data arrives |
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

### Design system showcase (`app/sites/main/design-system/`)

`/design-system` on the main site shows every token, the type scale, and the
shared components in both themes. It returns 404 in production
(`VERCEL_ENV === "production"`), so it's only visible locally and on previews.

### Admin (`app/sites/main/admin/`)

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

## 12. Design process (D30)

The design is led by the owner and built to the owner's taste.

1. **Per page.** Each page is designed before it is built.
2. **Components first.** For the page, design every component it uses, one at a
   time: buttons, nav bars, links, cards, tags, form fields, and so on. Shared
   components are designed once and reused.
3. **Then sections.** With the components agreed, design the page section by
   section.
4. **The owner supplies the direction**: reference websites, screenshots, images
   (e.g. from Instagram), and any skills or tools to install (e.g. Framer
   Motion). Agents turn that into a written spec, propose options where the
   references leave a choice open, and ask rather than guess.
5. **Approval = merge.** Specs are added to this file in a docs-only pull
   request. The owner merging it approves the spec. Only then is it built.
6. **Specs replace the baseline.** When a spec changes a token, font, or
   component, the baseline sections above are updated to match in the same PR.

### What a component spec covers

- **Purpose** — where and why it's used
- **References** — the links and images the owner supplied
- **Anatomy** — its parts (label, icon, container…)
- **Variants and sizes**
- **States** — default, hover, focus, active, disabled, loading, error (as relevant)
- **Visual values** — colours (light and dark), typography, spacing, radius,
  borders, shadows
- **Motion** — what animates, duration, easing, the library used, and the
  reduced-motion behaviour
- **Responsive behaviour** — phone, tablet, desktop
- **Accessibility** — keyboard, focus, labels, contrast, tap targets
- **Approved in** — the PR that approved it

### What a section spec covers

- **Purpose and content** — what it says, and where the content comes from
- **References** — the links and images the owner supplied
- **Layout** — per breakpoint
- **Components used** — linking to their specs
- **Motion** — entrance, scroll, and interaction effects, with reduced-motion
  behaviour
- **Light and dark** — anything that differs between themes
- **Approved in** — the PR that approved it

## 13. Component specs

_None approved yet._

## 14. Page and section specs

_None approved yet._

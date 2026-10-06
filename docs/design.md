# Design

> **Status: foundations (D37–D41), core components (D42–D46), and content
> components (D47–D53) approved in Phase 5a.1–5a.3; homepage section and project
> page specs written in Phase 5a.4 (D54–D62, §14).** §1–§8 below are the
> owner-approved foundations: direction, colour, typography, spacing, depth, icons,
> theming, and motion. §13 holds the component specs and §14 the section and page
> specs. Nothing visual is built until Phase 5b, after the owner merges the last
> design PR. Nothing visual is built or restyled
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
| `primary-hover` | `#1D4ED8` | `#1D4ED8` | Hover fill of `primary` buttons (§13.1) |
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
  `surface-raised` in both themes; white on `primary` is 5.2:1 and on
  `primary-hover` 6.7:1. `border` is decorative only — form-field outlines need a
  3:1 edge, defined in the form-field component spec.
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
| `SiteHeader` | **Spec: §13.6.** Floating glass capsule: brand, key links (main: About · Projects · Experience · Contact), Sites chip + menu (§13.7), theme toggle; on phones it expands into the menu. |
| `SiteFooter` | **Spec: §13.8.** Brand + per-site description; Sites, Connect, and Contact columns; giant "CHESTLY ACE" wordmark revealed on scroll; © line and Back to top. |
| `Brand` | The old DA logo (`public/brand/logo.png`) + "Chestly Ace" wordmark in Bebas Neue. The logo's lettering is transparent, so dark mode puts a light backing behind it, which also reads as an outline. |
| `ThemeToggle` | **Spec: §13.2** (icon button). system / light / dark, accessible label that states the current mode |
| `Button` | **Spec: §13.1.** Magnetic pills. Variants `primary`, `secondary`, `ghost`; sizes `sm`/`md`/`lg`; optional trailing icon. Renders `<a>` when given `href`. |
| `IconButton` | **Spec: §13.2.** Icon-only circle: theme toggle, menu, close |
| `TextLink` | **Spec: §13.3.** Text roll (nav, footer, standalone) and inline underline (running text) |
| `SitesMenu` | **Spec: §13.7.** Popover from the header's Sites chip |
| `SkipLink` | **Spec: §13.9.** |
| `SectionHeading` | **Spec: §14.0.** Mono index ("02 — SKILLS") + Bebas `display-xl` title with a letter reveal + optional intro |
| `Tag` | **Spec: §13.4.** Mono label chip for tech stack, blog tags |
| `StatusPill` | **Spec: §13.5.** "Open to Remote Roles" with pulsing green dot. Only the "open" state exists for now; other `profile.availability` states are decided when that data arrives |
| `Container` | `max-w-7xl` + gutters |

### Main site (`components/main/`)

| Component | Notes |
|---|---|
| `Hero` | **Spec: §14.1.** The previous portfolio's hero, kept and restyled: status pill, stacked headline with a rotating outlined line, tagline, paragraph, CTAs, contact row, arched portrait with floating stickers and quote card, glow. New motion: letter entrance, cursor parallax, WebGL dot grid, scroll exit |
| `About` | **Spec: §14.2.** Scroll-lit statement, body text, facts list, resume button |
| `SkillGroup` | **Spec: §14.3.** Mono group label + logo tiles (mono → colour on hover); Certifications grid beneath |
| `ServiceCard` | **Spec: §13.11.** Large cards that stack on scroll: number, Iconly icon, title, description, items |
| `CreativesCard` | **Spec: §13.12.** Inverted last card of the service stack, linking to `creatives.chestlyace.online` |
| `ProjectCard` | **Spec: §13.10.** Image-forward tile: image, mono category label, title + `↗`; links to the project page. Hover zoom and "View ↗" cursor label |
| `Timeline` + `TimelineItem` | **Spec: §13.13.** Used by both Experience and Volunteering. Rail that fills blue on scroll, a dot per entry; dates, role, organization, description, optional logo |
| `ContactCard` | **Spec: §13.14.** Email / phone / WhatsApp tiles with copy buttons |
| `ContactForm` | **Spec: §13.15** (form fields). Name, email, subject, message; delivery per Q10 (email + WhatsApp) |
| `FaqList` | **Spec: §13.16.** Hairline accordion on native `<details>/<summary>` |
| `CertificationItem` | **Spec: §13.17.** Badge tile in a grid (Q22) |
| `RotatingWords` | **Spec: §14.1.** The hero's outlined line; words roll in and out letter by letter |
| `HeroBackground` | **Spec: §14.1.** OGL dot grid that reacts to the cursor; static CSS grid fallback |
| `ProjectMedia` | **Spec: §14.5.** Project image with the hover zoom and the shared WebGL ripple canvas |
| Project page | **Spec: §14.10.** `/projects/[slug]`: title, facts, hero image, Problem / Approach / Outcome, gallery, next project |

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

Shared components used by all three sites. Each spec follows the checklist in
§12. Colours are token names from §2; type steps are from §3; curves, springs, and
durations are from §8. **Approved in:** core components — PR #20 (issue #19);
content components — PR #22 (issue #21).

**Core components (Phase 5a.2):** [Button](#131-button) ·
[Icon button](#132-icon-button) · [Text link](#133-text-link) ·
[Tag](#134-tag) · [Status pill](#135-status-pill) ·
[Header](#136-header) · [Sites menu](#137-sites-menu) ·
[Footer](#138-footer) · [Skip link](#139-skip-link)

**Interaction rules shared by every component below:**

- **Hover effects only on devices that can hover**, behind
  `@media (hover: hover) and (pointer: fine)`. Touch devices get press feedback
  instead.
- **Focus:** `:focus-visible` shows a 2px `ring` outline with a 2px offset,
  following the component's radius. Never removed.
- **Tap targets:** at least 44×44px. Where the visible shape is smaller, the hit
  area is extended with an invisible pseudo-element.
- **Reduced motion:** listed per component; the §8 rules always apply.

### 13.1 Button

**Purpose.** Actions and calls to action: "View Projects", "Get In Touch",
"Download Resume", "Send", project "Live" / "Source".

**References.** Owner's choice: **magnetic pills** (2026-10-06). Apple's
pill-shaped controls; anubi.io's cursor-aware buttons.

**Anatomy.** Pill container → label → optional trailing icon (Lucide, e.g.
`arrow-up-right`, `arrow-right`, `download`). Renders `<a>` when it has `href`,
otherwise `<button>`.

**Variants.**

| Variant | Background | Text | Border | Hover (fine pointer) |
|---|---|---|---|---|
| `primary` | `primary` | `primary-foreground` | none | `primary-hover` |
| `secondary` | `surface` | `foreground` | 1px `border` | `surface-raised`, border `muted` at 40% |
| `ghost` | transparent | `foreground` | none | `surface` |

- One `primary` per view (§2). `secondary` for the other actions next to it.
  `ghost` for low-emphasis actions inside cards and toolbars.
- The Phase 3 `link` variant is removed — text links are their own component
  (§13.3).
- On `background-alt` bands, `secondary` uses `surface-raised` (hover:
  `surface`) so it stays visible.

**Sizes.**

| Size | Height | Padding (x) | Type | Icon | Use |
|---|---|---|---|---|---|
| `sm` | 36px (44px hit area) | 16px | 14px, medium 500 | 16px | Inside cards (project links) |
| `md` | 44px | 24px | 15px, medium 500 | 18px | Default |
| `lg` | 56px | 32px | 17px, medium 500 | 20px | Hero and contact CTAs |

- Radius `full`. Label and icon gap 8px. Text font (system → Inter), no
  uppercase, tracking `-0.005em`.
- Width hugs the content; on phones, hero CTAs may go full width (decided in the
  Hero section spec).

**States.**

| State | Treatment |
|---|---|
| Default | As the variant table |
| Hover | Background change (150ms `ease-out`); trailing icon nudges 2px in its direction (`↗` up-right, `→` right) |
| Magnetic | See Motion |
| Pressed | `scale(0.97)` on pointer down (120ms `ease-out`), released with the default spring |
| Focus | 2px `ring`, 2px offset, pill-shaped |
| Disabled | 40% opacity, no hover, no magnetic pull, `cursor: not-allowed`; `aria-disabled` on links |
| Loading | A 16px spinner replaces the trailing icon (or sits before the label if there is none); label stays so the width doesn't jump; `aria-busy="true"`; clicks ignored |

**Motion** (Motion — `motion/react`):

- **Magnetic pull.** While the pointer is within the button's box plus a
  **24px** margin, the button moves toward the pointer by **35%** of the
  pointer's offset from its centre, capped at **10px** in any direction. The label
  moves a further **15%** in the same direction (a slight parallax that reads as
  depth). Followed with a spring
  `{ type: "spring", bounce: 0, duration: 0.3 }`; when the pointer leaves, it
  returns with the default spring (`bounce: 0, duration: 0.4`). Interruptible —
  re-entering mid-return picks up from the current position.
- Only on `(hover: hover) and (pointer: fine)`. Off on touch, when disabled, and
  under reduced motion.
- Press scale applies on every device.
- Transforms only; the button's layout box never moves, so neighbours don't
  shift.

**Reduced motion.** No magnetic pull, no icon nudge. Background colour changes
and press scale stay.

**Responsive.** Same on all widths; magnetic pull simply never activates on
touch.

**Accessibility.** Native `<button>` / `<a>`. Icon-only buttons are a separate
component (§13.2). Text on `primary` is 5.2:1 (white on `#2563EB`) and 6.7:1 on
hover (`#1D4ED8`). External links say so to screen readers ("opens in a new
tab") when they use `target="_blank"`.

### 13.2 Icon button

**Purpose.** Icon-only controls: theme toggle, mobile menu, close, copy.

**Anatomy.** Circular container → one Lucide icon (20px, 1.5px stroke).

**Values.** 40px circle (44px hit area), radius `full`, transparent background,
icon `foreground`. Hover: `surface` background (150ms `ease-out`). Pressed:
`scale(0.94)`. Focus: 2px `ring`, circular.

**Motion.**

- **Icon swaps** (e.g. sun → moon → monitor on the theme toggle, menu → close)
  cross-fade with `opacity`, `scale(0.8 → 1)`, and `blur(2px → 0)`, 200ms
  `ease-out` (Motion `AnimatePresence`, `mode="popLayout"`).
- No magnetic pull — it's reserved for text buttons.
- Reduced motion: opacity cross-fade only.

**Accessibility.** `aria-label` is required. The theme toggle's label states the
current mode and the next one ("Theme: system. Switch to light"). The menu
button uses `aria-expanded` and `aria-controls`.

### 13.3 Text link

**Purpose.** Every link that isn't a button. Two treatments, by context (owner's
choice, 2026-10-06):

| Treatment | Where |
|---|---|
| **Text roll** | Nav links (header, mobile menu), footer links, standalone links ("All projects ↗", "Back to top ↑") |
| **Inline underline** | Links inside running text (about text, project write-ups, FAQ answers, blog prose) |

#### Text roll

**References.** anubi.io's rolling nav links.

**Anatomy.** `<a>` → a clipping box one line tall → two copies of the label
stacked vertically, each split into letters → optional trailing icon (`↗` for
other sites, `↑` / `→` for in-page).

**Values.**

| Context | Type | Colour | Hover colour |
|---|---|---|---|
| Header (desktop) | 14px, medium 500, uppercase, tracking `+0.04em` (the old site's nav) | `muted` | `foreground` |
| Mobile menu | `display-lg` step, Bebas | `foreground` | — (no hover on touch) |
| Footer columns | 15px, regular 400 | `muted` | `foreground` |
| Standalone | `sm` or `body`, medium 500 | `foreground` | `primary-text` |

**Active state** (header and mobile menu, the section currently in view):
`foreground` colour and a 4px `primary` dot centred 6px below the label. The dot
moves between links with a shared-layout animation (Motion `layoutId`, default
spring). `aria-current="location"` on the active link.

**Motion.**

- On hover, the top copy slides up out of the clip (`translateY(0 → -100%)`)
  while the bottom copy rolls in from below (`translateY(100% → 0)`), letter by
  letter: **300ms** per letter, `ease-out`, **15ms** stagger, total capped at
  450ms (longer labels shorten the stagger). Hovering out rolls it back the same
  way.
- **Pure CSS** (transitions with a per-letter `--i` delay) — no JS, so it works
  before hydration.
- A trailing icon nudges 2px in its direction at the same time.
- This roll is longer than the §8 hover range (150–200ms) on purpose: it's a
  signature moment, and the colour change still starts at 0ms.
- Touch: no roll. Pressed state dims to 60% opacity for 100ms.
- Reduced motion: no roll, colour change only (150ms).

**Accessibility.** The real label is in the link once, as text for assistive
tech (`sr-only`); the two split copies are `aria-hidden="true"`. Focus-visible
shows the `ring` (radius `sm`) and plays the roll, the same as hover — the roll is
a hover effect, not a reaction to a keyboard shortcut. Links that open another
site show `↗` and say "(opens Creatives site)" or similar to screen readers.

#### Inline underline

**Anatomy.** `<a>` in running text, with an underline drawn as a background
gradient so it can animate.

**Values.** Colour `primary-text`, same weight as the surrounding text. At rest:
a 1px underline in `currentColor` at **35%** opacity, 2px below the baseline —
links in paragraphs must not rely on colour alone (WCAG 1.4.1).

**Motion.** On hover or focus, a full-opacity 1px underline **draws in from left
to right** over the resting one (`background-size: 0% → 100%`, 250ms
`ease-out`). On hover-out it retracts toward the right (it leaves the way it
continues, not back on itself). CSS only.

- Reduced motion: the full underline appears without drawing.
- External links add a small `↗` (Lucide `arrow-up-right`, 0.85em).

### 13.4 Tag

**Purpose.** Tech stack on project cards and project pages, blog tags. Not a
button unless it links somewhere.

**Values** (mono, matching the `label` type step, §3):

| Property | Value |
|---|---|
| Type | `label` step: JetBrains Mono, 0.75rem, medium 500, uppercase, `+0.08em` |
| Height / padding | 24px / 10px horizontal |
| Radius | `sm` (8px), per §5 |
| Background | `surface` (on `background`) or `surface-raised` (on `background-alt` and on cards) |
| Text | `muted` |
| Border | none |

- **Linked tag** (blog tags, filters): hover → `foreground` text and
  `surface-raised` background (150ms `ease-out`); focus ring radius `sm`; the
  link's hit area is extended to 44px tall.
- Tags wrap onto multiple lines with an 8px gap; they never scroll sideways.
- No motion of their own; they appear with their parent.

### 13.5 Status pill

**Purpose.** The availability badge in the hero ("Open to Remote Roles"). Only
the "open" state exists for now (D29).

**Anatomy.** Pill → status dot → label.

**Values.** Height 32px, padding 6px 14px 6px 12px, radius `full`. Background
`surface`, 1px `border`. Label `sm` step, medium 500, `foreground`. Dot 8px,
`secondary` (green), 8px gap to the label.

**Motion.** A ring pulses out from the dot: `scale(1 → 2.4)`, opacity
`0.5 → 0`, 2s `ease-out`, infinite, paused when off-screen. Reduced motion: no
pulse — the dot stays.

**Accessibility.** The dot is decorative (`aria-hidden`); the label carries the
meaning, so colour is not the only signal.

### 13.6 Header

**Purpose.** Site navigation on all three sites: brand, the current site's key
links, the way to the other sites, and the theme toggle.

**References.** Owner's choice (2026-10-06): **the floating glass capsule, with
the shape and position of the current site's nav** — the old `index.html`
`<nav>`: fixed, centred, 16px below the top edge, `max-w-4xl`, `rounded-full`,
`px-6 py-3`, translucent glass with a shadow. Apple's translucent navigation
materials (§5).

**Anatomy** (left → right, inside the capsule):

1. **Brand** — the DA logo (32px circle; light backing in dark mode, D23) +
   "Chestly Ace" wordmark (Bebas, 20px, `tracking-wide`). Links to the current
   site's home (top of the page on main).
2. **Key links** — on main: **About · Projects · Experience · Contact** (owner's
   choice: key links only; Skills, Services, Volunteering, and FAQ are reached by
   scrolling). Creatives and blog get their own key links in their design steps.
3. **Sites chip** — "Sites ▾", opens the Sites menu (§13.7).
4. **Theme toggle** — icon button (§13.2).
5. **Menu button** (phones only) — icon button, `menu` ↔ `x`.

**Values.**

| Property | Value |
|---|---|
| Position | `fixed`, top **16px**, centred horizontally, `z-50` |
| Width | `min(100% − 32px, 896px)` (896px = `max-w-4xl`) on phones; `min(100% − 48px, 896px)` from `sm` |
| Height | 56px (12px padding + 32px content + 12px) |
| Padding | 24px left and right (`px-6`), 12px top and bottom (`py-3`) |
| Radius | `full` |
| Background | `material-bar` + `material-blur` (§2, §5) |
| Edge | 1px `border` at 60% opacity (needed in dark mode, where shadows don't show) |
| Shadow | Light: the §5 float shadow. Dark: none |
| Groups | `justify-between`; key links `gap-6` (24px); right group `gap-2` (8px) |

**Sites chip.** Pill, 32px tall, padding 0 12px, radius `full`; `surface`
background, 1px `border`; label "Sites" 13px medium 500 `foreground` + Lucide
`chevron-down` 14px. Hover: `surface-raised`. Open: chevron rotates 180°
(200ms `ease-out`), background `surface-raised`. Hit area extended to 44px.

**States.**

| State | Treatment |
|---|---|
| At top | As above |
| Scrolled (> 80px) | **Compact**: height 48px (`py-2`), width `min(…, 820px)`, light shadow grows to `0 1px 2px rgb(0 0 0 / 0.04), 0 12px 32px rgb(0 0 0 / 0.08)` |
| Menu open (phones) | Expanded panel — see Responsive |

- No hide-on-scroll: the capsule always stays in view.
- Content scrolls underneath. Since the capsule floats with a gap above it, no
  fade strip is needed at the top edge.

**Motion.**

- **Load:** the capsule materializes once on first paint — `opacity 0 → 1`,
  `scale(0.96 → 1)`, `blur(8px → 0)`, 500ms `ease-out`, 100ms delay. The HTML
  is there from the first paint; only the effect waits.
- **Compact on scroll:** the width and height change through a Motion `layout`
  animation (transform-based, so no layout thrash), default spring. Children
  keep their size (`layout="position"`), so text never stretches.
- **Active link dot:** shared layout animation (§13.3).
- Reduced motion: no load effect; the compact state switches with a 150ms
  cross-fade.
- `prefers-reduced-transparency`: solid `surface-raised` background, no blur.

**Responsive.**

| Width | Layout |
|---|---|
| ≥ `lg` (1024px) | Full: brand + wordmark, key links, Sites chip, theme toggle |
| `md`–`lg` (768–1023px) | Wordmark hidden (logo only) so the links fit |
| < `md` (phones) | Brand + wordmark, theme toggle, menu button. Key links and Sites chip move into the expanded menu |

**Phones: the capsule expands into the menu** (owner's choice):

- Tapping the menu button grows the capsule **in place** into a panel: same
  width, top stays at 16px, height up to `100dvh − 32px`, radius `full → xl`
  (28px). Motion `layout` animation with
  `{ type: "spring", bounce: 0, duration: 0.5 }`; the radius animates through
  `style.borderRadius` so Motion keeps the corners correct while scaling.
- **Contents** (top to bottom): the capsule's top row stays (brand, theme
  toggle, close); then the key links as Bebas `display-lg` text-roll links, one
  per line; then a `label` "Sites" and the three sites as rows (name + short
  description, current site marked "You're here", `↗` on the others).
- Items enter after 100ms with a 40ms stagger: `opacity 0 → 1`,
  `translateY(8px → 0)`, `blur(4px → 0)`, 300ms `ease-out`.
- **Closing** reverses, faster: items fade out together (150ms), the panel
  shrinks back to the capsule (spring, `duration: 0.35`).
- Behind the panel, the page dims with `rgb(0 0 0 / 0.3)` (light) /
  `rgb(0 0 0 / 0.5)` (dark), fading in over 250ms. Tapping it closes the menu.
- Page scrolling stops while open (Lenis stopped, `overflow: hidden` on
  `<html>`).
- Tapping a key link closes the menu, then scrolls to the section.
- Reduced motion: the panel cross-fades open and closed (200ms), no stagger.

**Accessibility.**

- `<header>` → `<nav aria-label="Main">` → list of links.
- Phone menu: `aria-expanded` / `aria-controls` on the button; focus moves into
  the panel on open, is **trapped** while open, and returns to the menu button on
  close; Escape closes.
- The brand link's accessible name is "Chestly Ace — home".
- Anchor links scroll through Lenis and move focus to the section heading
  (`tabindex="-1"`). Sections get `scroll-margin-top: 96px` so the capsule never
  covers a heading.
- Text in the capsule meets 4.5:1 against the solid fallback; the material is
  72% opaque, so it also passes over page content in normal use.

### 13.7 Sites menu

**Purpose.** Moves between the three sites (Dev · Creatives · Blog, D25) from
the header's Sites chip. On phones its rows live in the expanded menu (§13.6).

**Anatomy.** Popover → three rows. Each row: site name, a one-line description,
and either `↗` (other sites) or a "You're here" mono `label` (current site).

| Row | Name | Description (placeholder — owner's wording at 5b) |
|---|---|---|
| main | Dev | Software engineering |
| creatives | Creatives | Design and photography |
| blog | Blog | Writing and notes |

**Values.**

| Property | Value |
|---|---|
| Position | 12px below the capsule's bottom edge, right edge aligned with the chip's right edge |
| Width | 280px |
| Padding | 8px |
| Radius | `md` (12px) for the popover; rows radius 8px (concentric) |
| Background | `material-bar` + `material-blur` |
| Edge / shadow | 1px `border` at 60%; the §5 float shadow in light mode |
| Row | 12px padding; name 15px medium 500 `foreground`; description `sm` `muted` |
| Row hover | `surface` background (light) / `surface-raised` (dark), 150ms |
| Current row | Not a link; `aria-current="page"`; no hover |

**Motion.** Grows from the chip: `transform-origin: top right`,
`scale(0.95 → 1)`, `opacity 0 → 1`, `blur(4px → 0)`, 200ms `ease-out` (Motion).
Exits the way it came, 150ms. Reduced motion: opacity only, 150ms.

**Accessibility.** A **disclosure** — a `<button aria-expanded>` controlling a
list of links — not an ARIA `menu`, because its items are plain links. Escape
or a click outside closes it and returns focus to the chip; Tab moves through
the rows; it closes when focus leaves it. On Vercel previews the links stay on
the preview (D28).

### 13.8 Footer

**Purpose.** The end of every page: where to go next, how to get in touch, and a
closing brand moment.

**References.** Owner's choice (2026-10-06): **giant wordmark footer** — a
full-width "CHESTLY ACE" in display type that reveals as the visitor reaches the
bottom. anubi.io's oversized closing type.

**Anatomy** (top to bottom):

1. **Top grid**
   - **Brand block:** logo + wordmark (as in the header) and the site's
     one-line description (D26), `lead` step, `muted`, max 36ch.
   - **Columns**, each headed by a mono `label` in `muted`:
     - **Sites** — Dev, Creatives, Blog (current marked with the 4px `primary`
       dot; others `↗`).
     - **Connect** — socials filtered by `socials.show_on` (on main: Instagram,
       LinkedIn, GitHub, TikTok — Q8), each with its Simple Icons logo (16px).
     - **Contact** — email (`chestlyace@gmail.com`, Q9), WhatsApp, Resume ↓.
   - All column links use the **text roll** (§13.3).
2. **Giant wordmark** — "CHESTLY ACE" in Bebas, `foreground`, spanning the full
   width of the wide container (1280px max) edge to edge.
3. **Bottom bar** — a 1px `border` line, then: "© 2026 Chestly Ace" (`label`,
   `muted`; the year is the current year) on the left, **Back to top ↑**
   (text roll) on the right.

**Values.**

| Property | Value |
|---|---|
| Background | `background-alt` |
| Padding | Top 96px phone / 128px desktop; bottom bar `py-6` |
| Container | Wide (§5), same gutters |
| Top grid (desktop) | 12 columns: brand block spans 5, the three link columns share 7 |
| Wordmark spacing | 96px above (64px on phones), 24px above the bottom bar |
| Wordmark size | Fitted to the container width with container-query units (`font-size` in `cqi`, tuned once so the text spans 100%); leading `0.8`; no JS |
| Link list gap | 12px |

**Motion.**

- **Wordmark reveal** (GSAP ScrollTrigger + SplitText): the letters sit in a
  clipping line box and rise from `translateY(100%)` to `0` with a `0.04`
  stagger, **scrubbed** to scroll as the wordmark travels from entering the
  viewport to the page bottom. Scrolling back up lowers them again. Driven by
  Lenis, so it feels continuous.
- **Back to top** scrolls through Lenis with `ease-in-out` (1.2s), then moves
  focus to the skip link, the first focusable element on the page.
- Reduced motion: the wordmark shows in its final state; Back to top jumps
  instantly.

**Responsive.**

| Width | Layout |
|---|---|
| ≥ `lg` | Brand block left; three columns right |
| `sm`–`lg` | Brand block full width; three columns in a row below |
| < `sm` | Brand block; then Sites and Connect side by side; Contact full width. Wordmark still spans the width (about 60px tall at 375px) |

**Accessibility.** `<footer>` with `<nav aria-label="Footer">` around the link
columns. Column headings are text labels (`<p>`), not headings, so the page
outline isn't broken. The giant wordmark is decorative (`aria-hidden="true"`);
the brand block already names the site. Social links have accessible names
("Chestly Ace on GitHub"), not just icons.

### 13.9 Skip link

**Purpose.** Lets keyboard users jump past the header.

**Values.** The first focusable element on every page, "Skip to content",
linking to `#main` (the `<main>` element, `tabindex="-1"`). Hidden until
focused; when focused, it appears at top 16px, left 16px, above the header
(`z-[60]`), styled as a `primary` `md` button with no magnetic pull. Reduced
motion has no effect (it doesn't animate).

**Content components (Phase 5a.3, issue #21):**
[Project card](#1310-project-card) · [Service card](#1311-service-card) ·
[Creatives card](#1312-creatives-card) · [Timeline item](#1313-timeline-item) ·
[Contact tile](#1314-contact-tile) · [Form fields](#1315-form-fields) ·
[FAQ item](#1316-faq-item) · [Certification item](#1317-certification-item)

Grids, section headings, and how many items show are decided in the section
specs (§14, Phase 5a.4). These specs cover the component itself.

### 13.10 Project card

**Purpose.** One software project in the Projects section; opens the project's
page (`/projects/[slug]`, Q11).

**References.** Owner's choice (2026-10-06): **image-forward tile** —
[anubi.io/work/all](https://anubi.io/work/all): big rounded image, small mono
label, title, `↗`.

**Anatomy.**

1. **Media** — the project image (`projects.image_url`) in a rounded frame.
2. **Label** — `category_label` in the `label` step (e.g. "WEB APP"). A year can
   follow it ("WEB APP · 2025") only if a year field is added to `projects` —
   the schema has none today; decided in review or at 5b.
3. **Title row** — `title` + a Lucide `arrow-up-right` at the right edge.

No summary, tech tags, or Live / Source buttons on the card — they live on the
project page.

**Values.**

| Property | Value |
|---|---|
| Media frame | Aspect `4 / 3`, radius `lg` (20px), `surface` background, image `object-fit: cover` |
| No image | `surface` frame with the title in Bebas `display-lg`, `muted`, centred |
| Media → label | 16px |
| Label | `label` step, `muted` |
| Label → title | 6px |
| Title | `h3` step, `foreground`; icon 20px, `muted` |
| Featured variant | Aspect `16 / 9`; used where the section spec gives a project a wider slot |

**States and motion** (Motion for hover, GSAP for scroll):

| State | Treatment |
|---|---|
| Hover (fine pointer) | Image scales `1 → 1.04` inside the frame (600ms `ease-out`); title icon turns `foreground` and nudges 2px up-right |
| Cursor label | Over the media, a 88px `primary` circle with "VIEW ↗" (`label` step, `primary-foreground`) appears at the pointer — `scale(0.5 → 1)` + `opacity`, 200ms `ease-out` — and follows it with a spring (`bounce: 0, duration: 0.35`). The system cursor is hidden over the media only while the label shows. Leaves the same way it came |
| Pressed | Whole card `scale(0.98)`, 120ms |
| Focus | 2px `ring`, 4px offset, around the media frame (radius `lg`); the image zoom plays as on hover |
| Scroll entrance | The media reveals upward — `clip-path: inset(100% 0 0 0) → inset(0)` — while the image settles `scale(1.15 → 1)`, 900ms `expo.out`; label and title fade up 16px, 80ms later. Batched per row (ScrollTrigger `batch`), plays once |

- The move from card to project page (shared media, GSAP Flip) is specified
  with the project page in Phase 5a.4.
- Touch: no zoom, no cursor label; press feedback only.
- Reduced motion: no zoom, cursor label, or entrance; title icon changes colour
  only.

**Accessibility.** The card is one `<a>`; its name is the title. The image is
decorative inside the link (`alt=""`) so the title isn't read twice. The
cursor label is `aria-hidden`. The image is lazy-loaded through `next/image`
except for cards in the first viewport.

### 13.11 Service card

**Purpose.** One software service in the Services section (`services` table, D9).

**References.** Owner's choice (2026-10-06): **stacking cards on scroll** — each
service is a large card; as the visitor scrolls, the next card slides up over the
previous one and they stack.

**Anatomy.** Card → number ("01") → Iconly icon (`services.icon`) → title →
description → items (`services.items`).

**Values.**

| Property | Value |
|---|---|
| Card | `surface` background, radius `xl` (28px), padding 48px desktop / 24px phone |
| Height | `min(70vh, 560px)` desktop; content height on phones |
| Layout (desktop) | Two columns: left — number and title; right — icon, description, items |
| Layout (phone) | One column: number + icon on one row, then title, description, items |
| Number | Bebas `display-lg`, `muted`, two digits |
| Icon | Iconly Light, 40px, `foreground` |
| Title | `title` step, `foreground` |
| Description | `lead` step, `muted`, max 52ch |
| Items | A list, 2 columns from `md`; each item `body`, `foreground`, preceded by a 16px `muted` dash, with a 1px `border` line between rows |

**Stacking** (CSS `position: sticky` for the stack, GSAP ScrollTrigger for the
scrubbed effects):

- Every card sticks at `top: 112px + index × 16px` (phones: `96px + index × 8px`),
  so each earlier card's top edge peeks out above the next — the visible stack.
- As the next card slides over it, the card underneath scales `1 → 0.94` and
  dims (an overlay of `background` at `0 → 40%` opacity), scrubbed to scroll.
- Stacking needs room: it runs only when the viewport is at least 640px tall.
  Shorter screens get a plain list with 16px gaps.
- The last card in the stack is the creatives card (§13.12).

**States.** Not interactive by itself (no hover). Items are plain text.

**Reduced motion.** No sticking, scaling, or dimming — a plain list with 16px
gaps.

**Accessibility.** An `<ol>`; each card an `<li>` with an `<h3>` title. The number
is `aria-hidden` (the list order already gives it). The dimming overlay is
decorative; covered cards are still in the reading order.

### 13.12 Creatives card

**Purpose.** The fixed link from Services to `creatives.chestlyace.online` (D9).
Not a database row, so it can't be deleted by accident.

**References.** Owner's choice (2026-10-06): **the last card in the service
stack**, styled differently.

**Anatomy and values.** Same frame, size, and sticking as a service card (§13.11),
but **inverted**: background `foreground`, text `background` (near-black card with
white text in light mode, light card with near-black text in dark mode).

| Part | Value |
|---|---|
| Label | "CREATIVES", `label` step, at 60% opacity |
| Title | "Design & photography live on Creatives" — `title` step (placeholder copy from `ia-content.md` §2.4; owner's wording at 5b) |
| Line | One short sentence, `lead` step, at 70% opacity |
| Arrow | Lucide `arrow-up-right`, 32px, top-right |

- The whole card is one link to the creatives site (stays on the preview on
  Vercel previews, D28).
- Hover (fine pointer): the arrow nudges 4px up-right and the card scales
  `1 → 1.01` (default spring). Pressed: `scale(0.98)`.
- Focus: 2px `ring`, 4px offset, radius `xl`.
- Reduced motion: the arrow nudge only.
- Contrast: the inverted pair is `foreground` / `background` swapped — the same
  ratio as body text. The 60% and 70% text still pass 4.5:1 in both themes
  (lowest: 5.1:1).

### 13.13 Timeline item

**Purpose.** One entry in Experience (`journey`) or Volunteering
(`volunteering`) — the same component for both (D33).

**References.** Owner's choice (2026-10-06): **a line that fills on scroll** — a
vertical line with a dot per entry; the line fills with blue as the visitor
scrolls, and each dot lights up as its entry reaches the middle of the screen.

**Anatomy.**

- **Rail** (per timeline): a 2px vertical line in `border`, with a `primary`
  fill on top of it.
- **Dot** (per entry): on the rail, level with the entry's date.
- **Content:** date range → role → organization (+ location) → description →
  optional logo and "EDUCATION" tag.

**Values.**

| Property | Value |
|---|---|
| Rail column | 24px wide; line 2px, centred, radius `full` |
| Rail → content | 32px desktop / 20px phone |
| Between entries | 64px desktop / 48px phone |
| Dot | 12px circle. Inactive: `background` fill, 2px `border` edge. Active: `primary` fill and edge, plus a 6px halo of `primary` at 20% |
| Dates | `label` step, `muted` — `dates_label`, else built from `start_date` / `end_date` ("2024 — NOW") |
| Role | `h3` step, `foreground` |
| Organization | `body`, medium 500, `foreground`; a text-roll link with `↗` when `link_url` is set (§13.3). Location after it, `sm`, `muted` |
| Description | `body`, `muted`, max 60ch, 12px above |
| Logo | Optional 40px square, radius `md`, `surface` background, left of the role (desktop) |
| Education | `journey.type = 'education'` adds a Tag (§13.4) "EDUCATION" after the dates |

**Motion** (GSAP ScrollTrigger):

- The `primary` fill grows down the rail (`scaleY 0 → 1`, origin top), scrubbed
  so its tip stays at the middle of the viewport while the timeline passes.
- As the tip reaches a dot, the dot activates: fill and edge to `primary`,
  `scale(0.8 → 1)`, halo fades in — 300ms `ease-out`. Scrolling back up
  deactivates it the same way.
- Each entry's content fades up 24px as it enters (650ms `power3.out`, once).
- Reduced motion: the rail shows fully filled in `primary`, every dot is active,
  and content shows in its final state.

**Responsive.** The same single column at every width; the rail always sits on
the left.

**Accessibility.** An `<ol>` of `<li>` entries; role in an `<h3>`; dates in
`<time datetime>`. The rail, fill, and dots are `aria-hidden`.

### 13.14 Contact tile

**Purpose.** Email, phone, and WhatsApp in the Contact section (`profile.email`,
`profile.phone`, `profile.whatsapp_number`; Q9, Q10).

**References.** Owner's choice (2026-10-06): **tiles with copy**.

**Anatomy.** Tile → Iconly icon → label → value → `↗` (top-right) → copy button
(email and phone only).

| Tile | Icon (Iconly Light) | Label | Value | Opens |
|---|---|---|---|---|
| Email | `Message` | EMAIL | `chestlyace@gmail.com` | `mailto:` |
| Phone | `Call` | PHONE | the number, formatted | `tel:` |
| WhatsApp | `Chat` | WHATSAPP | "Chat on WhatsApp" | `https://wa.me/<number>` |

**Values.**

| Property | Value |
|---|---|
| Tile | `surface` background (`surface-raised` on `background-alt`), radius `lg` (20px), padding 24px desktop / 20px phone, min height 176px |
| Icon | 32px, `foreground`, top-left |
| Label | `label` step, `muted`, 24px below the icon |
| Value | 17px, medium 500, `foreground`; long values wrap anywhere rather than overflow |
| Arrow | Lucide `arrow-up-right`, 20px, `muted`, top-right |
| Copy button | Icon button (§13.2) at 36px visual size, bottom-right, Lucide `copy` |

**States and motion.**

| State | Treatment |
|---|---|
| Hover (fine pointer) | Background `surface-raised` (on `background-alt`: `surface`), 150ms; arrow turns `foreground` and nudges 2px up-right |
| Pressed | `scale(0.98)`, 120ms |
| Focus | 2px `ring`, 2px offset, radius `lg` |
| Copied | The copy icon swaps to `check` in `secondary` green (icon swap from §13.2), and a small "Copied" bubble (`surface-raised`, radius `sm`, `label` step) grows from the button — `scale(0.95 → 1)` + opacity, 150ms. Both revert after 2s |

- Reduced motion: no arrow nudge; the icon and bubble cross-fade.
- If the clipboard isn't available, the copy button is not shown.

**Responsive.** Three columns from `md`; one column on phones (min height drops
to content height there).

**Accessibility.** The tile's link covers the whole tile with a stretched
pseudo-element; the copy button sits above it as a separate `<button>` (never
nested inside the link). Copy button label: "Copy email address" / "Copy phone
number". A polite live region announces "Email address copied". The link's name
includes the label: "Email: chestlyace@gmail.com".

### 13.15 Form fields

**Purpose.** The contact form (name, email, subject, message; Q10) and, later,
the admin's forms.

**References.** Owner's choice (2026-10-06): **filled fields**, Apple style —
soft grey fills, rounded corners, no hard border, label above.

**Anatomy.** Label → control → helper or error message.

**Controls.**

| Control | Use | Values |
|---|---|---|
| Text input | Name, email | Height 48px, padding 0 16px |
| Textarea | Message | Min height 160px, padding 12px 16px, grows with its content up to 320px, then scrolls |
| Select | Subject ("General Inquiry", "Web Development Project", "Job Opportunity", "Collaboration") | Native `<select>`, same box as a text input, Lucide `chevron-down` 16px at 16px from the right |

**Values (all controls).**

| Property | Value |
|---|---|
| Fill | `surface` (`surface-raised` on `background-alt`) |
| Edge | A soft inset 1px `border` line — keeps the field visible on white without reading as a hard outline |
| Radius | `md` (12px) |
| Text | 17px `body`, `foreground` (17px also stops iOS zooming on focus) |
| Placeholder | `muted` |
| Label | `sm` step, medium 500, `foreground`, 8px above the control |
| Optional fields | "(optional)" after the label in `muted`; no asterisks |
| Helper / error | `sm` step, 6px below the control |
| Between fields | 20px |

**States.**

| State | Treatment |
|---|---|
| Hover (fine pointer) | Edge darkens to `muted` at 50%, 150ms |
| Focus | 2px `ring` around the control (no offset), edge hidden; 150ms `ease-out` |
| Error | Edge `danger`; message in `danger` with a 14px Lucide `circle-alert`; `aria-invalid="true"` |
| Disabled | 50% opacity, no hover |
| `prefers-contrast: more` | Edge becomes 1px `muted` (over 3:1 on every background) |

- **Validation timing:** a field is first checked when the visitor leaves it,
  then re-checked as they type once it has shown an error. On submit, every
  field is checked and focus moves to the first invalid one.
- Error messages enter with height + opacity, 200ms `ease-out`. Reduced motion:
  they appear without the height animation.
- **Form status:** the submit button is a `primary` `lg` Button (§13.1) with its
  loading state while sending. On success the form cross-fades (300ms) into a
  thank-you panel (`surface`, radius `lg`, Lucide `circle-check` in `secondary`,
  owner's copy at 5b). A failed send shows an alert at the top of the form
  (`danger` text, Lucide `circle-alert`, `role="alert"`), keeping what was typed.
- Spam protection, if approved at 5b, sits directly above the submit button.

**Responsive.** Name and email side by side from `sm`; everything else full width.

**Accessibility.** Every control has a visible `<label for>`. Helper and error
text are tied to the control with `aria-describedby`. Autocomplete attributes on
name and email. The filled style keeps a label above every field, so the label —
not the edge — identifies each one.

### 13.16 FAQ item

**Purpose.** One question in the FAQ (`faqs` table); the list also feeds the
`FAQPage` JSON-LD.

**References.** Owner's choice (2026-10-06): **hairline accordion** — thin lines
between rows; a `+` turns into `×` and the answer opens smoothly below. Several
can be open at once.

**Anatomy.** Row → question + toggle icon → answer.

**Values.**

| Property | Value |
|---|---|
| Row | 1px `border` line below each row, and above the first |
| Question | `lead` step, medium 500, `foreground`; padding 24px top and bottom (20px phones); 56px right padding to clear the icon |
| Icon | Lucide `plus`, 20px, `foreground`, in a 32px `surface` circle at the right |
| Answer | `body`, `muted`, max 68ch, 24px bottom padding |

**States and motion.**

- **Open:** the icon rotates 45° (`+` becomes `×`) with the default spring; the
  answer's height opens `0 → auto` (300ms `ease-out`) while its text fades in and
  drops `translateY(-4px → 0)` (250ms, 50ms later). **Close:** faster — 200ms,
  text and height together.
- Hover (fine pointer): icon circle `surface-raised`, 150ms.
- Focus: 2px `ring` on the question row, radius `sm`.
- Reduced motion: opens and closes instantly; the icon still turns.

**Implementation note.** Native `<details>` / `<summary>`, so it works without
JavaScript and with the browser's find-in-page. The open/close animation uses
CSS (`::details-content` with `interpolate-size`) where supported and Motion
elsewhere; without either it opens instantly.

**Accessibility.** `<summary>` is the keyboard control (Enter / Space). The icon
is `aria-hidden`; the open state comes from `<details>` itself.

### 13.17 Certification item

**Purpose.** One certification in the Certifications block (Q22) — the Google
badges from the old site's `assets/certs/`.

**References.** Owner's choice (2026-10-06): **badge grid**.

**Anatomy.** Tile → badge image → name → issuer · year → `↗` when there's a
credential link.

**Values.**

| Property | Value |
|---|---|
| Tile | `surface` background (`surface-raised` on `background-alt`), radius `lg`, padding 24px, min width 200px |
| Badge | 64px, `object-fit: contain`, top-left; SVG preferred |
| Name | `body`, medium 500, `foreground`, at most 2 lines; 16px below the badge |
| Issuer · year | `label` step, `muted` (e.g. "GOOGLE · 2024"), 6px below |
| Arrow | Lucide `arrow-up-right`, 18px, `muted`, top-right — only when linked |

**States and motion.**

- When the certification has a credential URL, the whole tile is a link to it.
  Hover (fine pointer): background `surface-raised` (on `background-alt`:
  `surface`); the badge lifts `translateY(-2px)` and scales `1 → 1.04` (default
  spring); the arrow nudges. Pressed: `scale(0.98)`. Focus: 2px `ring`,
  radius `lg`.
- Without a URL, the tile is static — no hover.
- Reduced motion: background change only.

**Data.** The schema has no certifications table yet. Phase 5b adds one with at
least: name, issuer, issued date, badge image, credential URL, order, and
published flag (proposed; confirmed in the 5b PR).

**Accessibility.** The badge is decorative (`alt=""`) because the name is text.
A linked tile's name is "Name — Issuer, verify credential (opens in a new tab)".

## 14. Page and section specs

The main site's homepage (`/`) and the project page (`/projects/[slug]`). Each
spec follows the section checklist in §12. Components are linked, not repeated.
**Approved in:** the Phase 5a.4 PR (issue #23).

**Homepage:** [Page-wide rules](#140-page-wide-rules) · [Hero](#141-hero) ·
[About](#142-about) · [Skills and certifications](#143-skills-and-certifications) ·
[Services](#144-services) · [Projects](#145-projects) ·
[Experience](#146-experience) · [Volunteering](#147-volunteering) ·
[Contact](#148-contact) · [FAQ](#149-faq)

**Project page:** [Project page](#1410-project-page)

### 14.0 Page-wide rules

**Order, ids, and numbering.**

| # | Section | `id` | Nav (§13.6) |
|---|---|---|---|
| — | Hero | `top` | brand link |
| 01 | About | `about` | About |
| 02 | Skills (+ Certifications) | `skills` | — |
| 03 | Services | `services` | — |
| 04 | Projects | `projects` | Projects |
| 05 | Experience | `experience` | Experience |
| 06 | Volunteering | `volunteering` | — |
| 07 | Contact | `contact` | Contact |
| 08 | FAQ | `faq` | — |

- The index numbers are assigned at render time from the sections that are
  actually shown, so a hidden Volunteering (no published entries) leaves no gap.
- The header's active dot follows the section in view for the four nav links;
  sections without a nav link keep the previous link active.

**Section heading** (replaces the Phase 3 `SectionHeading`; owner's choice,
2026-10-06):

- A mono `label` index above the title: "02 — SKILLS", `muted`.
- The title in Bebas at `display-xl`, `foreground`, uppercase.
- An optional intro in `lead`, `muted`, max 52ch, 24px below the title.
- Title → content: 48px phone / 64px desktop (§5).
- **Reveal:** the title's letters rise from a clipping line box
  (`translateY(105% → 0)`), 30ms stagger, 900ms `expo.out`, once, when the
  heading is 85% down the viewport (GSAP ScrollTrigger + SplitText). The index
  label and intro fade up 16px, 100ms later. Reduced motion: shown in final state.

**Bands** (owner's choice: alternating):

- Section backgrounds alternate between `background` and `background-alt` (§2).
  The grid/glow effects exist only in the hero.
- Bands are assigned **counting up from the footer**, which is `background-alt`
  (§13.8): the last section before it is `background`, the one above it
  `background-alt`, and so on. No two neighbours match, even when Volunteering is
  hidden. With every section shown: FAQ `background`, Contact `background-alt`,
  Volunteering `background`, Experience `background-alt`, Projects `background`,
  Services `background-alt`, Skills `background`, About `background-alt`, Hero
  `background`.
- **Any component that uses `surface` (cards, tiles, fields) switches to
  `surface-raised` on a `background-alt` band** (§2). Component specs say this
  where it matters; this rule covers them all.
- Padding: §5 — `py-24` / `md:py-40`. Containers: the wide container for grids and
  media (Skills, Services, Projects, Contact); the narrow `980px` container for
  text-led sections (About, Experience, Volunteering, FAQ).

**Scroll and anchors.**

- Lenis drives all scrolling (§8). Nav links and "Back to top" scroll through it
  with `ease-in-out`, 1.2s; focus then moves to the section's heading
  (`tabindex="-1"`).
- Every section has `scroll-margin-top: 96px` so the capsule never covers a
  heading.
- Default section entrance (when a section's own spec doesn't say otherwise):
  children fade up 24px, 650ms `power3.out`, 80ms stagger, batched, once.
- Reduced motion: Lenis off; all reveals show their final state (§8).

**Data.** Sections read from the database (`architecture.md` §5). A section with
nothing to show is hidden, not rendered empty.

### 14.1 Hero

**Purpose.** The first screen: who Chestly is, what they do, and the two actions
that matter (see the work, get in touch).

**References.** Owner's choice (2026-10-06): **the previous portfolio's hero,
kept as it is, with smooth animations and effects added.** The old hero's layout
and ingredients stay; the foundations (§1–§8) and the core components (§13)
restyle them; motion is new. anubi.io for the WebGL grid and the scroll feel.

**What stays from the old hero.** A status pill; a giant stacked headline whose
last line is outlined; a tagline; a short paragraph; two pill buttons; a
phone / email / socials row; an arched portrait, grayscale until hovered, with a
soft glow behind it; floating tech stickers and a speech-bubble quote card; a
scroll cue at the bottom.

**What changes, and why.**

| Old | New | Why |
|---|---|---|
| Headline "Developer / Designer / & PHOTOGRAPHER" | "SOFTWARE / ENGINEER" + a rotating outlined line (owner's choice) | Main site is software-only (D4, Q4) |
| Camera sticker | A software sticker (TypeScript — placeholder) | D4 |
| Quote card: "…Not you devs & designers…" | Wording edited — owner's text at 5b | D4 |
| Blue-to-purple glow | Blue only | §2: blue is the only accent |
| Coloured sticker chips (dark slate, white, green) | Neutral chips (`surface-raised`, 1px `border`) with each logo in its brand colour | §1 airy, one accent; logos keep their own colours |
| Glass buttons, `scale(1.05)` hover | Magnetic pills (§13.1) | D42 |
| `bg-grid-pattern` class (never defined in the old CSS — the old hero had a plain background) | A WebGL grid that reacts to the cursor (below) | Signature moment (owner: hero background) |
| Nav links "Home, About, Services…" | The capsule header (§13.6) | D44 |

**Anatomy and layout.**

- A 12-column grid in the wide container, `min-height: 100svh`, content
  vertically centred, top padding **112px** (clears the 16px + 56px capsule),
  bottom padding 48px.
- **Left, columns 1–7** (`lg+`): left-aligned. **Phone and tablet:** one column,
  centred, text first, portrait below with 48px between.
- **Right, columns 8–12:** the portrait group.

**Left column** (top to bottom, 32px between blocks):

1. **Status pill** (§13.5) — `profile.tagline`.
2. **Headline.** `<h1 class="sr-only">` carries the full text for search and
   screen readers ("Chestly Ace, also known as Amahndong Chestly — software
   engineer"); the visible lines are decorative (`aria-hidden`).
   - Lines 1 and 2: `profile.headline` split at the first space ("Software
     Engineer" → SOFTWARE / ENGINEER). A single-word headline is one line.
     Bebas at `display-2xl` (5 → 11rem, leading 0.85), `foreground`.
   - Line 3: the **rotating line** — Bebas at 50% of the line-1 size, outlined
     (`-webkit-text-stroke: 1.5px foreground`, transparent fill, 40% opacity),
     tracking `+0.02em`, 8px below line 2. The words are placeholders —
     "& BACKEND", "& FULL-STACK", "& MOBILE" — until the owner supplies them.
3. **Tagline** — `label` step in the text face (uppercase, `+0.1em`), `sm` size,
   `muted`. Old: "Software developer, graphic designer, and photographer crafting
   modern digital experiences." — edited to software only; owner's wording at 5b.
4. **Paragraph** — `sm` step, `muted`, max 56ch. Old: "Amahndong Chestly, known
   professionally as Chestly Ace, builds websites, brand visuals, and
   photography-driven digital experiences." — edited; owner's wording at 5b.
5. **Buttons** — `View Projects` (`primary`, `lg`, trailing `arrow-right`, links
   `#projects`) and `Get In Touch` (`secondary`, `lg`, Iconly `Message` icon,
   links `#contact`). Side by side from `sm` (16px gap); stacked and full width on
   phones.
6. **Contact row** — WhatsApp + phone, mail + email, then the socials (filtered by
   `show_on`, Simple Icons, 20px, `muted` → `foreground` on hover, 44px hit
   areas). Phone and email are text-roll links (§13.3, `sm`). Wraps with 16px
   gaps; centred on phones.

**Right column — the portrait group.**

| Part | Values |
|---|---|
| Portrait | The arch from the old hero: `border-radius: 14rem 14rem 9999px 9999px`, 2px `border` edge, `surface` fill, `object-fit: cover`, aspect `3 / 4`; width `min(100%, 420px)` on phones, the column's width on desktop (max 480px), right-aligned on `lg+`. `profile.hero_image_url`, `fetchpriority="high"`, preloaded |
| Treatment | `grayscale(1) contrast(1.25)`; full colour on hover, as in the old hero (700ms `ease-out`). A 128px fade at the bottom into `background` |
| Depth | Light: the §5 float shadow, larger (`0 24px 64px rgb(0 0 0 / 0.12)`). Dark: none |
| Glow | Behind the portrait: a 350px circle of `primary` at 18% opacity, `blur(60px)`, centred. Dark mode 24% |
| Stickers (4) | 48px chips, radius `md`, `surface-raised` + 1px `border`, rotated and placed as in the old hero: React (top 15%, left −5%, −12°), AWS (bottom 20%, left −2%, +6°), Android (bottom 10%, right 10%, −8°), and a fourth in the old camera's place (top 30%, right −8%, +15°) — **TypeScript, placeholder**. Logos 28px, in brand colour (devicon, installed in 5b) |
| Quote card | Top 5%, right −5% (−10% from `sm`), max 180px wide: `material-bar` + `material-blur`, radius `lg` with the bottom-left corner square (the speech-bubble tail), rotated +2°. Header: "@Dev.Ace" (`sm`, medium, `muted`) + Lucide `badge-check` 14px in `primary-text`; body: italic `sm`. Hover: rotates to 0° (default spring) |
| Phones | Stickers and quote card scale to 80% and stay inside the gutters (offsets clamp to 0) |

**Motion** (new — the owner's ask: "nice smooth animations and effects").

*1. Load entrance* — pure CSS, so nothing waits for JavaScript and LCP is never
delayed (§8 principle 8). The text and portrait are in the HTML; the entrance
only styles their first seconds. Total ≈ 1.4s, then the page is fully usable.

| Step | Element | Effect | Timing |
|---|---|---|---|
| 1 | Status pill | Fades up 12px, `blur(4px → 0)` | 0ms, 500ms `ease-out` |
| 2 | Headline lines 1–2 | Each letter rises from its clipping line box, `translateY(110% → 0)` | Letter stagger 30ms, line offset 120ms, 900ms `ease-out`; starts at 100ms |
| 3 | Rotating line | Letters rise the same way; the outline draws as the letters land | Starts at 450ms |
| 4 | Tagline, paragraph, buttons, contact row | Fade up 16px, `blur(4px → 0)` | Start at 500ms, 70ms stagger, 600ms `ease-out` |
| 5 | Portrait | The arch reveals bottom to top (`clip-path: inset(100% 0 0 0) → inset(0)`) while the image settles `scale(1.2 → 1)` | Starts at 200ms, 1100ms `ease-out` |
| 6 | Glow | Fades in | Starts at 500ms, 1200ms |
| 7 | Stickers, then quote card | Fade in with `scale(0.8 → 1)` and settle into their rotations | Start at 900ms, 90ms stagger, 500ms `ease-out` |

The header capsule materializes at 100ms (§13.6). The scroll cue fades in at
1.4s.

*2. Rotating line.* Every **2.8s**, the current words roll up out of the clip while
the next roll in from below, letter by letter (30ms stagger, 600ms `expo.out`) —
the same roll as the text links (§13.3), at headline scale. Pauses while the tab
is hidden, while the hero is off-screen, and while the pointer rests on the line.
The line is `aria-hidden`; it adds colour, not meaning.

*3. Ambient motion* (CSS, `transform` only):

- Glow: drifts ±20px and breathes between 14% and 22% opacity over 14s,
  `ease-in-out`, alternating.
- Stickers: each floats ±6px vertically over 5–7s (a different period and phase
  each, so they never move together).

*4. Cursor motion* — fine pointers only (`(hover: hover) and (pointer: fine)`);
GSAP `quickTo`, so motion follows the pointer smoothly without a spring per frame.

- **Depth parallax:** with the pointer anywhere in the hero, the layers shift
  toward or against it, scaled by depth — glow 24px, portrait 6px, quote card
  10px, stickers 8–20px (the nearer ones further). Eased to a stop 0.4s after the
  pointer stops. Pointer leaves → everything returns to rest over 0.6s.
- **Letter lift:** headline letters within 140px of the pointer rise by up to
  12px, falling off smoothly with distance, and settle back as it leaves. Lines 1
  and 2 only.
- **Portrait colour:** as in the old hero — hover brings the colour in.
- **Buttons:** magnetic (§13.1).

*5. WebGL grid* (OGL — the signature moment, owner's choice): a field of small
dots on a **32px** grid fills the hero behind the content, in `border` colour at
60%. Dots within **160px** of the pointer swell and are pushed gently outward,
and turn `primary` at up to 40%, easing back over 600ms after the pointer leaves
(a second, slower ripple trails it). Dots in the rest of the hero hold still.

- Lazy: the canvas loads after the first paint and after the entrance (idle
  callback), so it never competes with LCP.
- Resolution capped (device pixel ratio ≤ 1.5); the loop runs only while the
  hero is on-screen and the tab is visible.
- Behind everything: `aria-hidden`, `pointer-events: none`; the pointer is read
  from the window.
- **Fallbacks:** reduced motion, `Save-Data`, no WebGL, and touch devices get the
  **static** dot grid (a CSS radial-gradient pattern, same size and colour). Until
  the canvas is ready the hero shows the same static grid, then cross-fades.
- Light and dark use the theme's `border` and `primary` values; the canvas
  re-reads them when the theme changes.

*6. Touch devices.* No hover exists, so the portrait **turns to colour as it
scrolls to the middle of the screen** (a scrubbed grayscale 1 → 0). Stickers
still float; nothing depends on a cursor.

*7. Scroll exit* — scrubbed to scroll (ScrollTrigger, 0 → one viewport height):

- Headline lines drift apart: line 1 moves left up to 6vw, line 2 right up to 6vw,
  line 3 left up to 3vw, and the block fades to 30%.
- The portrait group rises slower than the page (−8% of its height) and scales to
  96%.
- The glow follows the portrait; the status pill and paragraph fade out.
- The scroll cue fades out within the first 80px.

*8. Scroll cue.* Desktop (`lg+`) only: a Lucide `chevron-down` (32px, `muted`),
centred 32px from the hero's bottom, bobbing 8px over 2s (`ease-in-out`,
infinite). A button — click scrolls to About through Lenis; `aria-label`: "Scroll
to About".

**Reduced motion.** Everything above is off: the entrance shows its final state,
the rotating line stops on its first words, ambient and cursor motion and the
scroll exit are removed, the grid is the static pattern. The portrait's colour
change on hover stays; pill pulse and button colour changes stay (§8).

**Light and dark.** Colours come from tokens. Light: float shadow on the portrait.
Dark: no shadow; the portrait edge and the sticker chips use `border`; glow at 24%.

**Responsive.**

| Width | Layout |
|---|---|
| < `sm` | Centred; headline `display-2xl` at its 5rem minimum; buttons stacked and full width; contact row stacked |
| `sm`–`lg` | Centred; buttons side by side; portrait max 420px, centred |
| ≥ `lg` | Left-aligned text (columns 1–7), portrait right (columns 8–12); scroll cue shown |

**Accessibility.** One `<h1>` (the `sr-only` one). Visible headline lines and the
rotating line are `aria-hidden`; decorative layers (glow, grid, stickers) are
`aria-hidden`. The portrait's `alt` is meaningful ("Chestly Ace"); the quote card
is real text. The rotating line and the sticker float are decorative; both stop under
reduced motion, and the rotating line also pauses on hover and focus
(WCAG 2.2.2). Every interactive
element keeps the `ring` focus outline; the page is fully usable by keyboard.
Text colours are the §2 tokens (AA-checked); the outlined line is decorative and
adds nothing the `<h1>` doesn't already say.

**Performance budget.** The portrait is the LCP element: preloaded, correctly
sized, WebP/AVIF. The entrance uses CSS only. Total JavaScript for the hero
effects loads after first paint; the WebGL chunk is separate and lazy.

**Build notes (Phase 5b.3).** Where the build interprets or adjusts the spec above:

- **Frame shape.** The old frame's CSS (`border-radius: 14rem 14rem 9999px 9999px`)
  never rendered as an arch: CSS shrinks all four radii by the same factor so the
  9999px bottom corners fit, which leaves the top corners almost square. The result
  — a flat-topped shield with a U-shaped bottom — is what the old site showed and
  what is built. A true arch is a one-line change if wanted.
- **Headline size** is also capped at 19% of the screen height, so the buttons stay
  on the first screen of a laptop; taller screens get the full type-scale size.
- **Outlined line.** A text outline can't be drawn stroke by stroke, so the line
  fades in as its letters land.
- **Cursor parallax** follows and returns over 0.5s (one setting for both).
- **WebGL grid.** Dots near the cursor blend fully to the accent blue; every dot is
  drawn at 60% opacity.
- **Offsets.** The quote card and the TypeScript sticker stop at the container's
  gutter instead of leaving the screen; on phones the TypeScript sticker sits lower
  so the quote card doesn't cover it.
- **AWS sticker** keeps a white backing in dark mode (its wordmark is dark), as the
  brand logo does.
- **Status pill** shows only when `availability` is `open` (D29).
- **Icons.** Sticker logos come from Devicon; social icons from Simple Icons, except
  LinkedIn (dropped by Simple Icons), which uses Devicon's path (D67).

### 14.2 About

**Purpose.** A short statement of who Chestly is, plus the resume.

**References.** Owner's choice (2026-10-06): **scroll-lit statement.** anubi.io's
big text statements; Apple's confident type.

**Content** (`profile`):

| Element | Source | Copy |
|---|---|---|
| Statement | `about_quote` | "Blending logic with creativity to craft digital experiences that matter." — carries over |
| Body | `about_body` | Edit needed — Q5 (still open). Paragraphs split on blank lines |
| Facts | `location`, `headline`, `availability` | New (see below) |
| Resume | `resume_url` | "Download Resume ↓" |

**Layout** (narrow container; band `background-alt` in the normal order):

1. **Heading** (§14.0): "01 — ABOUT".
2. **Statement:** Bebas at `display-lg` (3 → 5rem), `foreground`, left-aligned,
   with a max width of about 24ch so it breaks into 3–4 lines on desktop.
3. **Two columns** (`lg+`; stacked on smaller screens), 96px below the statement:
   - **Left (7 columns):** the body text, `lead` step, `foreground`, paragraphs
     24px apart, max 56ch.
   - **Right (5 columns):** a short facts list — mono `label` + value pairs,
     divided by 1px `border` lines, 16px padding between rows:
     "BASED IN" → `profile.location`; "ROLE" → `profile.headline`; "STATUS" →
     the availability text. Below it, the resume button (`secondary`, `md`,
     trailing Lucide `arrow-down`).
   - The facts list is **my proposal** built from existing profile fields: the
     hero already carries the portrait, so About has no photo; delete the list if
     you'd rather About be text only.

**Motion.**

- **Scroll-lit words:** the statement's words start at `foreground` at **18%**
  opacity and light up to 100% one after another as the block scrolls through
  the viewport — the first word at the block's top reaching 80% of the viewport
  height, the last at its bottom reaching 50% (GSAP ScrollTrigger, scrubbed,
  SplitText by words). Scrolling back dims them again.
- The text is in the HTML at full strength; the dim state is applied once the
  words are split, so no-JS visitors read it normally.
- Body and facts fade up with the default entrance (§14.0); the facts rows stagger
  60ms.
- Reduced motion: all words at full strength; entrance in its final state.

**Accessibility.** The statement is one `<p>`; the split words are spans inside
it, so assistive technology reads the sentence normally. The 18% state is
transient — a word is dimmed only while it is still below the reading line — and
the text is at full contrast once read; reduced-motion visitors see it at full
strength at once. The facts are a `<dl>`.

### 14.3 Skills and certifications

**Purpose.** The tech stack, grouped, and the certifications beneath it.

**References.** Owner's choices (2026-10-06): **grouped logo grid**; certifications
**under Skills** (Q22).

**Content.** `skills` (published, ordered), grouped by `category`: Languages,
Frameworks, Databases, Cloud & DevOps, Tools (creative tools are on the creatives
site — Q7; Figma stays). Certifications: §13.17.

**Layout** (wide container, band `background` in the normal order):

1. **Heading:** "02 — SKILLS".
2. **Group rows**, 48px apart. Desktop: a 12-column row — the group's mono `label`
   in `muted` (columns 1–3, sticky within the row), the tiles (columns 4–12).
   Phones: label above the tiles.
3. **Skill tile:** height 56px, padding 0 16px, radius `md`, `surface` fill
   (`surface-raised` on `background-alt`), gap 12px between logo and name; logo
   28px (devicon, or `icon_url` when there's no devicon); name `sm` step, medium,
   `foreground`. Tiles wrap, 12px gaps.
4. **Certifications:** below the last group, 96px gap, a mono `label`
   "CERTIFICATIONS" and the badge grid (§13.17): 2 columns on phones, 3 from `sm`,
   4 from `lg`, 16px gaps.

**Tile colour treatment.** Logos show in **monochrome `foreground` at 80%** and
turn to their **original colour** on hover (200ms) — the same grey-to-colour
language as the hero portrait. A logo whose colour version is near-black or
near-white in the current theme stays monochrome (so GitHub, Next.js, and similar
never vanish in dark mode). The exact logo set is chosen at 5b.

**Motion.**

- Tiles rise in per group, batched (ScrollTrigger `batch`): `translateY(16px → 0)`
  + opacity, 500ms `ease-out`, 40ms stagger, once.
- Hover (fine pointer): the tile lifts `translateY(-2px)` (150ms) and its logo
  turns colour. Tiles aren't links, so they take no focus and show no focus ring.
- Reduced motion: no rise or lift; the colour change on hover stays.

**Accessibility.** Each group is a `<section>` with its label as a heading
(`<h3>`), tiles in a list. Logos are decorative; the name is text.

### 14.4 Services

**Purpose.** What Chestly offers (`services`, software only — D9) and a pointer to
the creatives site.

**References.** Owner's choice (2026-10-06): **stacking cards on scroll** (§13.11),
the creatives card last (§13.12).

**Content.** Heading "03 — SERVICES" and the intro (from `ia-content.md` §2.4,
owner's wording at 5b): "I help businesses, founders, and teams launch responsive
websites and custom web applications, with attention to performance, maintainable
code, and clean delivery." Then the service cards in `order_index` order, then the
creatives card.

**Layout** (wide container, band `background-alt` in the normal order): the heading
and intro in normal flow, then the stack as specified in §13.11 — cards stick
below the capsule, each one sitting 16px lower than the one before. The cards use
`surface-raised` on this band; their dimming overlay uses the band's colour
(`background-alt`) so it blends. 64px of space follows the last card.

**Motion.** As §13.11 and §13.12. The heading follows the §14.0 reveal.

**Responsive and reduced motion.** As §13.11 — the stack only runs at 640px
viewport height or more, and not under reduced motion; otherwise the cards are a
plain list.

**Accessibility.** As §13.11 — an ordered list, each card a list item with its
title as an `<h3>`.

### 14.5 Projects

**Purpose.** The work. Every published project, opening its own page (Q11).

**References.** Owner's choices (2026-10-06): **staggered two-column grid**, and a
**WebGL ripple on image hover** (signature moment). anubi.io/work/all.

**Content.** `projects` (published; featured first, then `order_index`), shown as
project cards (§13.10). Heading "04 — PROJECTS" (old: "Work"); an optional one-line
intro. No tabs or filters — design and events moved out (D8).

**Layout** (wide container, band `background` in the normal order):

- **Desktop (`md+`):** two columns, 32px column gap, 64px row gap. The **right
  column is pushed down 96px**, so tiles step down the page.
- **Featured projects:** each gets a full-width row (both columns) with the wide
  16:9 card, before the grid starts; the grid then follows with its stagger.
- **Phones:** one column, no stagger, 48px row gap.
- A dense row of tiles with a long title wraps to two lines; the grid stays
  aligned at the image tops.

**Motion.**

- **Tile entrance:** as specified in §13.10 (media reveals upward, labels rise),
  batched per row.
- **Media parallax:** inside each frame the image drifts `translateY(−5% → +5%)`
  scrubbed to scroll (the image is rendered 110% tall to allow it). Reduced
  motion: off.
- **WebGL ripple** (OGL; owner's choice): on hover over a tile's media, the image
  is drawn as a WebGL plane and **ripples outward from the pointer** — a soft
  displacement wave that decays over about 600ms — while the "VIEW ↗" cursor label
  (§13.10) stays on top.
  - One shared canvas, created on the first hover and moved into the hovered
    tile's media frame, so nothing runs until a visitor hovers.
  - The image is read as a texture (`crossOrigin="anonymous"`); if that fails, the
    normal DOM image stays and only the zoom hover plays.
  - Fine pointers only; off under reduced motion and `Save-Data`.
  - Cleaned up 5 seconds after the last hover.

**Accessibility.** As §13.10. The grid is a list (`<ul>`) of cards. The ripple
canvas is `aria-hidden`.

### 14.6 Experience

**Purpose.** Work history and education (`journey`).

**References.** Owner's choice (2026-10-06): the timeline that fills on scroll
(§13.13).

**Content.** `journey` rows (`type` work or education), newest first by
`start_date`; one timeline, with an "EDUCATION" Tag on education entries
(`ia-content.md` §2.6). Heading "05 — EXPERIENCE" (old: "Journey").

**Layout** (narrow container, band `background-alt` in the normal order): heading,
then the timeline (§13.13). Timeline items use `surface-raised` for logo frames on
this band.

**Motion and accessibility.** As §13.13.

### 14.7 Volunteering

**Purpose.** Community and volunteer work (`volunteering`, D10, D33).

**Content.** `volunteering` rows, newest first. Heading "06 — VOLUNTEERING", plus a
short intro line (new copy — owner's wording at 5b). **Hidden entirely** while no
entries are published (numbering closes up, §14.0).

**Layout.** The same as Experience, in its own section: narrow container, the
timeline (§13.13), band per §14.0 (normally `background`). A volunteering entry has
no "EDUCATION" tag.

**Motion and accessibility.** As §13.13.

### 14.8 Contact

**Purpose.** The ways to reach Chestly, and the form.

**References.** Owner's choice (2026-10-06): **two columns** — tiles and heading on
the left, form on the right. Components: contact tiles (§13.14), form fields
(§13.15).

**Content.**

| Element | Source | Copy |
|---|---|---|
| Heading | static | "LET'S WORK TOGETHER" (carries over) |
| Intro | static | "Have a project in mind? Let's create something extraordinary." — the old text's "whether it's development, design, or photography" is dropped; owner's wording at 5b |
| Tiles | `email`, `phone`, `whatsapp_number` | Email `chestlyace@gmail.com` (Q9) |
| Socials | `socials` with `main` in `show_on` | Instagram, LinkedIn, GitHub, TikTok (Q8) |
| Form | static | Name, email, subject, message |

**Layout** (wide container, band `background-alt` in the normal order):

- **Left (columns 1–6):** the section label "07 — CONTACT"; the heading in Bebas
  at `display-xl`; the intro in `lead`; then the tiles — a two-column grid with
  the **Email tile spanning both columns** and **Phone** and **WhatsApp** below it,
  side by side (16px gaps; `surface-raised` tiles on this band); then the socials
  row (icon links as in the hero's contact row, with their names visible from
  `sm`).
- **Right (columns 7–12):** the form — no panel, fields directly on the band
  (`surface-raised` fills). Fields: Name and Email side by side (`sm+`), Subject,
  Message; a `primary` `lg` submit button. Subjects: "General Inquiry", "Web
  Development Project", "Job Opportunity", "Collaboration" (`ia-content.md` §2.8).
  The form's delivery is decided at 5b (Q10: email plus WhatsApp).
- **Phones and tablets:** one column — heading and intro, tiles (single column),
  socials, then the form.
- **WhatsApp QR code** ("Scan To Connect" on the old site): on desktop
  (`(hover: hover)`), a small "QR" button on the WhatsApp tile opens a popover
  with the code (same entrance as the Sites menu, §13.7). Phones don't show it —
  they can tap the link. **Proposed placement; say if you'd rather drop the QR.**

**Motion.**

- Heading reveal (§14.0); tiles rise in with the default entrance and a 80ms
  stagger; form fields rise in with a 60ms stagger.
- Tile and field motion as their specs (§13.14, §13.15).
- Reduced motion: final states.

**Accessibility.** Heading structure: section `<h2>`; the form's fields have
labels. Landmark: the section is `aria-labelledby` its heading; the form is a
named `<form>`.

### 14.9 FAQ

**Purpose.** Answers to common questions, which also feed the `FAQPage` structured
data (Phase 7).

**Content.** `faqs` (published, ordered). Heading "08 — FAQ" (old: "SEO FAQ" —
becomes plain "FAQ", §11).

**Layout** (narrow container, band `background` in the normal order — the last
band before the footer): heading, then the accordion (§13.16), the whole width of
the container. Several answers can be open at once.

**Motion and accessibility.** As §13.16. The list fades in with the default
entrance, 50ms stagger.

### 14.10 Project page

**Purpose.** A case study for one project — the depth the card can't show
(Q11). Route: `/projects/[slug]`; an unknown slug shows the main site's 404.

**References.** Owner's choice (2026-10-06): **case-study layout.**
anubi.io/work/all, Apple.

**Content.** `projects` row by `slug`. Today the schema has `title`, `summary`,
`description`, `image_url`, `tech_stack`, `category_label`, `live_url`,
`source_url`, and the private flags. The Problem / Approach / Outcome sections and
extra screenshots need new fields — **proposed for Phase 5b, to be confirmed in
that PR:** `problem`, `approach`, `outcome` (text, nullable) and `gallery_urls`
(text array). A section whose text is empty is hidden; if all three are empty the
page shows `description` instead.

**Layout** (top to bottom; wide container unless noted):

1. **Back link:** "← All projects" (text roll, §13.3) linking to `/#projects`;
   112px below the top (clears the capsule).
2. **Title:** Bebas at `display-xl`, uppercase, `foreground`, max 14ch per line
   break; 24px above the facts row.
3. **Facts row:** the category `label` (`muted`), the tech Tags (§13.4), and the
   Live and Source buttons (`secondary`, `md`, trailing `arrow-up-right`) at the
   right on `lg+`, wrapping below on smaller screens. A private link shows a
   "Private" Tag instead of a button (`is_*_private`, §10: colour is never the
   only signal).
4. **Hero image:** full container width, aspect `16 / 9`, radius `xl` (28px),
   `surface` fill. **This is the card's image morphing into place** (see Motion).
5. **Summary:** `summary` in `lead`, narrow container, 64px below the image.
6. **Problem / Approach / Outcome:** each a row — mono `label` in `muted` on the
   left (columns 1–3), the text on the right (columns 4–12, `body`, max 68ch),
   separated by 1px `border` lines, 48px of padding. Phones: label above text.
7. **Gallery** (when `gallery_urls` has images): the images stacked full-width,
   radius `lg`, 24px apart.
8. **Next project:** a full-width band (`background-alt`): a mono `label` "NEXT
   PROJECT", the next project's title in Bebas at `display-xl`, and `arrow-right`;
   the whole block is a link. After the last project it points to the first.
   Hover (fine pointer): the project's image fades in behind the title at 100%
   → 25% opacity and the arrow nudges 8px (400ms `ease-out`). The block has a
   `min-height` of 320px.

The header capsule is the same as the homepage, with its key links pointing to
`/#about`, `/#projects`, and so on (§13.6).

**Motion.**

- **Card to page** (§8, GSAP Flip): when opened from a project card, its media
  frame **morphs into the hero image** — position, size, and radius animate
  (800ms `ease-in-out`) while the title and facts fade up beneath it (150ms
  later, 500ms `ease-out`). Closing with "← All projects" reverses it. Opened
  directly (a link, a reload), the page uses the plain entrance: the image reveals
  upward as in §13.10, the title's letters rise as in the hero.
  *How the morph is carried across the route change (Flip state or the browser's
  View Transitions) is decided in the build.* Browsers without support get a
  cross-fade.
- **Sections:** Problem / Approach / Outcome rows and gallery images use the
  default entrance (§14.0); gallery images also parallax ±4% inside their frames.
- Reduced motion: no morph — an instant swap with a 150ms cross-fade; reveals show
  their final state.

**Responsive.** Title scales with `display-xl` (4 → 8rem). The facts row stacks:
category, tags, then the buttons. The Next project block's title scales to
`display-lg` on phones.

**Accessibility.** One `<h1>` (the title). The hero image has meaningful `alt`
text (the project name and what's shown). "← All projects" is the first link in the
page after the skip link. Live and Source links that open a new tab say so to
screen readers. The `title` and metadata are set per project (SEO — Phase 7).

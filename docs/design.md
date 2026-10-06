# Design

> **Status: foundations approved in Phase 5a.1 (D37–D41); core components
> approved in Phase 5a.2 (D42–D46); content component specs written in Phase 5a.3
> (D47–D53); sections pending (D30).** §1–§8 below are the owner-approved
> foundations: direction, colour, typography, spacing, depth, icons, theming, and
> motion. §13 holds the component specs. Page sections (§14) are still the Phase 3
> placeholder baseline until their specs are approved in Phase 5a.4. Nothing visual is built or restyled
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
| `SectionHeading` | Eyebrow label + Bebas display title + optional intro paragraph |
| `Tag` | **Spec: §13.4.** Mono label chip for tech stack, blog tags |
| `StatusPill` | **Spec: §13.5.** "Open to Remote Roles" with pulsing green dot. Only the "open" state exists for now; other `profile.availability` states are decided when that data arrives |
| `Container` | `max-w-7xl` + gutters |

### Main site (`components/main/`)

| Component | Notes |
|---|---|
| `Hero` | Status pill, name in display type, headline, short intro, CTAs (View Projects, Get In Touch), quick contact row, portrait |
| `About` | Quote, body text, resume download button |
| `SkillGroup` | Category label + grid of devicon logo + name |
| `ServiceCard` | **Spec: §13.11.** Large cards that stack on scroll: number, Iconly icon, title, description, items |
| `CreativesCard` | **Spec: §13.12.** Inverted last card of the service stack, linking to `creatives.chestlyace.online` |
| `ProjectCard` | **Spec: §13.10.** Image-forward tile: image, mono category label, title + `↗`; links to the project page. Hover zoom and "View ↗" cursor label |
| `Timeline` + `TimelineItem` | **Spec: §13.13.** Used by both Experience and Volunteering. Rail that fills blue on scroll, a dot per entry; dates, role, organization, description, optional logo |
| `ContactCard` | **Spec: §13.14.** Email / phone / WhatsApp tiles with copy buttons |
| `ContactForm` | **Spec: §13.15** (form fields). Name, email, subject, message; delivery per Q10 (email + WhatsApp) |
| `FaqList` | **Spec: §13.16.** Hairline accordion on native `<details>/<summary>` |
| `CertificationItem` | **Spec: §13.17.** Badge tile in a grid (Q22) |

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
content components — the Phase 5a.3 PR (issue #21).

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

_None approved yet._

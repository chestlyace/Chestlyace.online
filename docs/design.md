# Design

> **Status: foundations (D37–D41), core components (D42–D46), and content
> components (D47–D53) approved in Phase 5a.1–5a.3; homepage section and project
> page specs written in Phase 5a.4 (D54–D62, §14); all built in Phase 5b. The
> admin's component and screen specs (§13.18–13.26, §14.11; D72) are written in
> Phase 6a and built in Phase 6b; the blog's (§13.27–13.50, §14.13–14.19; D82–D85) are
> written in Phase 9a.** §1–§8 below are the
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
`primary-hover` (its hover fill), `primary-text`, and `ring`, so they feel related
but distinguishable:

| Site | Accent | Status |
|---|---|---|
| main | Blue `#2563EB` | Decided |
| admin | The main blue (no override; D72) | Decided |
| creatives | Warm orange `#C2410C` (values below) | Decided (Q12, 2026-10-08; D87) |
| blog | The main blue (no override) | Decided (Q12, 2026-10-07) |

**Creatives orange** (D87), contrast-checked (WCAG AA 4.5:1):

| Token | Light | Dark | Check |
|---|---|---|---|
| `primary` | `#C2410C` | `#C2410C` | White (`primary-foreground`) on it: 5.18:1 |
| `primary-hover` | `#9A3412` | `#9A3412` | White on it: 7.31:1 |
| `primary-text` | `#C2410C` | `#FB923C` | On `background` 5.18:1 and on `background-alt` 4.76:1 (light); on `background` 8.75:1, `surface` 7.92:1 and `surface-raised` 7.28:1 (dark) |
| `ring` | `#C2410C` | `#FB923C` | At least 3:1 on every background it is drawn on |

A lighter orange such as `#EA580C` would give white text only 3.56:1, so `#C2410C`
is the lightest orange that keeps white button text readable.

Applied by a `data-site="main|creatives|blog|admin"` attribute on `<html>` set in each
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
| Spring — button return | `{ type: "spring", bounce: 0.35, duration: 0.8 }` | Only the magnetic button springing back to rest (§13.1) |

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
| `ComingSoon` | **Spec: §14.12.** The short placeholder page the creatives and blog hosts show until Phases 9–10 (label, Bebas title, lead, one link to the main site) |

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

| Component | Notes |
|---|---|
| `PostItem` | **Spec: §13.27.** One post in the list: big cover, mono meta, Bebas title, description (Linear-style, D82) |
| `PostHeader` | **Spec: §13.28.** Back link, meta row (date, reading time, updated), title, description, tags |
| `Prose` | **Spec: §13.29.** Typography for a post's rendered markdown, in both themes |
| `CodeBlock` | **Spec: §13.30.** Shiki-highlighted code with a header row and a copy button |
| `Callout` | **Spec: §13.31.** `note`, `tip`, `warning` |
| `TableOfContents` | **Spec: §13.32.** Sticky rail on `lg+`, native disclosure below |
| `PostNavigation` | **Spec: §13.33.** Previous and next post |
| `NewsletterBox` | **Spec: §13.34.** Email signup (Resend Audience, double opt-in) |
| `ReactionBar` | **Spec: §13.35.** Like (no account needed) and share |
| `ReaderSignIn` | **Spec: §13.36.** GitHub / Google sign-in panel and the signed-in chip |
| `Comments` | **Spec: §13.37.** Readers' own comments, replies, likes, reports |
| `Steps`, `Compare`, `FileTree`, `Typewriter`, `CodeGroup`, `Diff`, `Terminal`, `FlowCanvas`, `Quiz`, `AgentSession` | **Specs: §13.38–13.47.** The rich blocks, from `docs/blog-markdown.md` |
| `components/admin/blog/` | **Specs: §13.48–13.50.** The block editor, DEV import/export dialogs, comment moderation |

### Design system showcase (`app/sites/main/design-system/`)

`/design-system` on the main site shows every token, the type scale, and the
shared components in both themes. It returns 404 in production
(`VERCEL_ENV === "production"`), so it's only visible locally and on previews.

### Admin (`app/sites/admin/`, `components/admin/`)

Plain and functional, built from the same tokens (D72): sidebar of resources, list
views with drag-to-reorder and publish toggles, edit forms with inline validation
errors, image upload field with preview. It is its own site on
`admin.chestlyace.online` (D71). **Specs: §13.18–13.26 and §14.11.**

| Component | Notes |
|---|---|
| `AdminShell` | §13.18 — sidebar / drawer, content area |
| `ResourceList` | §13.19 — rows, drag-to-reorder, publish switch, delete |
| `Switch` | §13.20 |
| `AdminFields` | §13.21 — tag list, date, URL, slug, checkbox group, image list |
| `UploadField` | §13.22 — direct-to-Cloudinary |
| `ConfirmDialog` | §13.23 — also the `destructive` Button variant |
| `Toast`, `SaveBar` | §13.24, §13.25 |
| `LoginForm` | §13.26 |

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

**Admin components (Phase 6a):** see [the admin block below](#1318-admin-shell)
(§13.18–13.26).

**Blog components (Phase 9a):** [Post item](#1327-post-item) ·
[Post header](#1328-post-header) · [Prose](#1329-prose) ·
[Code block](#1330-code-block) · [Callout](#1331-callout) ·
[Table of contents](#1332-table-of-contents) ·
[Post navigation](#1333-post-navigation) · [Newsletter box](#1334-newsletter-box) ·
[Reaction bar](#1335-reaction-bar) · [Reader sign-in](#1336-reader-sign-in) ·
[Comments](#1337-comments) (§13.27–13.37); **rich blocks** (§13.38–13.47):
[Steps](#1338-steps) · [Compare](#1339-compare) · [File tree](#1340-file-tree) ·
[Typewriter code](#1341-typewriter-code) · [Code group](#1342-code-group) ·
[Diff](#1343-diff) · [Terminal](#1344-terminal) · [Flow canvas](#1345-flow-canvas) ·
[Quiz](#1346-quiz) · [Agent session](#1347-agent-session); **admin** (§13.48–13.50):
[Blog editor](#1348-blog-editor) · [DEV import and export](#1349-dev-import-and-export) ·
[Comment moderation](#1350-comment-moderation). The custom markdown they read and
write is in [`blog-markdown.md`](./blog-markdown.md).

**Creatives components (Phase 10a):** [Masonry grid](#1351-masonry-grid) ·
[Gallery tile](#1352-gallery-tile) · [Filter bar](#1353-filter-bar) ·
[Event tile](#1354-event-tile) · [Lightbox](#1355-lightbox) ·
[Details and credits](#1356-details-and-credits) · [Doodle scene](#1357-doodle-scene) ·
[Marquee](#1358-marquee) · [Section portal](#1359-section-portal) ·
[Creatives contact block](#1360-creatives-contact-block) (§13.51–13.60).

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
pill-shaped controls; anubi.io's cursor-aware buttons. Motion revised from the
owner's screen recording (2026-10-06): a strong pull from a distance, a floating
label, a light that follows the pointer, and a springy return.

**Anatomy.** Pill container → label → optional trailing icon (Lucide, e.g.
`arrow-up-right`, `arrow-right`, `download`). Renders `<a>` when it has `href`,
otherwise `<button>`.

**Variants.**

| Variant | Background | Text | Border | Hover (fine pointer) |
|---|---|---|---|---|
| `primary` | `primary` | `primary-foreground` | none | `primary-hover` |
| `secondary` | `surface` | `foreground` | 1px `border` | `surface-raised`, border `muted` at 40% |
| `ghost` | transparent | `foreground` | none | `surface` |
| `destructive` | `danger` | white | none | `danger` at 85% (admin only, §13.23) |

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

- **Magnetic pull** (revised 2026-10-06 from the owner's screen recording).
  While the pointer is within the button's box plus a **100px** margin, the
  button leans toward it by **30%** of the pointer's offset from the button's
  centre, scaled from 40% at the edge of the zone to 100% over the button, and
  capped at **40px**. The label travels a further **18%** (about 1.6× the pill's
  travel), so it floats above the pill. The pill stretches along the pull
  (`scale` +0.25% per px of pull along that axis) and squashes slightly across it
  (−0.1% per px), never below 0.9. Followed with a spring
  `{ type: "spring", bounce: 0, duration: 0.3 }`.
- **Sheen.** A soft radial light follows the pointer across the button's face
  (150px radius, centred on the pointer, clipped to the pill). Its opacity is the
  pointer's closeness to the button — 0 at the edge of the zone, 1 over it. Colour
  by variant: `primary` white at 30%; `secondary` and `ghost` `foreground` at 12%
  and 10%.
- **Return.** When the pointer leaves, everything springs back with a small
  overshoot: `{ type: "spring", bounce: 0.35, duration: 0.8 }` (the one place a
  spring bounces, §8; deliberate, owner's direction). Interruptible —
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

**Purpose.** Entries in Experience (`journey`) and Volunteering (`volunteering`)
— the same component for both (D33).

**References.** Owner's direction (2026-10-06, replacing the earlier "line that
fills on scroll"): **a date-picker wheel.** Not a long list — one pinned section
in which the entries roll past a fixed spotlight as the visitor scrolls, like
choosing a date on a calendar app, until the last one has had its turn and the
page moves on.

**Anatomy.**

- **Wheel** (left, columns 1–5 from `lg`; on top on phones): one row per entry —
  the dates in Bebas (`title` step, uppercase), the role beneath in `label` step
  `muted`. The row nearest the spotlight is full size and colour; the rows above
  and below shrink and fade with distance. The top and bottom edges fade out.
- **Card** (right, columns 6–12; below the wheel on phones): `tile` fill, radius
  `xl`, padding 24px / 32px. Counter ("03 / 06") and the "EDUCATION" Tag
  (`journey.type = 'education'`) on top; then the logo (40px square, radius `md`;
  the organization's first letter when there is none), dates, role (`h3`),
  organization (+ location), description (`body`, `muted`, max 60ch). Organization
  is a text-roll link with `↗` when `link_url` is set (§13.3).

**Values.**

| Property | Value |
|---|---|
| Pin | The stage sticks 96px from the top (below the capsule) and is the viewport's height less 112px, min 30rem |
| Scroll per entry | 60% of the viewport's height; the first and last entry are each held for a little before and after |
| Row | 104px on desktop, 68px on phones |
| Look at distance *d* rows | opacity `1 − 0.6·min(d, 1.5)` (at least 0.15); scale `1 − 0.1·min(d, 2)` |

**Motion** (GSAP ScrollTrigger, Motion):

- The track is `(n − 1) × 60svh` taller than the stage; a scrubbed tween (0.4s
  smoothing) moves the wheel, so it glides to a stop after the visitor does.
- The card changes when the nearest row changes: the old one fades out and up
  (10px), the new one fades in from below (14px), 220ms `ease-out`; the direction
  follows the scroll.
- Clicking a row scrolls to the position where that entry is in the spotlight.
- Reduced motion, no JavaScript, or a single entry: no pin — a plain list of every
  entry in the card's format.

**Accessibility.** An `<ol>` of buttons (the current one `aria-current="step"`);
the card shows the current entry; dates in `<time datetime>` in the list version.

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

**Admin components (Phase 6a, issue #37):**
[Admin shell](#1318-admin-shell) · [Resource list](#1319-resource-list) ·
[Switch](#1320-switch) · [Admin form fields](#1321-admin-form-fields) ·
[Upload field](#1322-upload-field) · [Confirm dialog](#1323-confirm-dialog) ·
[Toast](#1324-toast) · [Save bar](#1325-save-bar) · [Login form](#1326-login-form)

The admin (`admin.chestlyace.online`, D71) is **plain and functional** (D72): the
same tokens, type and radii as the public sites, the main blue accent, and the
core components (§13.1–13.5, §13.15). It has no smooth scrolling, no scroll-driven
effects, and no magnetic buttons (`magnetic={false}` everywhere in it); motion is
limited to state changes of 120–300ms with the curves in §8. Every screen works
with a keyboard and on a phone. Light and dark follow the same toggle as the
public sites.

### 13.18 Admin shell

**Purpose.** The frame around every admin screen after login: navigation between
resources, the way back to the public site, and the sign-out.

**References.** Owner's choice (2026-10-06): "plain and functional" (§9), on our
tokens.

**Anatomy.** Sidebar (`lg` and up) or top bar with a drawer (below `lg`) → content
area.

**Values.**

| Part | Value |
|---|---|
| Sidebar | 248px wide, fixed, full height; `surface` fill, 1px `border` on its right edge; padding 16px |
| Brand | The `Brand` component (§9) with a mono `label` "ADMIN" under it; 24px below it the nav |
| Nav | A list of links in two groups under mono `label` headings: **Overview** (Dashboard) and **Content** (Profile, Skills, Services, Projects, Experience, Volunteering, Certifications, Socials, FAQ). Each link: 40px tall, radius `md`, padding 0 12px, `body` 15px medium, `muted`; a 20px Lucide icon (16px gap 12px) before the label |
| Active link | `foreground` text, `surface-raised` fill (on the sidebar's `surface`), a 2px `primary` bar on the left edge, `aria-current="page"` |
| Hover (fine pointer) | `foreground` text, `surface-raised` at 60%, 150ms |
| Footer of the sidebar | "View site ↗" (text link to the main site, new tab), the theme toggle (§13.2), "Sign out" (ghost button, `sm`) |
| Top bar (< `lg`) | 56px; `material` bar (§5) with a bottom `border`; menu icon button, the current screen's title in `h3`, the theme toggle |
| Drawer (< `lg`) | The sidebar slides in from the left over a scrim (`foreground` at 40%); 300ms `ease-drawer`; closes on scrim tap, Escape, or choosing a link; focus is trapped and returns to the menu button |
| Content area | Fills the rest; `background`; padding 24px (phones 16px) / 32px (`lg`); content max 960px wide, left-aligned |
| Page title | The screen's `<h1>` in `title` step, `foreground`, with a one-line `muted` description under it; 32px above the content |

**States and motion.** Navigating between screens is a normal page change. The
active bar does not animate (it is part of the link). Reduced motion: the drawer
appears and disappears without sliding.

**Responsive.** As in the table: sidebar from `lg`, drawer below.

**Accessibility.** `<nav aria-label="Admin">` around the links; a skip link
(§13.9) to `#main`; the drawer is a dialog (`role="dialog"`, `aria-modal`,
labelled "Menu"); every icon has a text label (no icon-only nav). One `<h1>` per
screen.

### 13.19 Resource list

**Purpose.** The list screen of every resource: see all entries in the order the
public site shows them, hide or show them, reorder them, and open or delete them.

**Anatomy.** Toolbar (count + "New" button) → rows → empty state. A row: drag
handle → text block → status → switch → actions.

**Values.**

| Part | Value |
|---|---|
| Toolbar | Left: "6 entries" (`muted`, `sm`); right: a `primary` `md` button "New <thing>" (e.g. "New project") with a `plus` icon; 24px below it the list |
| List | A single bordered card: `surface` fill, radius `lg`, 1px `border` between rows; no outer padding |
| Row | Min height 64px, padding 12px 16px, gap 12px; `body` text. Hover (fine pointer): `surface-raised` |
| Drag handle | Lucide `grip-vertical`, 20px, `muted`, in a 44×44px hit area at the left; cursor `grab` |
| Text block | Primary line `body`, medium 500, `foreground`, truncated to one line; secondary line `sm` `muted` (what it is — see §14.11 per resource). The whole text block is the link to the editor |
| Status | A Tag (§13.4): "Published" (plain) or "Draft" (`muted` text on `border` outline); hidden below `md` (the switch carries the state) |
| Switch | The publish switch (§13.20), labelled "Published: <title>" |
| Actions | An icon button (§13.2) "Edit <title>" (`pencil`) and one "Delete <title>" (`trash-2`, `danger` on hover and focus). Below `md` they collapse into a single "More" (`ellipsis`) button opening a small menu |
| Empty state | Centred in the card: a 40px icon, "Nothing here yet", one line of help, and the "New" button |

**Reordering.**

- **Pointer / touch:** press and drag the handle (Motion's `Reorder`); the dragged
  row lifts (`shadow-float-lifted`, `scale(1.01)`), the others slide aside with
  the default spring; dropping saves the new order at once
  (`POST /api/admin/<resource>/reorder`).
- **Keyboard:** focus the handle (it is a button, "Reorder <title>"); Space picks
  the row up, ↑ / ↓ move it, Space drops it (saves), Escape cancels. A polite live
  region announces "Picked up Alexdy, position 1 of 2", "Moved to position 2 of
  2", "Dropped at position 2" and "Reorder cancelled".
- **Optimistic:** the new order shows immediately; if the save fails the list
  returns to the old order and a toast says so (§13.24).
- Lists that show a subset (Experience's tabs) reorder within what is shown.
- Where order does not matter to the public site the handle is not shown (none
  today).

**Publish switch.** Toggling saves at once (`PATCH /:id` with `isPublished`),
optimistic with the same failure handling; the Status tag follows.

**Delete.** Opens the confirm dialog (§13.23); on confirm the row collapses
(height + opacity, 200ms) and a toast confirms.

**Motion.** As above. Reduced motion: rows jump to their new place with no
spring; the lift and the collapse are replaced by opacity changes.

**Responsive.** Rows keep the same structure; below `md` the Status tag is hidden
and the actions collapse into "More", leaving handle, text, switch, "More".

**Accessibility.** The list is a `<ul>`; each row's link, switch and buttons have
names that include the entry's title. Focus order within a row: handle, text link,
switch, edit, delete. Colour is never the only signal for draft (the tag and the
switch's label say it too).

### 13.20 Switch

**Purpose.** A two-state setting that takes effect or is saved as a field:
"Published", "Featured", "Link is private".

**Anatomy.** Track → knob (+ a visible label beside it in forms).

**Values.** Track 44×26px, radius `full`; off: `border` fill; on: `primary` fill.
Knob 20px, white, 3px inset, a soft shadow. A 44px-tall hit area. Label `body`
`foreground` on the right in forms, `sm` text hidden visually in lists (the
`aria-label` carries it).

**States and motion.** The knob moves with the default spring and the fill
cross-fades (150ms). Hover (fine pointer): the off track darkens to `muted` at
50%. Pressed: the knob stretches to 24px wide. Focus: 2px `ring`, 2px offset,
radius `full`. Disabled: 50% opacity. Reduced motion: the knob jumps; the fill
still cross-fades.

**Accessibility.** `role="switch"` on a `<button>` with `aria-checked`; Space and
Enter toggle. Never relies on colour alone: the label or a visible "On / Off"
accompanies it in forms.

### 13.21 Admin form fields

**Purpose.** The editor screens' fields. Text inputs, textarea, select and the
field chrome are the form fields of §13.15 (filled style, label above, errors
below, validation on blur, `aria-invalid`); this adds the types the admin needs.

**Field types.**

| Type | Use | Behaviour |
|---|---|---|
| Text | Names, titles, short strings | §13.15 text input; a character counter (`sm`, `muted`, right-aligned under the field) appears from 80% of the limit |
| Long text | Descriptions, answers, the About text | §13.15 textarea, min height 160px, growing to 480px; supports blank lines between paragraphs, said in the helper text where it matters |
| URL | Links | Text input, `inputmode="url"`; accepted values start with `https://` or `http://` (typed values without a scheme get `https://` on blur); invalid ones show "Enter a web address starting with https://" |
| Date | Start / end / issued dates | Native `<input type="date">` in the same box; a "Clear" text button beside it where blank means "ongoing" or "unknown" |
| Select | Category, type, availability, icon | §13.15 select |
| Switch | Booleans | §13.20 with its label on the right and a one-line helper under it |
| Checkbox group | `show_on` | Native checkboxes (20px, `primary` when checked) in a row, each with its label; at least one must be ticked |
| Tag list | `tech_stack`, `items`, `headline_words` | A box that holds the entries as removable chips (Tag, §13.4, with an `x` button) and a text input; Enter or comma adds, Backspace on an empty input removes the last chip; chips can be reordered by dragging (same rules as §13.19) or with Alt+← / Alt+→ on a focused chip. Duplicates are refused with a message |
| Image / file | Hero, logos, badges, project image, resume | The upload field (§13.22) |
| Image list | `gallery_urls` | A stack of upload fields (§13.22, compact), reorderable like §13.19, with an "Add image" button |
| Slug | `projects.slug` | A text input that follows the title until edited by hand; lowercase letters, numbers, hyphens; a helper shows the resulting address (`chestlyace.online/projects/<slug>`); a warning notes that changing it breaks links to the old address |

**Layout of an editor screen.** One column, max 720px, fields 24px apart, grouped
under `h2` group titles (`h3` step) with a 1px `border` line above each group;
related short fields sit side by side from `sm` (e.g. start and end date). The
Publish switch is the first field of every entry. The save bar (§13.25) is fixed
to the bottom.

**Errors.** The server returns `{ error: "invalid", fields: { <name>: "<message>" } }`
(HTTP 422); each message shows under its field, and focus moves to the first
invalid one. A top-of-form alert (`role="alert"`, `danger`, Lucide `circle-alert`)
reports failures that are not tied to a field ("Couldn't save. Check your
connection and try again."), keeping what was typed.

**Accessibility.** Every control has a visible label; helper and error text are
tied with `aria-describedby`; required fields say "(required)" in `muted` after the
label — in the admin, where nearly everything is required, **optional** fields are
the ones marked "(optional)", as in §13.15. Chips are buttons with names like
"Remove Laravel".

### 13.22 Upload field

**Purpose.** Choosing an image or file for a field. Files go straight from the
browser to Cloudinary using a short-lived signature
(`POST /api/admin/upload-signature`, `content-schema.md` §3); the field stores the
returned URL.

**Anatomy.** Label → drop area → preview and details → buttons → helper/error.

**States.**

| State | Treatment |
|---|---|
| Empty | A dashed 1px `border` box, radius `md`, min height 140px, `surface` fill: an `upload` icon, "Drop a file here or **choose one**" (the second part is a text button), and the limits in `sm` `muted` ("JPG, PNG, WebP or AVIF · up to 10 MB") |
| Drag over | The border becomes `primary`, the fill `primary` at 6%; 150ms |
| Uploading | The preview area shows the file name and a 4px progress bar (`primary` on `border`); a "Cancel" text button; the field is busy (`aria-busy`) |
| Filled | A preview (images: `object-contain` on `surface`, radius `md`, max 160px tall, 16:9 for project images, square for logos and badges; the resume shows a PDF icon, its name and a "View" link), the file name and size in `sm` `muted`, and two buttons: "Replace" (secondary `sm`) and "Remove" (ghost `sm`) |
| Existing URL | A URL already in the database (from the old site) shows as filled; "Replace" works as normal |
| Error | `danger` border and message with the reason ("That file is over 10 MB", "Upload failed — try again") and a "Try again" text button |

A "Use an address instead" text link under the box swaps it for a URL input (§13.21)
so a hosted image can be pasted; "Upload a file instead" swaps back.

**Rules per use** (`content-schema.md` §3): project image `portfolio/projects`,
journey logo `portfolio/journey`, profile hero and resume `portfolio/profile`;
10 MB; the resume accepts PDF only. Replacing or removing a file changes the field
only when the entry is saved; nothing is deleted from Cloudinary.

**Motion.** Border and fill changes 150ms; the progress bar grows linearly; the
preview fades in (200ms). Reduced motion: no fade.

**Accessibility.** The drop area is also a real button (Enter or Space opens the
file chooser); progress is announced politely in steps of 25%; the preview image
has `alt=""` (the field's label and file name carry the meaning).

### 13.23 Confirm dialog

**Purpose.** Asking before something destructive or easy to lose: deleting an
entry, leaving a form with unsaved changes.

**Anatomy.** A native `<dialog>` opened with `showModal()` → title → one-line
explanation → two buttons.

**Values.** 440px wide (phones: full width minus 32px), radius `xl`, `surface-raised`
fill, `shadow-float-lifted`, padding 24px; a `foreground` at 40% backdrop. Title
`h3`; text `body` `muted`; buttons right-aligned, 12px apart: **Cancel** (secondary
`md`, receives focus first) and the confirming action — **Delete** (the
`destructive` Button variant, below) or **Discard changes** (`primary`).

**Copy.** "Delete “Alexdy”?" / "This removes it from the site. You can't undo this."
and "Leave without saving?" / "Your changes to this entry will be lost."

**Destructive Button variant** (added to §13.1): `danger` fill, white text,
`danger` at 85% on hover; same sizes, states and motion as `primary`; used only
here and for "Sign out everywhere" if it is ever added.

**Motion.** The dialog scales `0.96 → 1` and fades (200ms `ease-out`); the backdrop
fades (200ms). Reduced motion: fade only.

**Accessibility.** Native dialog behaviour: focus is trapped and returns to the
trigger; Escape cancels; the title labels the dialog (`aria-labelledby`) and the
text describes it (`aria-describedby`).

### 13.24 Toast

**Purpose.** Short feedback after an action that doesn't change the screen:
"Saved", "Deleted", "Couldn't reorder".

**Values.** Bottom-centre, 24px above the screen edge (above the save bar where
there is one); max 420px wide; `material` background (§5), 1px `border` at 60%,
radius `lg`, `shadow-float`, padding 12px 16px; a 20px icon (`circle-check` in
`secondary` for success, `circle-alert` in `danger` for errors) and one line of
`body` text; an optional text button ("Undo" is not offered — deletes are final).
A close icon button on errors.

**Behaviour.** Success toasts last 4 seconds; errors stay until dismissed. At most
three stack; older ones are removed. Hovering or focusing pauses the timer.

**Motion.** Enters from 12px below with opacity, 250ms `ease-out`; leaves with
opacity, 150ms. Reduced motion: opacity only.

**Accessibility.** Success: `role="status"` (polite). Errors: `role="alert"`
(assertive). Never the only way to learn of a failure that affects the form: form
failures also show the form's alert (§13.21).

### 13.25 Save bar

**Purpose.** Saving or discarding an editor screen's changes.

**Values.** Fixed to the bottom of the content area, full width of it (not under
the sidebar); `material` background, a 1px `border` on its top edge, padding
12px 16px (`lg`: 12px 32px); content aligned to the same 720px column as the form.
Left: a status in `sm` — "Unsaved changes" with a small `primary` dot, or "All
changes saved" in `muted` (after a save, for 3 seconds, then blank). Right:
**Cancel** (ghost `md`, returns to the list; asks to confirm when there are
unsaved changes, §13.23) and **Save** (`primary` `md`; loading state while saving;
disabled until something changed).

**Behaviour.** The form is "dirty" once any field differs from what was loaded.
Save validates, sends, then shows a success toast ("Saved. It's live on the site.")
and stays on the screen (new entries move to their own edit address). Cmd/Ctrl+S
saves. Leaving the page or closing the tab with unsaved changes shows the
browser's own warning. On a failure the bar stays dirty and the form's alert
explains.

**Motion.** The status text cross-fades (150ms). Reduced motion: none needed.

**Accessibility.** The status is in a polite live region; Save has `type="submit"`
for the form so Enter in a text field submits.

### 13.26 Login form

**Purpose.** Signing in (Q15: one admin, a password, no username).

**Anatomy.** Centred card → brand → "Sign in" → password field → button.

**Values.** Card 400px wide (phones: full width minus 32px), `surface` fill, radius
`xl`, padding 32px, centred vertically and horizontally on a `background` page; the
`Brand` (§9) and a mono `label` "ADMIN" above an `h1` "Sign in" (`title` step).
One password field (§13.15) labelled "Password", `type="password"`,
`autocomplete="current-password"`, with a show/hide icon button (`eye` / `eye-off`,
"Show password") inside its right edge; below it a `primary` `lg` full-width
button "Sign in" (loading state while checking).

**Errors.** A wrong password shows one message, "That password isn't right." — never
which part was wrong. Too many attempts: "Too many attempts. Try again in 12
minutes." with the real wait; the form is disabled until then. Network failure:
the generic form alert (§13.21). The password stays typed after a failed attempt.

**After signing in.** To the screen asked for (a safe path on the admin host) or
the dashboard. Signing out returns here with "You've been signed out."; an expired
session sends the visitor here with "Your session ended. Sign in again." and
returns them to the screen they were on.

**Proposed values (confirmed in 6b):** a session lasts 7 days from sign-in; 5 failed
attempts per IP per 15 minutes, in memory like the contact form's limit (D69), with a
short fixed delay on every attempt.

**Motion.** The card enters with opacity and 12px rise, 300ms. Reduced motion:
none.

**Accessibility.** The error is tied to the field with `aria-describedby` and
announced (`role="alert"`); the page `<title>` is "Sign in — Admin"; the browser's
password manager can fill and save it.

### 13.27 Post item

**Purpose.** One post in a list: the blog home (§14.13) and the tag pages
(§14.15).

**References.** Owner's choice (2026-10-07): the minimalism of
[linear.app/blog](https://linear.app/blog) — one column, a big cover per post,
a bold title, a small date and arrow, **separated by space rather than borders** —
in our own type, tokens and motion.

**Anatomy.** The whole item is one link: **cover** → **meta line** (mono `label`:
`2026-10-20` in a `<time datetime>`, then "6 MIN READ", then the post's first tag
as plain text) → **title row** (Bebas title, `arrow-up-right` at the right edge)
→ **description**.

**Values.**

| Property | Value |
|---|---|
| Cover frame | Aspect `16 / 9`, radius `xl` (28px; `lg` on phones), `surface` fill, image `object-fit: cover` |
| No cover | The `surface` frame with the post's title in Bebas `display-lg`, `muted`, centred (as the project card, §13.10) |
| Cover → meta | 20px |
| Meta line | `label` step, `muted`, parts separated by " · " |
| Meta → title | 8px |
| Title | Bebas, `display-lg` step, uppercase, `foreground`, up to three lines; arrow 24px, `muted`, top-aligned with the first line |
| Description | `lead` step, `muted`, max 52ch, 12px below the title; two lines on phones |
| Between items | 96px (64px on phones); no divider lines |
| **Latest post** | The first item is larger: it uses the wide container (§5) and its title is `display-xl`; every other item sits in the narrow container (980px), so the list steps in after the first |

**States and motion** (Motion for hover, GSAP for scroll; the same moves as the
project card):

| State | Treatment |
|---|---|
| Hover (fine pointer) | The cover scales `1 → 1.04` inside its frame (600ms `ease-out`); the arrow turns `foreground` and nudges 4px up and right; the title turns `primary-text` (150ms) |
| Focus | 2px `ring` around the whole item (radius `lg`) |
| Pressed (touch) | The item dims to 60% for 100ms |
| Entrance | The cover reveals upward (a clip from the bottom, 900ms `expo.out`) and the meta, title and description fade up 24px, 650ms `power3.out`, 80ms stagger, once, at 85% down the viewport (§14.0) |

Reduced motion: no scale, no entrance (shown in the final state); colour changes
stay.

**Responsive.** Same stack everywhere; titles scale with `display-lg` /
`display-xl`; on phones the latest post's title drops to `display-lg`.

**Accessibility.** The link's accessible name is the title; the date, reading time
and tag are read as part of the item. The cover is decorative (`alt=""`; the title
names the post). Items are `<li>` in an `<ol>` (newest first). Tags are not links
inside the item (no links inside links); they are linked on the post and tag pages.

**Approved in:** the Phase 9a PR (issue #61).

### 13.28 Post header

**Purpose.** The top of a post page (§14.14): what it is, when, how long, and
what it's about.

**Anatomy** (top to bottom): back link → meta row → title → description → tags.

**Values.**

| Part | Value |
|---|---|
| Back link | "← All posts", text roll (§13.3, standalone), to `/`; 112px below the top of the viewport (clears the capsule) |
| Meta row | Mono `label`, `muted`: `<time>` `2026-10-20` · "6 MIN READ" (reading time, computed: words ÷ 200, rounded up, minimum 1); when the post has `updated`, " · UPDATED 2026-11-02" follows. 24px below the back link |
| Title | The section heading's look (§14.0): Bebas at `display-lg`, uppercase, `foreground`, letters rising on load; max 20ch per line break; the page's one `<h1>` |
| Description | `lead` step, `muted`, max 52ch, 24px below the title |
| Tags | Linked Tags (§13.4), 8px gap, 24px below the description |

**Motion.** The title's letters rise as in the section heading (§14.0), once on
load; the meta row, description and tags fade up 16px, 100ms later. Reduced
motion: final state.

**Responsive.** The title scales with `display-lg` (3 → 5rem); the meta row wraps
onto two lines on phones with the same separators.

**Accessibility.** The back link is the first link after the skip link. The meta
row is plain text with a `<time>`; "6 MIN READ" is read as "6 minute read" through
an `aria-label` on the element.

**Approved in:** the Phase 9a PR (issue #61).

### 13.29 Prose

**Purpose.** The typography for a post's body, written in MDX, in both themes.
Everything an author can write without a component.

**Values** (the reading column is at most 68ch, §3; sizes below are **proposed
for review**, built from the existing steps):

| Element | Treatment |
|---|---|
| Paragraph | `body` step (17px), leading **1.7** (longer than the 1.55 default, for reading), `foreground`, 24px between paragraphs |
| `h2` | Text semibold, **1.75 → 2.25rem**, leading 1.15, tracking `-0.02em`; 64px above, 16px below |
| `h3` | The `h3` step (1.375 → 1.75rem); 40px above, 12px below |
| `h4` | `body` semibold; 32px above, 8px below |
| Heading anchor | A mono `#` (`muted`) appears 8px left of `h2`–`h4` on hover and focus-within (150ms); it is a link to the heading's own address; headings have `id`s and `scroll-margin-top: 96px` |
| Link | Inline underline (§13.3); external links add the `↗` |
| Strong, emphasis | Semibold 600; italic |
| Lists | Bullets and numbers in `muted`; 8px between items; 24px indent; nested lists 16px more |
| Blockquote | A 2px `border` rule on the left, 20px of padding, `foreground` at 80%, italic; no background |
| Inline code | JetBrains Mono at 0.9em, `surface` fill (`surface-raised` on `background-alt`), padding 2px 6px, radius `sm` |
| Horizontal rule | 1px `border`, 48px above and below |
| Image / figure | Full column width, radius `lg`, `surface` fill while loading; a caption in `sm`, `muted`, 12px below; images may be wider than the column up to the wide container on `lg+` when marked wide (`#wide`) |
| Table | In a wrapper that scrolls sideways; header row in mono `label` `muted`; 1px `border` lines between rows; cells padded 12px 16px; no zebra stripes |
| Footnotes | Not supported at launch |

- Code blocks are §13.30; callouts §13.31; the rich blocks are §13.38–13.47 — all are custom blocks of `docs/blog-markdown.md`.
- Light and dark use the same tokens; nothing is a raw colour.

**Motion.** Prose does not animate on its own; images and figures fade in as they
load (200ms). The heading anchor's `#` fades (150ms).

**Responsive.** The same sizes; images, tables and code blocks never push the
page sideways (they scroll inside themselves).

**Accessibility.** Headings keep their order (`h2` under the page's `h1`); the
build warns about a skipped level. Images need `alt` text (the build fails on an
image with none, unless it is marked decorative). Links never rely on colour alone.

**Approved in:** the Phase 9a PR (issue #61).

### 13.30 Code block

**Purpose.** Code in a post, highlighted at build time (Shiki, no JavaScript sent
for the colours).

**Anatomy.** A frame → a header row (file name or language on the left, copy
button on the right) → the code.

**Values.**

| Property | Value |
|---|---|
| Frame | `surface` (`surface-raised` on `background-alt`), 1px `border`, radius `lg`, 24px between it and the prose |
| Header row | 40px tall, 16px padding; the file name from the code fence's `title` (e.g. ` ```ts title="proxy.ts" `) or, without one, the language, in mono `label` `muted`; a 1px `border` line below |
| Code | JetBrains Mono, 0.875rem, leading 1.65, padding 16px 20px; no wrapping: the block scrolls sideways inside the frame |
| Colours | Shiki with two themes at once, switched by the site's light/dark class: **`github-light`** and **`github-dark`** (neutral greys and a blue that sit with our tokens), with the theme's background replaced by the frame's `surface`. Every token pair must meet 4.5:1 on its background; the build step checks them and changes a theme colour that fails |
| Line numbers | Off by default; on with `showLineNumbers` on the fence: `muted`, right-aligned in a 32px gutter, not selectable |
| Line highlight | ` ```ts {2,4-6} `: those lines get a `primary` tint at 8% and a 2px `primary` rule on the left |
| Copy button | An icon button (§13.2) at 32px (44px hit area), Lucide `copy` 16px that becomes `check` 16px for 2s after copying; `aria-label` "Copy code" and an `aria-live="polite"` region that says "Copied" |

**States.**

| State | Treatment |
|---|---|
| Copy button, fine pointer | Hidden until the block is hovered or has focus inside (opacity, 150ms); always visible on touch and when focused |
| Hover on the button | `surface-raised` background |
| Focus | The scrolling code area is focusable (`tabindex="0"`, `role="region"`, labelled by the file name/language) so it can be scrolled with the keyboard; 2px `ring` |

**Motion.** The copy icon swap uses the icon-button cross-fade (§13.2, 200ms).
Reduced motion: opacity only.

**Responsive.** The same everywhere; the header row's text is truncated with an
ellipsis, never wraps.

**Accessibility.** Selecting and copying by hand works as usual (line numbers are
not selectable). Colour is never the only way to see a highlighted line (the
rule). The copy result is announced.

**Approved in:** the Phase 9a PR (issue #61).

### 13.31 Callout

**Purpose.** A short aside inside a post, written `<Callout type="tip" title="…">`
in MDX.

**Variants.**

| Type | Icon (Lucide, 20px) | Label (mono) | Icon colour |
|---|---|---|---|
| `note` | `info` | NOTE | `primary-text` |
| `tip` | `lightbulb` | TIP | `primary-text` |
| `warning` | `triangle-alert` | WARNING | `danger` |

**Values.** `surface` fill (`surface-raised` on `background-alt`), radius `lg`,
padding 20px (24px from `sm`), no border; icon and mono label on one line, the
optional `title` in semibold `body` below it, then the content in `body` at the
prose leading. 32px above and below. A callout never holds a code block taller
than 12 lines (the build warns).

**Motion.** None.

**Responsive.** The same everywhere.

**Accessibility.** The label is text, so the type is never conveyed by colour or
icon alone. A callout is a `<aside>` with `role="note"`; it does not interrupt
reading order.

**Approved in:** the Phase 9a PR (issue #61).

### 13.32 Table of contents

**Purpose.** Lets a reader see the shape of a long post and jump to a part of it.

**Anatomy.** A mono `label` "ON THIS PAGE" (`muted`) and a list of the post's `h2`
headings, with their `h3`s indented. Shown only when the post has **at least 3**
headings.

**Values.**

| Property | Value |
|---|---|
| Desktop (≥ `lg`) | A sticky rail in columns 10–12 (§14.14), `top: 112px`, max height `100dvh − 144px` with its own scroll |
| Items | `sm` step, leading 1.45, 8px between items; `h3` items indented 16px; `muted` |
| Active item | The heading nearest the top of the viewport: `foreground`, and a 2px `primary` rule on the left of the list that **moves** to it (a shared-layout animation, default spring, §8) |
| Hover (fine pointer) | `foreground`, 150ms |
| Phones and tablets (< `lg`) | A native `<details>`/`<summary>` under the header: `surface` fill, radius `md`, 48px summary row "On this page" with a Lucide `chevron-down` that turns 180° when open; the open list is the same items |

**Motion.** Clicking an item scrolls to the heading through Lenis (`ease-in-out`,
1.2s, §14.0) and moves focus to it (`tabindex="-1"`). The active rule moves with
the spring. Reduced motion: an instant jump; the rule moves without the spring.

**Accessibility.** `<nav aria-label="On this page">`; the active item has
`aria-current="location"`; the disclosure is keyboard-operable by default; links
are real anchors to the headings' `id`s.

**Approved in:** the Phase 9a PR (issue #61).

### 13.33 Post navigation

**Purpose.** The way on from a post: the previous (older) and next (newer) post.

**Anatomy.** Two blocks side by side from `md`: **Previous** on the left, **Next**
on the right (right-aligned). Each: a mono `label` ("PREVIOUS" / "NEXT") with a
Lucide `arrow-left` / `arrow-right`, then the post's title in the `h3` step.
Each block is one link.

**Values.** Wide container; a 1px `border` line above and below the pair;
padding 32px; the blocks sit in a 2-column grid with a 1px `border` line between
them. With only one neighbour, it takes its own side and the other is empty.
Posts are ordered by `date`; the first post has no Previous and the latest has no
Next (it does not wrap).

**States.** Hover (fine pointer): the title turns `primary-text` and the arrow
nudges 4px toward its direction (150ms `ease-out`). Focus: 2px `ring`, radius `md`.

**Responsive.** Below `md` the blocks stack, Previous above Next, separated by a
1px `border` line.

**Accessibility.** `<nav aria-label="More posts">`; each link's name is "Previous
post: <title>" / "Next post: <title>".

**Approved in:** the Phase 9a PR (issue #61).

### 13.34 Newsletter box

**Purpose.** Lets a reader subscribe to new posts by email (Q16). It appears under
the post list on the blog home and under every post. Subscribers are held in a
Resend Audience; the list is sent to from Resend (D82, 9b.7).

**Anatomy.** A panel: mono `label` "NEWSLETTER" → title → one line of text → the
form (email field + submit) → a helper line.

**Values.**

| Part | Value |
|---|---|
| Panel | `surface` (`surface-raised` on `background-alt`), radius `xl`, padding 32px (24px phones); wide container, content max 36rem |
| Title | Text semibold at the `title` step (2 → 3rem), `foreground`, 8px below the label |
| Text | `body`, `muted`, 12px below the title |
| Field | Email input, filled (§13.15), 48px, label "Email" above (visible); no other fields |
| Button | `primary` `md` Button "Subscribe" (§13.1), beside the field from `sm` (8px gap), full width below it on phones |
| Helper | `sm`, `muted`, 12px below: a line about unsubscribing |
| Spam protection | A honeypot field hidden from people, plus the rate limit the contact form has (D69); no CAPTCHA |

**Copy** (placeholder wording, for the owner to approve here; the owner edits it in
the admin, Blog → Newsletter, §14.19, and `content/copy.ts` holds the wording a
field shows until it is changed):

| | Text |
|---|---|
| Title | "New posts, in your inbox" |
| Text | "A short email when I publish something new. Nothing else." |
| Helper | "You can unsubscribe at any time. Prefer a feed? Use the RSS link in the footer." |
| Success | "Check your inbox. I've sent you a link to confirm your address." |
| Error | "That didn't work. Please try again in a moment." |
| Invalid email | "Enter a valid email address." |

**States.**

| State | Treatment |
|---|---|
| Default | As above |
| Field | The filled-field states of §13.15 (hover, focus, error with `circle-alert` and `aria-invalid`) |
| Sending | The button's loading state (§13.1); the field is disabled |
| Success | The form cross-fades (300ms) into a message with Lucide `circle-check` in `secondary` and the success copy; the address is not shown again |
| Error | An alert above the field (`danger` text, `circle-alert`, `role="alert"`), the typed address kept |
| Already subscribed | Looks like success (the answer must not reveal who is on the list) |

**How it works** (a build note, not visual): the form posts to the blog's own API;
the address is **not** added to the Audience until the reader opens the
confirmation link in the email (double opt-in). The link goes to the page in
§14.16. Resend's broadcast emails carry their own unsubscribe link.

**Motion.** The panel uses the default entrance (§14.0); the success cross-fade as
above. Reduced motion: no entrance, instant swap.

**Responsive.** Field and button side by side from `sm`; stacked below.

**Accessibility.** A visible `<label>`; the helper and errors are tied with
`aria-describedby`; the status message is in a `role="status"` region; the
success message receives focus. The honeypot is `aria-hidden`, `tabindex="-1"`,
`autocomplete="off"`.

**Approved in:** the Phase 9a PR (issue #61).

### 13.35 Reaction bar

**Purpose.** Like and share a post, directly under its text (§14.14).

**Anatomy.** A row: a **Like** button (Lucide `heart` 20px and the count in mono),
then a **Share** button (`secondary` pill, `sm`, Lucide `share-2`, label "Share").

**Values.**

| Part | Value |
|---|---|
| Like | A pill button, 40px tall, `surface` fill, 1px `border`, `foreground` heart and count (`label` step); liked: heart filled in `primary-text`, border `primary` at 40% |
| Share | A `secondary` Button (§13.1), size `sm`, `magnetic={false}` |
| Bar | 32px below the post's text, a 1px `border` line above it, 16px padding, gap 12px |

**Behaviour.**

- **Like needs no account** (owner, 2026-10-07): one like per browser, kept in a
  first-party cookie that the server stores only as a hash; repeated clicks toggle
  it. The count updates at once and is corrected from the server's answer. The
  server rate-limits likes.
- **Share:** on devices with the system share sheet (`navigator.share`), Share
  opens it with the post's title and address; elsewhere it opens a small menu
  (a popover of `surface-raised`, radius `md`, §13.7's materials): **Copy link**,
  **Share on X**, **LinkedIn**, **WhatsApp**, **Email**, each a text link with its
  icon. Copy link turns its label into "Link copied" for 2s (a `role="status"`
  region announces it).
- Shared addresses are the post's canonical address (no tracking parameters).

**Motion.** Liking pops the heart: `scale 1 → 1.25 → 1` with the default spring
(`bounce: 0.3`, 400ms) and the count rolls to its new value (200ms). The share
menu materializes as the Sites menu does (§13.7). Reduced motion: no pop, no roll.

**Accessibility.** The Like button is a toggle (`aria-pressed`) named "Like this
post" with the count in its label ("12 likes"); the Share menu follows the menu
pattern (Escape closes, focus returns to the button).

**Approved in:** the Phase 9a PR (issue #61).

### 13.36 Reader sign-in

**Purpose.** Readers sign in with **GitHub or Google** to comment and to like
comments (Q16, D83). It is the only account a visitor ever has; the owner's admin
sign-in is separate (D71).

**Anatomy.** Two parts: the **sign-in panel** and the **signed-in chip**.

**Sign-in panel** (in the comments, §13.37, and in a native `<dialog>` when a
signed-out reader tries to like a comment or reply):

| Part | Value |
|---|---|
| Panel | `surface` (`surface-raised` on `background-alt`), radius `lg`, padding 24px |
| Title | "Sign in to comment" in the `h3` step; the dialog's title is the same |
| Text | `sm`, `muted`: "We use your name and picture from GitHub or Google. Your email is never shown." with a link to the privacy page (§14.18) |
| Buttons | Two `secondary` Buttons, size `md`, each with the provider's logo (Simple Icons, 18px) and "Continue with GitHub" / "Continue with Google"; side by side from `sm`, stacked on phones |

**Signed-in chip.** An avatar (28px, radius `full`, the provider's picture, else
the initial on `surface`) and the reader's name (`sm`, medium 500) with a ghost
`sm` button "Sign out"; a "Delete my account" text link inside a small menu on the
name (it removes the account and anonymises the reader's comments as "Deleted
user", after a confirm dialog, §13.23's pattern).

**Flow.** The buttons start the provider's sign-in; the reader comes back to the
same post at the same place (the address is kept through the sign-in). A cancelled
or failed sign-in shows an alert above the buttons (`danger` text, `circle-alert`,
`role="alert"`): "Sign-in didn't complete. Please try again."

**Motion.** The dialog scales in as the other dialogs do (§13.23, 200ms
`ease-out`). Reduced motion: fade only.

**Accessibility.** The dialog is a native `<dialog>` (focus trapped, Escape
closes, focus returns to the control that opened it); the provider buttons say
what they do ("Continue with GitHub"); the logos are decorative.

**Approved in:** the Phase 9a PR (issue #61).

### 13.37 Comments

**Purpose.** Readers discuss a post under it (owner, 2026-10-07: sign in to
comment; comments appear at once and are moderated afterwards).

**Anatomy.** A heading "Comments" with the count (`h3` step, mono count) → the
**composer** (or the sign-in panel, §13.36) → the **list**.

**Composer** (signed in): the reader's avatar (36px) beside a textarea (filled,
§13.15: min height 96px, grows to 240px) labelled "Add a comment", a word counter
(`sm`, `muted`; turns `danger` over the limit) and a `primary` `sm` "Post comment"
Button. Plain text only; line breaks kept; web addresses become links with
`rel="nofollow ugc noopener"`; HTML is never rendered. **Limit: `COMMENT_MAX_WORDS`
(placeholder 120, the owner's to set)**, a rate limit per reader, and one
unanswered duplicate is refused.

**A comment:** avatar (32px) · name (semibold) and, for the owner's own account, a
mono Tag "AUTHOR" · the time (`sm`, `muted`, relative, "3 days ago", with the full
date in a `title` and `<time datetime>`) · the text (`body`) · actions in a row
(`sm`, `muted`, 12px gap): **Like** (heart + count, as §13.35 but small), **Reply**,
**Report** (Lucide `flag`; signed-in only; opens a confirm that sends one report),
**Delete** (own comments only, with a confirm). A **reply** is indented 40px, one
level deep (a reply to a reply attaches to the same parent).

**List.** Newest first, 20 at a time with a ghost "Load more comments" button; a
reply thread is collapsed behind "Show 3 replies" when it has more than 2.

| State | Treatment |
|---|---|
| No comments | "No comments yet. Be the first." in `muted` |
| Loading | Three skeleton rows (`surface` bars) |
| Error | An alert (`danger`, `circle-alert`, `role="alert"`) with a "Try again" text link; the post is unaffected |
| Posting | The Post button's loading state; the textarea is disabled |
| Posted | The comment appears at the top with a 300ms fade; the composer clears; focus stays in the composer |
| Hidden by the owner | A comment with replies shows "This comment was removed." in `muted`; one without disappears |
| Comments off (`comments_enabled = false`) | The whole section is left out |

**Moderation.** The owner hides, shows or deletes any comment, and can ban a
reader, in the admin (§13.50); the owner is emailed about each new comment
(Resend, the contact form's pattern).

**Motion.** New comments fade in; counts roll (§13.35). Reduced motion: none.

**Responsive.** Replies are indented 24px on phones; actions wrap.

**Accessibility.** The list is a list (`<ul>`), each comment an `<article>` with
the author's name as its label; the composer has a visible label; the counter is
tied with `aria-describedby`; errors use `role="alert"`; nothing depends on
hover.

**Approved in:** the Phase 9a PR (issue #61).

**Rich blocks (§13.38–13.47).** The custom blocks a post can contain beyond plain
prose, written in the format of `docs/blog-markdown.md` (§2) and **entered in the
block editor with forms, never typed by hand** (§13.48). They share these rules:

- They sit in the reading column (§14.14) unless a spec says otherwise, 40px above
  and below.
- Their entrance runs **once**, when the block is 70% into the viewport (§14.0's
  trigger); the content is in the HTML from the start and is only revealed by the
  animation, so search engines and screen readers get all of it.
- **Reduced motion:** every block shows its final state at once; replay controls
  stay, and the replay uses no movement.
- Colours are tokens (§2) except where a spec says otherwise; every text colour
  meets 4.5:1 on its background in both themes.
- A block that fails to parse shows its source as a plain code block and, in the
  editor, an error on the block.

### 13.38 Steps

**Purpose.** A story or procedure told as a vertical timeline that fills in as the
reader scrolls (`steps`).

**References.** Owner's reference posts (yokwejuste.me): step-by-step processes.
In our motion language (§8, §14.6).

**Anatomy.** An ordered list: a **rail** on the left (a 2px `border` line) and for
each step a **marker** (a 40px circle holding a 20px Lucide icon, or the step
number when no icon), a mono `label` "STEP 01", the **title** (`h3` step) and the
**text** (`body`, inline markdown).

**Values.**

| Property | Value |
|---|---|
| Layout | Markers centred on the rail; text column 24px to the right of it; 48px between steps |
| Marker | `surface` fill, 1px `border`, icon `muted` (inactive) |
| Active marker | `primary` fill, `primary-foreground` icon, scaled `1 → 1.08 → 1` with the default spring |
| Rail fill | A 2px `primary` line that grows down the rail as the reader scrolls (scrubbed), reaching each marker as its step becomes active |

**Motion.** GSAP ScrollTrigger: each step fades up 16px (650ms `power3.out`) as it
enters; the rail's fill is **scrubbed** to scroll; a step is *active* while it is
the nearest to 40% down the viewport, and earlier steps stay filled. Reduced
motion: all markers filled, no fade.

**Responsive.** Marker 32px on phones; the same layout.

**Accessibility.** An `<ol>`; markers and the rail are `aria-hidden`; the number is
in the label text, so the order never depends on the animation.

**Approved in:** the Phase 9a PR (issue #61).

### 13.39 Compare

**Purpose.** A titled comparison table with an optional recommended column
(`compare`).

**Anatomy.** A card: a title row (mono `label` "COMPARE" and the title in the
semibold `body`), then a table: a header row and body rows; the first column names
the row.

**Values.**

| Property | Value |
|---|---|
| Card | `surface` (`surface-raised` on `background-alt`), radius `lg`, padding 20px (24px from `sm`) |
| Header row | Mono `label`, `muted`; a 1px `border` line below |
| Rows | Cells padded 12px 16px; 1px `border` lines between rows; first column `foreground` medium 500, the rest `muted` → `foreground` on hover |
| Recommended column | Its header carries a mono Tag "RECOMMENDED" (§13.4) and a 2px `primary` rule under it; its cells have a `primary` tint at 6% |
| Hover row (fine pointer) | `surface-raised` background, 150ms |

**Motion.** Rows fade up 8px with a 60ms stagger when the block enters (400ms
`ease-out`); the recommended column's tint fades in after the last row (300ms).

**Responsive.** The table scrolls sideways inside the card on phones with the first
column sticky and a soft fade at the scrolling edge.

**Accessibility.** A real `<table>` with `<th scope>`; the scroll area is focusable
(`tabindex="0"`) and labelled by the title; "Recommended" is text.

**Approved in:** the Phase 9a PR (issue #61).

### 13.40 File tree

**Purpose.** A folder structure with notes on its entries (`filetree`).

**Anatomy.** A `surface` frame (radius `lg`, padding 16px 20px) holding a tree:
rows of **icon** (Lucide `folder` / `folder-open` / `file`, `file-code`,
`file-json` by extension, 16px, `muted`), the **name** (JetBrains Mono, 0.875rem)
and an optional **note** (mono `sm`, `muted`).

**Values.**

| Property | Value |
|---|---|
| Row | 32px tall, indent 20px per level, radius `sm` |
| Highlighted entry (`+`) | Name in `primary-text`, row tinted `primary` at 6% |
| Notes | A second column from `sm` (aligned across rows); on phones under the name |
| Hover (fine pointer) | Row `surface-raised` at 70%, 150ms |

**Behaviour.** Folders with children are toggles (open by default): clicking the
row, or Enter/Space, collapses it (the chevron turns 90°, 200ms; children height-
animate); arrow keys move between rows as in the tree pattern.

**Motion.** On entering, rows reveal top to bottom: `opacity 0 → 1`, `x −8 → 0`,
30ms stagger, 400ms `ease-out`.

**Accessibility.** `role="tree"` with `treeitem`s, `aria-expanded` on folders;
notes are part of each item's text; icons are decorative.

**Approved in:** the Phase 9a PR (issue #61).

### 13.41 Typewriter code

**Purpose.** Code that types itself out with captions on chosen lines
(`typewriter`): for walking through a snippet.

**Anatomy.** A code frame as §13.30 (header row with the file name, copy button)
plus a **replay** icon button (Lucide `rotate-ccw`) and, while it types, a ghost
`sm` **Skip** button. Captions sit on their own rows under their line.

**Values.** Code as §13.30 (Shiki colours, mono 0.875rem, leading 1.65). A caption
row: `sm`, `muted`, a 14px Lucide `corner-down-right` before the text, 8px above the
next code line; **space for every caption is reserved from the start**, so nothing
below ever jumps. The line being typed has a `primary` tint at 6% and a 2px
`primary` rule at its left; a block caret (`primary`, 2px wide) follows the typing.

**Motion.** Starts when the block is 70% in view: 18ms per character, 120ms between
lines; a caption fades in (200ms) when its line finishes. Skip, a click on the
block, or the replay button's second press completes it at once; replay clears and
types again. Reduced motion: complete from the start, captions visible, no caret.

**Accessibility.** All the code and captions are in the page from the start (the
animation only reveals them); the caret and tint are decorative; the controls have
labels; copy copies the whole code, not just what has typed.

**Approved in:** the Phase 9a PR (issue #61).

### 13.42 Code group

**Purpose.** Several files or variants in one frame, as tabs (`codegroup`).

**Anatomy.** The code frame of §13.30 whose header row holds a **tab list** (mono
`label` tabs named after each file, else the language) with the copy button at the
right.

**Values.** Tabs 40px tall, 12px padding; the selected tab is `foreground` with a
2px `primary` underline; others `muted`. The underline moves with a shared layout
animation (default spring); the code swaps with a 150ms cross-fade. Copy copies the
selected tab. A group with one tab is a plain code block.

**Accessibility.** The tab pattern: `role="tablist"`, `tab`, `tabpanel`, arrow keys
between tabs, the panel is focusable for scrolling (§13.30).

**Approved in:** the Phase 9a PR (issue #61).

### 13.43 Diff

**Purpose.** A before-and-after view of code (`diff`).

**Anatomy.** The code frame of §13.30 with a gutter column of `+`, `−` or a space.

**Values.** Added lines: a `secondary` tint at 12% and a `+` in `secondary`;
removed lines: a `danger` tint at 10% and a `−` in `danger`; unchanged lines plain.
The signs make the meaning independent of colour (§10). (**Proposed:** this uses
`secondary` and `danger` outside §2's stated uses, for what they mean here —
success and error — and is flagged for review.) The copy button copies the **new**
version (added and unchanged lines), labelled "Copy new code".

**Motion.** On entering, added lines flash in (the tint 0 → 12%, 400ms, 60ms
stagger) and removed lines fade to 55% opacity. Reduced motion: final state.

**Accessibility.** Each line's sign is real text (not selectable) with an
`aria-label` of "added" / "removed" on the gutter cell.

**Approved in:** the Phase 9a PR (issue #61).

### 13.44 Terminal

**Purpose.** A terminal session: commands typed, output printed (`terminal`).

**Anatomy.** A window: a title bar (the `title`, or "terminal", in mono `label`; a
copy button and a replay button at the right) and the body.

**Values.**

| Property | Value |
|---|---|
| Window | Radius `lg`, 1px `border`; **always dark**, in both themes (a terminal reads as dark): fill `#0A0A0A`, text `#F5F5F7`, output `#A1A1A6`, comments `#8E8E93` italic, the `$` prompt `#60A5FA`; JetBrains Mono 0.875rem, leading 1.65, padding 16px 20px |
| Title bar | 40px, `#171717`, 1px line below `#262626`, label `#A1A1A6` |
| Caret | A block, `#60A5FA`, blinking at 1s (steps); static in reduced motion |

**Motion.** At 70% in view each `$` command types (22ms per character); its output
then appears line by line (40ms apart, after a 120ms pause); the next command
follows after 400ms. Replay re-runs it; Skip or a click completes it. Reduced
motion: complete from the start.

**Behaviour.** The prompt `$` is not selectable; **copy puts only the commands on
the clipboard**, each on its own line.

**Accessibility.** The whole session is in the page from the start; the window is
a `role="region"` labelled by its title; the controls have labels; the animation
adds nothing that isn't already text.

**Approved in:** the Phase 9a PR (issue #61).

### 13.45 Flow canvas

**Purpose.** An architecture or process diagram: boxes, groups and arrows
(`flow`).

**Anatomy.** A frame (`surface`, radius `xl`) holding an SVG canvas: **nodes**
(rounded boxes with an icon chip, a label and an optional description), **groups**
(dashed containers with a mono label) and **arrows** (curved or elbow paths with
heads and optional labels).

**Values.**

| Part | Value |
|---|---|
| Node | `surface-raised`, 1px `border`, radius `md`, padding 12px 16px; label semibold `sm`, description `sm` `muted`; an icon chip (28px, radius `sm`) tinted with the node's style colour at 14% and the icon in that colour |
| Group | 1px dashed `border`, radius `lg`, a mono `label` at its top left; its children laid out by `dir` |
| Arrow | 1.5px `muted` stroke, a small arrowhead; its label sits in a pill (`surface`, `label` step) at the middle |
| Style colours | `blue` (`primary`), `green` (`secondary`), plus **diagram tints** `orange #F97316`, `purple #8B5CF6`, `teal #14B8A6`, `red #EF4444`, `gray` (`muted`); dark mode lightens each by one step (**proposed values**; they only tint chips and icons, text stays `foreground`, so contrast holds) |
| Size | The canvas keeps its drawn proportions (a viewBox) and scales to the column; the frame never goes below 640px wide |

**Motion.** At 70% in view the nodes fade in with `scale 0.96 → 1` (60ms stagger,
400ms `ease-out`), then the arrows **draw themselves** in the order they were
written (stroke-dashoffset, 600ms `ease-in-out` each, 120ms apart), their labels
fading in as they finish. **Hover or focus on a node** lights its arrows
(`primary`) and dims the rest to 40% (150ms). Reduced motion: complete from the
start; the highlight still works without movement.

**Responsive.** Below 640px the frame scrolls sideways (soft fade at the edges) so
the diagram stays legible.

**Accessibility.** The SVG has `role="img"` and a label ("Diagram: …" from the
block's title or its first node); a visually hidden list under it spells out every
arrow ("Organization → Folders: contains"); nodes are focusable (`tabindex="0"`)
for the highlight.

**Approved in:** the Phase 9a PR (issue #61).

### 13.46 Quiz

**Purpose.** A short multiple-choice quiz that checks the reader got the point
(`quiz`).

**Anatomy.** A card (`surface`, radius `lg`, padding 24px / 32px from `sm`): a
mono `label` "QUESTION 1 / 3" → the question (`h3` step) → the options → the
explanation → a Next button; after the last question, the result.

**Values.**

| Part | Value |
|---|---|
| Option | A button row, 48px tall minimum, radius `md`, `surface-raised` fill, 1px `border`, a mono letter badge (A–D) at the left, text `body`; 8px apart |
| Hover (fine pointer) | Border `muted` at 50%, 150ms |
| Chosen, right | Border `secondary`, a Lucide `circle-check` in `secondary`, and "Correct" in text |
| Chosen, wrong | Border `danger`, `circle-x` in `danger` and "Not quite"; the right option is then also marked |
| Explanation | The `E:` text in `body`, in a `surface-raised` panel (radius `md`, padding 16px), appears under the options |
| Next | `primary` `md` Button "Next question" (last: "See result") |
| Result | "You got 2 of 3." with a line of copy by score, and a ghost "Try again" button |

**Behaviour.** One answer per question, locked once chosen; progress is not saved
(a reload starts again). Nothing is sent anywhere.

**Motion.** Options press to `scale(0.98)`; the explanation opens by height and
opacity (250ms `ease-out`); questions cross-fade with a 12px horizontal slide
(200ms). Reduced motion: instant.

**Accessibility.** A `role="radiogroup"` (arrow keys, Enter to choose); after an
answer, focus moves to the explanation (`role="status"`); right and wrong are
shown with icons and text, never colour alone.

**Approved in:** the Phase 9a PR (issue #61).

### 13.47 Agent session

**Purpose.** Shows a development session with an AI agent (a Claude Code session)
as a replayable transcript (`session`, D84).

**References.** Owner (2026-10-07): sessions from their agents, embedded in a post.
The look is the terminal's (§13.44).

**Anatomy.** A dark window as §13.44: a **header** (the title; a mono `label`
"CLAUDE CODE"; "14 turns · 9 tool calls"), the **transcript**, and a **control
bar** at the bottom.

**The transcript** is the turns chosen in the editor (`from`–`to`), in order:

| Turn part | Look |
|---|---|
| Your prompt | A row with a mono `label` "YOU", the text in `#F5F5F7`, a 2px `#60A5FA` rule at the left |
| The agent's reply | A mono `label` "AGENT" and the text (a markdown subset: paragraphs, lists, inline code, links) in `#F5F5F7` |
| A tool call | A collapsed row: a chevron, the tool's name and a one-line summary ("Edit · proxy.ts · +12 −3", "Bash · pnpm test"); opened (click or Enter), it shows the command and its output, or the diff (§13.43 styling in the dark window), cut at 40 lines with "Show all" |
| Redactions | A `[redacted]` pill (`#262626`, mono) where the editor hid a secret, path or address |
| The agent's thinking | Left out by default; the editor can include it, shown dimmed and collapsed |

**Values.** Max height 560px (the transcript scrolls inside, the header and
control bar stay in view), turns separated by 20px, text mono 0.875rem. **Control
bar:** Play/Pause, Previous and Next turn, a speed toggle (1× / 2×), a progress
bar you can click, and "Expand all".

**Behaviour.** At first it shows the **first 6 turns** and a "Play session"
button, so a long session never dominates the page. **Play** reveals the turns one
by one (the prompts type at 22ms per character, replies appear line by line, tool
calls appear collapsed); Pause stops; Previous/Next step one turn; "Expand all"
shows everything. Never autoplays.

**Motion.** A revealed turn fades up 8px (250ms `ease-out`); the transcript
scrolls to keep the newest turn in view (smoothly; instant in reduced motion).
Reduced motion: Play reveals turns without typing or movement.

**Accessibility.** The transcript is a real list in the page from the start (the
collapsed rows are `<details>`); the controls have labels and are keyboard
operable; the window is a labelled `region`; nothing autoplays.

**Approved in:** the Phase 9a PR (issue #61).

### 13.48 Blog editor

**Purpose.** Where the owner writes a post **without typing markdown**: a list of
**blocks**, each filled in with a simple form, with a live preview. It produces the
custom markdown of `docs/blog-markdown.md` (stored in `blog_posts.content`).

**References.** Owner (2026-10-07): "a simpler method of getting input from the
user and then putting it in the markdown format", unlike dev.to's markdown box.
Our own editor (D83), in the admin's plain, functional style (§13.18).

**Anatomy.** An admin screen (§14.19) in the admin shell (§13.18):

1. **Post details**: the title (a large text field), the description, the address
   (slug, following the title as in §13.21), tags (tag list, §13.21, lowercase
   kebab-case), the cover (the upload field, §13.22, plus "Use a generated cover"),
   and a **Settings** disclosure: published date, comments on/off, canonical
   address, series name.
2. **Tabs:** **Write** · **Preview** · **Markdown**. From `xl` (1280px) Write and
   Preview sit side by side, the preview scrolling with the block being edited.
3. **The block list** (Write): the blocks in order.
4. **The save bar** (§13.25), with the post's status ("Draft", "Published",
   "Unsaved changes", "Saved"), Save, and **Publish** / **Unpublish**, and a
   "More" menu: Publish to DEV (§13.49), Duplicate post, Delete post.

**A block** is a row: a drag handle, a mono Tag with the block's type, the block's
**form**, and a small toolbar (Move up, Move down, Duplicate, Delete; Delete asks
first, §13.23). Blocks reorder by dragging (Motion `Reorder`, as the admin lists,
§13.19) **or** with the Move buttons, so a keyboard works. Between blocks and at the
end sits an **insert** button (a "+" icon button that appears on hover/focus and
always at the end).

**Inserting.** The insert button, or typing `/` at the start of an empty paragraph,
opens a menu (a popover, `surface-raised`, radius `md`, with a search field),
grouped:

| Group | Blocks |
|---|---|
| Text | Paragraph, Heading, Quote, List, Callout, Divider |
| Media | Image, Code, Code group, Diff |
| Interactive | Steps, Compare, File tree, Terminal, Typewriter code, Quiz, Flow canvas |
| Agent | Agent session |
| Advanced | Raw markdown |

**The forms** (every field is an admin field, §13.21; a long list can be pasted
in):

| Block | Fields |
|---|---|
| Paragraph | An auto-growing text area with a toolbar (Bold, Italic, Link, Inline code, Bulleted list, Numbered list) and the shortcuts Ctrl/⌘ B, I, K; it stores markdown, and the Markdown tab shows it |
| Heading | Level (2, 3 or 4) and text |
| Quote, List | Text area; list items one per line |
| Callout | Type (Note, Tip, Warning) and text |
| Image | Upload (§13.22) or address, **alt text** (required unless "Decorative" is on), caption, "Wide" switch |
| Code | Language (searchable list), file name, the code (mono text area), highlighted lines (e.g. `2, 4-6`), line numbers switch |
| Code group | Tabs: add, rename, reorder; each tab has language, file name and code |
| Diff | Two text areas, **Before** and **After**, with the computed diff shown below; or switch to editing the diff lines directly |
| Terminal | Rows, each a type (Command, Output, Comment) and text; "Paste a terminal session" turns pasted `$ …` lines into rows; title |
| Typewriter | Language, file name, the code, and a **caption** field under each line you click |
| File tree | A tree editor: rows you indent with Tab / Shift+Tab, folder switch, note field, highlight switch; "Paste `tree` output" imports the text |
| Steps | Cards you reorder: icon (a searchable Lucide picker), title, text |
| Compare | A small grid: add or remove rows and columns, the first row is the header, choose the recommended column, title |
| Quiz | Questions: the question, the options (a radio marks the right one, 2–4 options), the explanation; add and reorder questions |
| Flow canvas | See below |
| Agent session | See below |
| Raw markdown | A mono text area (an escape hatch; checked on save) |

**The flow canvas editor.** A canvas (grid background) and a side panel. **Add
box** places a node; drag it where you want it; click it to edit its label, icon,
colour (the style names, as small swatches), description, and whether it is a group
or inside one; **drag from a box's edge dot to another box to draw an arrow**; click
an arrow to label or delete it; "Auto-arrange" lays the boxes out in rows. Boxes
and arrows are also listed in the panel so the diagram can be edited without a
pointer.

**The agent session editor.** "Upload a session" accepts a Claude Code `.jsonl`
file (from `~/.claude/projects/`). It then shows (1) the turns as a checklist with
a preview of each (choose a range, or pick turns; tool calls are listed under
their turn), (2) options: include the agent's thinking (off), and (3) a **redaction
review**: everything the tool found and will hide (API keys and tokens, `.env`
values, email addresses, your home folder's path) listed with its context, each with
a switch, and a field to add anything else to hide. Only the redacted version is
stored (`agent_sessions`); the original file is never kept. The block then shows the
session's title and turn range.

**Autosave and checks.** Drafts save by themselves 5 seconds after the last change
(the save bar says "Saving…" then "Saved"); the unsaved-changes guard (§13.25)
covers leaving the page. Each block validates as you go (e.g. an image without alt
text, a quiz question with no right answer); **Publish is disabled until every block
is valid**, and the first problem is linked ("Fix 2 problems").

**Preview.** Renders the post with the real public components (§13.28–13.47) in the
current theme with a light/dark switch of its own; interactive blocks work.

**Markdown tab.** Shows the generated markdown (read-only by default; "Edit
markdown" unlocks it). Editing and returning to Write re-reads it; a block that
doesn't parse stays as a Raw markdown block with an error.

**Motion.** As the rest of the admin (§13.18): state changes only, 120–300ms; the
block reorder uses Motion's layout animation.

**Responsive.** Below `xl` the tabs are exclusive; on phones the block toolbar is a
"…" menu, and the flow canvas editor works with touch (drag to move, an
"Add arrow" mode: tap one box, then another).

**Accessibility.** Every control is a labelled form control; blocks are a list; the
insert menu is a menu (arrow keys, Escape); drag has a keyboard equivalent (Move
buttons) with an `aria-live` announcement ("Moved to position 3"); errors are tied
to their fields.

**Approved in:** the Phase 9a PR (issue #61).

### 13.49 DEV import and export

**Purpose.** Bring the owner's posts from DEV (dev.to) into the blog, and send a
post to DEV (`docs/blog-markdown.md` §3–§4).

**Import** (a dialog from the Posts list's "Import from DEV" button, native
`<dialog>`, §13.23's frame, wide):

1. **Username**: a field with the owner's DEV username (remembered after the first
   time) and "Find my posts". Reading published articles needs no key.
2. **Choose**: a list of the articles (title, date, tags, a cover thumbnail) with
   checkboxes, "Select all", and an "Already imported" tag on those already here.
3. **Import** creates a **draft** for each; a **report** follows: for each post,
   what became what and every warning (a liquid tag kept as text, an image still on
   DEV's CDN, more than 4 tags…), with a link to open the draft in the editor.

**Export** (the editor's "Publish to DEV" in the More menu, a dialog):

| Part | Content |
|---|---|
| Status | Whether the DEV API key is set (a server secret, `DEVTO_API_KEY`); if not, the dialog says how to create one in DEV's settings and add it in Vercel, and disables the button |
| What will change | A list of the post's custom blocks and how each will be written for DEV (e.g. "Steps → numbered list", "Flow canvas → image"), so nothing is a surprise |
| Options | "Publish now" switch (off: it is created as a draft on DEV); the canonical address is always set to the post here |
| Result | A link to the DEV article; the post remembers it (`devto_id`) so the next export **updates** that article |

**States.** Loading (the button's loading state, §13.1), error (an alert with DEV's
message, `role="alert"`), success. Nothing is sent without pressing the dialog's
primary button.

**Accessibility.** A native dialog (focus trapped, Escape closes); lists are real
lists with labelled checkboxes; the report is a list with warnings as text.

**Approved in:** the Phase 9a PR (issue #61).

### 13.50 Comment moderation

**Purpose.** The owner's tools for the readers' comments (§13.37), in the admin.

**Anatomy.** A resource list (§13.19) at "Comments": filter tabs **All · Reported ·
Hidden**, newest first; each row: the reader's avatar, name and provider (GitHub /
Google), the post's title (a link), an excerpt, the time and, when reported, a
"Reported ×3" status pill.

**Row actions** (icon buttons with labels, §13.2): **Hide / Show** (toggle), **Open
on the post**, **Delete** (confirm dialog, §13.23), and in a "…" menu **Ban
reader** (they can no longer comment; confirm) and **Mark this account as the
author** (shows the "AUTHOR" Tag on its comments).

**States.** Empty ("No comments yet." / "Nothing reported."); hiding a comment
updates the public page's cache at once (§14.19); every destructive
action asks first.

**Accessibility.** As the other admin lists (§13.19).

**Approved in:** the Phase 9a PR (issue #61).

**Creatives components (Phase 10a).**

Owner references (2026-10-08): **anubi.io/lab** (a tight, rigid masonry of
work with the title bottom-left and the year top-right on each tile), **anubi.io/work**
(event tiles with a blur-and-details hover that open into an event page with an
information sidebar, more pictures and credits) and **anubi.io** (the creative
motion). The creatives site has **two sections**, **Graphic design** and
**Photography** (Videography is a later step, D87). **Approved in:** the Phase 10a
PR (issue #87).

Shared rules for §13.51–13.60: the always-in-HTML and compositor-only rules of §8;
every image has alt text (the admin requires it, or "decorative"); every image
carries its pixel size so the grid reserves its space (no layout shift); images are
Cloudinary addresses served at the width the tile needs (`f_auto,q_auto`, a
`srcset`), with a blurred 24px placeholder shown until the image is ready (the
blur-up of the lab page); the first row of a page loads eagerly, the rest lazily.

### 13.51 Masonry grid

**Purpose.** The Graphic design page's gallery (§14.21): many pieces of different
proportions in one solid, even arrangement.

**References.** anubi.io/lab: columns of tiles at their own ratios, tight gutters,
square corners, nothing decorative between tiles.

**Anatomy.** A list of Gallery tiles (§13.52) in CSS columns' order: tiles are placed
into the **shortest column** as they come, so reading order is left to right, then
down, and the columns end at nearly the same height.

**Values.**

| Part | Value |
|---|---|
| Columns | 1 on phones, 2 from `sm`, 3 from `lg`, 4 from `2xl` (≥ 1536px; the grid is then wider than the container, see below) |
| Gutter | 12px between tiles, both directions (the lab page's tight, rigid look) |
| Container | Wide (§5); from `2xl` the grid runs to 1600px |
| Tile ratio | The image's own (`width / height`), clamped to between 3:4 portrait-tall and 16:10 landscape-wide so no tile is a sliver |
| Radius | **0** (owner's "solid and rigid"; a deliberate exception to the `lg` media radius of §5, used only for the gallery tiles and the lightbox image) |

**Behaviour.** Filtering (§13.53) re-flows the grid with a GSAP Flip: tiles that
stay glide to their new places (500ms `ease-in-out`), tiles that leave fade and
shrink to `scale(0.95)` (200ms), tiles that arrive fade in from `scale(0.95)`
(300ms, 30ms stagger). The page keeps its scroll position; the URL records the
filter (`?category=poster`) without a navigation. Reduced motion: the grid changes
with a 150ms cross-fade.

**Motion (entrance).** Tiles rise 24px and fade in as their row passes 85% of the
viewport, in a 40ms stagger by column (`power3.out`, 700ms), once.

**Accessibility.** An `<ul>` of `<li>`s with the filter's result count in a polite
live region ("12 pieces"); order in the DOM is the reading order.

### 13.52 Gallery tile

**Purpose.** One design piece in the Masonry grid (§13.51), and also the clickable
thumbnail inside an event page (§14.23).

**References.** anubi.io/lab tiles: the image fills the tile; a dark gradient
carries the title bottom-left and the year top-right; the media is a blur-up.

**Anatomy.** Image → a bottom gradient → **title** (bottom-left, Text semibold at
`h3`, `#F5F5F7`, max 2 lines) and a mono `label` line under it with the category
→ the **year** (top-right, mono `label`). A tile is one `<a>` (or `<button>` that
opens the Lightbox, §13.55).

**States.**

| State | Treatment |
|---|---|
| Rest | Image sharp; the gradient (transparent → `rgb(0 0 0 / 0.6)`, bottom 45%) is always there so the title is readable on any image |
| Hover (fine pointer) | **Details**: the image blurs (`blur(8px)`) and darkens (`rgb(0 0 0 / 0.45)`) over 300ms `ease-out`, `scale(1.03)`; the details rise 12px and fade in over the gradient: the title, the category, the **client** (if any), the **tools** as tags (§13.4), and a "View" label with `arrow-up-right` in the accent |
| Focus | The same as hover plus the 2px `ring` outline inset 2px; opens on Enter |
| Press | `scale(0.985)`, 120ms |
| Touch devices | No hover state: the tile shows the rest state and a tap opens the Lightbox (the details are in it) |
| Loading | The blurred placeholder, then a 300ms cross-fade to the image |

**Values.** Text over images is always `#F5F5F7` on the gradient (it does not
follow the theme, as the always-dark terminal of §13.44 does not); the gradient
makes it at least 4.5:1 on any image; the blurred hover dim makes it 7:1.

**Motion.** As above; compositor-only (`transform`, `opacity`, `filter`). The
blur is on a duplicate image layer faded in over the sharp one (so the blur never
re-rasterises the sharp image). Reduced motion: the hover swaps to the dimmed state
with a 150ms opacity change, no blur or scale.

**Accessibility.** The tile's accessible name is "Title, category, year"; the hover
details are decorative duplicates (`aria-hidden`) because the Lightbox holds them
for everyone. The tile is reachable by keyboard in DOM order.

### 13.53 Filter bar

**Purpose.** Narrows the Graphic design grid by category.

**Anatomy.** A row of **Tags** (§13.4, `button` variant): "All" then each category
that has a published piece, with the count after the name ("POSTER · 12"), sorted by
count then name. One is selected at a time (`aria-pressed`), shown as the accent
pill (`primary` fill, `primary-foreground` text).

**Values.** 8px gap, wraps to a second line; sticky nowhere (it scrolls with the
page). On phones the row scrolls sideways (no wrap) with the right edge faded.

**Behaviour.** Selecting a filter runs the grid's Flip (§13.51), updates the URL
and moves nothing else. Arrow keys move between chips (a roving tab stop); Space or
Enter selects. A category with no pieces never appears; with a single category
there is no bar.

### 13.54 Event tile

**Purpose.** One photography event on the Photography page (§14.22).

**References.** anubi.io/work: a large cover tile per project, a blurred hover with
details, opening into its own page.

**Anatomy.** A wide cover image (`16 / 10`) with, over it: the event's **year**
(top-right, mono `label`) and its **title** (bottom-left, Bebas at `display-lg`,
`#F5F5F7`); under the image, outside it: the **place** and **date** on one mono
`label` line, `muted`, and the number of pictures ("48 PHOTOS").

**Values.**

| Part | Value |
|---|---|
| Layout | 1 column on phones, 2 from `md` (24px gutters); the **featured** event spans both columns at `21 / 9` |
| Radius | 0, as the gallery tiles |
| Gradient | The same bottom gradient as §13.52 |

**States.** Hover (fine pointer): the cover blurs (`blur(10px)`), dims, and a panel
rises over it with the event's **description** (3 lines), its **role** line ("Event
photographer"), and an "Open the event" label with `arrow-up-right`, 350ms
`ease-out`; the cover scales to 1.03. Press `scale(0.99)`. Focus as hover. Touch:
a tap opens the event (no hover state). Click opens the event page (§14.23) through
a shared-element transition: the cover grows into the page's hero (GSAP Flip,
700ms `ease-in-out`); with reduced motion, a plain 200ms cross-fade.

**Accessibility.** One link; its name is "Title, place, date"; the hover panel is
`aria-hidden`.

### 13.55 Lightbox

**Purpose.** Opens a design piece or an event picture full size with its details,
and steps through the pieces without going back to the grid.

**References.** The "click for more details or credits" of the owner (2026-10-08):
the click on a design piece opens this and the journey ends there, with no further
page. Deep link: `/design?piece=slug` opens the gallery with the lightbox open.

**Anatomy.** A full-screen layer: the **image** (contained, max 100% of the stage)
on the left on desktop, a **details panel** on the right (§13.56), a close button
(top-right), previous / next buttons (the stage's edges), and a counter ("03 / 24").
A piece with several images shows them as a vertical **thumbnail rail** beside the
stage; an event picture has no panel (the event's own sidebar is on the page behind).

**Values.**

| Part | Value |
|---|---|
| Layer | A native `<dialog>`, `100dvh`, `rgb(10 10 10 / 0.94)` background in both themes, no blur (it is opaque enough; reduced transparency changes nothing) |
| Stage | The image contained, never upscaled past its pixel size; 24px padding |
| Panel | 360px wide from `lg`; below it, under the image as a sheet that scrolls with the page |
| Controls | 44px icon buttons (§13.2) over the layer, `#F5F5F7` icons |

**Behaviour.** Opens from a tile with a Flip from the tile's rectangle to the stage
(500ms `ease-in-out`); closes the other way. Previous / next and ← / → move through
the grid's current order (the filter included); the URL changes with each (`?piece=slug`, no navigation), so a piece can be shared. Escape, the close
button or a click outside closes; swiping down or sideways does so on touch
(Motion drag gestures). Focus is trapped inside; closing returns focus to the tile.
Neighbouring images are preloaded. Reduced motion: a 200ms cross-fade.

**Accessibility.** The `<dialog>` is named by the piece's title; the counter is a
polite live region; all gestures have button equivalents.

### 13.56 Details and credits

**Purpose.** The facts about a piece or an event, in one reusable block: the Lightbox
panel (§13.55), the design page's sidebar and the event page's sidebar (§14.23).

**Anatomy.** A definition list under a mono `label` heading. For a **design piece**:
Client, Category, Role, Tools, Year, then a short description (`body`, `muted`) and
an optional link ("View the project ↗"). For an **event**: Event, Date, Place,
Role, What was covered (tags), then the description. Followed, when present, by
**Credits**: a list of "Role — Name" rows (a name may link out).

**Values.** Each row is a mono `label` term (`muted`) over its value (`sm`,
`foreground`), 12px between rows, a 1px `border` line between groups; a term with no
value is not shown. Tools and "what was covered" are Tags (§13.4) without buttons.

**Accessibility.** A real `<dl>`; Credits an `<ul>`; links have visible names.

### 13.57 Doodle scene

**Purpose.** The home page's interactive hero illustration (§14.20): hand-drawn
doodles that draw themselves and react to the pointer, with the work inside it.

**References.** anubi.io's visual animation; owner (2026-10-08): "hand-drawn doodles
that draw themselves and react to hover", as the full-screen hero of the home page.

**Anatomy.** One SVG layer (`viewBox="0 0 1440 900"`, `preserveAspectRatio="xMidYMid
slice"`) behind the hero text: about **fourteen doodles** in a single hand-drawn
style (2.5px strokes, round caps and joins, slightly wobbly paths, no fills except
tiny dots), on the themes of the two sections: a **camera**, an **aperture**, a
**pen nib with a bézier curve and its handles**, a **pencil**, **crop marks**, three
**star bursts**, a **squiggle** under the "&", a **scribble circle** around
"PHOTOGRAPHY", a **curly arrow** pointing at the "See the work" button, a **spiral**,
a **spark** and three **colour dots**. Six **frames** (hand-drawn rectangles and
polaroids, tilted −6° to 6°) hold featured images (the pieces and events marked
featured, square corners). Strokes are `foreground` at 85%; the stars, the scribble
circle, the arrow and the spark are `primary-text` (the creatives orange, §4).

**Draw-on (once, on load).** Every doodle path carries `pathLength="1"` and animates
`stroke-dashoffset` `1 → 0` over 900ms `power2.inOut`, staggered by 90ms from 400ms
after the statement starts (§14.20); a frame draws, then its image reveals with a
300ms clip-path wipe. Nothing waits on it: the statement and buttons are in the HTML.

**Idle.** Once drawn, each doodle "breathes": a ±2° rotation and 3% scale loop of
4–7s with its own phase (GSAP sine), paused while the hero is off-screen.

**Hover (fine pointer).**

- **Field:** doodles within 180px of the pointer drift away from it by up to 16px
  (stronger when closer) and tilt toward it, GSAP `quickTo`, 0.5s. The statement and
  buttons are never moved.
- **Doodle reactions:** pointing at a doodle makes it play its own 600ms animation:
  the **camera** flashes (a ring of strokes expands and fades), the **aperture's**
  blades rotate 60°, a **star** spins 180° and scales to 1.2, the **squiggle** and
  **scribble circle** redraw themselves, the **arrow** wiggles, the **pen nib's**
  curve handles slide, a **frame** straightens to 0° and its image brightens. Each
  reaction ends in the doodle's resting pose and can be re-triggered after it ends.
- **Touch:** no pointer field; a tap on a doodle plays its reaction.

**Doodle accents.** The section headings of Graphic design and Photography (§14.21,
§14.22) carry one small doodle beside the title (a star and a squiggle) that draws
itself when the heading reveals and plays its reaction on hover.

**Reduced motion and `Save-Data`.** The doodles are drawn at once (no draw-on, no
idle, no pointer field); hover only changes a doodle's colour to `primary-text` over
150ms. **Performance.** One SVG; only `transform` and `stroke-dashoffset` animate; at
most twenty elements animate at once; the scene's timelines pause when it leaves the
viewport and the SVG is split into its own lazy chunk.

**Accessibility.** The scene is `aria-hidden` and has no focusable parts; every
effect is decoration, so nothing is lost without it. The images in the frames have
alt text, as everywhere.

### 13.58 Marquee

**Purpose.** A band of outlined Bebas words that keeps moving, between home page
sections (§14.20).

**Anatomy.** One line of words separated by a small accent star ("GRAPHIC DESIGN ✦
PHOTOGRAPHY ✦ BRANDING ✦ EVENTS ✦ "), repeated to fill twice the width. Type: Bebas
at `display-xl`, `transparent` fill with a 1.5px `foreground` outline (the outlined
line of the main hero, §14.1); every third word filled with the accent (`primary-text`).

**Motion.** It drifts left at 60px/s. **Scroll speeds it up:** the speed adds the
scroll velocity from Lenis (capped at 4×) and the direction **reverses** when the
page scrolls up (GSAP `ticker`, eased, 400ms). Paused when off-screen. Reduced
motion: the words are static, centred and wrapped.

**Accessibility.** The line is `aria-hidden`; the same words are in the page's
`<h1>`/section headings as text, so nothing is lost.

### 13.59 Section portal

**Purpose.** The two big entrances on the creatives home (§14.20): Graphic design and
Photography.

**Anatomy.** A tall panel (`4 / 5` on phones, `3 / 4` side by side from `md`) with a
featured image, a mono index ("01 — GRAPHIC DESIGN"), the section name in Bebas at
`display-lg`, one line of text (`lead` step, `#F5F5F7`) and a "View the work" label
with `arrow-up-right`. Radius 0, bottom gradient as §13.52.

**States.** Hover (fine pointer): the image reacts to the pointer with the **ripple
distortion** (OGL) of the main site's project tiles (§14.5), the name's letters roll
up (the text roll of §13.3), and a round **cursor label** "VIEW" in the accent follows
the pointer (GSAP `quickTo`, 0.3s). Focus: a 2px `ring` outline. Press: `scale(0.99)`.
Touch: no ripple, no cursor label; the panel is a plain link.

**Motion.** The ripple canvas is created on first hover only, lazy-loaded, and
removed when the pointer leaves for 2s; reduced motion, `Save-Data` and touch use
the still image. Click opens the section with a Flip of the panel's image into the
section's first row (700ms), or a cross-fade for reduced motion.

**Accessibility.** One link per panel, named "Graphic design" / "Photography"; the
canvas is `aria-hidden`.

### 13.60 Creatives contact block

**Purpose.** The way to ask for work, at the bottom of **every** creatives page
(owner, 2026-10-08), above the footer (§13.8).

**References.** The main site's contact tiles (§13.14), without the form.

**Anatomy.** A mono `label` "CONTACT"; a Bebas statement ("HAVE A PROJECT OR AN EVENT
TO COVER?", `display-xl`) in two lines; a line of text; a row of three **Buttons**
(§13.1): **WhatsApp** (`primary`, `lg`, with a pre-filled message "Hi Chestly, I saw
your creative work and I'd like to talk about…", the link of §14.8), **Email**
(`secondary`) and, when the profile has one, **Instagram** (`secondary`, from the
socials shown on creatives); under them the response-time note.

**Values.** A `background-alt` band, wide container, 96px padding (128px from `md`).
The text and buttons come from the settings screen (§14.26) and the profile's
WhatsApp number, email and socials, so the copy is editable.

**Motion.** The statement's letters rise as a section heading (§14.0); the buttons
fade up with a 80ms stagger. Reduced motion: final state.

**Accessibility.** The block is a labelled `<section>`; the statement is an `<h2>`.

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

**Admin (Phase 6a):** [Admin pages](#1411-admin-pages)

**Launch (Phase 8.4):** [Coming-soon page](#1412-coming-soon-page-creatives-and-blog)

**Creatives (Phase 10a):** [Creatives home](#1420-creatives-home) ·
[Graphic design](#1421-graphic-design) · [Photography](#1422-photography) ·
[Event page](#1423-event-page) · [Services](#1424-creatives-services) ·
[Header and footer additions](#1425-creatives-header-and-footer-additions) ·
[Creatives admin pages](#1426-creatives-admin-pages)

**Blog (Phase 9a):** [Blog home](#1413-blog-home) · [Post page](#1414-post-page) ·
[Tags](#1415-tags) · [Newsletter confirmation](#1416-newsletter-confirmation) ·
[Header and footer additions](#1417-blog-header-and-footer-additions) ·
[Privacy notice](#1418-privacy-notice) · [Blog admin pages](#1419-blog-admin-pages)

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

**References.** Owner's direction (2026-10-06): one pinned section with a scroll
wheel (§13.13), not a long list.

**Content.** `journey` rows (`type` work or education), newest first by
`start_date`; one wheel, with an "EDUCATION" Tag on education entries
(`ia-content.md` §2.6). Heading "05 — EXPERIENCE" (old: "Journey").

**Layout** (narrow container, band per §14.0): heading, then the wheel (§13.13),
pinned while the visitor scrolls through the entries.

**Motion and accessibility.** As §13.13.

### 14.7 Volunteering

**Purpose.** Community and volunteer work (`volunteering`, D10, D33).

**Content.** `volunteering` rows, newest first. Heading "06 — VOLUNTEERING", plus a
short intro line (new copy — owner's wording at 5b). **Hidden entirely** while no
entries are published (numbering closes up, §14.0).

**Layout.** The same as Experience, in its own section: narrow container, the
wheel (§13.13), band per §14.0. A volunteering entry has
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

#### Build notes (5b.5)

Where the build differs from, or settles, what the specs above say:

- **Experience wheel.** What the server renders is the plain list; with motion allowed and more than one entry, the pinned wheel replaces it on the client. The entries' order is the database order (newest first as seeded).
- **FAQ.** The open/close animation is CSS only (`::details-content` with `interpolate-size`); a browser without them opens and closes instantly, as §13.16 allows.
- **Contact form card.** The form sits on a card of its own (owner, 2026-10-06): `tile` fill, radius `xl`, a "Send a message" title; the fields inside take `tile-hover`, the opposite tone, so they stay visible on both bands.
- **Contact form.** Posts to `/api/contact`; a quick submit waits until the form has been on screen for 3 seconds before sending. Error messages open with a grid-row transition (height + opacity, 200ms).
- **Contact tiles.** The copy button only shows where `navigator.clipboard` exists. The WhatsApp QR button shows on `(hover: hover)` devices and the code is always black on white.
- **Volunteering.** No entries are seeded, so the section is hidden and the numbers close up; the intro line is placeholder copy in `content/copy.ts`.

### 14.10 Project page

> **Build notes (5b.6).** The morph is a fixed, cover-fitted copy of the image that flies between the card's box and the hero's box (the spec left the technique to the build); the reverse runs only when the card is on screen. Title letters rise in both cases (the spec's "fade up" after a morph applies to the facts row only). The summary is left-aligned with the title rather than centred. A private link shows as a "Live · Private" / "Source · Private" tag. With no Problem / Approach / Outcome the description appears as one "Overview" row.

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

### 14.11 Admin pages

**Purpose.** The owner edits everything the main site shows, without SQL
(Phase 6). Components: §13.18–13.26, with the core components §13.1–13.5 and §13.15.
**Approved in:** the Phase 6a PR (issue #37).

**References.** Owner's choice (2026-10-06): plain and functional, on our tokens
(§9, D72). Host: `admin.chestlyace.online` (Q21, D71).

**Addresses** (on the admin host):

| Screen | Address |
|---|---|
| Sign in | `/login` |
| Dashboard | `/` |
| Profile | `/profile` (one form; no list) |
| A resource's list | `/skills`, `/services`, `/projects`, `/experience`, `/volunteering`, `/certifications`, `/socials`, `/faq` |
| New entry | `/<resource>/new` |
| An entry | `/<resource>/<id>` |

- Every address except `/login` needs a valid session; without one it redirects to
  `/login?next=<path>`. `/login` with a valid session redirects to `/`.
- An unknown resource or id shows the admin's own 404 (inside the shell, with a
  link back to the dashboard).
- `noindex` on every page (meta and `X-Robots-Tag`); no sitemap; `robots.txt`
  disallows everything.
- Every successful write revalidates the public site (`content-schema.md` §2), so
  the change shows on the next visit to the public page. The save toast says "It's
  live on the site." only after the revalidation succeeded.
- **Layout of every list screen:** the shell (§13.18), the page title and
  description, the toolbar and list (§13.19). **Of every editor screen:** the
  shell, a "← <Resource>" text link (§13.3) above the title, the title ("Edit
  Alexdy" / "New project"), the form (§13.21) and the save bar (§13.25).
  A new entry starts with **Published** off, so nothing half-written goes live;
  the owner turns it on when ready.

**Dashboard (`/`).**

- Title "Dashboard", description "Everything on chestlyace.online, in one place."
- A grid of one tile per resource (§13.14's tile look, `surface`, radius `lg`,
  padding 20px, three columns from `lg`, two from `sm`, one on phones): the
  resource name, the number of entries as `title`-step text, "x published · y
  drafts" in `sm` `muted`, and "Last edited <relative time>"; the whole tile links
  to the list. Hover as §13.14.
- Under the grid, a "Site" group with: "View chestlyace.online ↗", and a notice
  (`surface-raised`, `sm`) for anything the build needs that is missing — "Email
  sending isn't set up (RESEND_API_KEY)", "Uploads aren't set up (Cloudinary)" —
  shown only when true.
- No charts and no analytics (Q17 belongs to Phase 8).

**Resources.** For each: what a list row shows, then the editor's fields in
order. "Req." means required. All text is trimmed. URLs follow §13.21.
Every editor starts with the **Published** switch (Profile and Socials have none).

**Profile** (`/profile`, the single row; `content-schema.md` §1.1). No list, no
"New", no delete. Title "Profile".

| Group | Field | Control | Req. | Notes |
|---|---|---|---|---|
| Identity | Name | Text | ✓ | The name shown in the header and hero, max 80 |
| | Legal name | Text | | For search results; max 80 |
| | Display name | Text | | The logo's wordmark; max 40 |
| Hero | Headline | Text | ✓ | Two words split at the first space, e.g. "Software Engineer"; max 60 |
| | Rotating words | Tag list | | The outlined line ("Backend", "Full-Stack"); the site adds the "& "; empty hides the line; max 8 words |
| | Tagline | Text | | The status pill's text; max 60 |
| | Availability | Select | | Open / Limited / Closed; only "Open" shows the pill |
| | Hero image | Upload (image) | | `portfolio/profile` |
| About | Quote | Text | | The scroll-lit statement; max 200 |
| | Body | Long text | | Blank line between paragraphs; max 2000 |
| | Résumé | Upload (PDF) | | `portfolio/profile` |
| Contact | Email | Text | ✓ | Valid address |
| | Phone | Text | | As shown, e.g. +237 676 940 247 |
| | WhatsApp number | Text | | Digits only; helper shows the resulting link |
| | Location | Text | | e.g. Yaoundé, Cameroon |

**Skills** (`/skills`). Row: name; "<Category> · <icon name or 'no icon'>".

| Field | Control | Req. | Notes |
|---|---|---|---|
| Name | Text | ✓ | max 60 |
| Category | Select | ✓ | Language / Framework / Database / Cloud / Tool (the DB's `language`, `framework`, `database`, `cloud`, `tool`) |
| Icon name | Text | | A Devicon name, e.g. `react`; helper links to devicon.dev; unknown names show a warning |
| Icon image | Upload or URL | | Used when there is no Devicon name |

**Services** (`/services`). Row: title; "<n> items · icon <name>".

| Field | Control | Req. | Notes |
|---|---|---|---|
| Title | Text | ✓ | max 80 |
| Description | Long text | ✓ | max 400 |
| Icon | Select | ✓ | The Iconly names the site knows (the list lives in code; the select shows each icon beside its name) |
| Items | Tag list | | The bullet list on the card; max 8 |

**Projects** (`/projects`). Row: title; "<Category> · <n> tech · Featured / —". Featured
projects are listed first on the site whatever the order here; the list shows a
"Featured" Tag and a helper line says so.

| Group | Field | Control | Req. | Notes |
|---|---|---|---|---|
| Basics | Title | Text | ✓ | max 80 |
| | Slug | Slug | ✓ | Unique |
| | Category label | Text | | e.g. Full Stack; max 30 |
| | Featured | Switch | | Full-width row on the homepage |
| | Summary | Long text | ✓ | The card and page summary; max 300 |
| | Image | Upload (image) | | `portfolio/projects`; the card and the page's hero |
| | Tech stack | Tag list | | Chips on the project page; max 12 |
| Links | Live link | URL | | |
| | Live link is private | Switch | | Shows a "Private" tag instead of a button |
| | Source link | URL | | |
| | Source link is private | Switch | | Same |
| Case study | Description | Long text | | Shown when Problem, Approach and Outcome are all empty; max 3000 |
| | Problem | Long text | | max 2000; empty hides the section |
| | Approach | Long text | | Same |
| | Outcome | Long text | | Same |
| | Gallery | Image list | | `portfolio/projects`; shown under the sections |

**Experience** (`/experience`; the `journey` table). The list has tabs — **All**,
**Work**, **Education** — and rows read: role; "<Organization> · <dates> ·
Education" (the last word only for education). Order is shared across tabs (it is
the order on the public wheel).

| Field | Control | Req. | Notes |
|---|---|---|---|
| Type | Select | ✓ | Work / Education; first field |
| Role or degree | Text | ✓ | max 100 |
| Organization | Text | ✓ | max 100 |
| Location | Text | | |
| Start date | Date | | |
| End date | Date | | Blank = ongoing |
| Dates text | Text | | Shown instead of the dates when filled, e.g. "Dec 2025 - Present"; helper shows what the dates alone would read |
| Description | Long text | | max 600 |
| Logo | Upload (image) | | `portfolio/journey`; the first letter shows when empty |
| Link | URL | | The organization's site |

**Volunteering** (`/volunteering`). Same row and fields as Experience, without Type.
The public section stays hidden while no entry is published; the list says so in a
`surface-raised` notice when that is the case.

**Certifications** (`/certifications`). Row: name; "<Issuer> · <issued date or 'no date'>".

| Field | Control | Req. | Notes |
|---|---|---|---|
| Name | Text | ✓ | max 120 |
| Issuer | Text | ✓ | max 80 |
| Issued on | Date | | |
| Badge | Upload (image) | | Square; `portfolio/profile` |
| Credential link | URL | | The tile links to it when set |

**Socials** (`/socials`). Row: platform; the address.

| Field | Control | Req. | Notes |
|---|---|---|---|
| Platform | Text | ✓ | e.g. GitHub; max 40 |
| Address | URL | ✓ | |
| Icon | Select | ✓ | Instagram / LinkedIn / GitHub / TikTok / WhatsApp / Link, each shown with its icon |
| Show on | Checkbox group | ✓ | Main / Creatives / Blog |

Socials have no Published switch (the table has no such column; `Show on` does that
job), so their rows show no status or switch, and their editor starts with the
fields above.

**FAQ** (`/faq`). Row: the question; the first line of the answer.

| Field | Control | Req. | Notes |
|---|---|---|---|
| Question | Text | ✓ | max 200 |
| Answer | Long text | ✓ | max 1500; plain text |

**Motion.** Only what the components specify; page changes are instant. Reduced
motion as each component says.

**Light and dark.** Both themes, from the tokens; nothing differs beyond them.

**Responsive.** Editors are one column at every width; lists keep their rows (§13.19);
the dashboard grid steps 3 → 2 → 1 columns. The save bar and toasts stay within
the content area on phones, the toast sitting above the bar.

**Accessibility.** One `<h1>` per screen (the title); focus moves to the `<h1>`
after a page change; every control is reachable by keyboard; destructive actions
always confirm; nothing depends on hover.

### 14.12 Coming-soon page (creatives and blog)

**Purpose.** What `creatives.chestlyace.online` and `blog.chestlyace.online` show
from launch until Phases 9–10 build them. Both hosts are indexed from launch
(D81), so the page is a real, short page rather than an empty stub: it says what
will live there and points to the main site. Routes: `/` on both hosts, and
`/services` on creatives (the address the old `graphic-design.html` and
`photography.html` redirect to, `ia-content.md` §6), which shows the same page
until Phase 10. Any other path is the site's 404.

**References.** None supplied. Built from existing components and tokens only, so
nothing new is introduced: the section heading's look (§14.0), the Button (§13.1)
and the shared header and footer (§13.6, §13.8). **Owner: send a reference if you
want it to look different.**

**Content** (placeholder wording for the owner to approve in this PR; it lives in
`content/copy.ts` with the other placeholders):

| | Creatives | Blog |
|---|---|---|
| Label (mono) | "COMING SOON" | "COMING SOON" |
| Title | "Design & Photography" | "Blog" |
| Lead | "Graphic design, branding, and photography by Chestly Ace (Amahndong Chestly). A new home for the work is on its way." | "Writing on software engineering, web development, and building things. The first posts are on their way." |
| Button | "Visit chestlyace.online" → the main site | same |

Both name forms stay in the creatives lead (`ia-content.md` §4). The page's
`<title>` and description are the site's existing ones (`ia-content.md` §4,
`lib/seo.ts`); the page is `index, follow` once `SITE_INDEXING` includes the site.

**Layout.** On `background`, between the shared header and footer. A wide
container (§5); content left-aligned, vertically centred in the space between the
header and footer (`min-height` of the viewport minus the footer's height, never
less than 480px), 112px below the top of the viewport at the least (clears the
capsule).

1. Mono `label` "COMING SOON", `muted`.
2. The title in Bebas at `display-xl`, uppercase, `foreground`, 24px below the
   label; max 14ch per line.
3. The lead in `lead`, `muted`, max 52ch, 24px below the title.
4. One `primary` Button, size `lg`, trailing `arrow-up-right`, 40px below the
   lead, opening the main site in the same tab.

Phones: the same stack; the Button goes full width below `sm`. The title scales
with `display-xl` (4 → 8rem).

**Components used.** Button (§13.1), the heading look of §14.0 (label + Bebas
title + lead, not the section-index numbering), Container (§5), header and footer
(§13.6, §13.8).

**Motion.** The title's letters rise as in the section heading (§14.0), once on
load; the label, lead and button fade up 16px, 100ms later, 650ms `power3.out`,
80ms stagger. Reduced motion: shown in final state.

**Light and dark.** Tokens only; nothing differs between themes.

**Accessibility.** One `<h1>` (the title). The Button's accessible name is its
text. The page has the skip link and landmarks of every page (§13.9).

**Approved in:** the Phase 8.4a PR (issue #57).

### 14.13 Blog home

**Purpose.** The blog's front page (`/` on `blog.chestlyace.online`): every
published post, newest first.

**References.** Owner (2026-10-07): [linear.app/blog](https://linear.app/blog)'s
minimalism (§13.27), with our type, tokens and motion.

**Content.** Published posts from the database (`blog_posts`, `content-schema.md`
§4), newest first by `published_at`. The heading's intro is the blog's description
(`ia-content.md` §4). **With no published post the page is the coming-soon page
(§14.12).**

**Layout** (one `background` section, so the page alternates correctly with the
footer's `background-alt`, §14.0):

1. **Heading** (§14.0, the page's `<h1>`): mono label "BLOG", the title "Blog" in
   Bebas `display-xl`, the intro ("Writing on software engineering, web
   development, and building things."). 112px below the top of the viewport.
2. **Post list:** an `<ol>` of Post items (§13.27), 80px below the heading (56px
   on phones): the latest post in the wide container, the rest in the narrow one.
3. **Newsletter box** (§13.34), 128px below the last item (96px on phones).

**Motion.** The heading's reveal, the items' entrance (§13.27), the newsletter
box's entrance.

**Pagination and search.** None at launch: all posts on one page. When there are
more than 30 posts, pagination is designed then.

**Accessibility.** One `<h1>`; the list is an ordered list of links; the page's
`<title>` and description are the site's (`ia-content.md` §4).

**Approved in:** the Phase 9a PR (issue #61).

### 14.14 Post page

**Purpose.** One post (`/[slug]`). An unknown slug, or a draft, shows the blog's
404.

**References.** Owner's choice (2026-10-07): **prose with a sticky contents rail**;
the rich blocks of §13.38–13.47 sit inside the prose.

**Content.** The post's row (title, description, cover, tags, dates, counts) and its
custom markdown (`docs/blog-markdown.md`), rendered on the server.

**Layout** (one `background` section; wide container, 12 columns on `lg+`):

1. **Post header** (§13.28), columns 1–10.
2. **Cover** (when the post has one): columns 1–12, aspect `16 / 9`, radius `xl`,
   `surface` fill, 48px below the header. Its `alt` is `cover_alt` (empty if none,
   so it is decorative).
3. **Contents disclosure** (§13.32, below `lg` only, when the post has 3 or more
   headings), 32px below the cover or header.
4. **Body and rail** (48px below): the **prose** (§13.29) with its rich blocks in
   columns 1–8, at most 68ch (interactive blocks may use the full column; images
   marked `#wide` and the flow canvas and agent session may reach columns 1–10), and
   on `lg+` the **table of contents** (§13.32) as a sticky rail in columns 10–12.
5. **Reaction bar** (§13.35), 32px below the prose.
6. **Post navigation** (§13.33), 96px below (64px on phones), full width.
7. **Newsletter box** (§13.34), 96px below.
8. **Comments** (§13.37), 96px below (64px on phones), unless the post turns them
   off.

**Motion.** The header's title reveal, the default entrance for the cover and the
newsletter box (§14.0), each rich block's own entrance, the contents rail's moving
rule. Prose does not animate.

**Responsive.** Below `lg` everything is one column in the order above; the cover
keeps its `16 / 9` ratio (radius `lg` below `sm`).

**Accessibility.** One `<h1>`; the body is an `<article>`; headings keep their
order; the skip link goes to `#main`. Each post sets its own `<title>`,
description, canonical (the post's `canonical_url` when cross-posted) and Open
Graph image (the cover, else the site's), and `BlogPosting` structured data
(Phase 9b, SEO).

**Approved in:** the Phase 9a PR (issue #61).

### 14.15 Tags

**Purpose.** Browse posts by topic: an index of all tags (`/tags`) and one page
per tag (`/tags/[tag]`).

**Tags index.** The section heading (§14.0): label "TAGS", title "Tags", intro
"Browse posts by topic." Below it, every tag as a **linked Tag** (§13.4) enlarged
to 32px tall with its count after the name ("NEXTJS · 4"), sorted by count
(highest first), then alphabetically; wrapping with a 12px gap. Tags with no
published post do not appear.

**Tag page.** The section heading: label "TAG", the title is the tag in Bebas
(`display-xl`, uppercase), the intro is the count ("4 posts" / "1 post"). Below, the
Post items (§13.27) for that tag in the same arrangement as the home, then a
standalone text link "All tags →" (§13.3) 64px below the list. An unknown tag, or
one with no published post, shows the blog's 404.

Both pages are one `background` section with the newsletter box (§13.34) 128px
below the content, like the home (§14.13). Each has one `<h1>`.

**SEO.** Tag pages and the tags index are indexable with their own title ("Posts
tagged nextjs — Chestly Ace") and canonical.

**Approved in:** the Phase 9a PR (issue #61).

### 14.16 Newsletter confirmation

**Purpose.** Where the link in the confirmation email lands
(`/newsletter/confirm?token=…`); it confirms the address on the server and shows
the result.

**Layout and look.** Exactly the coming-soon page (§14.12): label, Bebas title,
lead, one `primary` Button back to the blog home. Not indexed (`noindex`).

**Copy** (placeholder wording for the owner to approve; edited in the admin, Blog →
Newsletter, §14.19; `content/copy.ts` holds the starting wording):

| | Confirmed | Link didn't work |
|---|---|---|
| Label | "SUBSCRIBED" | "LINK EXPIRED" |
| Title | "You're on the list" | "That link didn't work" |
| Lead | "Thanks for confirming. You'll get an email when there's a new post." | "It may have expired or already been used. You can subscribe again from the bottom of any post." |
| Button | "Read the blog" | "Go to the blog" |

**Accessibility.** As §14.12; the status is the page's `<h1>`.

**Approved in:** the Phase 9a PR (issue #61).

### 14.17 Blog header and footer additions

**Header key links** (§13.6): **Posts** (`/`) and **Tags** (`/tags`), as text rolls
(§13.3). The active dot follows the route: Posts on `/` and on post pages, Tags on
`/tags` and tag pages. The phone menu lists the same two as Bebas rows above the
Sites rows. The Sites chip and theme toggle stay. (The reader's sign-in is **not**
in the header: it appears only where it is needed, in the comments, §13.36.)

**Footer** (§13.8): the blog's Connect column gets an **RSS** link (Lucide `rss`
16px, text roll) to `/rss.xml`, after the socials shown on the blog
(`socials.show_on`), and the Contact column a **Privacy** link to §14.18. The page
`<head>` also carries the feed's `alternate` link.

**Accent.** The blog keeps the main blue (§4, Q12): no override.

**Approved in:** the Phase 9a PR (issue #61).

### 14.18 Privacy notice

**Purpose.** Readers' accounts, comments and likes store personal data, so the blog
has a short privacy page (`/privacy`; `ia-content.md` §3 said real pages are added
once something stores data). Not indexed.

**Layout.** The narrow container; the heading (§14.0: label "PRIVACY", title
"Privacy"); the text in prose (§13.29) with a "Last updated" date in a mono
`label`. Wording is drafted by the agent in Phase 9b.5 **for the owner's approval**;
it covers: what is stored (the name, email address and picture the reader's GitHub
or Google account shares; their comments; a likes cookie held as a hash;
newsletter addresses), why, who sees it (the name, picture and comments are
public; the email never is), how long, how to delete the account and its data, and
how to ask a question.

**Accessibility.** One `<h1>`; headings in order.

**Approved in:** the Phase 9a PR (issue #61).

### 14.19 Blog admin pages

**Purpose.** The owner's side of the blog, in the admin (`admin.chestlyace.online`,
§14.11): a **Blog** group in the sidebar (§13.18) with **Posts**, **Comments** and
**Newsletter**.

**Screens.**

| Screen | Content |
|---|---|
| Posts (`/blog`) | A resource list (§13.19): title, status ("Draft", "Published"), published date, likes and comments counts; a "New post" button and an "Import from DEV" button (§13.49); a publish switch per row; filter tabs All · Published · Drafts; delete with confirm |
| New and edit post (`/blog/new`, `/blog/[id]`) | The block editor (§13.48) |
| Comments (`/blog/comments`) | The moderation list (§13.50) |
| Newsletter (`/blog/newsletter`) | One form like the profile's (§14.11, §13.21), no list: a **Show the signup box** switch, then the wording of the signup box (§13.34), of the two confirmation pages (§14.16) and of the confirmation email, each field showing the wording in use. Added in 9b.7 at the owner's request (2026-10-08: everything editable from the admin) |

**Build notes** (not visual). Publishing, unpublishing, editing and hiding a
comment all revalidate the blog's cached pages (the `blog` cache tag, as the main
site's admin does with `portfolio`, D74).

**Approved in:** the Phase 9a PR (issue #61).

**Creatives pages (Phase 10a).**

`creatives.chestlyace.online` has **two sections, Graphic design and Photography**
(owner, 2026-10-08; Videography follows as its own step), a home page that shows
them off, a Services page, and a contact block under every page (§13.60). Specs
follow the checklist of §12; components are linked, not repeated. **Approved in:**
the Phase 10a PR (issue #87).

**Creatives (Phase 10a):** [Creatives home](#1420-creatives-home) ·
[Graphic design](#1421-graphic-design) · [Photography](#1422-photography) ·
[Event page](#1423-event-page) · [Services](#1424-creatives-services) ·
[Header and footer additions](#1425-creatives-header-and-footer-additions) ·
[Creatives admin pages](#1426-creatives-admin-pages)

### 14.20 Creatives home

**Purpose.** The first impression of the creative work: what Chestly makes, the
best of it, and the doors into the two sections. Route `/`.

**References.** anubi.io (big statements, image-forward, scroll motion, the visual
animation); the main site's hero (§14.1) for the way type is revealed.

**Content.**

| Element | Source | Copy |
|---|---|---|
| Hero statement | settings (§14.26) | "DESIGN & PHOTOGRAPHY" (placeholder, editable) |
| Hero line | settings | "Brand visuals and event stories by Chestly Ace (Amahndong Chestly)." |
| Featured work | pieces and events marked **featured** | up to 8 images, mixed (six in the doodle frames) |
| Portals | static | Graphic design, Photography (each with its latest featured image) |
| Selected work | featured pieces and events | up to 8 |
| Services teaser | `creative_services` | the three or four service titles, a link to `/services` |
| Contact | §13.60 | |

**Layout** (top to bottom, wide container; bands alternate `background` and
`background-alt` counting up from the footer as §14.0):

1. **Hero** (`background`, one viewport tall, `min-height: 100svh`). The statement
   in Bebas at `display-2xl`, centred, two lines ("DESIGN" and "& PHOTOGRAPHY"), the
   hero line in `lead`, `muted`, 24px below, and two Buttons: **See the work**
   (`primary`, scrolls to the portals) and **Get in touch** (`secondary`, to the
   contact block). Behind them the full-screen **Doodle scene** (§13.57): hand-drawn
   doodles that draw themselves on load and react to the pointer, with six featured
   pieces in hand-drawn frames. The text sits above the scene and is always legible
   (the scene keeps clear of the statement's box).
2. **Marquee** (§13.58), 48px below the hero's bottom padding.
3. **Portals** (`background-alt`): two Section portals (§13.59) side by side from
   `md`, stacked on phones, 16px gap, under a section heading (§14.0, label "01 —
   WORK", title "TWO WAYS I WORK" placeholder).
4. **Selected work** (`background`): the section heading ("02 — SELECTED"), then a
   **pinned horizontal strip**: while the section is pinned the featured pieces slide
   left as you scroll (GSAP ScrollTrigger `scrub`, `pin`), each a Gallery tile
   (§13.52) at a fixed 360px height; a mono counter ("03 / 08") and a thin accent
   progress bar sit under the strip. Clicking a tile opens the Lightbox (§13.55).
   Phones and tablets: no pin: a native horizontal scroll-snap row.
5. **Services teaser** (`background-alt`): the section heading ("03 — SERVICES"),
   the services as a two-column list of Bebas rows ("BRANDING SUPPORT", "EVENT
   COVERAGE"…), each a link to its place on `/services`, with a text roll (§13.3).
6. **Contact block** (§13.60), then the footer (§13.8).

**Motion.** The hero's statement letters rise (900ms `expo.out`, 30ms stagger, as
§14.0); the doodles draw on from 400ms later (§13.57); the portals, tiles and
headings use the shared entrances. All of it is compositor-only. The doodle scene,
marquee and pinned strip are **lazy**: nothing waits on them, the hero text and the
portals are in the HTML from the first paint.

**Reduced motion, touch and `Save-Data`.** The doodles drawn at once with no idle or
pointer field, no pin, a static marquee, the strip a plain scroll row.

**Light and dark.** The Bebas statement is `foreground`; the doodle strokes follow `foreground` and the tiles are
the same in both themes; the bands follow §14.0; the accent is the creatives orange
(§4).

**SEO.** Title "Chestly Ace — Design & Photography"; one `<h1>` (the statement);
`Person` and `WebSite` JSON-LD with each featured piece as a `CreativeWork`.

### 14.21 Graphic design

**Purpose.** The gallery of design work. Route `/design`.

**References.** anubi.io/lab (the rigid masonry and its details).

**Layout** (`background`, 112px below the viewport top as §14.0):

1. **Heading** (§14.0): label "GRAPHIC DESIGN", title "DESIGN" in Bebas at
   `display-xl`, an intro in `lead` (editable, §14.26), and the piece count.
2. **Filter bar** (§13.53), 48px below.
3. **Masonry grid** (§13.51) of Gallery tiles (§13.52), 32px below the bar.
4. **Contact block** (§13.60).

**Opening a piece.** Hovering a tile shows its details (§13.52); a click opens the
Lightbox (§13.55) with the piece's images (a **thumbnail rail** when there are
several) and the Details and credits panel (§13.56), and the journey ends there:
there is no separate page per piece (owner, 2026-10-08). `/design?piece=slug` opens
the gallery with that piece's lightbox open, so a piece can be shared. Pieces are
ordered by the order set in the admin (newest first by default).

**Empty.** With no published piece the page shows the coming-soon look (§14.12) with
the section's name.

**Motion.** The grid's entrance, Flip filtering (§13.51), the Lightbox's Flip; the
heading carries a Doodle accent (§13.57).

**SEO.** Title "Graphic design — Chestly Ace"; the page carries every piece as an
`ImageObject`/`CreativeWork` in its JSON-LD with its title, description and image, and
`?piece=` addresses are canonicalised to `/design`.

### 14.22 Photography

**Purpose.** The photography work, organised by event. Route `/photography`.

**References.** anubi.io/work (event tiles with the blurred, detailed hover).

**Layout** (`background`): the heading (§14.0: label "PHOTOGRAPHY", title
"PHOTOGRAPHY", the intro, the event count); then the **Event tiles** (§13.54) in
the order set in the admin (newest first by default), the featured event first
and across both columns, 24px gutters, 64px between rows; then a line "More coming
soon" only when there is a single event; then the contact block.

Events with a **kind** (conference, community, portrait…) show it as a mono tag on
the tile; there is no filter bar until there are more than twelve events (then the
Filter bar, §13.53, by kind).

**Motion.** Tiles rise 32px and fade in (the default entrance, 80ms stagger); the
hover and open transitions are §13.54; the heading carries a Doodle accent (§13.57).

**SEO.** Title "Photography — Chestly Ace"; each event indexable; `ImageGallery`
JSON-LD per event.

### 14.23 Event page

**Purpose.** One event: its story, a selection of pictures, who made it, and a way
to see everything. Route `/photography/[slug]`.

**References.** anubi.io/work/[project]: a cover, an information sidebar, more
images, credits.

**Layout** (wide container):

1. **Hero** (full width, `70svh` max): the cover image, with the event's title in
   Bebas at `display-xl` (`#F5F5F7` on the §13.52 gradient, bottom-left), the year
   top-right. The cover is the shared element from the tile (§13.54).
2. **Body**, 12 columns from `lg`: **columns 1–4: the sidebar**, sticky 112px below
   the top, with the Details and credits block (§13.56: Event, Date, Place, Role,
   What was covered) and the **"View the full album ↗" button** (`primary`, `md`;
   the address and the service's name, "Google Photos", "Google Drive" or
   "Behance", come from the event in the admin; absent, no button). **Columns
   5–12: the story and the pictures:** the description in `lead` (max 60ch), then
   the **selected pictures** in a masonry (§13.51) of Gallery tiles (§13.52) without
   titles; a click opens the Lightbox (§13.55) through the event's pictures with
   the picture's caption, if any. Below `lg` the sidebar comes first as a block under
   the hero, then the story and pictures.
3. **Credits** (below the pictures, `background-alt` band): the mono label
   "CREDITS", then the credits as "Role — Name" rows in two columns (§13.56); the
   last row is the photographer's. The full-album button repeats here.
4. **Next event** (`background`): a large Event tile (§13.54) for the next event,
   under a label "NEXT EVENT", then the contact block.

**Motion.** The hero's title letters rise; the sidebar and pictures use the shared
entrances; the pictures' masonry as §13.51; the Lightbox's Flip. Reduced motion:
final states and cross-fades.

**Accessibility.** One `<h1>` (the title); the pictures' alt text is edited per
picture in the admin; the sidebar is an `<aside>` named "About the event".

**SEO.** Title "Event title — Photography — Chestly Ace", the cover as the Open
Graph image, `ImageGallery` JSON-LD.

### 14.24 Creatives services

**Purpose.** What Chestly offers in design and photography, and how to ask. Route
`/services`; the old `graphic-design.html` and `photography.html` redirect here
(`ia-content.md` §6).

**Content.** From `creative_services` (§14.26), in two groups under the headings
"GRAPHIC DESIGN" and "PHOTOGRAPHY" (placeholder wording carried from the old pages,
`content-schema.md` §6): each service has a title, a description, an icon and a
list of what is offered. The page also carries the old pages' **FAQ**
(design and photography questions), as `<details>` rows (§14.9's look).

**Layout** (`background`): heading (§14.0, label "SERVICES"); each group as a
section: the group name in Bebas at `display-lg`, then the services as a
three-column grid of service cards (the Services section's cards, §14.4, in the
creatives accent), then a primary Button "Request design work" / "Book a session"
(the WhatsApp link, §13.60); then the FAQ; then the contact block.

**Motion.** The shared entrances.

**SEO.** Title "Design & photography services — Chestly Ace"; `Service` JSON-LD per
service; `FAQPage` JSON-LD. The page keeps the old pages' search intent (graphic
designer portfolio, event photographer…) in its text, written naturally.

### 14.25 Creatives header and footer additions

**Header key links** (§13.6): **Work** (`/`), **Design** (`/design`), **Photography**
(`/photography`) and **Services** (`/services`), as text rolls (§13.3); the active
dot follows the route (Work on the home only). Videography is added with its own
step. The phone menu lists the same as Bebas rows above the Sites rows. The Sites
chip and theme toggle stay.

**Footer** (§13.8): the Connect column shows the socials with `creatives` in their
`show_on` (Instagram, TikTok); the Contact column the email and WhatsApp; the
site's one-line description (D26) is the creatives one.

**Accent.** The creatives orange (§4): the `primary` Buttons, active dot, focus ring
and accent text of these pages.

### 14.26 Creatives admin pages

**Purpose.** Everything on the creatives site is edited in the same admin
(`admin.chestlyace.online`, D86), in a **Creatives** group of the sidebar (§13.18)
beside Content and Blog. Same patterns as the other screens: resource lists
(§13.19), the editor form (§13.21, §14.11), the image fields (§13.22), the save bar
(§13.25).

| Screen | Content |
|---|---|
| Design (`/creatives/design`) | A resource list of design pieces: cover thumbnail, title, category, year, featured star, published switch, drag to reorder; "New piece". The editor: title, address (slug, from the title), category (a text field suggesting the existing ones), cover image, **more images** (uploaded, reordered, each with alt text), description, client, role, tools (tags), year, a link, featured, published |
| Photography (`/creatives/photography`) | A list of events: cover thumbnail, title, date, place, number of pictures, featured, published, drag to reorder; "New event". The editor: title, address, date, place, kind, cover, description, role, what was covered (tags), **pictures** (uploaded in bulk, drag to reorder, each with alt text and an optional caption), **credits** (rows of role and name with an optional link, reorderable), the **full-album address** and its service's name (Google Photos, Google Drive, Behance or a custom label), featured, published |
| Services (`/creatives/services`) | A list: title, group (Graphic design or Photography), published, drag to reorder. The editor: title, group, description, icon (the picker of §14.4), what is offered (a list), published. A second tab "FAQ" edits the creatives questions and answers |
| Creatives settings (`/creatives/settings`) | One form like the profile's: the hero statement, hero line, the two sections' intros, the portals' text, the marquee words, the contact block's statement, text and response-time note, the SEO description |

**Rules.** Images upload through the existing signed Cloudinary upload (a
`creatives` folder: `portfolio/creatives`, up to 2400px on the long side, WebP/AVIF
by the delivery URL), and the editor records each image's **width and height**
so the site can reserve its space. Every image needs alt text before the piece or
event can be published (the editor's check, as for blog images). Publishing,
editing, reordering and deleting revalidate the creatives site's cached pages (the
`creatives` cache tag, as D74 for the others). The wording of every fixed text on
the site is in these screens or in `content/copy.ts` as a default (`D86`: the owner
edits everything from the admin).

**Approved in:** the Phase 10a PR (issue #87).

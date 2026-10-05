# chestlyace.online — Planning Docs

These documents are the source of truth for building the new chestlyace.online.
Read them before writing code. When code and docs disagree, either the code is
wrong or the doc needs updating in the same change.

The old site (`chestlyace/portfolio-webpage`) is **reference only**: plain
HTML/Tailwind CDN + vanilla JS, an Express API, PostgreSQL on an EC2 box,
Cloudinary uploads, and a password-gated admin panel. Nothing from it is reused
as code; its content and data are migrated.

## Documents

| File | What it covers |
|---|---|
| [`architecture.md`](./architecture.md) | One Next.js app serving three subdomains, routing by host, folder layout, hosting on Vercel, environments, migration off EC2 |
| [`content-schema.md`](./content-schema.md) | Postgres schema for the main site, admin API, uploads, MDX frontmatter for the blog, draft content model for the creatives site, old → new data mapping |
| [`design.md`](./design.md) | Visual direction, design tokens (light + dark), typography, component inventory, theming across subdomains |
| [`ia-content.md`](./ia-content.md) | Sitemap per subdomain, section-by-section page breakdown, navigation, SEO, redirects from old URLs, copy that has to change |
| [`open-questions.md`](./open-questions.md) | Everything deliberately left undecided, with options and a recommendation where there is one |
| [`phases.md`](./phases.md) | Development phases in order, what each delivers, and which open questions block it |

Agents: read [`../instructions.md`](../instructions.md) before any work.

## Decisions log

Settled during the planning session. Change one only by updating this table and
every doc that depends on it.

| # | Decision | Notes |
|---|---|---|
| D1 | **Monorepo, single Next.js app, multi-tenant routing by host** | `chestlyace.online`, `creatives.chestlyace.online`, `blog.chestlyace.online` all served by one app |
| D2 | **Hosted on Vercel**; EC2 + nginx retired | Postgres moves to a managed provider (Neon) |
| D3 | **Main site stays database-driven** | Same Postgres approach as before, rebuilt with Next.js Route Handlers and a rebuilt admin panel |
| D4 | **Main site sells Chestly as a software engineer only** | No design or photography work on it |
| D5 | **Design + photography move to `creatives.chestlyace.online`** | Own content source, separate from the main database |
| D6 | **Creatives site uses a headless CMS** | Which one is open (see `open-questions.md` Q1) |
| D7 | **Blog lives at `blog.chestlyace.online`, posts are MDX files in the repo** | Publishing = committing |
| D8 | **`works` narrows to software projects only** | Design and event rows leave the main database |
| D9 | **Services: condensed, software only, with one link out to the creatives site** | The old `software-development.html` page folds into the homepage — no separate services page |
| D10 | **Volunteering is a new top-level section on the main site** | Same fields as a Journey entry, rendered in its own section |
| D11 | **Shared header/footer across all three subdomains** | Each links to the other two |
| D12 | **Existing copy and data carry over; the redesign is visual** | Copy that mentions design/photography still needs editing — see `ia-content.md` |
| D13 | **Visual direction stays close to the current site** | Dark/light toggle kept, rounded cards, Tailwind — a polish and consistency pass |

## Status

Planning phase. No application code yet.

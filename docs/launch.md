# Launch runbook

How to take `chestlyace.online` and `admin.chestlyace.online` live on Vercel, and
retire the old EC2 site (Phase 8; decisions Q17, Q20, D76–D79). The owner does
these steps; nothing here changes code. Tick each box as you go.

**Order of events.** Prepare everything on a Vercel preview first. Only the last
section (DNS) changes what visitors see, and it is reversible until the old
server is shut down.

## 0. What goes live, and when

| Host | At launch | Indexed |
|---|---|---|
| `chestlyace.online` | Live on Vercel | Yes (`SITE_INDEXING=main`) |
| `www.chestlyace.online` | Redirects to the apex | — |
| `admin.chestlyace.online` | Live on Vercel | Never |
| `creatives.chestlyace.online`, `blog.chestlyace.online` | See §6 | No, until Phases 9–10 |

## 1. Accounts to set up first

- [ ] **Vercel**: one project connected to this repo, production branch `main`.
- [ ] **Prisma Postgres** through the Vercel integration, two databases
      (`architecture.md` §8, D31): one for **Production**, one for **Preview** and
      **Development**. Previews never touch production data.
- [ ] **Cloudinary** (a free account works to start): note the cloud name, API key and API
      secret from the dashboard. Uploads are signed by the app; no upload preset
      is needed.
- [ ] **Resend**: add and verify `chestlyace.online` (DNS records Resend shows
      you), then create an API key. Until the domain is verified Resend only
      delivers to your own account address.
- [ ] **Vercel Web Analytics**: project → Analytics tab → Enable (D79).

## 2. Environment variables (Vercel → Settings → Environment Variables)

Set each for **Production**. For **Preview**, set the same keys with the preview
database and any values you want to test with (`SITE_INDEXING` stays unset there).

| Variable | Value | Notes |
|---|---|---|
| `DATABASE_URL` | Prisma connection string | Set by the integration, per environment |
| `DIRECT_URL` | Prisma direct (unpooled) string | Only needed on your machine for migrations |
| `ADMIN_PASSWORD_HASH` | output of `pnpm admin:hash` | Vercel takes the `$` characters as they are |
| `SESSION_SECRET` | 32+ random characters | `openssl rand -base64 48`. Changing it signs you out |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | from Cloudinary | The admin dashboard warns while any is missing |
| `RESEND_API_KEY` | from Resend | The dashboard warns while it is missing |
| `CONTACT_FROM_EMAIL` | e.g. `Chestly Ace <hello@chestlyace.online>` | Must be on the verified Resend domain |
| `CONTACT_TO_EMAIL` | optional | Defaults to the profile's email |
| `SITE_INDEXING` | `main` | Production only. Turns indexing on for the main site (D76); a redeploy applies it |

Not needed yet: `NEXT_PUBLIC_*_URL` (the production defaults are right),
`REVALIDATE_SECRET` and `CMS_*` (creatives, later).

## 3. Database

- [ ] `DATABASE_URL=<production direct string> pnpm db:migrate`
- [ ] Load your data, following `docs/migration.md` (dump, dry run, `--write`).
      Rehearse on the **preview** database first.
- [ ] Open the admin on the preview and fix what the migration report named:
      upload the **résumé PDF**, any logos or images it listed, the About text
      (Q5). Then repeat on production (or do it once there after loading).

## 4. Preview checks (before touching DNS)

On the Vercel preview URL (`?site=main`, `?site=admin`, …):

- [ ] The homepage shows your real content; every section is right.
- [ ] A project page opens, with its image and links.
- [ ] The contact form sends an email to you (this needs the production
      Resend settings: check again after launch, §7).
- [ ] The admin signs in, an edit appears on the site, an image uploads.
- [ ] `/resume.pdf` opens your résumé.
- [ ] `/robots.txt` disallows everything on the preview (previews are never
      indexable), and the page source has `noindex`.

## 5. DNS and domains

1. Vercel → project → Settings → Domains: add `chestlyace.online`,
   `www.chestlyace.online` (set it to **redirect** to the apex) and
   `admin.chestlyace.online`. Vercel shows the exact records each needs; use
   those values, not ones from memory.
2. **Lower the TTL** of the existing DNS records to 300 seconds a day before, so
   a rollback is quick.
3. In your DNS provider, replace the records for the apex and `www` (which point
   at the EC2 host) and add the one for `admin`, as Vercel shows them.
4. Wait for Vercel to show the domains as valid and issue certificates.

**Rollback:** put the old records back; with a 300-second TTL the old site is
back within minutes. The old server must still be running (§8).

## 6. The creatives and blog hosts at launch

Old `graphic-design.html` and `photography.html` links redirect to
`creatives.chestlyace.online/services`, so that host must answer. The simplest
way: also add `creatives.chestlyace.online` and `blog.chestlyace.online` to the
Vercel project at the same time. They show their "rebuild in progress"
placeholders and stay closed to search engines (`SITE_INDEXING=main`). If you
would rather leave them out of DNS until Phases 9–10, those two old URLs will not
resolve in the meantime.

## 7. After the cutover

- [ ] `https://chestlyace.online` loads on Vercel; `https://www.chestlyace.online`
      redirects to it; `https://admin.chestlyace.online` shows the sign-in page.
- [ ] Each old address redirects (`ia-content.md` §6): `/software-development.html`,
      `/graphic-design.html`, `/photography.html`, `/admin/`, `/admin/index.html`.
- [ ] `/robots.txt` on the main host now says `Allow: /` and lists the sitemap;
      `/sitemap.xml` lists the homepage and each published project; the page
      source says `index, follow`.
- [ ] Send yourself a message through the contact form; it arrives.
- [ ] Vercel → Analytics shows your visit.
- [ ] Check the structured data of the homepage with Google's Rich Results test
      (Person, WebSite, FAQPage).
- [ ] In Google Search Console add `chestlyace.online`, submit
      `https://chestlyace.online/sitemap.xml`, and use "Inspect URL" on `/`.
- [ ] Raise the DNS TTLs back to normal.

## 8. Retiring the old EC2 site (Q20: 14 days)

- **Day 0 (cutover):** leave the EC2 instance running. Stop writing to the old
  database from the old admin; make the old site read-only if you can (or just do
  not edit through it).
- **During the 14 days:** watch for anything missing; the old database is still
  there to re-export from (`docs/migration.md`). Edit only in the new admin.
- **Day 14:**
  - [ ] Take a last `pg_dump` and a copy of the old site's files, and keep them
        somewhere safe.
  - [ ] Stop the Node process (and any process manager entry), then stop the
        instance.
  - [ ] After a few more days with nothing wrong, terminate the instance, release
        its Elastic IP and delete its snapshots/volumes you no longer need.
  - [ ] Remove any DNS records still pointing at the old host.

## 9. Later

- When Phases 9–10 ship the blog and creatives sites, set
  `SITE_INDEXING=main,creatives,blog` (or `on`) and redeploy.

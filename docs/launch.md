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
| `creatives.chestlyace.online`, `blog.chestlyace.online` | Live on Vercel with short "coming soon" pages (`design.md` §14.12) | Yes (D81) |

## 1. Accounts to set up first

- [ ] **Vercel**: one project connected to this repo, production branch `main`.
- [ ] **Prisma Postgres** through the Vercel integration, two databases
      (`architecture.md` §8, D31): one for **Production**, one for **Preview** and
      **Development**. Previews never touch production data.
- [ ] **Cloudinary** (a free account works to start): note the cloud name, API key and API
      secret from the dashboard. Uploads are signed by the app; no upload preset
      is needed.
- [ ] **Resend**: add and verify `chestlyace.online` (DNS records Resend shows
      you, see "Email" below), then create an API key. Until the domain is
      verified Resend only delivers to your own account address.
- [ ] **Vercel Web Analytics**: project → Analytics tab → Enable (D79).

### Email: hello@chestlyace.online

`hello@chestlyace.online` is a requirement (owner, 2026-10-07). It needs two
separate things, which use different DNS records and do not conflict:

- **Receiving and replying** (a mailbox): a free **Zoho Mail** account.
- **Sending the contact form** (the site's messages): **Resend**, from the same
  address.

DNS changes for email do not touch the website, so you can do all of this
**before** the cutover. In your DNS provider first check whether the domain
already has MX records; if it does, they would be replaced.

**A. Zoho Mail (the mailbox)**

- [ ] Sign up for Zoho Mail's **Forever Free** plan with your own domain
      (`chestlyace.online`). Free-plan limits when this was written: up to 5
      users, 5 GB each, one domain, web and phone app only (no IMAP/POP, so no
      Outlook/Thunderbird/Gmail pulling), 25 MB attachments. Check the current
      terms at sign-up; the paid Mail Lite plan adds IMAP/POP.
- [ ] Verify the domain: Zoho gives a TXT (or CNAME) record to add.
- [ ] Create the mailbox `hello`.
- [ ] Add the records Zoho shows for your region: the **MX** records (replace any
      existing ones), an **SPF** TXT on the root (`v=spf1 include:zoho.<region>
      ~all`), and the **DKIM** TXT (`zoho._domainkey`). Use the exact values Zoho
      displays; the host names depend on the data centre (`.com`, `.eu`, `.in`…).
- [ ] Send a message to `hello@chestlyace.online` from another address and reply
      to it from Zoho; check both arrive and are not in spam.

**B. Resend (the contact form)**

- [ ] In Resend → Domains → add `chestlyace.online` and add the records it shows
      (a DKIM TXT, and SPF/MX on a `send` subdomain by default, so it does not
      collide with Zoho's SPF on the root; a name can have only **one** SPF
      record, so if Resend ever asks for the root, put both `include:`s in the
      same record).
- [ ] Wait until Resend shows the domain as **Verified**, then create the API key
      and set `RESEND_API_KEY`, `CONTACT_FROM_EMAIL` (see §2).
- [ ] Optionally add a DMARC record once both work, e.g. a TXT on `_dmarc` with
      `v=DMARC1; p=none; rua=mailto:hello@chestlyace.online`.

**C. On the site**

- The contact form sends from `hello@chestlyace.online` to `CONTACT_TO_EMAIL`
  (default: the profile's email). Whether the **public** email on the site
  (profile, footer, JSON-LD) becomes `hello@chestlyace.online` instead of
  `chestlyace@gmail.com` is an open question (Q23).

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
| `CONTACT_FROM_EMAIL` | `Chestly Ace <hello@chestlyace.online>` | Must be on the verified Resend domain (see "Email" below) |
| `CONTACT_TO_EMAIL` | optional | Defaults to the profile's email; set it to `hello@chestlyace.online` once that mailbox works |
| `SITE_INDEXING` | `on` | Production only. Opens all three public sites to search engines (D76, D81); a redeploy applies it |

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
   `www.chestlyace.online` (set it to **redirect** to the apex),
   `admin.chestlyace.online`, and `creatives.chestlyace.online` and
   `blog.chestlyace.online` (§6). Vercel shows the exact records each needs; use
   those values, not ones from memory.
2. **Lower the TTL** of the existing DNS records to 300 seconds a day before, so
   a rollback is quick.
3. In your DNS provider, replace the records for the apex and `www` (which point
   at the EC2 host) and add the ones for `admin`, `creatives` and `blog`, as
   Vercel shows them. Leave the email records (MX, SPF, DKIM) as they are.
4. Wait for Vercel to show the domains as valid and issue certificates.

**Rollback:** put the old records back; with a 300-second TTL the old site is
back within minutes. The old server must still be running (§8).

## 6. The creatives and blog hosts at launch

Owner decision (2026-10-07, D81): both hosts go live at the same time as the main
site and are findable by search engines.

- [ ] Add `creatives.chestlyace.online` and `blog.chestlyace.online` to the
      Vercel project with the other domains (§5) and the DNS records Vercel shows.
- They show the short "coming soon" pages of `design.md` §14.12 until Phases 9–10
  replace them. `creatives.chestlyace.online/services` shows the same page, so the
  old `graphic-design.html` and `photography.html` links land on a real page.
- They are indexed (`SITE_INDEXING=on`), but a short placeholder gives a search
  engine little to rank; expect them to matter only once the real sites ship.
  Each host's sitemap lists just its homepage until then.

## 7. After the cutover

- [ ] `https://chestlyace.online` loads on Vercel; `https://www.chestlyace.online`
      redirects to it; `https://admin.chestlyace.online` shows the sign-in page.
- [ ] Each old address redirects (`ia-content.md` §6): `/software-development.html`,
      `/graphic-design.html`, `/photography.html`, `/admin/`, `/admin/index.html`.
- [ ] `/robots.txt` on the main host now says `Allow: /` and lists the sitemap;
      `/sitemap.xml` lists the homepage and each published project; the page
      source says `index, follow`.
- [ ] The same for `creatives.chestlyace.online` and `blog.chestlyace.online`
      (`robots.txt`, `sitemap.xml`, `index, follow`), and
      `creatives.chestlyace.online/services` shows the coming-soon page.
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

- When Phases 9–10 ship the blog and creatives sites, nothing in the indexing
  settings changes (`SITE_INDEXING=on` already covers them); in Search Console add
  each host and submit its `sitemap.xml`.

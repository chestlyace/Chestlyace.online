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
| `blog.chestlyace.online` | Live on Vercel with the blog (Phase 9). It shows the "coming soon" page until the first post is published | Yes (D81) |
| `creatives.chestlyace.online` | Live on Vercel with a short "coming soon" page (`design.md` §14.12) until Phase 10 | Yes (D81) |

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
- [ ] **For the blog** (Phase 9; the settings are in §2 and the steps in §2a):
      a **GitHub OAuth app** and a **Google OAuth client** (readers sign in with
      either to comment), a **DEV API key** (only if you publish to DEV from the
      admin) and, in Resend, a **segment** for the newsletter.

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
| `BETTER_AUTH_SECRET` | 32+ random characters | `openssl rand -base64 32`. Signs readers' sessions; changing it signs every reader out |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | from the GitHub OAuth app (§2a) | Without both, "Continue with GitHub" is not offered |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | from the Google OAuth client (§2a) | Without both, "Continue with Google" is not offered |
| `COMMENT_MAX_WORDS` | optional | The longest comment, in words. Defaults to 120 |
| `DEVTO_API_KEY` | optional | From DEV (Settings → Extensions). Only for "Publish to DEV" in the admin; importing your DEV articles needs no key |
| `RESEND_AUDIENCE_ID` | the id of the newsletter's Resend segment (§2a) | Resend now calls audiences "segments"; this is the segment's id. Without it the newsletter box can't subscribe anyone |
| `NEWSLETTER_SECRET` | 32+ random characters | `openssl rand -base64 32`. Signs the confirmation links in the newsletter email; changing it makes links already sent stop working |
| `SITE_INDEXING` | `on` | Production only. Opens all three public sites to search engines (D76, D81); a redeploy applies it |

The newsletter confirmation email and the "new comment" email to you are sent
with `RESEND_API_KEY` from `CONTACT_FROM_EMAIL`, like the contact form, so they
need the same verified Resend domain (new comments go to `CONTACT_TO_EMAIL`, or
the profile's email).

Not needed yet: `NEXT_PUBLIC_*_URL` (the production defaults are right),
`REVALIDATE_SECRET` and `CMS_*` (creatives, later).

### 2a. Setting up the blog's services

**Reader sign-in (comments).** Readers sign in with GitHub or Google; the blog
keeps only what they share (name, email, picture), as the privacy page says.

- [ ] **GitHub:** github.com → Settings → Developer settings → OAuth Apps → New
      OAuth App. Homepage URL `https://blog.chestlyace.online`; **Authorization
      callback URL** `https://blog.chestlyace.online/api/reader/callback/github`.
      Create a client secret. Set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.
- [ ] **Google:** Google Cloud console → APIs & Services → Credentials → Create
      credentials → OAuth client ID (type "Web application"; set up the consent
      screen first, with the `email`, `profile` and `openid` scopes only).
      **Authorised redirect URI** `https://blog.chestlyace.online/api/reader/callback/google`.
      Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Publish the consent screen
      ("In production") so people other than you can sign in.
- [ ] Set `BETTER_AUTH_SECRET`.
- [ ] After your first sign-in on the blog, open admin → Blog → Comments, find
      your own account and choose **Mark as author**, so your comments carry the
      Author tag.

For a preview, a GitHub OAuth app and a Google client each take **one** callback
address, so give the preview its own apps (or test sign-in on production only).

**Newsletter (Resend).** Subscribers live in Resend, not in the blog's database;
a reader is only added after opening the link in the confirmation email.

- [ ] In Resend, open **Segments** (previously "Audiences"), create one called
      for example "Blog subscribers", and copy its **id**. Set it as
      `RESEND_AUDIENCE_ID`.
- [ ] Set `NEWSLETTER_SECRET`.
- [ ] The wording of the signup box, of the two pages the confirmation link opens
      and of the confirmation email is edited in admin → **Blog → Newsletter**. The
      same screen has the **Show the signup box** switch: it is **on** by default,
      so turn it off until `RESEND_AUDIENCE_ID`, `NEWSLETTER_SECRET` and the
      Resend domain are ready, then on again.
- [ ] To send a post to subscribers, write a **Broadcast** in Resend to that
      segment. Every broadcast carries Resend's own unsubscribe link.

**Publish to DEV (optional).** Create a key at dev.to → Settings → Extensions →
"DEV Community API Keys" and set `DEVTO_API_KEY`. Exporting makes a **draft** on
DEV with the canonical address pointing at your post.

## 3. Database

- [ ] `DATABASE_URL=<production direct string> pnpm db:migrate` (this also creates the blog's tables: posts, likes, readers and comments, agent sessions, the newsletter's wording)
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
- [ ] **The blog** (`?site=blog`): write a post in admin → Blog → Posts, preview
      it, publish it; it appears on the blog home, in `rss.xml` and the sitemap.
      Like it. Sign in with GitHub and Google (production only if the OAuth apps
      are for production), comment, reply, and hide the comment from admin →
      Blog → Comments. Upload an agent session in a post and play it. Subscribe to
      the newsletter with your own address: the confirmation email arrives, its
      link says "You're on the list", and the address is in the Resend segment.
- [ ] Read the **privacy page** (`/privacy` on the blog) once and approve or
      change its wording; it is a draft until you do.

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
site and are findable by search engines. The blog (Phase 9) is built; the
creatives site (Phase 10) is not.

- [ ] Add `creatives.chestlyace.online` and `blog.chestlyace.online` to the
      Vercel project with the other domains (§5) and the DNS records Vercel shows.
- The blog shows the short "coming soon" page (`design.md` §14.12) until you
  publish the first post, then the real blog. The creatives host shows the same
  page until Phase 10 replaces it; `creatives.chestlyace.online/services` shows it
  too, so the old `graphic-design.html` and `photography.html` links land on a
  real page.
- They are indexed (`SITE_INDEXING=on`), but a short placeholder gives a search
  engine little to rank; expect them to matter once the real sites ship. The
  creatives sitemap lists just its homepage until then, and the blog's lists its
  published posts and tags.

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
- [ ] On the blog: sign in with GitHub and Google and post a comment; subscribe to
      the newsletter once with your own address and open the link in the email.
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

- When Phase 10 ships the creatives site, nothing in the indexing settings
  changes (`SITE_INDEXING=on` already covers every host); in Search Console add
  each host (including the blog) and submit its `sitemap.xml`.

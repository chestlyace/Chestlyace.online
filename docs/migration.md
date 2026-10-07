# Migrating the old site's data

How to move the live database from the old EC2 site into the new one
(`architecture.md` §10, `content-schema.md` §6). The owner runs these steps on
their own machine (Q20); the old database is only ever read.

**What the script does.** `pnpm migrate:old` reads the old tables from a scratch
Postgres and builds the new rows:

| Old | New |
|---|---|
| `profile` | Contact details, name, display name, tagline, About quote, résumé address, hero image. The headline ("Software Engineer"), hero words, About text and email (`chestlyace@gmail.com`, Q9) keep the dev seed's values. |
| `skills` | Icons become Devicon slugs (or an address); MongoDB/MySQL/PostgreSQL → `database`, Google Cloud/AWS → `cloud`. Ps, Lr, Canva are left out (Q7). |
| `works` (`project`) | `projects`: slug from the title, first sentence → summary, `#` and empty links → none. |
| `journey` | `journey`: `company` → `organization`, dates read into start/end (the original text is kept as the label), logos mapped to `public/logos/`. The two creative roles are left out (Q6). |
| `socials` | `socials`: icon names normalised (`fab fa-linkedin-in` → `linkedin`). |
| `services`, FAQ, certifications | Not loaded from the old database: the new services, the two software FAQs and the seven certification badges come from the dev seed the owner reviewed. |
| design/event `works`, creative roles, tools and services | Not loaded. Written to `old-creatives.json` for the creatives site (Phase 10). |

## Before you start

- The new production database exists (Prisma Postgres) and its migrations have
  run: `DATABASE_URL=… pnpm db:migrate`.
- A local Postgres you can create a scratch database in, and `psql`/`pg_dump`.
- Do a rehearsal against the preview/dev database first, then the real one.

## 1. Dump the live database (on the EC2 host)

```sh
pg_dump --no-owner --no-privileges portfolio_db > portfolio.sql
```

Copy `portfolio.sql` to your machine (`scp`). It holds your public content and
contact details only, but delete it when you are done.

## 2. Load it into a scratch database (locally)

```sh
createdb old_site
psql old_site -f portfolio.sql
export OLD_DATABASE_URL=postgres://localhost/old_site
```

## 3. Dry run

```sh
pnpm migrate:old
```

Nothing is written to the new database (it need not even be reachable). The
report lists the counts per table and everything to check. Typical lines:

- *Hero image / Résumé is a file name from the old site*: the files are not in
  this repo. Upload the résumé PDF in the admin (Profile → Résumé) before launch,
  or `/resume.pdf` is a 404.
- *Logo file … is not in public/logos/*: upload the logo in the admin on that
  entry.
- *dates could not be read*: the text is kept as shown; set the dates in the
  admin if the entry should sort or show a range.
- *has no icon / no logo*: pick one in the admin.

`old-creatives.json` is written next to where you run the command (it is
git-ignored). Keep it for Phase 10.

## 4. Load the new database

```sh
DATABASE_URL=<new database> pnpm migrate:old --write
```

The command prints which host and database it is writing to. It refuses a
database that already has content; `--replace` wipes the content first (the
admin session secret and password are environment variables, not data, so they
are unaffected). Run it against the preview database, open the preview, then run
it against production.

## 5. After loading

Check each of the four public pages of the main site and the admin, and fix in
the admin: the résumé PDF, any logos or images the report named, and the About
text (Q5 is still open). Every change there goes live at once.

## Rolling back

The old database is never modified, so the old site keeps working throughout.
To redo a load, run the command again with `--replace`, or restore the new
database from its provider backup.

## Clean up

Drop the scratch database (`dropdb old_site`) and delete `portfolio.sql`.

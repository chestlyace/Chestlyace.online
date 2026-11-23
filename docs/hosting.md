# Hosting runbook: the Oracle server

How the four sites run on an Oracle Cloud Always Free server (D94), and how to set
one up from nothing. It replaces the Vercel hosting in `launch.md`, which stays as
the record of the first launch. The owner does these steps; tick each box as you go.

**Why the move (2026-11-23):** Vercel paused the project for going over the Hobby
plan's limits (`402 DEPLOYMENT_DISABLED` on every host). A server has no usage
limit that can switch the site off.

## 0. What runs where

```
 visitor ──https──▶ Caddy (ports 80/443, certificates)
                      │  passes Host through; sets X-Forwarded-For
                      ▼
                    next start on port 3000, closed to the internet  (systemd)
                      │  /srv/chestlyace/current → releases/<time>-<commit>
                      ▼
          Prisma Postgres · Cloudinary · Resend   (unchanged)
```

| Piece | Where |
|---|---|
| Server | Oracle Cloud Always Free, Ampere A1 (ARM), Ubuntu 24.04 |
| App | Node 24, `next start`, run by systemd as the `deploy` user |
| HTTPS | Caddy, certificates from Let's Encrypt, renewed by itself |
| Deploys | GitHub Actions on every push to `main` (`.github/workflows/deploy.yml`) |
| Secrets | `/srv/chestlyace/shared/env`, readable by `deploy` only |
| DNS | Namecheap (Advanced DNS), A records to the server |
| Database | Prisma Postgres, as before, still connected through the Vercel project |

The files the server uses are in `deploy/`: `chestlyace.service`, `Caddyfile`,
`sudoers` and `deploy.sh`.

## 1. Before you start

- [ ] **Keep the Vercel project and its Prisma integration.** The production
      database was created through it. Deleting the project or the integration can
      delete the database. You can remove the domains from it after §7.
- [ ] Note the **region of the production database** (Prisma console → the
      database → settings). Pick the Oracle region closest to it in §2: every
      page load talks to the database.

## 2. Create the server

- [ ] Sign up at `cloud.oracle.com` (Free Tier). The **home region** you pick is
      permanent, and Always Free servers only run there, so choose the one near
      the database.
- [ ] **Recommended: upgrade the account to Pay As You Go** (Billing → Upgrade).
      Always Free resources stay free, but Oracle can reclaim an idle Always Free
      server on a free account, and a quiet portfolio looks idle (low CPU, network
      and memory for 7 days). Then set a budget alert at $1 (Billing → Budgets) so
      anything that isn't free shows up at once.
- [ ] Compute → Instances → **Create instance**:
  - Image: **Canonical Ubuntu 24.04** (the aarch64 build).
  - Shape: **Ampere → VM.Standard.A1.Flex**, 2 OCPUs and 12 GB of memory. The free
    allowance is 4 OCPUs and 24 GB in total, so this leaves room for another server.
  - Networking: create a new virtual cloud network with a **public subnet**, and
    assign a public IPv4 address.
  - SSH keys: paste your own public key (e.g. `~/.ssh/id_ed25519.pub`).
  - If it says **"Out of capacity"**, try another availability domain or try again
    later; ARM capacity comes and goes.
- [ ] Make the address permanent: Networking → IP management → **Reserved public
      IPs**, reserve one and assign it to the server's network interface. Write it
      down: it's `<IP>` below.
- [ ] Open the web ports in Oracle's firewall: the network → the public subnet's
      **security list** → Add ingress rules: source `0.0.0.0/0`, TCP, destination
      port `80`, and a second for `443`. **Never open 3000**: the app listens on
      every address (see `deploy/chestlyace.service` for why), so the firewalls are
      what keep it behind Caddy.

Check that you can sign in: `ssh ubuntu@<IP>`.

## 3. Install the software (on the server, as `ubuntu`)

Oracle's Ubuntu image also has its own firewall (iptables) that rejects everything
but SSH. Open 80 and 443 there too:

```bash
sudo iptables -I INPUT -p tcp -m multiport --dports 80,443 -m conntrack --ctstate NEW -j ACCEPT
sudo netfilter-persistent save
```

Updates, Node 24 (with pnpm through corepack) and Caddy:

```bash
sudo apt update && sudo apt full-upgrade -y
sudo apt install -y curl unattended-upgrades caddy
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs
sudo corepack enable
node --version   # v24.x
```

The `deploy` user, which runs the app and receives deploys:

```bash
sudo adduser --disabled-password --gecos "" deploy
sudo mkdir -p /srv/chestlyace/shared /srv/chestlyace/releases /srv/chestlyace/incoming
sudo chown -R deploy:deploy /srv/chestlyace
```

From **your machine**, in this repository, copy the server files up:

```bash
scp deploy/chestlyace.service deploy/sudoers deploy/Caddyfile ubuntu@<IP>:
```

Back on the server:

```bash
sudo install -m 644 chestlyace.service /etc/systemd/system/chestlyace.service
sudo visudo -cf sudoers && sudo install -m 440 sudoers /etc/sudoers.d/chestlyace
sudo systemctl daemon-reload
sudo systemctl enable chestlyace
```

The `Caddyfile` waits on the server until §7: Caddy can only get certificates once
DNS points at the server.

## 4. The environment file

The same variables Vercel had (`launch.md` §2), in one file on the server.

- [ ] On your machine, pull production's values:
      `vercel env pull --environment=production prod.env`
- [ ] Open `prod.env` and:
  - delete every `VERCEL_…` line (they describe Vercel, not this server);
  - fill in any value that came back empty (Vercel never returns variables marked
    *sensitive*): take it from its service again (`launch.md` §2 says where);
  - in `ADMIN_PASSWORD_HASH`, write every `$` as `\$`. Vercel took the hash as
    it was, but in a file Next reads `$name` as another variable;
  - check `SITE_INDEXING=on` is there.
- [ ] Copy it up and lock it down, then delete both copies:

```bash
scp prod.env ubuntu@<IP>:
ssh ubuntu@<IP> 'sudo install -o deploy -g deploy -m 600 prod.env /srv/chestlyace/shared/env && rm prod.env'
rm prod.env
```

`deploy.sh` copies this file into each release as `.env.production.local`. Next
reads it at build time (`SITE_INDEXING`, `NEXT_PUBLIC_*`) and when it starts, so
**a change to it needs a deploy** (§6), not just a restart.

## 5. GitHub: the deploy key and secrets

- [ ] On your machine, make a key only GitHub Actions will use:
      `ssh-keygen -t ed25519 -N "" -C "github-actions-deploy" -f chestlyace-deploy`
- [ ] Let it sign in as `deploy`:

```bash
scp chestlyace-deploy.pub ubuntu@<IP>:
ssh ubuntu@<IP> 'sudo install -d -o deploy -g deploy -m 700 /home/deploy/.ssh && sudo install -o deploy -g deploy -m 600 chestlyace-deploy.pub /home/deploy/.ssh/authorized_keys && rm chestlyace-deploy.pub'
```

- [ ] Get the server's host key, so Actions knows it's talking to your server:
      `ssh-keyscan -t ed25519 <IP>`. Check that its fingerprint
      (`ssh-keyscan -t ed25519 <IP> | ssh-keygen -lf -`) matches what the server
      shows for `sudo ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub`.
- [ ] GitHub → the repository → Settings → Environments → **production** (create it
      if it isn't there) → add these secrets:

| Secret | Value |
|---|---|
| `DEPLOY_HOST` | `<IP>` |
| `DEPLOY_USER` | `deploy` |
| `DEPLOY_SSH_KEY` | the whole contents of `chestlyace-deploy` (the private key) |
| `DEPLOY_KNOWN_HOSTS` | the line `ssh-keyscan` printed |

- [ ] Delete `chestlyace-deploy` and `chestlyace-deploy.pub` from your machine.

## 6. Deploys

Every push to `main` deploys (a merged pull request is a push). The first time, or
to deploy again by hand: GitHub → Actions → **Deploy** → Run workflow.

What happens (`deploy/deploy.sh`):

1. Actions sends the commit and the deploy script to the server. The server needs
   no access to GitHub.
2. The server unpacks it into `releases/<time>-<commit>`, adds the environment
   file, runs `pnpm install` and `pnpm build`. The live release keeps serving
   meanwhile.
3. `current` is pointed at the new release and the app restarts (a few seconds).
4. The script checks that the home page answers. **If it doesn't, `current` goes
   back to the previous release** and the run fails, so you see it in Actions.
5. The three newest releases are kept for rollbacks.

**Rolling back by hand:** in Actions, open an earlier successful Deploy run and
choose "Re-run all jobs": it deploys that run's commit again. Or on the server:

```bash
ls /srv/chestlyace/releases
sudo -u deploy ln -sfn /srv/chestlyace/releases/<release> /srv/chestlyace/current
sudo systemctl restart chestlyace
```

**Migrations** are run from your machine, as before (`launch.md` §3):
`DATABASE_URL=<production direct string> pnpm db:migrate`, before you merge the
pull request that needs them.

## 7. Check it, then move DNS

- [ ] Run the first deploy (§6) and wait for it to pass.
- [ ] Look at it before anyone else can. From your machine:
      `ssh -L 3000:127.0.0.1:3000 ubuntu@<IP>`, then open `http://localhost:3000`,
      `http://admin.localhost:3000`, `http://blog.localhost:3000` and
      `http://creatives.localhost:3000`. Links between the sites go to the real
      domains; that's expected.
- [ ] Turn on Caddy's configuration. Until DNS points here it keeps retrying the
      certificates, which is harmless:

```bash
sudo install -m 644 Caddyfile /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

- [ ] Namecheap → Domain List → `chestlyace.me` → Manage → **Advanced DNS**.
      Replace the Vercel records with A records to `<IP>` (table below). Leave
      every mail record alone: MX, the SPF and DKIM TXT records, Resend's `send`
      records, and the Google site verification.
- [ ] Watch Caddy get the certificates: `sudo journalctl -u caddy -f` (look for
      "certificate obtained" for each host). If it gave up while DNS was still
      changing, `sudo systemctl reload caddy`.

| Type | Host | Value | Replaces |
|---|---|---|---|
| A | `@` | `<IP>` | the Vercel A record |
| A | `www` | `<IP>` | the CNAME to `…vercel-dns-….com` |
| A | `admin` | `<IP>` | the CNAME to Vercel |
| A | `blog` | `<IP>` | the CNAME to Vercel |
| A | `creatives` | `<IP>` | the CNAME to Vercel |

## 8. After the switch

- [ ] `https://chestlyace.me`, `https://admin.chestlyace.me`,
      `https://blog.chestlyace.me` and `https://creatives.chestlyace.me` load, with
      a valid padlock.
- [ ] `https://www.chestlyace.me/anything` lands on `https://chestlyace.me/anything`.
- [ ] `https://chestlyace.me/?site=admin` shows the **main** site (the override
      is off in production).
- [ ] Sign in to the admin; save a small change and see it on the site.
- [ ] Send yourself a message with the contact form.
- [ ] On the blog, sign in with GitHub and with Google. The callback addresses are
      the same domains, so the OAuth apps need no change.
- [ ] `/robots.txt` on each public host still says `Allow: /`.
- [ ] In the Vercel project, remove the domains (Settings → Domains). Keep the
      project and the Prisma integration (§1).

## 9. Day to day

| To… | Run (on the server) |
|---|---|
| See the app's logs | `sudo journalctl -u chestlyace -f` |
| See whether it's running | `systemctl status chestlyace` |
| Restart it | `sudo systemctl restart chestlyace` |
| See Caddy's logs | `sudo journalctl -u caddy -f` |
| Change a setting | edit `/srv/chestlyace/shared/env` (`sudo -u deploy nano …`), then deploy (§6) |

- Security updates install themselves (`unattended-upgrades`). Every month or so:
  `sudo apt update && sudo apt full-upgrade -y && sudo reboot`. The app and Caddy
  start again by themselves.
- The server has no previews: check a change locally with `pnpm build && pnpm start`
  before merging.

## 10. What changed from Vercel

- **No preview deployments.** `?site=` and the French override still work in
  development and on any remaining Vercel preview, never in production
  (`overridesAllowed()` in `lib/sites.ts`).
- **No automatic check on pull requests.** Vercel's build was the only one (D17).
  The quality bar (`instructions.md` §6) is run locally, as it already was.
- **No analytics.** `@vercel/analytics` was removed (D79 is superseded); a
  replacement is a separate decision.
- **The data cache** is keyed on the deployed commit (`GIT_COMMIT_SHA`, written by
  `deploy.sh`) and lives in each release's `.next/cache`, so a deploy starts with
  a fresh cache. One server, so `revalidateTag` from the admin reaches everything.

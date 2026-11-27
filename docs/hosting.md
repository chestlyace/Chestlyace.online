# Hosting runbook: the EC2 server

How the four sites run on an AWS EC2 server (D94), and how to set one up from
nothing. It replaces the Vercel hosting in `launch.md`, which stays as the record
of the first launch. The owner does these steps; tick each box as you go.

**Why the move (2026-11-23):** Vercel paused the project for going over the Hobby
plan's limits (`402 DEPLOYMENT_DISABLED` on every host). A server has no usage
limit that can switch the site off. EC2 is the host "for now" (owner, 2026-11-27);
the setup is plain Ubuntu, so another host later changes only §2–§3.

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
| Server | AWS EC2 `t3.small` (2 vCPU, 2 GB), Ubuntu 24.04, an Elastic IP |
| App | Node 24, `next start`, run by systemd as the `deploy` user |
| HTTPS | Caddy, certificates from Let's Encrypt, renewed by itself |
| Deploys | GitHub Actions on every push to `main` (`.github/workflows/deploy.yml`) |
| Secrets | `/srv/chestlyace/shared/env`, readable by `deploy` only |
| DNS | Namecheap (Advanced DNS), A records to the Elastic IP |
| Database | Prisma Postgres, as before, still connected through the Vercel project |

The files the server uses are in `deploy/`: `chestlyace.service`, `Caddyfile`,
`sudoers` and `deploy.sh`.

**What it costs** (on-demand, us-east-1, before any credits; other regions differ a
little): the `t3.small` about $15 a month, the public IPv4 address about $3.60, the
20 GB disk about $1.60. Roughly $20 a month in all.

## 1. Before you start

- [ ] **Keep the Vercel project and its Prisma integration.** The production
      database was created through it. Deleting the project or the integration can
      delete the database. You can remove the domains from it after §7.
- [ ] Note the **region of the production database** (Prisma console → the
      database → settings). Prisma Postgres runs in AWS regions: launch the server
      in the same one (§2). Every page load talks to the database.
- [ ] Set a spending alarm before anything else: AWS console → Billing and Cost
      Management → **Budgets** → Create budget → Monthly cost budget, $25, with an
      email alert. Anything unexpected then shows up at once.

## 2. Create the server

- [ ] AWS console, in the database's region → EC2 → **Launch instance**:
  - Name: `chestlyace`.
  - Image: **Ubuntu Server 24.04 LTS**, 64-bit (x86).
  - Instance type: **t3.small**.
  - Key pair: pick yours, or create one (ED25519) and keep the `.pem` file safe.
    You sign in with it as `ubuntu`.
  - Network settings → Edit → create a security group named `chestlyace-web` with
    three inbound rules: **SSH (22)**, **HTTP (80)** and **HTTPS (443)**, each from
    `0.0.0.0/0` (and `::/0` for 80 and 443). SSH has to be open to anywhere because
    GitHub Actions connects from addresses that change; only keys can sign in
    (Ubuntu turns passwords off). **Never open 3000**: the app listens on every
    address (`deploy/chestlyace.service` says why), so the firewalls are what keep
    it behind Caddy.
  - Storage: **20 GB gp3**.
  - Advanced details → Credit specification: **Standard**. A `t3` in the default
    "Unlimited" mode bills extra for long bursts of CPU; Standard slows down
    instead, which a build every few merges never reaches.
- [ ] Give it a fixed address: EC2 → Network & Security → **Elastic IPs** →
      Allocate, then Actions → Associate with the `chestlyace` instance. Without it
      the address changes whenever the instance stops. Write it down: it's `<IP>`
      below.

Check that you can sign in: `ssh -i <your key> ubuntu@<IP>`. The steps below write
plain `ssh ubuntu@<IP>`; add `-i <your key>` if your key isn't the default one.

## 3. Install the software (on the server, as `ubuntu`)

A second firewall on the server itself, so port 3000 stays closed even if the
security group is ever edited by mistake:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80,443/tcp
sudo ufw --force enable
```

A 2 GB swap file, so `next build` has room next to the running app on a 2 GB box:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
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
   meanwhile. A build takes a few minutes on a `t3.small`.
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
- [ ] If the old site's EC2 instance is still running, stop it now and terminate it
      once you're sure nothing on it is needed (`launch.md` §8), and release its
      Elastic IP if it had one: an unused one is still billed.

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

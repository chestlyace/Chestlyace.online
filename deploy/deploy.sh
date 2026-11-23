#!/usr/bin/env bash
# Runs on the server (docs/hosting.md §6). The Deploy workflow uploads the commit
# as incoming/<sha>.tar.gz and this script as incoming/deploy-<sha>.sh, then runs:
#
#   bash /srv/chestlyace/incoming/deploy-<sha>.sh <sha>
#
# The commit is built in its own release directory while the current release keeps
# serving. Then `current` points at it, the app restarts, and the script checks
# that it answers. If it doesn't, `current` goes back to the previous release.
set -euo pipefail

SHA="${1:?usage: deploy.sh <commit sha>}"
ROOT="${DEPLOY_ROOT:-/srv/chestlyace}"
SERVICE="chestlyace"
PORT=3000
KEEP=3

export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

TARBALL="$ROOT/incoming/$SHA.tar.gz"
# Named by time first, so the newest sort last and a redeploy of the same commit
# never overwrites the release that is serving.
RELEASE="$ROOT/releases/$(date -u +%Y%m%d%H%M%S)-${SHA:0:12}"
PREVIOUS=""
if [ -L "$ROOT/current" ]; then PREVIOUS="$(readlink -f "$ROOT/current")"; fi

log() { printf '\n==> %s\n' "$*"; }

point_current_at() {
  ln -sfn "$1" "$ROOT/current.tmp"
  mv -T "$ROOT/current.tmp" "$ROOT/current"
  sudo -n systemctl restart "$SERVICE"
}

healthy() {
  for _ in $(seq 1 30); do
    if curl -fsS -o /dev/null -H "Host: chestlyace.me" "http://127.0.0.1:$PORT/"; then
      return 0
    fi
    sleep 2
  done
  return 1
}

[ -f "$TARBALL" ] || { echo "Missing $TARBALL" >&2; exit 1; }
[ -f "$ROOT/shared/env" ] || {
  echo "Missing $ROOT/shared/env (docs/hosting.md §4)" >&2
  exit 1
}

log "Unpacking $SHA"
mkdir -p "$RELEASE"
tar -xzf "$TARBALL" -C "$RELEASE"
rm -f "$TARBALL" "$ROOT/incoming/deploy-$SHA.sh"

# Next reads .env.production.local at build time and again at `next start`.
install -m 600 "$ROOT/shared/env" "$RELEASE/.env.production.local"
printf '\n# Written by deploy.sh: keys the data cache to this commit.\nGIT_COMMIT_SHA=%s\n' \
  "$SHA" >> "$RELEASE/.env.production.local"

cd "$RELEASE"
log "Installing dependencies"
pnpm install --frozen-lockfile
log "Building"
pnpm build

log "Switching to $(basename "$RELEASE")"
point_current_at "$RELEASE"

if ! healthy; then
  echo "The new release did not answer on port $PORT." >&2
  if [ -n "$PREVIOUS" ] && [ -d "$PREVIOUS" ]; then
    log "Rolling back to $(basename "$PREVIOUS")"
    point_current_at "$PREVIOUS"
  fi
  exit 1
fi

log "Live: $SHA"

# Keep the newest releases for rollbacks, and never delete the one serving.
LIVE="$(readlink -f "$ROOT/current")"
find "$ROOT/releases" -mindepth 1 -maxdepth 1 -type d | sort -r |
  tail -n +$((KEEP + 1)) | while read -r old; do
    [ "$old" = "$LIVE" ] || rm -rf "$old"
  done

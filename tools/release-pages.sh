#!/bin/sh
# Build dist/ and publish it to Cloudflare Pages (project "inkwave"). Needs a one-time `npx wrangler login`.
# Cross-platform: macOS / Linux / Windows (Git Bash). usage: tools/release-pages.sh
set -e
cd "$(dirname "$0")/.."
# Windows: wrangler reads $XDG_CONFIG_HOME/.wrangler when the var is set (Git Bash sets it to
# AppData/Roaming/xdg.config), but a plain cmd/PowerShell shell leaves it unset and looks in
# %USERPROFILE%\.wrangler instead — point it at the login's config if that is where it lives.
if [ -z "${XDG_CONFIG_HOME:-}" ] && [ -f "$HOME/AppData/Roaming/xdg.config/.wrangler/config/default.toml" ]; then
  XDG_CONFIG_HOME="$HOME/AppData/Roaming/xdg.config"
  export XDG_CONFIG_HOME
fi
PY=$(command -v python3 || command -v python || command -v py || true)
if [ -z "$PY" ]; then echo 'release: need python3 (or python) to build dist/' >&2; exit 1; fi
"$PY" tools/build-dist.py
STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT
# Pages serves everything in the folder: leave out the Vercel link files
cp -a dist/. "$STAGE/"
rm -rf "$STAGE/.vercel" "$STAGE/vercel.json"
# fresh modules on every visit (revalidate; unchanged files come back as cheap 304s)
printf '/*\n  Cache-Control: public, max-age=0, must-revalidate\n' > "$STAGE/_headers"
# run from the staging folder so no repo-level wrangler config gets picked up
cd "$STAGE"
npx --yes wrangler@4 pages project create inkwave --production-branch main --force 2>&1 | tail -2 || true
npx --yes wrangler@4 pages deploy . --force --project-name inkwave --branch main --commit-dirty=true

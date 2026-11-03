#!/bin/bash
# SessionStart hook: install the test tools (playwright, tailwindcss, sortablejs)
# in Claude Code cloud sessions so `npm test` / `npm run test:e2e` /
# `npm run screenshots` work right away. Skips the install when nothing changed.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}"

# Run the install only if a listed file has changed since the install last succeeded
hashes=node_modules/.session-start.sha256
if ! sha256sum --check --status "$hashes" 2>/dev/null; then
  # Delete the old hashes first, so a failed install runs again next time
  rm -f "$hashes"

  # Browsers are preinstalled in /opt/pw-browsers; never run `playwright install`.
  npm install --no-audit --no-fund

  sha256sum .claude/hooks/session-start.sh package.json package-lock.json 2>/dev/null > "$hashes" || rm -f "$hashes"
fi

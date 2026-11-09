#!/bin/bash
# Captures the welcome-pack screens from a local copy of Toran.
# Usage: run-capture.sh <spec letters, e.g. "a b c"> [--reset]
SP=/tmp/claude-0/-home-user-test/3315e8b3-1eaa-5a44-b906-42368514a515/scratchpad
WP=/home/user/test/media/welcome-pack
cd /home/user/toran-main-code
set -a; . $SP/sb.env; set +a
if [ "$2" = "--reset" ]; then
  npx -y supabase@2.120.0 db reset >/dev/null 2>&1
  psql "$DB_URL" -q -f $WP/capture/seed.sql
  rm -f $WP/shots/manifest.json
fi
pkill -f mock-claude.cjs; (node $WP/capture/mock-claude.cjs > $SP/v6/mock.log 2>&1 &)
cp $WP/capture/capture-lib.ts tests/e2e-auth/zz-capture-lib.ts
for s in $1; do f=$(ls $WP/capture/$s-*.spec.ts); cp $f tests/e2e-auth/zz-$(basename $f); done
specs=$(for s in $1; do echo tests/e2e-auth/zz-$(basename $WP/capture/$s-*.spec.ts); done)
PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium npx playwright test -c playwright.auth.config.ts --reporter=line $specs 2>&1 | sed 's/\x1b\[[0-9;]*[A-Za-z]//g' | grep -E "passed|failed|Error|Locator|^\s+>|waiting for" | head -20

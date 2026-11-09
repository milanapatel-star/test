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
  # Pages are prerendered when the site is built, so build it again from the
  # fresh database: otherwise the first screens show what the last run added.
  pkill -f "next start"; pkill -f next-server; sleep 1
  rm -f tests/e2e-auth/zz-*
  export NEXT_PUBLIC_SUPABASE_URL=$API_URL NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${PUBLISHABLE_KEY:-$ANON_KEY} ANTHROPIC_API_KEY=mock-key ANTHROPIC_BASE_URL=http://127.0.0.1:4010 VERCEL_PROJECT_PRODUCTION_URL=toran.org.uk
  rm -rf .next
  pnpm build > $SP/v6/build.log 2>&1 || { echo "BUILD FAILED, see $SP/v6/build.log"; exit 1; }
  (nohup pnpm start --port 3100 > $SP/v6/server.log 2>&1 &)
  sleep 6
fi
pkill -f mock-claude.cjs; (node $WP/capture/mock-claude.cjs > $SP/v6/mock.log 2>&1 &)
cp $WP/capture/capture-lib.ts tests/e2e-auth/zz-capture-lib.ts
for s in $1; do f=$(ls $WP/capture/$s-*.spec.ts); cp $f tests/e2e-auth/zz-$(basename $f); done
# Chromium formats date and time boxes from the system language, not the
# page's: British, so dates read 14/11/2026 and times 17:00.
export LANG=en_GB.UTF-8 LANGUAGE=en_GB:en
# One stage at a time, in the order given: each builds on the last.
for s in $1; do
  spec=tests/e2e-auth/zz-$(basename $(ls $WP/capture/$s-*.spec.ts))
  PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium npx playwright test -c playwright.auth.config.ts --reporter=line $spec 2>&1 | sed 's/\x1b\[[0-9;]*[A-Za-z]//g' | grep -E "passed|failed|Error|Locator|^\s+>|waiting for|OFF SCREEN" | head -20
done

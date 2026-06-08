#!/bin/bash
set -euo pipefail

# Only run in remote (web) sessions
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Install dependencies
npm install

# Start the Next.js dev server in the background if not already running
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
  nohup npm run dev > /tmp/next-dev.log 2>&1 &
  # Wait up to 20s for it to be ready
  for i in $(seq 1 20); do
    sleep 1
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
      echo "Dev server ready"
      break
    fi
  done
else
  echo "Dev server already running"
fi

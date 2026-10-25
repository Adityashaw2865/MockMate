#!/usr/bin/env bash
# One-command local setup: database, dependencies, Prisma client, tables.
set -e
if command -v docker >/dev/null 2>&1; then
  docker compose up -d db
  sleep 4
else
  echo "Docker not found. Put a Postgres URL (for example from neon.tech) in apps/server/.env as DATABASE_URL."
fi
pnpm install
pnpm --filter server exec prisma generate
pnpm db:push
echo ""
echo "Setup finished. Start the app with:  pnpm dev"
echo "Then open http://localhost:3000"

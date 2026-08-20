#!/usr/bin/env bash
# Regenerates docker/db/seed.sql from the live Neon database, for local dev.
# Requires pg_dump on PATH and backend/.env's DATABASE_URL to point at Neon.
set -euo pipefail

cd "$(dirname "$0")/../.."
set -a
source backend/.env
set +a

pg_dump --no-owner --no-privileges --format=plain \
  "$DATABASE_URL" \
  -f docker/db/seed.sql

echo "Wrote docker/db/seed.sql ($(wc -l < docker/db/seed.sql) lines)"
echo "Re-seed a local container: docker compose down -v && docker compose up -d db"

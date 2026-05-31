#!/bin/sh
set -e

echo "→ Validating environment..."
node /app/scripts/validate-env.mjs

echo "→ Running database migrations..."
npx prisma migrate deploy --schema=/app/packages/database/prisma/schema.prisma

echo "→ Starting web server..."
exec node /app/apps/web/server.js

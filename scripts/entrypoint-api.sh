#!/bin/sh
set -e

echo "→ Validating environment..."
node /app/scripts/validate-env.mjs

echo "→ Starting API server..."
exec node /app/apps/api/dist/main

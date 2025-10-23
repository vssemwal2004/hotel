#!/usr/bin/env bash
set -euo pipefail

# Build frontend (Next.js) and export to static files
cd frontend
# Use relative API path by default for single-service deployment
export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-/api}"
# Install deps (CI-friendly)
if [ -f package-lock.json ]; then
  npm ci --no-audit --no-fund
else
  npm install --no-audit --no-fund
fi
npm run build
npx next export -o out
cd ..

# Start backend (serves API and static frontend)
cd backend
if [ -f package-lock.json ]; then
  npm ci --no-audit --no-fund
else
  npm install --no-audit --no-fund
fi
# Ensure production mode for proper cookie/security settings
export NODE_ENV=production
# FRONTEND_DIST is used by server.js to serve the exported site
export FRONTEND_DIST="${FRONTEND_DIST:-$(pwd)/../frontend/out}"
node src/server.js

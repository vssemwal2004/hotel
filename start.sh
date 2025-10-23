#!/bin/sh
set -e

# Build frontend (Next.js) and export to static files
cd frontend
# Use relative API path by default for single-service deployment
NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-/api}"
export NEXT_PUBLIC_API_URL
# Install deps (CI-friendly)
npm install --no-audit --no-fund
npm run build
npx next export -o out
cd ..

# Start backend (serves API and static frontend)
cd backend
npm install --no-audit --no-fund
# Ensure production mode for proper cookie/security settings
NODE_ENV=production
export NODE_ENV
# FRONTEND_DIST is used by server.js to serve the exported site
FRONTEND_DIST="${FRONTEND_DIST:-$(pwd)/../frontend/out}"
export FRONTEND_DIST
node src/server.js

// Root-level serverless proxy for monorepo deployments
// This lets a Vercel project configured at the repo root still find an /api function.

export { default } from '../backend/api/index.js'

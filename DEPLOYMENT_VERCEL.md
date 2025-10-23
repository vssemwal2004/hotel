# Deploying the Hotel app to Vercel (monorepo)

This repository is a monorepo with two separate projects:
- Backend (Express on serverless functions): `backend/`
- Frontend (Next.js): `frontend/`

Follow these steps to deploy both as two Vercel projects.

## 1) Backend project (Express API)

When importing the repo into Vercel, create/select a project and set:

- Root Directory: `backend`
- Framework Preset: "Other"
- Build System: Vercel (modern), not Legacy
- Build Command: leave empty
- Output Directory: leave empty
- Node.js Runtime: 20.x (also set via `backend/vercel.json`)

Environment Variables (Required):
- MONGODB_URI: e.g. `mongodb+srv://<user>:<pass>@cluster/hoteldb?retryWrites=true&w=majority`
- CLIENT_ORIGIN: your frontend URL (e.g. `https://<your-frontend>.vercel.app`)
- JWT_SECRET: strong random string
- COOKIE_SECRET: strong random string
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET

Then deploy and verify endpoints:
- GET https://<your-backend>/api/health -> `{ ok: true }`
- GET https://<your-backend>/api/ -> `{ ok: true, service: 'hotel-backend', ... }`

Notes:
- The API is implemented as a serverless function at `backend/api/index.js`, which wraps the Express app from `backend/src/app.js`.
- Health checks do not require MongoDB; all other endpoints do.

## 2) Frontend project (Next.js)

Create a second Vercel project pointing to:
- Root Directory: `frontend`
- Framework Preset: Next.js

Environment Variables:
- NEXT_PUBLIC_API_URL: `https://<your-backend>.vercel.app/api`

Then deploy the frontend. It will call your backend using the public URL you set.

## 3) Security and cleanup

- Do not commit real secrets. Use `.env` files locally (they are git-ignored). If any credentials were committed historically, rotate them.
- The backend must not write to disk on serverless. All image uploads are configured to use Cloudinary.

## 4) Troubleshooting

- Error: "Function Runtimes must have a valid version"
  - Ensure the backend project root is `backend/` and `backend/vercel.json` contains `{ "version": 2, "functions": { "runtime": "nodejs20.x" } }`.
  - Ensure the Vercel project uses the modern build system, not Legacy.

- 500 on image uploads
  - Verify the Cloudinary env vars are set on the backend project.

- CORS/cookies not working
  - Set `CLIENT_ORIGIN` on backend to your frontend URL and redeploy both.

## 5) Local development

- Backend: `cd backend` then `npm i` and `npm run dev` (requires local `MONGODB_URI`)
- Frontend: `cd frontend` then `npm i` and `npm run dev` (uses `NEXT_PUBLIC_API_URL` or defaults to `http://localhost:5000/api`)

# Hotel Backend (Auth)

Node.js Express API providing cookie-based authentication for the Hotel app.

## Features
- Register, Login, Logout, Me endpoints
- HTTP-only JWT cookie (no localStorage)
- CORS with credentials
- Helmet, logging, and validation with Zod
- MongoDB via Mongoose

## Endpoints
- POST /api/auth/register { name, email, password }
- POST /api/auth/login { email, password }
- POST /api/auth/logout
- GET  /api/auth/me

## Setup
1. Copy `.env.example` to `.env` and set values.
2. Install deps:
   - In Windows PowerShell from repo root or backend folder:
   ```powershell
   cd backend; npm install
   ```
3. Start MongoDB locally (or set MONGODB_URI to a cluster).
4. Run dev server:
   ```powershell
   npm run dev
   ```
5. Frontend must set axios `withCredentials: true` and point to `CLIENT_ORIGIN`.

### Admin bootstrap
- Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`. On server start, an admin user with this email will be created or updated with role=admin.

## Cookie notes
- In development (http://localhost), cookies use SameSite=Lax and Secure=false so they work without HTTPS.
- In production behind HTTPS, set NODE_ENV=production and COOKIE_DOMAIN to your domain; cookies are Secure and SameSite=None to allow cross-site with frontend domain if needed.

## Health
- GET /health -> { ok: true }

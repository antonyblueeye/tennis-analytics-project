# Deploy checklist (Vercel + Railway)

## 1. Find the **correct** Railway backend URL

Your FastAPI service from this repo must respond:

```text
GET https://YOUR-BACKEND.up.railway.app/health
→ {"status":"ok"}

GET https://YOUR-BACKEND.up.railway.app/api/players/rankings/top?limit=1
→ JSON with players
```

**Wrong backend example** (different project — do not use):

```text
/health → {"status":"healthy","version":"1.0.0"}
/api/players/rankings/top → 404
```

In Railway: open the service deployed from `tennis-analytics-project` / `backend` → Settings → Networking → copy **Public domain**.

## 2. Vercel environment variables

Root Directory: `frontend`

```text
NEXT_PUBLIC_API_URL=https://YOUR-BACKEND.up.railway.app
```

Must start with `https://` (or `http://` for local). Without a protocol the build/runtime will fail or misroute requests.

## 3. Railway backend variables

Root Directory: `backend` · Builder: Dockerfile

```text
DATABASE_URL=...   (from Postgres)
ALLOWED_ORIGINS=http://localhost:3000,https://tennis-analytics-project.vercel.app
```

## 4. Quick test from browser

```text
https://tennis-analytics-project.vercel.app  → site loads
https://YOUR-BACKEND.up.railway.app/api/players/rankings/top?limit=3  → JSON
```

If backend URL works but Vercel site does not → redeploy Vercel with correct `NEXT_PUBLIC_API_URL`.

Optional proxy: `next.config.ts` rewrites `/api/*` to backend when `NEXT_PUBLIC_API_URL` is set at build time.

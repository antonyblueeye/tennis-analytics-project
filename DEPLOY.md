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

Must start with `https://` (or `http://` for local). Example:

```text
NEXT_PUBLIC_API_URL=https://tennis-analytics-project-production.up.railway.app
```

## 3. Railway backend variables

Root Directory: `backend` · Builder: Dockerfile

```text
DATABASE_URL=...   (from Postgres — see below)
ALLOWED_ORIGINS=http://localhost:3000,https://tennis-analytics-project.vercel.app
```

### DATABASE_URL must work from the backend container

If API returns 500 with:

```text
could not translate host name "postgres.railway.internal" to address
```

the backend **cannot reach Postgres**. Common causes:

1. Postgres and backend in **different Railway projects** → use **Public** Postgres URL in backend `DATABASE_URL`
2. `DATABASE_URL` pasted manually with internal host → in Postgres service: **Connect → Public URL**, copy full `postgresql://...` into backend Variables
3. Or in the **same project**: backend → Variables → **Add Reference** → Postgres → `DATABASE_URL`

After changing `DATABASE_URL`, **Redeploy backend**, then verify:

```text
https://tennis-analytics-project-production.up.railway.app/api/players/rankings/top?limit=2
→ JSON (not 500)
```

## 4. Quick test from browser

```text
https://tennis-analytics-project.vercel.app  → site loads
https://YOUR-BACKEND.up.railway.app/api/players/rankings/top?limit=3  → JSON
```

If backend URL works but Vercel site does not → redeploy Vercel with correct `NEXT_PUBLIC_API_URL`.

Optional proxy: `next.config.ts` rewrites `/api/*` to backend when `NEXT_PUBLIC_API_URL` is set at build time.

# Appraisal Portal — appraisal.sistec.ac.in

The Appraisal Portal is a separate website built from this repo. It shows only
the appraisal pages and signs people in with their MILE accounts, using the
same MILE backend and database. MILE's menu has one link, **Appraisal Portal ↗**,
that opens the portal already signed in.

```
appraisal.sistec.ac.in  ─┐
                          ├─►  MILE backend (same API)  ─►  same MongoDB
mile.sistec.ac.in       ─┘
```

## Run it locally

```bash
npm run dev               # MILE            → http://localhost:5173
npm run dev:appraisal     # Appraisal Portal → http://localhost:5174
```

For the one-click link to open the local portal, put this in `.env.local`:

```
VITE_APPRAISAL_URL=http://localhost:5174
VITE_MILE_URL=http://localhost:5173
```

## Deploy on Render (free)

Static sites are free on Render and do not sleep. Only the backend sleeps on the
free plan, so the first sign-in after a quiet spell can take 30–50 seconds.

1. **New → Static Site**, connect this repository (same repo as MILE).
2. Settings:
   - **Build command:** `npm install && npm run build:appraisal`
   - **Publish directory:** `dist-appraisal`
3. **Environment** (the same API address MILE uses):
   - `VITE_API_URL` = `https://<your-backend>.onrender.com/api`
   - `VITE_MILE_URL` = `https://mile.sistec.ac.in`
4. **Redirects/Rewrites** → add a rule: Source `/*`, Destination `/index.html`,
   Action **Rewrite** (so `/appraisal/form/...` links open correctly).
5. **Settings → Custom Domains** → add `appraisal.sistec.ac.in`. Render shows a
   CNAME target; ask whoever manages the sistec.ac.in DNS to add:
   `appraisal  CNAME  <the target Render shows>`. Render issues HTTPS itself.

### MILE (existing site)

Add to MILE's environment and redeploy, so its menu link points to the portal:

- `VITE_APPRAISAL_URL` = `https://appraisal.sistec.ac.in`

### Backend

`https://appraisal.sistec.ac.in` is already in the CORS list. If the portal is
served from any other address, set `APPRAISAL_URL` to it in the backend's
environment.

## How the one-click sign-in works

1. In MILE, **Appraisal Portal ↗** asks the backend for a hand-off code
   (`POST /api/auth/handoff`, staff only).
2. MILE opens `https://appraisal.sistec.ac.in/sso#code=…` — the code is after
   `#`, so it never reaches a server or a log.
3. The portal swaps it for a normal sign-in (`POST /api/auth/handoff/exchange`).
   A code works **once**, for **60 seconds**.

People can also sign in on the portal directly with their MILE email and
password. Students, parents and security accounts are turned away.

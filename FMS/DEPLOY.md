# Deployment Guide

This app has two parts that deploy separately:
- **Frontend** (React) → Cloudflare Pages
- **API + Database** → Railway + Neon

---

## Step 1 — Database (Neon, free)

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project — call it `fms`
3. Copy the **Connection string** (looks like `postgresql://user:pass@host/dbname?sslmode=require`)
4. Keep it handy — you'll paste it into Railway

---

## Step 2 — API Server (Railway)

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **New Project → Deploy from GitHub repo** and select this repo
3. When prompted, set the **root directory** to `artifacts/api-server`
4. Set these environment variables in Railway:
   ```
   DATABASE_URL=   <your Neon connection string>
   PORT=8080
   ALLOWED_ORIGIN= <your Cloudflare Pages URL, e.g. https://fms.frontlineresponse.com>
   ```
5. After first deploy, open a Railway shell and run:
   ```
   pnpm --filter @workspace/db push
   ```
   This creates all the database tables.
6. Railway gives you a URL like `https://fms-api-production.up.railway.app` — copy it.

---

## Step 3 — Frontend (Cloudflare Pages)

1. Go to [pages.cloudflare.com](https://pages.cloudflare.com) and sign in
2. Click **Create a project → Connect to Git** and select this repo
3. Set build settings:
   - **Framework preset:** Vite
   - **Root directory:** `artifacts/fms`
   - **Build command:** `pnpm install && pnpm --filter @workspace/fms run build`
   - **Output directory:** `dist/public`
4. Add environment variable:
   ```
   VITE_API_URL=https://fms-api-production.up.railway.app
   ```
   (use your actual Railway URL from Step 2)
5. Click **Save and Deploy**

---

## Step 4 — Custom Domain

On Cloudflare Pages:
1. Go to your Pages project → **Custom domains**
2. Add `fms.frontlineresponse.com` (or whatever you want)
3. Cloudflare handles the DNS and SSL certificate automatically

For the API, in Railway:
1. Go to your service → **Settings → Domains**
2. Add `api.frontlineresponse.com`
3. Add a CNAME record in Cloudflare DNS pointing to the Railway domain

Then update `ALLOWED_ORIGIN` in Railway to match your final frontend domain.

---

## Environment variable summary

**Cloudflare Pages (frontend):**
| Variable | Value |
|---|---|
| `VITE_API_URL` | Your Railway API URL |

**Railway (backend):**
| Variable | Value |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `PORT` | `8080` |
| `ALLOWED_ORIGIN` | Your Cloudflare Pages / custom frontend URL |

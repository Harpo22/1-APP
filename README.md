# The 1% Operating System

A personal operating system for becoming who you say you want to become — daily execution, weighted discipline scoring, drift detection, a Future Self AI coach, wisdom vault, reality mirror, legacy clock, and more.

- **Frontend:** Vite + React + Tailwind
- **AI:** Google Gemini (free tier), called through a Vercel serverless function so your API key never touches the browser
- **Data:** saved in your browser (localStorage) — fill onboarding once, it persists. Use Settings → Export for backups.

---

## What you need (5 minutes)

1. A free **Google Gemini API key**
2. A free **Vercel** account
3. (Easiest path) a free **GitHub** account

---

## Step 1 — Get your free Gemini key

1. Go to **https://aistudio.google.com/apikey**
2. Sign in with a Google account → **Create API key**
3. Copy the key (looks like `AIza...`). Keep it private — treat it like a password.

The free tier is generous (hundreds–thousands of requests/day), which is far more than one person's daily use of this app.

---

## Step 2 — Deploy to Vercel

### Option A — GitHub + Vercel dashboard (recommended, no terminal)

1. Create a new repository on GitHub and upload this whole folder
   (drag the files into github.com → "Add file" → "Upload files", or push with git).
2. Go to **https://vercel.com** → **Add New… → Project** → **Import** your repo.
3. Vercel auto-detects Vite. Leave the build settings as-is:
   - Framework Preset: **Vite**
   - Build Command: `vite build`  (auto)
   - Output Directory: `dist`  (auto)
4. Before deploying, open **Environment Variables** and add:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** *(paste your key from Step 1)*
5. Click **Deploy**. After ~1 minute you'll get a live URL like
   `https://your-app.vercel.app`.

> If you add the key *after* the first deploy, go to
> **Project → Settings → Environment Variables**, add it, then
> **Deployments → … → Redeploy** so it takes effect.

### Option B — Vercel CLI (terminal)

```bash
npm i -g vercel
cd one-percent-os
vercel            # follow prompts to link/create the project
vercel env add GEMINI_API_KEY      # paste your key when asked
vercel --prod     # deploy to production
```

---

## Step 3 — Add it to your phone's Home Screen

Open your live `https://your-app.vercel.app` URL on your phone:

- **iPhone (Safari):** Share → **Add to Home Screen**
- **Android (Chrome):** menu (⋮) → **Add to Home screen / Install app**

It now opens fullscreen with its own icon, like a native app. Your data stays on that device in the browser.

---

## Running locally (optional)

```bash
npm install
npm run dev          # http://localhost:5173  (UI only)
```

`npm run dev` serves the interface, but the AI endpoint (`/api/ai`) only runs in Vercel's environment. To test the AI features locally, use:

```bash
npm i -g vercel
vercel dev           # runs the frontend AND the /api function together
```

Create a local `.env` (copy `.env.example`) with your `GEMINI_API_KEY` for `vercel dev`.

---

## How the AI works

The browser calls your own endpoint `POST /api/ai` with `{ system, prompt, maxTokens }`.
The serverless function (`api/ai.js`) adds your secret `GEMINI_API_KEY` and forwards the
request to Gemini, then returns `{ text }`. Powers the coach, daily plans, wisdom lessons,
course correction, reality mirror, monthly report, comeback protocol, and future-self letters.

To change the model, set a `GEMINI_MODEL` environment variable (default: `gemini-2.5-flash`).

## Your data

Everything is stored in your browser via `localStorage` under the key `one_percent_os_v1`.
It persists across sessions on that device/browser. **Settings → Export / Backup** downloads
a JSON file; **Import** restores it (also how you move data to another device or browser).

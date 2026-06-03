# Money Operating System

A premium **personal wealth-building operating system** — not a budgeting app. Money OS is a command centre for high performers who want to build wealth, grow a business, and reach financial freedom with discipline and clarity.

Open it and you instantly know whether you're **winning or losing** financially.

- **Frontend:** Vite + React + Tailwind CSS
- **Charts:** Recharts · **Icons:** Lucide
- **Local-first:** everything works offline and is saved in your browser (`localStorage` key `money_os_v1`).
- **Optional cloud:** add Supabase to enable accounts, cross-device sync and a cloud backup of your data.
- **Design:** premium dark mode, glassmorphism cards, smooth animations, mobile-first.

---

## Features

- **Mission Control** — a customisable KPI command centre, the **CEO Daily Brief** (your chosen headline metrics, business metrics, priority goals & alerts), a **Financial Freedom Tracker**, and your **Future Self** vision.
- **Owner Control Centre** — *the brain*. Manually control every number: current holdings & debts, dedicated funds, a net-worth override, monthly targets, freedom settings, the full business control centre (cash, goals, editable revenue sources / expense categories / business assets), unlimited legacy goals, **drag-and-drop Mission Control cards** (show/hide/reorder) and **Daily Brief customisation**.
- **Personal** — dashboard metrics, monthly progress trackers, transaction tracking (add / edit / delete) and the **Wasted Money System**.
- **Business** — fully separate finances, a lightweight pipeline CRM, revenue/expense breakdowns, recurring revenue, tax reserve and growth score.
- **Legacy Building** — net worth tracker with history graph, the **Wealth Score**, the **Monthly Wealth Ranking** (A+ → D, stored forever) and visual goals.
- **Monthly Reviews** — auto-generated wins, areas to improve and three next-month priorities.
- **Analytics** — spending, savings, revenue, profit, net worth, waste & lead trends with Week / Month / Quarter / Year filters.
- **Account & Data** — *the memory*. Cloud sign up / log in / log out / reset password / change email & password, live **sync status**, the **snapshot system** (automatic monthly / quarterly / yearly safety nets you can restore), CSV + full JSON export/import, reset and delete.

Everything you enter in the **Owner Control Centre** flows through every dashboard, tracker, report, projection, ranking, alert and score — no hardcoded figures. Realistic demo data is only used on first launch.

---

## Data, ownership & sync

- **You own all your data.** Export a full JSON backup or a CSV of transactions at any time; the app never locks you in.
- **Local-only mode (default):** data is stored in your browser and survives reloads. Use Account & Data → Export for backups.
- **Cloud mode (optional):** when configured, your account becomes the source of truth. Changes auto-save and sync; offline edits are cached locally and pushed when you reconnect. A single per-user JSON document is upserted, so syncing never creates duplicate records.
- **Snapshots:** monthly, quarterly and yearly snapshots are captured automatically (plus manual ones) so you can restore a previous financial state as a safety net.

### Enable cloud accounts (Supabase)

1. Create a free project at [supabase.com](https://supabase.com).
2. In **Project → SQL**, run [`supabase/schema.sql`](supabase/schema.sql). It creates the `app_data` table and Row-Level-Security policies so each user can only access their own data.
3. Copy `.env.example` to `.env` and set:
   - `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (from **Project → Settings → API**).
4. Rebuild/redeploy. The **Account & Data** page now offers sign up / log in and live sync.

Without these variables the app runs perfectly in local-only mode.

---

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
```

Build for production:

```bash
npm run build    # outputs to dist/
npm run preview
```

## Deploy

It's a static site — deploy `dist/` anywhere (Vercel, Netlify, Cloudflare Pages). On Vercel it auto-detects Vite (build `vite build`, output `dist`). Add the two `VITE_SUPABASE_*` env vars there to enable cloud sync. On your phone, use **Add to Home Screen** to run it full-screen like a native app.

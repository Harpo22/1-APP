# Money Operating System

A premium **personal wealth-building operating system** — not a budgeting app. Money OS is a command centre for high performers who want to build wealth, grow a business, and reach financial freedom with discipline and clarity.

Open it and you instantly know whether you're **winning or losing** financially.

- **Frontend:** Vite + React + Tailwind CSS
- **Charts:** Recharts · **Icons:** Lucide
- **Data:** 100% local — everything is saved in your browser via `localStorage` (key `money_os_v1`). No backend, no accounts, no tracking.
- **Design:** premium dark mode, glassmorphism cards, smooth animations, mobile-first.

---

## Features

- **Mission Control** — KPI command centre (net worth, freedom %, wealth score, income, revenue, savings, wasted money, profit, cash), a Financial Freedom Tracker with milestones & estimated completion, a Red-Flag Alert System, and your Future Self vision.
- **Personal** — dashboard metrics, monthly progress trackers (spending / fuel / bills / savings / investments / waste), full transaction tracking (add / edit / delete) and the **Wasted Money System** with reflection prompts and trigger analysis.
- **Business** — fully separate finances, a lightweight **pipeline CRM** (leads → sales → revenue), revenue & expense category breakdowns, recurring revenue, tax reserve and a growth score.
- **Legacy Building** — net worth tracker with history graph, the **Wealth Score** system (0–100), the **Monthly Wealth Ranking** (graded A+ → D, stored forever) and visual legacy goals.
- **Monthly Reviews** — auto-generated wins, areas to improve and three next-month priorities.
- **Analytics** — spending, savings, revenue, profit, net worth, waste & lead trends with Week / Month / Quarter / Year filters.
- **Settings** — profile, currency, freedom targets, budgets, business goals and full **data management**: export JSON backup, export CSV, import/restore, reset to demo and clear all.

The app ships with **realistic demo data** across every section so it feels alive the moment you open it.

---

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
```

Build for production:

```bash
npm run build    # outputs to dist/
npm run preview  # preview the production build
```

## Deploy

It's a static site — deploy the `dist/` folder anywhere (Vercel, Netlify, GitHub Pages, Cloudflare Pages). On Vercel it auto-detects Vite (build `vite build`, output `dist`).

### Add to your phone

Open the deployed URL on your phone and use **Add to Home Screen**. It runs full-screen like a native app and your data stays on that device.

---

## Your data

Everything lives in your browser under `localStorage` key `money_os_v1`. Use **Settings → Backup (Export JSON)** to download a backup and **Restore / Import** to move it to another device or browser. **Export CSV** gives you a spreadsheet of every transaction.

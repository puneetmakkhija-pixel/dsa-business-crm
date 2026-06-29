# DSA Business CRM — Command Center

A premium, dark-themed command center for a DSA (Direct Selling Agent) loan
business. It surfaces month-over-month disbursal trends, lender mix, top DSA
partners by volume, and the cases/invoices that need attention.

Built with **Next.js 14 (App Router) + React + TypeScript + Tailwind CSS**, with
charts rendered by **Chart.js** and data served live from **Supabase**.
Implemented from the Claude Design handoff `DSA CRM Premium.dc.html`.

**Live:** https://dsa-business-crm.vercel.app
**Source:** https://github.com/puneetmakkhija-pixel/dsa-business-crm

## What's on the dashboard

- **KPI row** — Disbursed (May), Net BL Margin, DSA Payout, Avg Payout, each with
  a delta chip and context line.
- **Disbursed Volume & Payout** — combined bar (disbursed ₹Cr) + line (DSA payout
  ₹L) chart across a trailing 8 months, with PEAK and FY-disbursed callouts.
- **Lender Split** — doughnut chart of May disbursal across 9 lenders.
- **Top DSA Partners** — leaderboard by disbursed volume with margin and a
  gradient progress bar per partner.
- **Needs Attention** — alert list for MIS mismatches, margin loss, pending
  payouts, and unmatched billing.

## Run it

```bash
npm install
cp .env.example .env.local   # optional — code falls back to the same values
npm run dev
```

Open http://localhost:3000. The layout is designed for a desktop width (~1440px).

## Data & deployment

- **Database:** Supabase project `smecircle`, isolated `dsa` schema (tables
  `kpis`, `lenders`, `partners`, `monthly_trend`, `alerts`). RLS is enabled with
  select-only policies, so the publishable/anon key is safe to expose.
- **Fetching:** [`app/page.tsx`](app/page.tsx) is an async server component
  (`force-dynamic`) that calls `getDashboardData()` in
  [`lib/dashboard-data.ts`](lib/dashboard-data.ts), which reads the `dsa` tables
  via the Supabase client in [`lib/supabase.ts`](lib/supabase.ts). Edit a row in
  Supabase and it shows on the next request.
- **Hosting:** Vercel, connected to this GitHub repo — every push to `main`
  auto-deploys. Supabase env vars are configured for production/preview/development.

## Project structure

```
app/
  layout.tsx                Root layout — Inter + Sora fonts, dark theme
  page.tsx                  Async server component — fetches from Supabase
  globals.css               Tailwind + base styles, scrollbar, riseIn keyframe
components/dashboard/
  Dashboard.tsx             Page composition (sidebar + main grid)
  Sidebar.tsx               Slim icon rail
  TopBar.tsx                Greeting, search, month selector
  KpiCards.tsx              Hero KPI row
  Panel.tsx                 Shared frosted card surface
  TrendChart.tsx            Bar + line chart (client, Chart.js)
  DonutChart.tsx            Lender-split doughnut (client, Chart.js)
  VendorLeaderboard.tsx     Top DSA partners
  AlertsPanel.tsx           Needs-attention list
  Icon.tsx                  Stroked line-icon helper
lib/
  supabase.ts               Supabase client (dsa schema, read-only)
  dashboard-data.ts         Types + getDashboardData() — fetch & map DB rows
```

The components are presentational and receive data via props, so the data source
is fully isolated in `lib/`. To change what the dashboard shows, edit the rows in
the Supabase `dsa` tables — no code change needed.

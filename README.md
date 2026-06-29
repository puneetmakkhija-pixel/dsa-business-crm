# DSA Business CRM — Command Center

A premium, dark-themed command center for a DSA (Direct Selling Agent) loan
business. It surfaces month-over-month disbursal trends, lender mix, top DSA
partners by volume, and the cases/invoices that need attention.

Built with **Next.js 14 (App Router) + React + TypeScript + Tailwind CSS**, with
charts rendered by **Chart.js**. Implemented from the Claude Design handoff
`DSA CRM Premium.dc.html`.

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
npm run dev
```

Open http://localhost:3000. The layout is designed for a desktop width (~1440px).

## Project structure

```
app/
  layout.tsx                Root layout — Inter + Sora fonts, dark theme
  page.tsx                  Renders the Dashboard
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
  dashboard-data.ts         All dashboard data + derived view-models
```

## Data

All figures live in [`lib/dashboard-data.ts`](lib/dashboard-data.ts), ported from
the design mock. Swap these arrays for live API/CRM data to make the dashboard
real — the components are otherwise presentational.

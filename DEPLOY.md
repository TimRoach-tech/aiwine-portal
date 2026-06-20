# AIWine Winery Portal — what it is & how to take it live

`portal.aiwine.co.nz` — the dashboard a winery logs into to manage their range,
see orders, and watch how customers are discovering their wines on AIWine.

## What's built (demo)
A complete, themed dashboard running on **sample data** in the browser:
- **Dashboard** — stock alerts, new orders, scans this week, 30-day revenue, live activity feed, where the wine travels
- **My Wines** — table with **inline stock steppers + price editing** (changes "sync to AIWine"), add-wine modal, remove
- **Orders** — incoming orders to fulfil → start packing → mark shipped (with a Shipped tab)
- **Upload list** — drag/drop **CSV** (auto-detects name/variety/vintage/price/stock columns) → preview (matches vs new) → confirm. Excel (.xlsx) prompts to export CSV for the demo; the live portal reads .xlsx directly.
- **Insights** — scans sparkline, top Sommelier asks that found them, most-scanned wines
- **Integrations** — CSV upload / live dashboard (now) + API/EPOS sync (coming soon) + link to the winery app
- AIWine theme (claret/bone/brass), Cormorant + Manrope + JetBrains Mono, vine-leaf graphics

## Going live (Vercel + Supabase — same stack as the CRM)
The portal is **a sibling of the CRM**: same database, different audience (wineries, not staff).

1. **Host on Vercel** (new project) pointed at `portal.aiwine.co.nz`. Static front-end + serverless API like the CRM.
2. **Use the SAME Supabase database** as the CRM. The portal reads/writes the shared `wineries` / `wines` / `orders` tables, so:
   - a winery edits stock here → it greys out in the consumer app + shop instantly
   - your team sees the same data in the CRM
3. **Auth = Supabase, scoped per winery (CRITICAL).** Unlike the CRM (staff see everything), each winery must see **only their own** wines and orders. This needs **Row-Level Security keyed to the winery**:
   - each winery login maps to a `wineryId`
   - RLS policies: `using (wineryId = auth_winery())` on wines/orders
   - this is the single most important security task — a winery must never see another winery's data
4. **Swap the demo data layer** in `portal.js` (the `WINES` / `ORDERS` arrays) for Supabase reads/writes — mirror the CRM's `store.js` pattern.
5. **CSV/Excel** — wire the confirm step to write rows to Supabase; add an .xlsx parser (SheetJS) for native Excel.

## DNS
Cloudflare → `portal` CNAME → `cname.vercel-dns.com` (grey cloud), then add the domain in the Vercel project — exactly like `crm.aiwine.co.nz`.

## Relationship to the other surfaces
- **wineries.aiwine.co.nz** (marketing) → "Log in" → **portal.aiwine.co.nz** (this)
- **winery app** (`apps/winery/`) = the phone companion, same login + data
- **crm.aiwine.co.nz** = your staff view of the same database

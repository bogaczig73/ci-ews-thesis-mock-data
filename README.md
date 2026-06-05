# EWS Mock Data Hub

Unified, editable, **synthetic** stand-in for every external data source the EWS
Power Automate flows consume. Each public endpoint mirrors the *shape* of the real
source it replaces. Backed by **Neon Postgres** (no Vercel Blob → no stale-read lag).

**Live:** https://mock-data-hub.vercel.app

## Sources mocked

| Source | Adapter / WF | Endpoint (public, source-shaped) | Format |
|---|---|---|---|
| Sreality (listings) | WF A | `GET /cs/v2/estates`, `/cs/v2/estates/{hash_id}` | JSON / HAL |
| Sreality (seller) | — | `GET /cs/v2/seller/{user_id}` | JSON |
| PSP.cz | WF B | `GET /rss/psp` (alias `/rss/tisky.rss`) | RSS 2.0 |
| MMR | WF B | `GET /rss/mmr` | RSS 2.0 |
| ČSÚ | WF C | `GET /rss/csu` | RSS 2.0 |
| ČNB | WF C | `GET /rss/cnb` | RSS 2.0 |
| ARES | (enrichment) | `POST /ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/vyhledat`, `GET .../{ico}` | JSON REST |

> ISIR (SOAP) is intentionally **not** mocked here — see the canonical adapter spec.

### Sreality filters
`category_main_cb`, `category_type_cb`, `company`, `locality`,
`czk_price_summary_order2_from`/`_to`, plus `per_page` (≤100) and `page`.

### ARES behaviour
A filter-only query (no `obchodniJmeno` / `ico` / `czNace`) returns
`VSTUP_PRAZDNY` (HTTP 400), matching the real ARES constraint.

## Editor

Browser UI for full CRUD over every source: `/listings`, `/agencies`, `/sellers`,
`/rss`, `/ares`. Edits are live on the public endpoints immediately.
Editor HTTP API lives under `/api/*` — see `/api-docs`.

## Storage

Neon Postgres project `mock-data-hub` (`calm-math-98688080`). Tables: `agencies`,
`listings`, `sellers`, `rss_channels`, `rss_items`, `economic_subjects`.
Connection via `DATABASE_URL` (set in Vercel env + local `.env.local`).

## Local dev

```bash
npm install
npm run seed     # (re)loads the DB from /data snapshots — clears existing rows first
npm run dev
```

`/data` holds the source snapshots: `estates.json`, `seller.json`,
`psp_tisky.rss` (windows-1250), `mmr_rss.xml`, and the hand-authored
`csu_rss.json`, `cnb_rss.json`, `ares.json`.

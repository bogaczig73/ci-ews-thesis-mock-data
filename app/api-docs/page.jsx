import { Icon } from '../_components/icons.jsx';

function Row({ m, path, note }) {
  const color = { GET: 'bg-emerald-50 text-emerald-700', POST: 'bg-amber-50 text-amber-700', PATCH: 'bg-sky-50 text-sky-700', DELETE: 'bg-rose-50 text-rose-700', '*': 'bg-slate-100 text-slate-600' };
  return (
    <div className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
      <span className={`badge font-mono ${color[m] || color['*']}`}>{m}</span>
      <div className="min-w-0">
        <code className="text-[13px] text-slate-700 break-all">{path}</code>
        {note && <p className="text-xs text-slate-400 mt-0.5">{note}</p>}
      </div>
    </div>
  );
}

function Section({ icon, title, accent, children }) {
  const I = Icon[icon];
  return (
    <section className="card p-6">
      <h2 className="font-semibold flex items-center gap-2 mb-3">
        <span className={`grid place-items-center w-8 h-8 rounded-lg ${accent}`}><I className="w-4 h-4" /></span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function ApiDocs() {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-indigo-500">Reference</div>
        <h1 className="text-2xl font-bold tracking-tight">API reference</h1>
        <p className="text-slate-500 mt-1">Every endpoint mirrors the shape of the real source it stands in for. All data is synthetic and lives in Neon Postgres.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Section icon="building" title="Sreality (JSON / HAL)" accent="bg-emerald-100 text-emerald-700">
          <Row m="GET" path="/cs/v2/estates" note="filters: category_main_cb, category_type_cb, company, locality, czk_price_summary_order2_from/_to · per_page (≤100), page" />
          <Row m="GET" path="/cs/v2/estates/{hash_id}" />
          <Row m="GET" path="/cs/v2/seller/{user_id}" />
        </Section>

        <Section icon="rss" title="RSS feeds (RSS 2.0 XML)" accent="bg-blue-100 text-blue-700">
          <Row m="GET" path="/rss/psp" note="also /rss/tisky.rss" />
          <Row m="GET" path="/rss/mmr" />
          <Row m="GET" path="/rss/csu" />
          <Row m="GET" path="/rss/cnb" />
          <Row m="GET" path="/rss/{source}/m{n}[/w{n}[/d{n}]]" note="filter by month / week-of-month / day-of-week. e.g. /rss/psp/m6/w1/d4 = 4 Jun · /rss/psp/m6/w1 = Jun 1–7 · /rss/all/m6 = all feeds, June. ?year=2026 · ?format=json" />
        </Section>

        <Section icon="briefcase" title="ARES (JSON REST)" accent="bg-cyan-100 text-cyan-700">
          <Row m="POST" path="/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/vyhledat" note="body { obchodniJmeno?, ico?, czNace?, start?, pocet? } · empty query → VSTUP_PRAZDNY, like real ARES" />
          <Row m="GET" path="/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/{ico}" />
        </Section>

        <Section icon="db" title="ČNB (JSON REST)" accent="bg-rose-100 text-rose-700">
          <Row m="GET" path="/cnbapi/pribor/daily" note="PRIBOR fixings · filters: from, to (YYYY-MM-DD) · date= shorthand for a single day" />
          <Row m="GET" path="/cnbapi/omo/daily" note="open-market operations · filters: from, to (YYYY-MM-DD) · date= shorthand" />
        </Section>

        <Section icon="code" title="Editor API (used by this UI)" accent="bg-indigo-100 text-indigo-700">
          <Row m="GET" path="/api/store" note="counts across all sources" />
          <Row m="*" path="/api/listings · /api/listings/{hash_id} · /api/listings/bulk" />
          <Row m="*" path="/api/agencies · /api/agencies/{id}" />
          <Row m="*" path="/api/sellers · /api/sellers/{id}" />
          <Row m="*" path="/api/rss/{source} · /api/rss/items/{id}" />
          <Row m="*" path="/api/ares · /api/ares/{ico}" />
          <Row m="*" path="/api/cnb/pribor · /api/cnb/pribor/{id}" />
          <Row m="*" path="/api/cnb/omo · /api/cnb/omo/{id}" />
        </Section>
      </div>
    </div>
  );
}

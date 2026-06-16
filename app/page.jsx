import Link from 'next/link';
import { sql } from '@/lib/db.js';
import { Icon } from './_components/icons.jsx';

export const dynamic = 'force-dynamic';

const SREALITY = [
  { key: 'listings', label: 'Listings', href: '/listings', icon: 'building', accent: 'from-emerald-500 to-teal-600', ring: 'ring-emerald-100' },
  { key: 'agencies', label: 'Agencies', href: '/agencies', icon: 'users', accent: 'from-sky-500 to-blue-600', ring: 'ring-sky-100' },
  { key: 'sellers', label: 'Sellers', href: '/sellers', icon: 'user', accent: 'from-violet-500 to-purple-600', ring: 'ring-violet-100' },
  { key: 'ares', label: 'ARES subjects', href: '/ares', icon: 'briefcase', accent: 'from-cyan-500 to-sky-600', ring: 'ring-cyan-100' },
];

const FEEDS = [
  { key: 'psp', label: 'PSP.cz', sub: 'Sněmovní tisky', dot: 'bg-blue-500' },
  { key: 'mmr', label: 'MMR', sub: 'Novinky', dot: 'bg-amber-500' },
  { key: 'csu', label: 'ČSÚ', sub: 'Rychlé informace', dot: 'bg-violet-500' },
  { key: 'cnb', label: 'ČNB', sub: 'Tiskové zprávy', dot: 'bg-rose-500' },
];

export default async function HomePage() {
  const [listings, agencies, sellers, ares, rss, pribor, omo] = await Promise.all([
    sql`SELECT count(*)::int AS n FROM listings`,
    sql`SELECT count(*)::int AS n FROM agencies`,
    sql`SELECT count(*)::int AS n FROM sellers`,
    sql`SELECT count(*)::int AS n FROM economic_subjects`,
    sql`SELECT source, count(*)::int AS n FROM rss_items GROUP BY source`,
    sql`SELECT count(*)::int AS n FROM cnb_pribor`,
    sql`SELECT count(*)::int AS n FROM cnb_omo`,
  ]);
  const counts = { listings: listings[0].n, agencies: agencies[0].n, sellers: sellers[0].n, ares: ares[0].n };
  const rssCounts = Object.fromEntries(rss.map((r) => [r.source, r.n]));
  const rssTotal = rss.reduce((a, r) => a + r.n, 0);
  const cnb = { pribor: pribor[0].n, omo: omo[0].n };

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl p-8 md:p-10 text-white shadow-lg"
        style={{ backgroundImage: 'linear-gradient(135deg,#4f46e5 0%,#6366f1 45%,#0ea5e9 100%)' }}>
        <div className="absolute -right-10 -top-16 w-72 h-72 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute right-24 bottom-[-4rem] w-56 h-56 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 text-xs font-medium bg-white/15 rounded-full px-3 py-1 backdrop-blur">
            <Icon.spark className="w-3.5 h-3.5" /> Synthetic · Neon-backed · live
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mt-4 tracking-tight">EWS Mock Data Hub</h1>
          <p className="text-white/85 mt-2 max-w-2xl">
            One editable stand-in for every external source the Power Automate flows consume —
            Sreality, four RSS feeds, and ARES. Edit anything here and it’s live on the public
            endpoints instantly.
          </p>
          <div className="flex flex-wrap gap-2 mt-5">
            <Link href="/listings" className="btn bg-white text-indigo-700 hover:bg-indigo-50">
              <Icon.building className="w-4 h-4" /> Manage listings
            </Link>
            <Link href="/api-docs" className="btn bg-white/15 text-white hover:bg-white/25 backdrop-blur">
              <Icon.code className="w-4 h-4" /> API reference
            </Link>
          </div>
        </div>
      </section>

      {/* Sreality + ARES stats */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Sources</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {SREALITY.map((c) => {
            const I = Icon[c.icon];
            return (
              <Link key={c.key} href={c.href} className={`card card-hover p-5 ring-1 ${c.ring}`}>
                <div className={`grid place-items-center w-11 h-11 rounded-xl bg-gradient-to-br ${c.accent} text-white shadow-sm`}>
                  <I className="w-5 h-5" />
                </div>
                <div className="text-3xl font-bold mt-4 tabular-nums">{counts[c.key]}</div>
                <div className="text-sm text-slate-500">{c.label}</div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* RSS feeds */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">RSS feeds</h2>
          <span className="text-xs text-slate-400">{rssTotal} items total</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {FEEDS.map((f) => (
            <Link key={f.key} href={`/rss?source=${f.key}`} className="card card-hover p-5">
              <div className="flex items-center justify-between">
                <span className={`w-2.5 h-2.5 rounded-full ${f.dot}`} />
                <Icon.rss className="w-4 h-4 text-slate-300" />
              </div>
              <div className="text-3xl font-bold mt-3 tabular-nums">{rssCounts[f.key] ?? 0}</div>
              <div className="text-sm font-medium text-slate-700">{f.label}</div>
              <div className="text-xs text-slate-400">{f.sub}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ČNB rates */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">ČNB rates</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/cnb" className="card card-hover p-5 ring-1 ring-rose-100">
            <div className="grid place-items-center w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-sm">
              <Icon.db className="w-5 h-5" />
            </div>
            <div className="text-3xl font-bold mt-4 tabular-nums">{cnb.pribor}</div>
            <div className="text-sm font-medium text-slate-700">PRIBOR fixings</div>
            <div className="text-xs text-slate-400">/cnbapi/pribor/daily</div>
          </Link>
          <Link href="/cnb" className="card card-hover p-5 ring-1 ring-rose-100">
            <div className="grid place-items-center w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-sm">
              <Icon.db className="w-5 h-5" />
            </div>
            <div className="text-3xl font-bold mt-4 tabular-nums">{cnb.omo}</div>
            <div className="text-sm font-medium text-slate-700">Open-market ops</div>
            <div className="text-xs text-slate-400">/cnbapi/omo/daily</div>
          </Link>
        </div>
      </section>

      {/* Endpoints */}
      <section className="card p-6">
        <h2 className="font-semibold flex items-center gap-2">
          <Icon.code className="w-4 h-4 text-indigo-500" /> Source-shaped public endpoints
        </h2>
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-2 mt-4 text-sm">
          {[
            ['GET', '/cs/v2/estates?company=10628&per_page=5'],
            ['GET', '/cs/v2/estates/4070023244'],
            ['GET', '/cs/v2/seller/197380'],
            ['GET', '/rss/psp · /rss/mmr · /rss/csu · /rss/cnb'],
            ['POST', '/ekonomicke-subjekty-v-be/rest/.../vyhledat'],
            ['GET', '/ekonomicke-subjekty-v-be/rest/.../27531241'],
            ['GET', '/cnbapi/pribor/daily?date=2026-06-03'],
            ['GET', '/cnbapi/omo/daily'],
          ].map(([m, path]) => (
            <div key={path} className="flex items-center gap-2.5 py-1">
              <span className={`badge font-mono ${m === 'GET' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{m}</span>
              <code className="text-slate-600 text-[13px] truncate">{path}</code>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

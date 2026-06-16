import { sql } from '@/lib/db.js';

export const dynamic = 'force-dynamic';

// Counts snapshot across every mocked source — powers the dashboard.
export async function GET() {
  const [listings, agencies, sellers, ares, rss, pribor, omo] = await Promise.all([
    sql`SELECT count(*)::int AS n FROM listings`,
    sql`SELECT count(*)::int AS n FROM agencies`,
    sql`SELECT count(*)::int AS n FROM sellers`,
    sql`SELECT count(*)::int AS n FROM economic_subjects`,
    sql`SELECT source, count(*)::int AS n FROM rss_items GROUP BY source`,
    sql`SELECT count(*)::int AS n FROM cnb_pribor`,
    sql`SELECT count(*)::int AS n FROM cnb_omo`,
  ]);
  const rssCounts = Object.fromEntries(rss.map((r) => [r.source, r.n]));
  return Response.json({
    listings: listings[0].n,
    agencies: agencies[0].n,
    sellers: sellers[0].n,
    ares: ares[0].n,
    rss: rssCounts,
    cnb: { pribor: pribor[0].n, omo: omo[0].n },
  });
}

import { getChannel, getItemsInRange, renderRss, parsePeriod, periodRange, RSS_SOURCES } from '@/lib/rss.js';

export const dynamic = 'force-dynamic';

const cors = { 'Access-Control-Allow-Origin': '*' };

// /rss/{source}/m{n}[/w{n}[/d{n}]] — feed filtered to a month / week-of-month / day-of-week.
// source: psp | mmr | csu | cnb | all.  ?year=2026  ?format=json
export async function GET(request, { params }) {
  let { source, period } = await params;
  if (source === 'tisky.rss' || source === 'tisky') source = 'psp';
  source = String(source).toLowerCase();

  const valid = [...RSS_SOURCES, 'all'];
  if (!valid.includes(source)) {
    return Response.json({ error: `Unknown source "${source}". Available: ${valid.join(', ')}` }, { status: 404, headers: cors });
  }

  const parsed = parsePeriod(period || []);
  if (parsed.error) return Response.json({ error: parsed.error }, { status: 400, headers: cors });

  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get('year')) || new Date().getUTCFullYear();

  const range = periodRange(year, parsed);
  if (range.error) return Response.json({ error: range.error }, { status: 400, headers: cors });

  const items = await getItemsInRange({ source, start: range.start, end: range.end });

  if (searchParams.get('format') === 'json') {
    return Response.json(
      { source, period: range.label, from: range.start, to: range.end, count: items.length, items },
      { headers: cors },
    );
  }

  const channel = source === 'all'
    ? { source: 'all', title: `EWS feeds — ${range.label}`, link: '/rss/all', description: `All RSS sources, ${range.label}`, language: 'cs' }
    : { ...(await getChannel(source)), title: `${(await getChannel(source))?.title ?? source} — ${range.label}` };

  return new Response(renderRss(channel, items), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'no-store', ...cors },
  });
}

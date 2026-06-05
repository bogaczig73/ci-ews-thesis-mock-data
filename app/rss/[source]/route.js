import { getChannel, getItems, renderRss, RSS_SOURCES } from '@/lib/rss.js';

export const dynamic = 'force-dynamic';

// Serves an RSS 2.0 feed for psp | mmr | csu | cnb.
// PSP's real feed lives at /rss/tisky.rss; we also accept /rss/psp.
export async function GET(_request, { params }) {
  let { source } = await params;
  if (source === 'tisky.rss' || source === 'tisky') source = 'psp';
  source = String(source).toLowerCase();

  if (!RSS_SOURCES.includes(source)) {
    return new Response(`Unknown RSS source "${source}". Available: ${RSS_SOURCES.join(', ')}`, {
      status: 404,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }

  const channel = await getChannel(source);
  const items = await getItems(source, 200);
  const xml = renderRss(channel, items);

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    },
  });
}

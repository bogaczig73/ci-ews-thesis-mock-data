import { getItems, createItem, RSS_SOURCES } from '@/lib/rss.js';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const { source } = await params;
  if (!RSS_SOURCES.includes(source)) {
    return Response.json({ error: `unknown source ${source}` }, { status: 404 });
  }
  return Response.json(await getItems(source, 500));
}

export async function POST(request, { params }) {
  const { source } = await params;
  if (!RSS_SOURCES.includes(source)) {
    return Response.json({ error: `unknown source ${source}` }, { status: 404 });
  }
  const body = await request.json();
  const created = await createItem({ ...body, source });
  return Response.json(created, { status: 201 });
}

import { updateItem, deleteItem } from '@/lib/rss.js';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  const { id } = await params;
  const patch = await request.json();
  const updated = await updateItem(id, patch);
  return updated ? Response.json(updated) : Response.json({ error: 'not found' }, { status: 404 });
}

export async function DELETE(_request, { params }) {
  const { id } = await params;
  await deleteItem(id);
  return Response.json({ ok: true });
}

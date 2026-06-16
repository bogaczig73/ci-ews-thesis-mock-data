import { getPriborRow, updatePribor, deletePribor } from '@/lib/cnb.js';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const { id } = await params;
  const row = await getPriborRow(id);
  return row ? Response.json(row) : Response.json({ error: 'not found' }, { status: 404 });
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const updated = await updatePribor(id, await request.json());
  return updated ? Response.json(updated) : Response.json({ error: 'not found' }, { status: 404 });
}

export async function DELETE(_request, { params }) {
  const { id } = await params;
  await deletePribor(id);
  return Response.json({ ok: true });
}

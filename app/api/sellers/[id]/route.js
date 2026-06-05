import { getSeller, deleteSeller } from '@/lib/sellers.js';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const { id } = await params;
  const s = await getSeller(id);
  return s ? Response.json(s) : Response.json({ error: 'not found' }, { status: 404 });
}

export async function DELETE(_request, { params }) {
  const { id } = await params;
  await deleteSeller(id);
  return Response.json({ ok: true });
}

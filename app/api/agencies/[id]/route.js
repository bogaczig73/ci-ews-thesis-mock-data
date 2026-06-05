import { updateAgency, deleteAgency } from '@/lib/listings.js';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  const { id } = await params;
  const patch = await request.json();
  const updated = await updateAgency(id, patch);
  return updated ? Response.json(updated) : Response.json({ error: 'not found' }, { status: 404 });
}

export async function DELETE(_request, { params }) {
  const { id } = await params;
  const res = await deleteAgency(id);
  return res.error ? Response.json(res, { status: 409 }) : Response.json(res);
}

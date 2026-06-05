import { getListing, updateListing, deleteListing } from '@/lib/listings.js';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const { hash_id } = await params;
  const l = await getListing(hash_id);
  return l ? Response.json(l) : Response.json({ error: 'not found' }, { status: 404 });
}

export async function PATCH(request, { params }) {
  const { hash_id } = await params;
  const patch = await request.json();
  const updated = await updateListing(hash_id, patch);
  return updated ? Response.json(updated) : Response.json({ error: 'not found' }, { status: 404 });
}

export async function DELETE(_request, { params }) {
  const { hash_id } = await params;
  await deleteListing(hash_id);
  return Response.json({ ok: true });
}

import { getSubject, updateSubject, deleteSubject } from '@/lib/ares.js';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const { ico } = await params;
  const s = await getSubject(ico);
  return s ? Response.json(s) : Response.json({ error: 'not found' }, { status: 404 });
}

export async function PATCH(request, { params }) {
  const { ico } = await params;
  const patch = await request.json();
  const updated = await updateSubject(ico, patch);
  return updated ? Response.json(updated) : Response.json({ error: 'not found' }, { status: 404 });
}

export async function DELETE(_request, { params }) {
  const { ico } = await params;
  await deleteSubject(ico);
  return Response.json({ ok: true });
}

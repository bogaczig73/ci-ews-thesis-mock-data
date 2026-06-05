import { updateListing, deleteListing } from '@/lib/listings.js';

export const dynamic = 'force-dynamic';

// Body: { hash_ids: [...], action: 'patch' | 'delete', patch?: {...} }
export async function POST(request) {
  const { hash_ids, action, patch } = await request.json();
  if (!Array.isArray(hash_ids) || hash_ids.length === 0) {
    return Response.json({ error: 'hash_ids must be a non-empty array' }, { status: 400 });
  }

  let affected = 0;
  if (action === 'delete') {
    for (const id of hash_ids) { await deleteListing(id); affected++; }
  } else if (action === 'patch') {
    if (!patch || typeof patch !== 'object') {
      return Response.json({ error: 'patch object required for action=patch' }, { status: 400 });
    }
    for (const id of hash_ids) { if (await updateListing(id, patch)) affected++; }
  } else {
    return Response.json({ error: "action must be 'patch' or 'delete'" }, { status: 400 });
  }
  return Response.json({ ok: true, affected });
}

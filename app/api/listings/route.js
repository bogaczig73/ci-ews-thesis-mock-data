import { getAllListings, createListing } from '@/lib/listings.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json(await getAllListings());
}

export async function POST(request) {
  const body = await request.json();
  if (body.hash_id == null) {
    return Response.json({ error: 'hash_id is required' }, { status: 400 });
  }
  try {
    const created = await createListing(body);
    return Response.json(created, { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 400 });
  }
}

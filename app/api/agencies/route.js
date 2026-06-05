import { getAgencies, createAgency, agencyListingCounts } from '@/lib/listings.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [agencies, counts] = await Promise.all([getAgencies(), agencyListingCounts()]);
  return Response.json(agencies.map((a) => ({ ...a, listing_count: counts[a.id] ?? 0 })));
}

export async function POST(request) {
  const body = await request.json();
  if (body.id == null || !body.name) {
    return Response.json({ error: 'id and name are required' }, { status: 400 });
  }
  try {
    return Response.json(await createAgency(body), { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 400 });
  }
}

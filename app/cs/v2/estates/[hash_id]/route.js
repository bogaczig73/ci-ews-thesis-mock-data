import { getListing, getAgencies, denormaliseListing } from '@/lib/listings.js';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const { hash_id } = await params;
  const listing = await getListing(hash_id);

  if (!listing) {
    return Response.json(
      { code: 404, message: `Estate ${hash_id} not found in mock dataset` },
      { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } },
    );
  }
  const agencies = await getAgencies();
  const agencyMap = Object.fromEntries(agencies.map((a) => [a.id, a]));
  return Response.json(denormaliseListing(listing, agencyMap), {
    headers: { 'Content-Type': 'application/hal+json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
  });
}

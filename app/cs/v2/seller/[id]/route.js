import { getSeller } from '@/lib/sellers.js';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const { id } = await params;
  const seller = await getSeller(id);

  if (!seller) {
    return Response.json(
      { code: 404, message: `Seller ${id} not found in mock dataset` },
      { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } },
    );
  }
  return Response.json(seller, {
    headers: { 'Content-Type': 'application/hal+json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
  });
}

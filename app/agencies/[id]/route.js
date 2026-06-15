import { getAgencyDetail } from '@/lib/listings.js';

export const dynamic = 'force-dynamic';

// Company detail at GET /agencies/{id} — includes ICO (the list omits it).
// Mirrors /api/agencies/{id}.
export async function GET(_request, { params }) {
  const { id } = await params;
  const detail = await getAgencyDetail(id);
  return detail
    ? Response.json(detail, { headers: { 'Access-Control-Allow-Origin': '*' } })
    : Response.json({ error: 'not found' }, { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } });
}

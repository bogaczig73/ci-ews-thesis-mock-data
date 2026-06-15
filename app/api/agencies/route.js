import { getAgencies, getAgenciesPage, createAgency, agencyListingCounts } from '@/lib/listings.js';

export const dynamic = 'force-dynamic';

// Max page size — simulates a real paginated "companies" API that never dumps all rows.
const PER_PAGE_CAP = 5;

const toInt = (v) => {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const counts = await agencyListingCounts();
  const withCount = (a) => ({ ...a, listing_count: counts[a.id] ?? 0 });

  // No paging params → full array (back-compatible; used by the listings name map).
  if (!searchParams.has('page') && !searchParams.has('per_page')) {
    const agencies = await getAgencies();
    return Response.json(agencies.map(withCount));
  }

  // Paginated mode → envelope with metadata, per_page capped at 5.
  const perPage = Math.min(Math.max(toInt(searchParams.get('per_page')) ?? PER_PAGE_CAP, 1), PER_PAGE_CAP);
  const page = Math.max(toInt(searchParams.get('page')) ?? 1, 1);
  const { rows, total } = await getAgenciesPage({ page, perPage });
  const totalPages = Math.max(Math.ceil(total / perPage), 1);

  return Response.json({
    data: rows.map(withCount),
    pagination: {
      page,
      per_page: perPage,
      total,
      total_pages: totalPages,
      has_prev: page > 1,
      has_next: page < totalPages,
    },
  });
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

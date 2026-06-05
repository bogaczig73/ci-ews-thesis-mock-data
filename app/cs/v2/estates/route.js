import { queryListings, getAgencies, denormaliseListing } from '@/lib/listings.js';

export const dynamic = 'force-dynamic';

const toInt = (v) => {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = Object.fromEntries(searchParams.entries());

  const perPage = Math.min(Math.max(toInt(q.per_page) ?? 20, 1), 100);
  const page = Math.max(toInt(q.page) ?? 1, 1);
  const locality = typeof q.locality === 'string' && q.locality.trim() ? q.locality.trim() : null;

  const [{ rows, total }, agencies] = await Promise.all([
    queryListings({
      category: toInt(q.category_main_cb),
      type: toInt(q.category_type_cb),
      company: toInt(q.company),
      locality,
      priceFrom: toInt(q.czk_price_summary_order2_from),
      priceTo: toInt(q.czk_price_summary_order2_to),
      perPage,
      page,
    }),
    getAgencies(),
  ]);

  const agencyMap = Object.fromEntries(agencies.map((a) => [a.id, a]));
  const estates = rows.map((l) => denormaliseListing(l, agencyMap));

  return Response.json(
    { result_size: total, per_page: perPage, page, _embedded: { estates } },
    { headers: { 'Content-Type': 'application/hal+json; charset=utf-8', 'Access-Control-Allow-Origin': '*' } },
  );
}

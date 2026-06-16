import { getOmo } from '@/lib/cnb.js';

export const dynamic = 'force-dynamic';

// GET /cnbapi/omo/daily?from=YYYY-MM-DD&to=YYYY-MM-DD
// ?date=YYYY-MM-DD is shorthand for from=to=date (matches real ČNB API).
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const from = date ?? searchParams.get('from') ?? undefined;
  const to = date ?? searchParams.get('to') ?? undefined;
  return Response.json(await getOmo({ from, to }));
}

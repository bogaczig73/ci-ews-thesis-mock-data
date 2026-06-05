import { getSellers, upsertSeller } from '@/lib/sellers.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json(await getSellers());
}

// Upsert a seller. Body is the full seller JSON (must include user_id).
export async function POST(request) {
  const body = await request.json();
  if (body.user_id == null) {
    return Response.json({ error: 'user_id is required' }, { status: 400 });
  }
  try {
    return Response.json(await upsertSeller(body));
  } catch (e) {
    return Response.json({ error: e.message }, { status: 400 });
  }
}

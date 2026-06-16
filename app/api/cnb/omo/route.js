import { listOmo, createOmo } from '@/lib/cnb.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json(await listOmo());
}

export async function POST(request) {
  const body = await request.json();
  if (!body.operation_type || !body.trade_date) {
    return Response.json({ error: 'operation_type and trade_date are required' }, { status: 400 });
  }
  try {
    return Response.json(await createOmo(body), { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 400 });
  }
}

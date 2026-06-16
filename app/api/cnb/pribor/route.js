import { listPribor, createPribor } from '@/lib/cnb.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json(await listPribor());
}

export async function POST(request) {
  const body = await request.json();
  if (!body.valid_for || !body.period || body.pribor == null || body.pribor === '') {
    return Response.json({ error: 'valid_for, period and pribor are required' }, { status: 400 });
  }
  try {
    return Response.json(await createPribor(body), { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 400 });
  }
}

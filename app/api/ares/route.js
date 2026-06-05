import { getSubjects, createSubject } from '@/lib/ares.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json(await getSubjects());
}

export async function POST(request) {
  const body = await request.json();
  if (!body.ico || !body.obchodni_jmeno) {
    return Response.json({ error: 'ico and obchodni_jmeno are required' }, { status: 400 });
  }
  try {
    return Response.json(await createSubject(body), { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 400 });
  }
}

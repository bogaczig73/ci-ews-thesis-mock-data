import { getSubject, toAresShape } from '@/lib/ares.js';

export const dynamic = 'force-dynamic';

const jsonHeaders = { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' };

// Mirrors ARES GET .../ekonomicke-subjekty/{ico}
export async function GET(_request, { params }) {
  const { ico } = await params;
  const subject = await getSubject(ico);

  if (!subject) {
    return Response.json(
      { kod: 'SUBJEKT_NENALEZEN', popis: `Ekonomický subjekt s IČO ${ico} nebyl nalezen.` },
      { status: 404, headers: jsonHeaders },
    );
  }
  return Response.json(toAresShape(subject), { headers: jsonHeaders });
}

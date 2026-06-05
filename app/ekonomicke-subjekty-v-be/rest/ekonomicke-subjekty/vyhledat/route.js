import { searchSubjects, toAresShape } from '@/lib/ares.js';

export const dynamic = 'force-dynamic';

const jsonHeaders = { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' };

// Mirrors ARES POST .../ekonomicke-subjekty/vyhledat
export async function POST(request) {
  let body = {};
  try {
    body = await request.json();
  } catch { /* empty body */ }

  const obchodniJmeno = body.obchodniJmeno?.trim() || null;
  const ico = (Array.isArray(body.ico) ? body.ico[0] : body.ico)?.toString().trim() || null;
  const nace = (Array.isArray(body.czNace) ? body.czNace[0] : body.czNace || body.kodNace)?.toString().trim() || null;

  // ARES rejects filter-only queries (e.g. only kodNace) with VSTUP_PRAZDNY.
  if (!obchodniJmeno && !ico && !nace) {
    return Response.json(
      { kod: 'VSTUP_PRAZDNY', popis: 'Nebyla zadána žádná vyhledávací hodnota.' },
      { status: 400, headers: jsonHeaders },
    );
  }

  const start = Number.isFinite(Number(body.start)) ? Math.max(0, Math.trunc(Number(body.start))) : 0;
  const pocet = Math.min(Math.max(Number(body.pocet) || 10, 1), 100);

  const { rows, total } = await searchSubjects({ obchodniJmeno, ico, nace, start, pocet });

  return Response.json(
    { pocetCelkem: total, ekonomickeSubjekty: rows.map(toAresShape) },
    { headers: jsonHeaders },
  );
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

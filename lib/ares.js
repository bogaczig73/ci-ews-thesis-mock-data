import { sql } from './db.js';

export async function getSubjects() {
  return sql`
    SELECT ico, obchodni_jmeno, dic, pravni_forma, datum_vzniku, datum_zaniku,
           sidlo, nace, financni_urad, is_active
    FROM economic_subjects ORDER BY obchodni_jmeno`;
}

export async function getSubject(ico) {
  const rows = await sql`
    SELECT ico, obchodni_jmeno, dic, pravni_forma, datum_vzniku, datum_zaniku,
           sidlo, nace, financni_urad, is_active
    FROM economic_subjects WHERE ico = ${ico}`;
  return rows[0] ?? null;
}

// Search mirrors the ARES POST /vyhledat contract (subset of filters).
export async function searchSubjects({ obchodniJmeno, ico, nace, start = 0, pocet = 10 }) {
  const rows = await sql`
    SELECT ico, obchodni_jmeno, dic, pravni_forma, datum_vzniku, datum_zaniku,
           sidlo, nace, financni_urad, is_active, count(*) OVER()::int AS total
    FROM economic_subjects
    WHERE (${obchodniJmeno}::text IS NULL OR obchodni_jmeno ILIKE '%' || ${obchodniJmeno} || '%')
      AND (${ico}::text IS NULL OR ico = ${ico})
      AND (${nace}::text IS NULL OR ${nace} = ANY(nace))
    ORDER BY obchodni_jmeno
    LIMIT ${pocet} OFFSET ${start}`;
  const total = rows.length ? rows[0].total : 0;
  return { rows: rows.map(({ total: _t, ...r }) => r), total };
}

export async function createSubject(s) {
  const rows = await sql`
    INSERT INTO economic_subjects (ico, obchodni_jmeno, dic, pravni_forma, datum_vzniku,
      datum_zaniku, sidlo, nace, financni_urad, is_active)
    VALUES (${s.ico}, ${s.obchodni_jmeno}, ${s.dic ?? null}, ${s.pravni_forma ?? null},
      ${s.datum_vzniku ?? null}, ${s.datum_zaniku ?? null}, ${s.sidlo ?? null},
      ${s.nace ?? []}, ${s.financni_urad ?? null}, ${s.is_active ?? true})
    RETURNING *`;
  return rows[0];
}

export async function updateSubject(ico, patch) {
  const cur = await getSubject(ico);
  if (!cur) return null;
  const n = { ...cur, ...patch };
  const rows = await sql`
    UPDATE economic_subjects SET obchodni_jmeno = ${n.obchodni_jmeno}, dic = ${n.dic},
      pravni_forma = ${n.pravni_forma}, datum_vzniku = ${n.datum_vzniku},
      datum_zaniku = ${n.datum_zaniku}, sidlo = ${n.sidlo}, nace = ${n.nace},
      financni_urad = ${n.financni_urad}, is_active = ${n.is_active}
    WHERE ico = ${ico} RETURNING *`;
  return rows[0];
}

export async function deleteSubject(ico) {
  await sql`DELETE FROM economic_subjects WHERE ico = ${ico}`;
  return { ok: true };
}

// Map a DB row to the ARES JSON shape (ekonomicky-subjekt).
export function toAresShape(s) {
  return {
    ico: s.ico,
    obchodniJmeno: s.obchodni_jmeno,
    dic: s.dic ?? undefined,
    pravniForma: s.pravni_forma ?? undefined,
    financniUrad: s.financni_urad ?? undefined,
    datumVzniku: s.datum_vzniku ? toDateStr(s.datum_vzniku) : undefined,
    datumZaniku: s.datum_zaniku ? toDateStr(s.datum_zaniku) : undefined,
    sidlo: s.sidlo ?? undefined,
    czNace: s.nace ?? [],
  };
}

function toDateStr(d) {
  // Neon returns DATE as a 'YYYY-MM-DD' string — don't reparse (avoids TZ drift).
  if (typeof d === 'string') return d.slice(0, 10);
  return new Date(d).toISOString().slice(0, 10);
}

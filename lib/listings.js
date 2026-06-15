import { sql } from './db.js';

// ---- Agencies ----------------------------------------------------------

export async function getAgencies() {
  return sql`SELECT id, name, url, logo_small FROM agencies ORDER BY name`;
}

// Paginated agencies — simulates a real "thousands of companies" paginated API.
// perPage is capped by the caller (route caps it at 5).
export async function getAgenciesPage({ page = 1, perPage = 5 }) {
  const offset = (page - 1) * perPage;
  const rows = await sql`
    SELECT id, name, url, logo_small, count(*) OVER()::int AS total
    FROM agencies
    ORDER BY name
    LIMIT ${perPage} OFFSET ${offset}`;
  const total = rows.length ? rows[0].total : await countAgencies();
  return { rows: rows.map(({ total: _t, ...r }) => r), total };
}

async function countAgencies() {
  const rows = await sql`SELECT count(*)::int AS n FROM agencies`;
  return rows[0].n;
}

export async function getAgency(id) {
  const rows = await sql`SELECT id, name, url, logo_small FROM agencies WHERE id = ${id}`;
  return rows[0] ?? null;
}

export async function createAgency({ id, name, url = null, logo_small = null }) {
  const rows = await sql`
    INSERT INTO agencies (id, name, url, logo_small)
    VALUES (${id}, ${name}, ${url}, ${logo_small})
    RETURNING id, name, url, logo_small`;
  return rows[0];
}

export async function updateAgency(id, patch) {
  const cur = await getAgency(id);
  if (!cur) return null;
  const next = { ...cur, ...patch };
  const rows = await sql`
    UPDATE agencies SET name = ${next.name}, url = ${next.url}, logo_small = ${next.logo_small}
    WHERE id = ${id}
    RETURNING id, name, url, logo_small`;
  return rows[0];
}

export async function deleteAgency(id) {
  const refs = await sql`SELECT count(*)::int AS n FROM listings WHERE company_id = ${id}`;
  if (refs[0].n > 0) {
    return { error: `Agency ${id} still has ${refs[0].n} listing(s). Reassign or delete them first.` };
  }
  await sql`DELETE FROM agencies WHERE id = ${id}`;
  return { ok: true };
}

export async function agencyListingCounts() {
  const rows = await sql`SELECT company_id, count(*)::int AS n FROM listings GROUP BY company_id`;
  const map = {};
  for (const r of rows) map[r.company_id] = r.n;
  return map;
}

// "Street, City - District" / "Street, City" -> "City"
function cityFromLocality(loc) {
  if (!loc) return null;
  const afterComma = loc.includes(',') ? loc.slice(loc.indexOf(',') + 1).trim() : loc.trim();
  return afterComma.split(' - ')[0].trim() || null;
}

// Per-agency locality (the most frequent city across that agency's listings).
export async function agencyLocalities() {
  const rows = await sql`SELECT company_id, locality FROM listings WHERE company_id IS NOT NULL AND locality IS NOT NULL`;
  const counts = {}; // company_id -> { city: n }
  for (const { company_id, locality } of rows) {
    const city = cityFromLocality(locality);
    if (!city) continue;
    (counts[company_id] ??= {})[city] = (counts[company_id][city] ?? 0) + 1;
  }
  const map = {};
  for (const [cid, cityCounts] of Object.entries(counts)) {
    map[cid] = Object.entries(cityCounts).sort((a, b) => b[1] - a[1])[0][0];
  }
  return map;
}

// ---- Listings ----------------------------------------------------------

export async function getAllListings() {
  return sql`SELECT * FROM listings ORDER BY hash_id`;
}

export async function getListing(hashId) {
  const rows = await sql`SELECT * FROM listings WHERE hash_id = ${hashId}`;
  return rows[0] ?? null;
}

// Filtered, paginated query used by the public sreality-shape endpoint.
export async function queryListings({ category, type, company, locality, priceFrom, priceTo, perPage, page }) {
  const offset = (page - 1) * perPage;
  const rows = await sql`
    SELECT *, count(*) OVER()::int AS total
    FROM listings
    WHERE (${category}::int IS NULL OR category = ${category})
      AND (${type}::int IS NULL OR type = ${type})
      AND (${company}::bigint IS NULL OR company_id = ${company})
      AND (${locality}::text IS NULL OR locality ILIKE '%' || ${locality} || '%')
      AND (${priceFrom}::bigint IS NULL OR price >= ${priceFrom})
      AND (${priceTo}::bigint IS NULL OR price <= ${priceTo})
    ORDER BY hash_id
    LIMIT ${perPage} OFFSET ${offset}`;
  const total = rows.length ? rows[0].total : await countListings({ category, type, company, locality, priceFrom, priceTo });
  return { rows: rows.map(({ total: _t, ...r }) => r), total };
}

async function countListings({ category, type, company, locality, priceFrom, priceTo }) {
  const rows = await sql`
    SELECT count(*)::int AS n FROM listings
    WHERE (${category}::int IS NULL OR category = ${category})
      AND (${type}::int IS NULL OR type = ${type})
      AND (${company}::bigint IS NULL OR company_id = ${company})
      AND (${locality}::text IS NULL OR locality ILIKE '%' || ${locality} || '%')
      AND (${priceFrom}::bigint IS NULL OR price >= ${priceFrom})
      AND (${priceTo}::bigint IS NULL OR price <= ${priceTo})`;
  return rows[0].n;
}

export async function createListing(l) {
  const rows = await sql`
    INSERT INTO listings (hash_id, company_id, category, type, name, locality, price,
      price_czk, auction_price, attractive_offer, region_tip, is_new, gps)
    VALUES (${l.hash_id}, ${l.company_id ?? null}, ${l.category ?? null}, ${l.type ?? null},
      ${l.name ?? null}, ${l.locality ?? null}, ${l.price ?? null},
      ${l.price_czk ?? null}, ${l.auction_price ?? null}, ${l.attractive_offer ?? 0},
      ${l.region_tip ?? 0}, ${l.is_new ?? false}, ${l.gps ?? null})
    RETURNING *`;
  return rows[0];
}

export async function updateListing(hashId, patch) {
  const cur = await getListing(hashId);
  if (!cur) return null;
  const n = { ...cur, ...patch };
  const rows = await sql`
    UPDATE listings SET company_id = ${n.company_id}, category = ${n.category}, type = ${n.type},
      name = ${n.name}, locality = ${n.locality}, price = ${n.price},
      price_czk = ${n.price_czk}, auction_price = ${n.auction_price},
      attractive_offer = ${n.attractive_offer}, region_tip = ${n.region_tip},
      is_new = ${n.is_new}, gps = ${n.gps}
    WHERE hash_id = ${hashId}
    RETURNING *`;
  return rows[0];
}

export async function deleteListing(hashId) {
  await sql`DELETE FROM listings WHERE hash_id = ${hashId}`;
  return { ok: true };
}

// ---- Sreality-shape denormaliser --------------------------------------

const num = (v) => (v == null ? v : Number(v));

export function denormaliseListing(l, agencyMap) {
  const company = l.company_id != null ? agencyMap[String(l.company_id)] : null;
  return {
    _embedded: {
      company: company
        ? { url: company.url, id: num(company.id), name: company.name, logo_small: company.logo_small }
        : null,
    },
    category: l.category,
    type: l.type,
    hash_id: num(l.hash_id),
    name: l.name,
    locality: l.locality,
    price: num(l.price),
    price_czk: l.price_czk,
    auctionPrice: l.auction_price ?? 0,
    attractive_offer: l.attractive_offer,
    region_tip: l.region_tip,
    new: l.is_new,
    gps: l.gps,
  };
}

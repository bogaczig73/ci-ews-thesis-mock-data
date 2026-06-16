import { sql } from './db.js';

// Mirrors the ČNB CNB API (api.cnb.cz/cnbapi): PRIBOR daily fixings and
// open-market operations (OMO). Date filters follow the real API's
// optional ?from=YYYY-MM-DD&to=YYYY-MM-DD (and ?date= shorthand).

function toDateStr(d) {
  // Queries cast DATE columns to text, so values arrive as 'YYYY-MM-DD' strings.
  // Slicing avoids the TZ drift that reparsing a Date object would introduce.
  if (d == null) return null;
  if (typeof d === 'string') return d.slice(0, 10);
  return new Date(d).toISOString().slice(0, 10);
}

// ---- PRIBOR ------------------------------------------------------------

// Real API orders the tenors short→long; preserve that regardless of insert order.
const PRIBOR_PERIOD_ORDER = {
  ONE_DAY: 1, ONE_WEEK: 2, TWO_WEEKS: 3, ONE_MONTH: 4,
  THREE_MONTH: 5, SIX_MONTH: 6, NINE_MONTH: 7, ONE_YEAR: 8,
};

export async function getPribor({ from, to } = {}) {
  const rows = await sql`
    SELECT valid_for::text AS valid_for, period, pribid, pribor FROM cnb_pribor
    WHERE (${from ?? null}::date IS NULL OR valid_for >= ${from ?? null})
      AND (${to ?? null}::date IS NULL OR valid_for <= ${to ?? null})
    ORDER BY valid_for DESC`;
  rows.sort((a, b) =>
    toDateStr(b.valid_for).localeCompare(toDateStr(a.valid_for)) ||
    (PRIBOR_PERIOD_ORDER[a.period] ?? 99) - (PRIBOR_PERIOD_ORDER[b.period] ?? 99));
  return { pribs: rows.map(toPriborShape) };
}

function toPriborShape(r) {
  return {
    validFor: toDateStr(r.valid_for),
    period: r.period,
    pribid: r.pribid ?? null,
    pribor: r.pribor == null ? null : Number(r.pribor),
  };
}

// ---- OMO (open-market operations) -------------------------------------

export async function getOmo({ from, to } = {}) {
  const rows = await sql`
    SELECT operation_type, liquidity_impact,
           trade_date::text AS trade_date,
           settlement_date::text AS settlement_date,
           maturity_date::text AS maturity_date,
           marginal_rate_in_percent, total_bid_volume_in_czk_bln, total_number_of_bids,
           minimum_bid_rate_in_percent, average_bid_rate_in_percent, maximum_bid_rate_in_percent,
           total_alloted_volume_in_czk_bln, total_number_of_alloted_bids,
           minimum_alloted_rate_in_percent, average_alloted_rate_in_percent,
           maximum_alloted_rate_in_percent, allotment_percentage
    FROM cnb_omo
    WHERE (${from ?? null}::date IS NULL OR trade_date >= ${from ?? null})
      AND (${to ?? null}::date IS NULL OR trade_date <= ${to ?? null})
    ORDER BY trade_date DESC, id`;
  return { operations: rows.map(toOmoShape) };
}

const num = (v) => (v == null ? null : Number(v));

// ---- Editor CRUD (raw snake_case rows; powers /cnb UI + /api/cnb) ------

export async function listPribor() {
  return sql`SELECT id, valid_for::text AS valid_for, period, pribid, pribor
    FROM cnb_pribor ORDER BY valid_for DESC, id`;
}

export async function getPriborRow(id) {
  const rows = await sql`SELECT id, valid_for::text AS valid_for, period, pribid, pribor
    FROM cnb_pribor WHERE id = ${id}`;
  return rows[0] ?? null;
}

export async function createPribor(p) {
  const rows = await sql`INSERT INTO cnb_pribor (valid_for, period, pribid, pribor)
    VALUES (${p.valid_for}, ${p.period}, ${p.pribid ?? null}, ${p.pribor})
    RETURNING id, valid_for::text AS valid_for, period, pribid, pribor`;
  return rows[0];
}

export async function updatePribor(id, patch) {
  const cur = await getPriborRow(id);
  if (!cur) return null;
  const n = { ...cur, ...patch };
  const rows = await sql`UPDATE cnb_pribor SET valid_for = ${n.valid_for}, period = ${n.period},
    pribid = ${n.pribid ?? null}, pribor = ${n.pribor} WHERE id = ${id}
    RETURNING id, valid_for::text AS valid_for, period, pribid, pribor`;
  return rows[0];
}

export async function deletePribor(id) {
  await sql`DELETE FROM cnb_pribor WHERE id = ${id}`;
  return { ok: true };
}

export async function listOmo() {
  return sql`SELECT id, operation_type, liquidity_impact,
    trade_date::text AS trade_date, settlement_date::text AS settlement_date,
    maturity_date::text AS maturity_date, marginal_rate_in_percent,
    total_bid_volume_in_czk_bln, total_number_of_bids, minimum_bid_rate_in_percent,
    average_bid_rate_in_percent, maximum_bid_rate_in_percent, total_alloted_volume_in_czk_bln,
    total_number_of_alloted_bids, minimum_alloted_rate_in_percent, average_alloted_rate_in_percent,
    maximum_alloted_rate_in_percent, allotment_percentage
    FROM cnb_omo ORDER BY trade_date DESC, id`;
}

export async function getOmoRow(id) {
  const rows = await sql`SELECT id, operation_type, liquidity_impact,
    trade_date::text AS trade_date, settlement_date::text AS settlement_date,
    maturity_date::text AS maturity_date, marginal_rate_in_percent,
    total_bid_volume_in_czk_bln, total_number_of_bids, minimum_bid_rate_in_percent,
    average_bid_rate_in_percent, maximum_bid_rate_in_percent, total_alloted_volume_in_czk_bln,
    total_number_of_alloted_bids, minimum_alloted_rate_in_percent, average_alloted_rate_in_percent,
    maximum_alloted_rate_in_percent, allotment_percentage
    FROM cnb_omo WHERE id = ${id}`;
  return rows[0] ?? null;
}

export async function createOmo(o) {
  const rows = await sql`INSERT INTO cnb_omo (operation_type, liquidity_impact, trade_date,
    settlement_date, maturity_date, marginal_rate_in_percent, total_bid_volume_in_czk_bln,
    total_number_of_bids, minimum_bid_rate_in_percent, average_bid_rate_in_percent,
    maximum_bid_rate_in_percent, total_alloted_volume_in_czk_bln, total_number_of_alloted_bids,
    minimum_alloted_rate_in_percent, average_alloted_rate_in_percent, maximum_alloted_rate_in_percent,
    allotment_percentage)
    VALUES (${o.operation_type}, ${o.liquidity_impact ?? null}, ${o.trade_date},
      ${o.settlement_date ?? null}, ${o.maturity_date ?? null}, ${o.marginal_rate_in_percent ?? null},
      ${o.total_bid_volume_in_czk_bln ?? null}, ${o.total_number_of_bids ?? null},
      ${o.minimum_bid_rate_in_percent ?? null}, ${o.average_bid_rate_in_percent ?? null},
      ${o.maximum_bid_rate_in_percent ?? null}, ${o.total_alloted_volume_in_czk_bln ?? null},
      ${o.total_number_of_alloted_bids ?? null}, ${o.minimum_alloted_rate_in_percent ?? null},
      ${o.average_alloted_rate_in_percent ?? null}, ${o.maximum_alloted_rate_in_percent ?? null},
      ${o.allotment_percentage ?? null})
    RETURNING id`;
  return getOmoRow(rows[0].id);
}

export async function updateOmo(id, patch) {
  const cur = await getOmoRow(id);
  if (!cur) return null;
  const n = { ...cur, ...patch };
  await sql`UPDATE cnb_omo SET operation_type = ${n.operation_type},
    liquidity_impact = ${n.liquidity_impact ?? null}, trade_date = ${n.trade_date},
    settlement_date = ${n.settlement_date ?? null}, maturity_date = ${n.maturity_date ?? null},
    marginal_rate_in_percent = ${n.marginal_rate_in_percent ?? null},
    total_bid_volume_in_czk_bln = ${n.total_bid_volume_in_czk_bln ?? null},
    total_number_of_bids = ${n.total_number_of_bids ?? null},
    minimum_bid_rate_in_percent = ${n.minimum_bid_rate_in_percent ?? null},
    average_bid_rate_in_percent = ${n.average_bid_rate_in_percent ?? null},
    maximum_bid_rate_in_percent = ${n.maximum_bid_rate_in_percent ?? null},
    total_alloted_volume_in_czk_bln = ${n.total_alloted_volume_in_czk_bln ?? null},
    total_number_of_alloted_bids = ${n.total_number_of_alloted_bids ?? null},
    minimum_alloted_rate_in_percent = ${n.minimum_alloted_rate_in_percent ?? null},
    average_alloted_rate_in_percent = ${n.average_alloted_rate_in_percent ?? null},
    maximum_alloted_rate_in_percent = ${n.maximum_alloted_rate_in_percent ?? null},
    allotment_percentage = ${n.allotment_percentage ?? null}
    WHERE id = ${id}`;
  return getOmoRow(id);
}

export async function deleteOmo(id) {
  await sql`DELETE FROM cnb_omo WHERE id = ${id}`;
  return { ok: true };
}

export async function counts() {
  const [p, o] = await Promise.all([
    sql`SELECT count(*)::int AS n FROM cnb_pribor`,
    sql`SELECT count(*)::int AS n FROM cnb_omo`,
  ]);
  return { pribor: p[0].n, omo: o[0].n };
}

function toOmoShape(r) {
  return {
    operationType: r.operation_type,
    liquidityImpact: r.liquidity_impact,
    tradeDate: toDateStr(r.trade_date),
    settlementDate: r.settlement_date ? toDateStr(r.settlement_date) : null,
    maturityDate: r.maturity_date ? toDateStr(r.maturity_date) : null,
    marginalRateInPercent: num(r.marginal_rate_in_percent),
    totalBidVolumeInCZKbln: num(r.total_bid_volume_in_czk_bln),
    totalNumberOfBids: r.total_number_of_bids,
    minimumBidRateInPercent: num(r.minimum_bid_rate_in_percent),
    averageBidRateInPercent: num(r.average_bid_rate_in_percent),
    maximumBidRateInPercent: num(r.maximum_bid_rate_in_percent),
    totalAllotedVolumeInCZKbln: num(r.total_alloted_volume_in_czk_bln),
    totalNumberOfAllotedBids: r.total_number_of_alloted_bids,
    minimumAllotedRateInPercent: num(r.minimum_alloted_rate_in_percent),
    averageAllotedRateInPercent: num(r.average_alloted_rate_in_percent),
    maximumAllotedRateInPercent: num(r.maximum_alloted_rate_in_percent),
    allotmentPercentage: num(r.allotment_percentage),
  };
}

// Seeds the Neon database from the bundled source snapshots in /data.
// Run with: npm run seed   (requires DATABASE_URL in .env.local or env)
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');

// Load DATABASE_URL from .env.local if not already in env.
function loadEnv() {
  if (process.env.DATABASE_URL) return;
  try {
    const env = readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
    for (const line of env.split('\n')) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*"?([^"]*)"?\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch { /* ignore */ }
}
loadEnv();

const sql = neon(process.env.DATABASE_URL);
const read = (f) => readFileSync(path.join(dataDir, f), 'utf8');
const readJson = (f) => JSON.parse(read(f));

// Deterministic, valid 8-digit Czech IČO derived from a company id
// (7-digit base + mod-11 check digit). Stable across reseeds.
function ico(id) {
  const n = (Math.abs(Number(id)) * 2654435761) >>> 0;
  const base = String(1000000 + (n % 9000000)); // 7 digits, first non-zero
  const w = [8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 7; i++) sum += Number(base[i]) * w[i];
  const check = (11 - (sum % 11)) % 10;
  return base + check;
}

// ---- RSS parsing helpers ----------------------------------------------

function decodeEntities(s) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&')
    .trim();
}

function tag(block, name) {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? decodeEntities(m[1]) : null;
}

function parseItems(xml) {
  const items = [];
  const re = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = re.exec(xml))) {
    const b = m[1];
    const guidMatch = b.match(/<guid([^>]*)>([\s\S]*?)<\/guid>/i);
    items.push({
      title: tag(b, 'title'),
      description: tag(b, 'description'),
      link: tag(b, 'link'),
      guid: guidMatch ? decodeEntities(guidMatch[2]) : null,
      guid_is_permalink: guidMatch ? /isPermaLink\s*=\s*"true"/i.test(guidMatch[1]) : false,
      pub_date: tag(b, 'pubDate'),
    });
  }
  return items;
}

// PSP feed is windows-1250 encoded — decode the raw bytes correctly.
function readPspXml() {
  const buf = readFileSync(path.join(dataDir, 'psp_tisky.rss'));
  return new TextDecoder('windows-1250').decode(buf);
}

// ---- Channel definitions ----------------------------------------------

const pspChannel = {
  source: 'psp',
  title: 'Nové sněmovní tisky',
  link: 'https://www.psp.cz/sqw/hp.sqw?k=151',
  description: 'Vypisuje nové sněmovní tisky.',
  language: 'cs',
  self_url: 'https://www.psp.cz/rss/tisky.rss',
  copyright: 'Copyright 2006-2026 ČR - Kancelář Poslanecké sněmovny',
  webmaster: 'wwwadm@psp.cz',
};

const mmrChannel = {
  source: 'mmr',
  title: 'Všechny aktualizace portálu Ministerstvo pro místní rozvoj',
  link: 'https://mmr.gov.cz/cs/ostatni/web/rss?rss=AllPageFefed',
  description: 'Všechny aktualizace portálu Ministerstvo pro místní rozvoj',
  language: 'cs-CZ',
  self_url: 'https://mmr.gov.cz/cs/ostatni/web/rss?rss=AllPageFefed',
  copyright: null,
  webmaster: null,
};

const mmrNovinkyChannel = {
  source: 'mmr_novinky',
  title: 'Novinky',
  link: 'https://mmr.gov.cz/cs/ostatni/web/rss?rss=Novinky',
  description: 'Novinky',
  language: 'cs-CZ',
  self_url: 'https://mmr.gov.cz/cs/ostatni/web/rss?rss=Novinky',
  copyright: null,
  webmaster: null,
};

// ---- Seed routine ------------------------------------------------------

async function main() {
  // ČNB CNB API tables are created here so a fresh DB seeds cleanly.
  await sql`CREATE TABLE IF NOT EXISTS cnb_pribor (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    valid_for date NOT NULL, period text NOT NULL, pribid text, pribor numeric NOT NULL,
    UNIQUE (valid_for, period))`;
  await sql`CREATE INDEX IF NOT EXISTS cnb_pribor_valid_for_idx ON cnb_pribor (valid_for)`;
  await sql`CREATE TABLE IF NOT EXISTS cnb_omo (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    operation_type text NOT NULL, liquidity_impact text, trade_date date NOT NULL,
    settlement_date date, maturity_date date, marginal_rate_in_percent numeric,
    total_bid_volume_in_czk_bln numeric, total_number_of_bids integer,
    minimum_bid_rate_in_percent numeric, average_bid_rate_in_percent numeric,
    maximum_bid_rate_in_percent numeric, total_alloted_volume_in_czk_bln numeric,
    total_number_of_alloted_bids integer, minimum_alloted_rate_in_percent numeric,
    average_alloted_rate_in_percent numeric, maximum_alloted_rate_in_percent numeric,
    allotment_percentage numeric)`;
  await sql`CREATE INDEX IF NOT EXISTS cnb_omo_trade_date_idx ON cnb_omo (trade_date)`;
  // ICO lives only on the agency detail, not in the list.
  await sql`ALTER TABLE agencies ADD COLUMN IF NOT EXISTS ico text`;

  console.log('Clearing existing data…');
  await sql`DELETE FROM rss_items`;
  await sql`DELETE FROM rss_channels`;
  await sql`DELETE FROM listings`;
  await sql`DELETE FROM agencies`;
  await sql`DELETE FROM sellers`;
  await sql`DELETE FROM economic_subjects`;
  await sql`DELETE FROM cnb_pribor`;
  await sql`DELETE FROM cnb_omo`;

  // --- Sreality: agencies + listings ---
  const estates = readJson('estates.json').body._embedded.estates;
  const agencies = new Map();
  for (const e of estates) {
    const c = e._embedded?.company;
    if (c && !agencies.has(c.id)) agencies.set(c.id, c);
  }
  for (const c of agencies.values()) {
    await sql`INSERT INTO agencies (id, name, url, logo_small, ico)
      VALUES (${c.id}, ${c.name}, ${c.url ?? null}, ${c.logo_small ?? null}, ${ico(c.id)})`;
  }
  for (const e of estates) {
    await sql`INSERT INTO listings (hash_id, company_id, category, type, name, locality, price,
      price_czk, auction_price, attractive_offer, region_tip, is_new, gps)
      VALUES (${e.hash_id}, ${e._embedded?.company?.id ?? null}, ${e.category ?? null},
        ${e.type ?? null}, ${e.name ?? null}, ${e.locality ?? null}, ${e.price ?? null},
        ${e.price_czk ?? null}, ${typeof e.auctionPrice === 'object' ? e.auctionPrice : null},
        ${e.attractive_offer ?? 0}, ${e.region_tip ?? 0}, ${e.new ?? false}, ${e.gps ?? null})`;
  }
  console.log(`Sreality: ${agencies.size} agencies, ${estates.length} listings.`);

  // --- Sreality: seller ---
  const seller = readJson('seller.json');
  await sql`INSERT INTO sellers (user_id, data) VALUES (${seller.user_id}, ${seller})`;
  console.log(`Seller ${seller.user_id} loaded.`);

  // --- RSS feeds ---
  const csu = readJson('csu_rss.json');
  const cnb = readJson('cnb_rss.json');
  const feeds = [
    { channel: pspChannel, items: parseItems(readPspXml()) },
    { channel: mmrChannel, items: parseItems(read('mmr_rss.xml')) },
    { channel: mmrNovinkyChannel, items: parseItems(read('mmr_novinky_rss.xml')) },
    { channel: csu.channel, items: csu.items },
    { channel: cnb.channel, items: cnb.items },
  ];
  for (const { channel, items } of feeds) {
    await sql`INSERT INTO rss_channels (source, title, link, description, language, self_url, copyright, webmaster)
      VALUES (${channel.source}, ${channel.title}, ${channel.link}, ${channel.description},
        ${channel.language}, ${channel.self_url}, ${channel.copyright ?? null}, ${channel.webmaster ?? null})`;
    for (const it of items) {
      await sql`INSERT INTO rss_items (source, guid, guid_is_permalink, title, description, link, pub_date)
        VALUES (${channel.source}, ${it.guid ?? null}, ${it.guid_is_permalink ?? false},
          ${it.title ?? null}, ${it.description ?? null}, ${it.link ?? null},
          ${it.pub_date ? new Date(it.pub_date).toISOString() : null})`;
    }
    console.log(`RSS ${channel.source}: ${items.length} items.`);
  }

  // --- ARES economic subjects ---
  const { subjects } = readJson('ares.json');
  for (const s of subjects) {
    await sql`INSERT INTO economic_subjects (ico, obchodni_jmeno, dic, pravni_forma, datum_vzniku,
      datum_zaniku, sidlo, nace, financni_urad, is_active)
      VALUES (${s.ico}, ${s.obchodni_jmeno}, ${s.dic ?? null}, ${s.pravni_forma ?? null},
        ${s.datum_vzniku ?? null}, ${s.datum_zaniku ?? null}, ${s.sidlo ?? null},
        ${s.nace ?? []}, ${s.financni_urad ?? null}, ${s.is_active ?? true})`;
  }
  console.log(`ARES: ${subjects.length} economic subjects.`);

  // --- ČNB CNB API: PRIBOR + open-market operations ---
  const cnbApi = readJson('cnb_cnbapi.json');
  for (const p of cnbApi.pribor) {
    await sql`INSERT INTO cnb_pribor (valid_for, period, pribid, pribor)
      VALUES (${p.validFor}, ${p.period}, ${p.pribid ?? null}, ${p.pribor})`;
  }
  for (const o of cnbApi.omo) {
    await sql`INSERT INTO cnb_omo (operation_type, liquidity_impact, trade_date, settlement_date,
      maturity_date, marginal_rate_in_percent, total_bid_volume_in_czk_bln, total_number_of_bids,
      minimum_bid_rate_in_percent, average_bid_rate_in_percent, maximum_bid_rate_in_percent,
      total_alloted_volume_in_czk_bln, total_number_of_alloted_bids, minimum_alloted_rate_in_percent,
      average_alloted_rate_in_percent, maximum_alloted_rate_in_percent, allotment_percentage)
      VALUES (${o.operationType}, ${o.liquidityImpact ?? null}, ${o.tradeDate}, ${o.settlementDate ?? null},
        ${o.maturityDate ?? null}, ${o.marginalRateInPercent ?? null}, ${o.totalBidVolumeInCZKbln ?? null},
        ${o.totalNumberOfBids ?? null}, ${o.minimumBidRateInPercent ?? null}, ${o.averageBidRateInPercent ?? null},
        ${o.maximumBidRateInPercent ?? null}, ${o.totalAllotedVolumeInCZKbln ?? null},
        ${o.totalNumberOfAllotedBids ?? null}, ${o.minimumAllotedRateInPercent ?? null},
        ${o.averageAllotedRateInPercent ?? null}, ${o.maximumAllotedRateInPercent ?? null},
        ${o.allotmentPercentage ?? null})`;
  }
  console.log(`ČNB CNB API: ${cnbApi.pribor.length} PRIBOR rows, ${cnbApi.omo.length} OMO ops.`);

  console.log('\nSeed complete.');
}

main().catch((e) => { console.error(e); process.exit(1); });

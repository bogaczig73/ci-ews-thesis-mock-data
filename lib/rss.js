import { sql } from './db.js';

export const RSS_SOURCES = ['psp', 'mmr', 'csu', 'cnb'];

export const RSS_SOURCE_LABELS = {
  psp: 'PSP.cz — Nové sněmovní tisky',
  mmr: 'MMR — Novinky',
  csu: 'ČSÚ — Rychlé informace',
  cnb: 'ČNB — Tiskové zprávy',
};

export async function getChannel(source) {
  const rows = await sql`SELECT * FROM rss_channels WHERE source = ${source}`;
  return rows[0] ?? null;
}

export async function getAllChannels() {
  return sql`SELECT * FROM rss_channels ORDER BY source`;
}

export async function getItems(source, limit = 100) {
  return sql`
    SELECT id, source, guid, guid_is_permalink, title, description, link, pub_date
    FROM rss_items WHERE source = ${source}
    ORDER BY pub_date DESC NULLS LAST, id DESC
    LIMIT ${limit}`;
}

export async function getItem(id) {
  const rows = await sql`SELECT * FROM rss_items WHERE id = ${id}`;
  return rows[0] ?? null;
}

// Items within a [start, end) UTC window, for one source or all sources.
export async function getItemsInRange({ source, start, end, limit = 500 }) {
  if (source === 'all') {
    return sql`
      SELECT id, source, guid, guid_is_permalink, title, description, link, pub_date
      FROM rss_items WHERE pub_date >= ${start} AND pub_date < ${end}
      ORDER BY pub_date DESC NULLS LAST, id DESC LIMIT ${limit}`;
  }
  return sql`
    SELECT id, source, guid, guid_is_permalink, title, description, link, pub_date
    FROM rss_items WHERE source = ${source} AND pub_date >= ${start} AND pub_date < ${end}
    ORDER BY pub_date DESC NULLS LAST, id DESC LIMIT ${limit}`;
}

// ---- Period addressing: m{1-12} / w{1-5} / d{1-7} ---------------------
// week = week-of-month (1 => days 1-7, 2 => 8-14, …); day = day-of-week (1-7).
// day-of-month = (week-1)*7 + day.

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export function parsePeriod(segments) {
  const seg = segments.map((s) => String(s).toLowerCase());
  const out = {};
  const specs = [['m', 'month', 1, 12], ['w', 'week', 1, 6], ['d', 'day', 1, 7]];
  for (let i = 0; i < seg.length; i++) {
    const spec = specs[i];
    if (!spec) return { error: `Too many path parts: expected m/w/d, got "${seg[i]}"` };
    const [prefix, key, lo, hi] = spec;
    const m = seg[i].match(new RegExp(`^${prefix}(\\d{1,2})$`));
    if (!m) return { error: `Expected "${prefix}<n>" at position ${i + 1}, got "${seg[i]}"` };
    const n = Number(m[1]);
    if (n < lo || n > hi) return { error: `${key} must be ${lo}-${hi}, got ${n}` };
    out[key] = n;
  }
  if (out.month == null) return { error: 'A month (m1-m12) is required' };
  return out;
}

export function periodRange(year, { month, week, day }) {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const monthEnd = Date.UTC(year, month, 1); // exclusive: first day of next month
  const utc = (d) => new Date(d).toISOString();

  if (week == null) {
    return { start: utc(Date.UTC(year, month - 1, 1)), end: utc(monthEnd), label: `${MONTHS[month - 1]} ${year}` };
  }
  if (day == null) {
    const startDom = (week - 1) * 7 + 1;
    if (startDom > daysInMonth) return { error: `Week ${week} has no days in ${MONTHS[month - 1]} ${year}` };
    const endDom = Math.min(week * 7, daysInMonth);
    return {
      start: utc(Date.UTC(year, month - 1, startDom)),
      end: utc(Math.min(Date.UTC(year, month - 1, endDom + 1), monthEnd)),
      label: `${MONTHS[month - 1]} ${year}, week ${week} (${startDom}–${endDom})`,
    };
  }
  const dom = (week - 1) * 7 + day;
  if (dom > daysInMonth) return { error: `Day d${day} of week ${week} (${dom}.) is outside ${MONTHS[month - 1]} ${year}` };
  return {
    start: utc(Date.UTC(year, month - 1, dom)),
    end: utc(Date.UTC(year, month - 1, dom + 1)),
    label: `${dom} ${MONTHS[month - 1]} ${year}`,
  };
}

export async function itemCounts() {
  const rows = await sql`SELECT source, count(*)::int AS n FROM rss_items GROUP BY source`;
  const map = {};
  for (const r of rows) map[r.source] = r.n;
  return map;
}

export async function createItem(it) {
  const rows = await sql`
    INSERT INTO rss_items (source, guid, guid_is_permalink, title, description, link, pub_date)
    VALUES (${it.source}, ${it.guid ?? null}, ${it.guid_is_permalink ?? false},
      ${it.title ?? null}, ${it.description ?? null}, ${it.link ?? null},
      ${it.pub_date ?? new Date().toISOString()})
    RETURNING *`;
  return rows[0];
}

export async function updateItem(id, patch) {
  const cur = await getItem(id);
  if (!cur) return null;
  const n = { ...cur, ...patch };
  const rows = await sql`
    UPDATE rss_items SET guid = ${n.guid}, guid_is_permalink = ${n.guid_is_permalink},
      title = ${n.title}, description = ${n.description}, link = ${n.link}, pub_date = ${n.pub_date}
    WHERE id = ${id} RETURNING *`;
  return rows[0];
}

export async function deleteItem(id) {
  await sql`DELETE FROM rss_items WHERE id = ${id}`;
  return { ok: true };
}

// ---- RSS 2.0 XML rendering --------------------------------------------

function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function rfc822(d) {
  if (!d) return '';
  return new Date(d).toUTCString();
}

export function renderRss(channel, items) {
  const head = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '<channel>',
    channel.self_url
      ? `<atom:link href="${esc(channel.self_url)}" rel="self" type="application/rss+xml" />`
      : '',
    `<title>${esc(channel.title)}</title>`,
    `<link>${esc(channel.link)}</link>`,
    `<description>${esc(channel.description)}</description>`,
    `<language>${esc(channel.language || 'cs')}</language>`,
    channel.copyright ? `<copyright>${esc(channel.copyright)}</copyright>` : '',
    channel.webmaster ? `<webMaster>${esc(channel.webmaster)}</webMaster>` : '',
    `<lastBuildDate>${rfc822(new Date())}</lastBuildDate>`,
  ].filter(Boolean);

  const body = items.map((it) => {
    const permalink = it.guid_is_permalink ? 'true' : 'false';
    return [
      '<item>',
      `<title>${esc(it.title)}</title>`,
      `<description>${esc(it.description)}</description>`,
      `<link>${esc(it.link)}</link>`,
      it.guid ? `<guid isPermaLink="${permalink}">${esc(it.guid)}</guid>` : '',
      it.pub_date ? `<pubDate>${rfc822(it.pub_date)}</pubDate>` : '',
      '</item>',
    ].filter(Boolean).join('\n');
  });

  return [...head, ...body, '</channel>', '</rss>'].join('\n');
}

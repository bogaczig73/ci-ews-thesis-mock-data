import { sql } from './db.js';

export async function getSellers() {
  const rows = await sql`SELECT user_id, data FROM sellers ORDER BY user_id`;
  return rows.map((r) => r.data);
}

export async function getSeller(userId) {
  const rows = await sql`SELECT data FROM sellers WHERE user_id = ${userId}`;
  return rows[0]?.data ?? null;
}

export async function upsertSeller(data) {
  const userId = data.user_id;
  const rows = await sql`
    INSERT INTO sellers (user_id, data) VALUES (${userId}, ${data})
    ON CONFLICT (user_id) DO UPDATE SET data = ${data}
    RETURNING data`;
  return rows[0].data;
}

export async function deleteSeller(userId) {
  await sql`DELETE FROM sellers WHERE user_id = ${userId}`;
  return { ok: true };
}

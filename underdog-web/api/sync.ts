import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://cqumlxualfevsagswakz.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

export const config = { maxDuration: 10 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const userId = String(req.query.userId || req.body?.userId || '');
  if (!userId || userId.length < 8) return res.status(400).json({ error: 'Invalid userId' });

  const baseUrl = `${SUPABASE_URL}/rest/v1/user_sync?user_id=eq.${encodeURIComponent(userId)}`;

  // GET: fetch sync data
  if (req.method === 'GET') {
    try {
      const r = await fetch(baseUrl, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
      });
      if (!r.ok) return res.status(r.status).json({ error: 'Supabase error' });
      const rows = await r.json();
      if (rows.length > 0) return res.json({ userId, data: rows[0].data, updated_at: rows[0].updated_at });
      return res.json({ userId, data: null });
    } catch { return res.status(500).json({ error: 'Fetch failed' }); }
  }

  // POST: upsert sync data
  if (req.method === 'POST') {
    const data = req.body?.data;
    if (!data) return res.status(400).json({ error: 'Missing data' });
    try {
      const r = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify({ user_id: userId, data, updated_at: new Date().toISOString() }),
      });
      if (!r.ok) return res.status(r.status).json({ error: 'Supabase error' });
      return res.json({ ok: true });
    } catch { return res.status(500).json({ error: 'Upsert failed' }); }
  }

  // DELETE: remove sync data (reset)
  if (req.method === 'DELETE') {
    try {
      const r = await fetch(baseUrl, {
        method: 'DELETE',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
      });
      if (!r.ok) return res.status(r.status).json({ error: 'Supabase error' });
      return res.json({ ok: true });
    } catch { return res.status(500).json({ error: 'Delete failed' }); }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

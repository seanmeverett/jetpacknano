import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildFeed } from './feedCore.js';

export const config = { maxDuration: 30 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  res.setHeader('Access-Control-Allow-Origin', '*');
  const topics = String(req.query.topics || '').split(',').map((t) => t.trim()).filter(Boolean);
  if (!topics.length) return res.json({ items: [], sources: [], count: 0 });
  const lang = String(req.query.lang || 'en');
  const region = String(req.query.region || 'US');
  res.json(await buildFeed(topics, process.env.YOUTUBE_API_KEY, lang, region, process.env.X_API_BEARER_TOKEN));
}

export type Item = {
  id: string; topic: string; type: 'video' | 'image' | 'text' | 'story';
  title: string; author: string; community: string;
  media?: string[]; permalink: string; likes: number; comments: number; ageHours: number;
};

const UA = 'JetpackNano/1.0 (https://github.com/seanmeverett/jetpacknano)';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function mastodonTopic(topic: string, instance: string): Promise<Item[]> {
  const url = `https://${instance}/api/v1/timelines/tag/${encodeURIComponent(topic)}?limit=30`;
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) return [];
  const statuses = (await r.json()) as any[];
  const out: Item[] = [];
  for (const s of statuses) {
    const media: string[] = []; let type: Item['type'] = 'text'; let hasVid = false;
    for (const m of s.media_attachments ?? []) {
      if (!m?.url) continue;
      if (m.type === 'video' || m.type === 'gifv') { media.push(m.url); hasVid = true; }
      else if (m.type === 'image') media.push(m.url);
    }
    if (hasVid) type = 'video';
    else if (media.length > 1) type = 'story';
    else if (media.length === 1) type = 'image';
    const text = (s.content || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
    out.push({
      id: 'ma_' + s.id, topic, type, title: text.slice(0, 280) || '(no text)',
      author: '@' + (s.account?.acct || 'user'), community: instance,
      media: media.length ? media : undefined, permalink: s.url || s.uri,
      likes: s.favourites_count || 0, comments: s.replies_count || 0,
      ageHours: Math.max(0, (Date.now() - new Date(s.created_at).getTime()) / 3600000),
    });
  }
  return out;
}

export async function buildFeed(topics: string[]) {
  const seen = new Set<string>(); const items: Item[] = []; const sources: string[] = [];
  for (const topic of topics) {
    try {
      const got = await mastodonTopic(topic, 'mastodon.social');
      sources.push(`mastodon:${topic}:${got.length}`);
      for (const it of got) if (!seen.has(it.id)) { seen.add(it.id); items.push(it); }
    } catch { sources.push(`mastodon:${topic}:err`); }
    await sleep(150);
  }
  items.sort((a, b) => a.ageHours - b.ageHours);
  return { items, sources, count: items.length };
}

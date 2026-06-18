export type Item = {
  id: string; topic: string; type: 'video' | 'image' | 'text' | 'story';
  title: string; author: string; community: string;
  media?: string[]; permalink: string; likes: number; comments: number; ageHours: number;
  embedUrl?: string; provider?: string; thumb?: string;
};

const UA = 'JetpackNano/1.0 (https://github.com/seanmeverett/jetpacknano)';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const PIPED = ['api.piped.private.coffee', 'pipedapi.kavin.rocks', 'pipedapi.adminforge.de'];

async function mastodonTopic(topic: string): Promise<Item[]> {
  const url = `https://mastodon.social/api/v1/timelines/tag/${encodeURIComponent(topic)}?limit=30`;
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
    if (hasVid) type = 'video'; else if (media.length > 1) type = 'story'; else if (media.length === 1) type = 'image';
    const text = (s.content || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
    out.push({ id: 'ma_' + s.id, topic, type, title: text.slice(0, 280) || '(no text)', author: '@' + (s.account?.acct || 'user'), community: 'mastodon.social', media: media.length ? media : undefined, permalink: s.url || s.uri, likes: s.favourites_count || 0, comments: s.replies_count || 0, ageHours: Math.max(0, (Date.now() - new Date(s.created_at).getTime()) / 3600000) });
  }
  return out;
}

// YouTube via Piped (key-free front-end) — we only take metadata + the video id, then embed via YouTube's official iframe.
async function youtubeTopic(topic: string): Promise<Item[]> {
  for (const inst of PIPED) {
    try {
      const r = await fetch(`https://${inst}/search?q=${encodeURIComponent(topic)}&filter=videos`, { headers: { 'User-Agent': UA } });
      if (!r.ok) continue;
      const j: any = await r.json();
      const out: Item[] = [];
      for (const v of (j.items ?? [])) {
        const vid = (v.url || '').match(/v=([\w-]{6,})/)?.[1];
        if (!vid) continue;
        out.push({
          id: 'yt_' + vid, topic, type: 'video',
          title: v.title || '(untitled)', author: v.uploader || 'YouTube', community: 'youtube.com',
          media: undefined, permalink: 'https://www.youtube.com/watch?v=' + vid,
          likes: 0, comments: 0, ageHours: v.uploaded ? Math.max(0, (Date.now() - v.uploaded) / 3600000) : 0,
          embedUrl: 'https://www.youtube.com/embed/' + vid, provider: 'youtube',
          thumb: 'https://i.ytimg.com/vi/' + vid + '/hqdefault.jpg',
        });
      }
      if (out.length) return out;
    } catch {}
  }
  return [];
}

export async function buildFeed(topics: string[]) {
  const seen = new Set<string>(); const items: Item[] = []; const sources: string[] = [];
  for (const topic of topics) {
    const tasks: Promise<Item[]>[] = [mastodonTopic(topic), youtubeTopic(topic)];
    const results = await Promise.allSettled(tasks);
    const [ma, yt] = results.map((r) => (r.status === 'fulfilled' ? r.value : []));
    sources.push(`mastodon:${topic}:${ma.length}`, `youtube:${topic}:${yt.length}`);
    for (const it of [...ma, ...yt]) if (!seen.has(it.id)) { seen.add(it.id); items.push(it); }
    await sleep(120);
  }
  items.sort((a, b) => a.ageHours - b.ageHours);
  return { items, sources, count: items.length };
}

export type Item = {
  id: string; topic: string; type: 'video' | 'image' | 'text' | 'story';
  title: string; author: string; community: string;
  media?: string[]; permalink: string; likes: number; comments: number; ageHours: number;
  embedUrl?: string; provider?: string; thumb?: string;
};

const UA = 'JetpackNano/1.0 (https://github.com/seanmeverett/jetpacknano)';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const PIPED = ['api.piped.private.coffee', 'pipedapi.kavin.rocks', 'pipedapi.adminforge.de'];

// Per-topic query expansion: richer, more relevant pulls across every category.
const Q: Record<string, { m: string[]; y: string[] }> = {
  music:    { m: ['music', 'nowplaying'],         y: ['music', 'music video'] },
  comedy:   { m: ['comedy', 'funny'],             y: ['comedy', 'funny clips'] },
  art:      { m: ['art', 'illustration'],         y: ['art', 'art process'] },
  cooking:  { m: ['cooking', 'food'],             y: ['cooking', 'recipe'] },
  nature:   { m: ['nature', 'wildlife'],          y: ['nature', 'nature documentary'] },
  fitness:  { m: ['fitness', 'workout'],          y: ['fitness', 'workout'] },
  tech:     { m: ['tech', 'technology'],          y: ['tech', 'technology news'] },
  travel:   { m: ['travel', 'wanderlust'],        y: ['travel', 'travel vlog'] },
  gaming:   { m: ['gaming', 'retrogaming'],       y: ['gaming', 'gameplay'] },
  books:    { m: ['books', 'booktok'],            y: ['books', 'book review'] },
  fashion:  { m: ['fashion', 'ootd'],             y: ['fashion', 'fashion trends'] },
  science:  { m: ['science', 'scicomm'],          y: ['science', 'science news'] },
  pets:     { m: ['pets', 'cats'],                y: ['pets', 'cute animals'] },
  diy:      { m: ['diy', 'maker'],                y: ['diy', 'diy projects'] },
};

async function mastodonTag(tag: string, topic: string): Promise<Item[]> {
  const url = `https://mastodon.social/api/v1/timelines/tag/${encodeURIComponent(tag)}?limit=25`;
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

async function youtubeQuery(q: string, topic: string): Promise<Item[]> {
  for (const inst of PIPED) {
    try {
      const r = await fetch(`https://${inst}/search?q=${encodeURIComponent(q)}&filter=videos`, { headers: { 'User-Agent': UA } });
      if (!r.ok) continue;
      const j: any = await r.json();
      const out: Item[] = [];
      for (const v of (j.items ?? [])) {
        const vid = (v.url || '').match(/v=([\w-]{6,})/)?.[1];
        if (!vid) continue;
        out.push({ id: 'yt_' + vid, topic, type: 'video', title: v.title || '(untitled)', author: v.uploader || 'YouTube', community: 'youtube.com', permalink: 'https://www.youtube.com/watch?v=' + vid, likes: 0, comments: 0, ageHours: v.uploaded ? Math.max(0, (Date.now() - v.uploaded) / 3600000) : 0, embedUrl: 'https://www.youtube.com/embed/' + vid, provider: 'youtube', thumb: 'https://i.ytimg.com/vi/' + vid + '/hqdefault.jpg' });
      }
      if (out.length) return out;
    } catch {}
  }
  return [];
}

async function topicItems(topic: string): Promise<Item[]> {
  const q = Q[topic] ?? { m: [topic], y: [topic] };
  const tasks: Promise<Item[]>[] = [...q.m.map((t) => mastodonTag(t, topic)), ...q.y.map((y) => youtubeQuery(y, topic))];
  const results = await Promise.allSettled(tasks);
  const out: Item[] = [];
  for (const r of results) if (r.status === 'fulfilled') out.push(...r.value);
  return out;
}

export async function buildFeed(topics: string[]) {
  const seen = new Set<string>(); const items: Item[] = []; const sources: string[] = [];
  // process topics with limited concurrency to stay within rate limits + function timeout
  const batch = 3;
  for (let i = 0; i < topics.length; i += batch) {
    const group = topics.slice(i, i + batch);
    const got = await Promise.allSettled(group.map((t) => topicItems(t)));
    group.forEach((t, idx) => {
      const r = got[idx];
      const arr = r.status === 'fulfilled' ? r.value : [];
      sources.push(`${t}:${arr.length}`);
      for (const it of arr) if (!seen.has(it.id)) { seen.add(it.id); items.push(it); }
    });
    await sleep(150);
  }
  items.sort((a, b) => a.ageHours - b.ageHours);
  return { items, sources, count: items.length };
}

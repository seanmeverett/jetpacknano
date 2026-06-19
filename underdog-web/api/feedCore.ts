export type Item = {
  id: string; topic: string; type: 'video' | 'image' | 'text' | 'story' | 'audio';
  format: string; title: string; author: string; community: string;
  media?: string[]; audio?: string; duration?: number;
  permalink: string; likes: number; comments: number; ageHours: number;
  embedUrl?: string; provider?: string; thumb?: string;
};

const UA = 'JetpackNano/1.0 (https://github.com/seanmeverett/jetpacknano)';
const PIPED = ['api.piped.private.coffee', 'pipedapi.kavin.rocks', 'pipedapi.adminforge.de'];

const Q: Record<string, { m: string[]; y: string[] }> = {
  music: { m: ['music', 'nowplaying'], y: ['music', 'music video'] },
  comedy: { m: ['comedy', 'funny'], y: ['comedy', 'funny clips'] },
  art: { m: ['art', 'illustration'], y: ['art', 'art process'] },
  cooking: { m: ['cooking', 'food'], y: ['cooking', 'recipe'] },
  nature: { m: ['nature', 'wildlife'], y: ['nature', 'nature documentary'] },
  fitness: { m: ['fitness', 'workout'], y: ['fitness', 'workout'] },
  tech: { m: ['tech', 'technology'], y: ['tech', 'technology news'] },
  travel: { m: ['travel', 'wanderlust'], y: ['travel', 'travel vlog'] },
  gaming: { m: ['gaming', 'retrogaming'], y: ['gaming', 'gameplay'] },
  books: { m: ['books', 'booktok'], y: ['books', 'book review'] },
  fashion: { m: ['fashion', 'ootd'], y: ['fashion', 'fashion trends'] },
  science: { m: ['science', 'scicomm'], y: ['science', 'science news'] },
  pets: { m: ['pets', 'cats'], y: ['pets', 'cute animals'] },
  diy: { m: ['diy', 'maker'], y: ['diy', 'diy projects'] },
};

// Skip non-English text (check language field + simple non-ASCII heuristic)
const isEnglish = (s: any): boolean => {
  const lang = s.language;
  if (lang && lang !== 'en') return false;
  // Heuristic: if >30% non-ASCII chars, likely non-English
  const text = (s.content || '').replace(/<[^>]+>/g, '');
  const nonAscii = (text.match(/[^\x00-\x7F]/g) || []).length;
  return nonAscii / Math.max(1, text.length) < 0.3;
};

async function mastodonTag(tag: string, topic: string): Promise<Item[]> {
  try {
    const r = await fetch(`https://mastodon.social/api/v1/timelines/tag/${encodeURIComponent(tag)}?limit=30`, { headers: { 'User-Agent': UA } });
    if (!r.ok) return [];
    const statuses = (await r.json()) as any[];
    return statuses.filter(isEnglish).map((s) => {
      const media: string[] = []; let type: Item['type'] = 'text'; let format = 'text'; let audio: string | undefined;
      for (const m of s.media_attachments ?? []) {
        if (!m?.url) continue;
        if (m.type === 'video' || m.type === 'gifv') { media.push(m.url); type = 'video'; format = 'video'; }
        else if (m.type === 'audio') { audio = m.url; type = 'audio'; format = 'audio'; }
        else if (m.type === 'image') media.push(m.url);
      }
      if (type === 'text') { if (media.length > 1) { type = 'story'; format = 'story'; } else if (media.length === 1) { type = 'image'; format = 'image'; } }
      const text = (s.content || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
      return { id: 'ma_' + s.id, topic, type, format, title: text.slice(0, 500) || '(no text)', author: '@' + (s.account?.acct || 'user'), community: 'mastodon.social', media: media.length ? media : undefined, audio, permalink: s.url || s.uri, likes: s.favourites_count || 0, comments: s.replies_count || 0, ageHours: Math.max(0, (Date.now() - new Date(s.created_at).getTime()) / 3600000) };
    }).filter((s) => s);
  } catch { return []; }
}

async function youtubeQuery(q: string, topic: string): Promise<Item[]> {
  for (const inst of PIPED) {
    try {
      const r = await fetch(`https://${inst}/search?q=${encodeURIComponent(q)}&filter=videos`, { headers: { 'User-Agent': UA } });
      if (!r.ok) continue;
      const j: any = await r.json();
      const out: Item[] = (j.items ?? []).map((v: any) => {
        const vid = (v.url || '').match(/v=([\w-]{6,})/)?.[1];
        if (!vid) return null;
        const dur = typeof v.duration === 'number' ? v.duration : undefined;
        return { id: 'yt_' + vid, topic, type: 'video' as const, format: dur != null ? (dur <= 60 ? 'short video' : 'long video') : 'video', title: v.title || '(untitled)', author: v.uploader || 'YouTube', community: 'youtube.com', permalink: 'https://www.youtube.com/watch?v=' + vid, likes: v.views || 0, comments: 0, ageHours: v.uploaded ? Math.max(0, (Date.now() - v.uploaded) / 3600000) : 0, duration: dur, embedUrl: 'https://www.youtube.com/embed/' + vid, provider: 'youtube', thumb: 'https://i.ytimg.com/vi/' + vid + '/hqdefault.jpg' };
      }).filter(Boolean);
      if (out.length) return out;
    } catch {}
  }
  return [];
}

// Interleave by format for a healthy mix, ranked by engagement within each format
const FORMAT_PRIORITY = ['short video', 'video', 'long video', 'image', 'story', 'audio', 'text'];
const engagementScore = (it: Item) => it.likes + it.comments * 3;

function interleaveByFormat(items: Item[]): Item[] {
  const groups: Record<string, Item[]> = {};
  for (const it of items) (groups[it.format] ??= []).push(it);
  // sort each group by engagement (desc) then freshness (asc)
  for (const fmt of Object.keys(groups)) {
    groups[fmt].sort((a, b) => engagementScore(b) - engagementScore(a) || a.ageHours - b.ageHours);
  }
  const result: Item[] = [];
  let added = true;
  while (added) {
    added = false;
    for (const fmt of FORMAT_PRIORITY) {
      const g = groups[fmt];
      if (g && g.length > 0) { result.push(g.shift()!); added = true; }
    }
  }
  return result;
}

export async function buildFeed(topics: string[]) {
  const tasks: Promise<Item[]>[] = [];
  for (const topic of topics) {
    const q = Q[topic] ?? { m: [topic], y: [topic] };
    q.m.forEach((tag) => tasks.push(mastodonTag(tag, topic)));
    q.y.forEach((y) => tasks.push(youtubeQuery(y, topic)));
  }
  const results = await Promise.allSettled(tasks);
  const seen = new Set<string>(); const items: Item[] = [];
  for (const r of results) { if (r.status === 'fulfilled') for (const it of r.value) if (!seen.has(it.id)) { seen.add(it.id); items.push(it); } }
  // Cap text-only posts to top 15 by engagement — keep the feed media-rich, not text-dominated
  const textItems = items.filter((it) => it.format === 'text').sort((a, b) => engagementScore(b) - engagementScore(a)).slice(0, 15);
  const mediaItems = items.filter((it) => it.format !== 'text');
  const capped = [...mediaItems, ...textItems];
  // healthy mix: interleave by format, ranked by engagement within each format
  const mixed = interleaveByFormat(capped);
  return { items: mixed, count: mixed.length };
}

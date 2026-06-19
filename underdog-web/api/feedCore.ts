export type Item = {
  id: string; topic: string; type: 'video' | 'image' | 'text' | 'story' | 'audio';
  format: string; title: string; author: string; community: string;
  media?: string[]; audio?: string; duration?: number;
  permalink: string; likes: number; comments: number; ageHours: number;
  embedUrl?: string; provider?: string; thumb?: string;
};

const UA = 'JetpackNano/1.0 (https://github.com/seanmeverett/jetpacknano)';
const PIPED = ['api.piped.private.coffee', 'pipedapi.kavin.rocks', 'pipedapi.adminforge.de'];
const REFERER = 'https://www.jetpacknano.com';

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
  ai: { m: ['ai', 'artificialintelligence'], y: ['AI', 'artificial intelligence', 'machine learning'] },
  'artificial intelligence': { m: ['ai', 'artificialintelligence'], y: ['AI', 'artificial intelligence', 'machine learning'] },
  'machine learning': { m: ['machinelearning'], y: ['machine learning', 'ML tutorial'] },
};

const isEnglish = (s: any): boolean => {
  const lang = s.language;
  if (lang && lang !== 'en') return false;
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
    }).filter(Boolean);
  } catch { return []; }
}

// Parse ISO 8601 duration (e.g. "PT1M30S" → 90)
const parseDuration = (iso: string): number => {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] || '0') * 3600) + (parseInt(m[2] || '0') * 60) + parseInt(m[3] || '0');
};

// Official YouTube Data API v3
async function youtubeOfficial(q: string, topic: string, apiKey: string): Promise<Item[]> {
  try {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&order=date&maxResults=15&relevanceLanguage=en&regionCode=US&key=${apiKey}`;
    const sr = await fetch(searchUrl, { headers: { 'Referer': REFERER } });
    if (!sr.ok) return [];
    const sj: any = await sr.json();
    const videoIds = (sj.items || []).map((v: any) => v.id?.videoId).filter(Boolean);
    if (!videoIds.length) return [];

    // Get video details (duration, stats)
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics,snippet&id=${videoIds.join(',')}&key=${apiKey}`;
    const dr = await fetch(detailsUrl, { headers: { 'Referer': REFERER } });
    const dj: any = dr.ok ? await dr.json() : { items: [] };
    const detailsMap: Record<string, any> = {};
    for (const v of dj.items || []) detailsMap[v.id] = v;

    return (sj.items || []).filter((v: any) => {
      // English-only filter: check defaultLanguage/defaultAudioLanguage + title non-ASCII
      const lang = v.snippet?.defaultLanguage || v.snippet?.defaultAudioLanguage;
      if (lang && lang !== 'en' && !lang.startsWith('en-')) return false;
      const title = v.snippet?.title || '';
      const nonAscii = (title.match(/[^\x00-\x7F]/g) || []).length;
      if (nonAscii / Math.max(1, title.length) > 0.2) return false;
      return true;
    }).map((v: any) => {
      const vid = v.id?.videoId;
      if (!vid) return null;
      const det = detailsMap[vid] || {};
      const dur = det.contentDetails?.duration ? parseDuration(det.contentDetails.duration) : undefined;
      const views = parseInt(det.statistics?.viewCount || '0');
      const format = dur != null ? (dur <= 60 ? 'short video' : 'long video') : 'video';
      return {
        id: 'yt_' + vid, topic, type: 'video' as const, format,
        title: (det.snippet?.title || v.snippet?.title || '(untitled)'),
        author: det.snippet?.channelTitle || v.snippet?.channelTitle || 'YouTube',
        community: 'youtube.com', permalink: 'https://www.youtube.com/watch?v=' + vid,
        likes: views, comments: parseInt(det.statistics?.commentCount || '0'), ageHours: v.snippet?.publishedAt ? Math.max(0, (Date.now() - new Date(v.snippet.publishedAt).getTime()) / 3600000) : 0,
        duration: dur, embedUrl: 'https://www.youtube.com/embed/' + vid, provider: 'youtube',
        thumb: (det.snippet?.thumbnails?.medium?.url || v.snippet?.thumbnails?.default?.url || `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`),
      };
    }).filter(Boolean);
  } catch { return []; }
}

// Fallback: Piped (no key needed)
async function youtubePiped(q: string, topic: string): Promise<Item[]> {
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

async function youtubeQuery(q: string, topic: string, apiKey?: string): Promise<Item[]> {
  if (apiKey) {
    const official = await youtubeOfficial(q, topic, apiKey);
    if (official.length) return official;
  }
  return youtubePiped(q, topic);
}

const FORMAT_PRIORITY = ['short video', 'video', 'long video', 'image', 'story', 'audio', 'text'];
const engagementScore = (it: Item) => it.likes + it.comments * 3;

function interleaveByFormat(items: Item[]): Item[] {
  const groups: Record<string, Item[]> = {};
  for (const it of items) (groups[it.format] ??= []).push(it);
  for (const fmt of Object.keys(groups)) groups[fmt].sort((a, b) => engagementScore(b) - engagementScore(a) || a.ageHours - b.ageHours);
  const result: Item[] = [];
  let added = true;
  while (added) { added = false; for (const fmt of FORMAT_PRIORITY) { const g = groups[fmt]; if (g && g.length > 0) { result.push(g.shift()!); added = true; } } }
  return result;
}

export async function buildFeed(topics: string[], youtubeApiKey?: string) {
  const tasks: Promise<Item[]>[] = [];
  for (const topic of topics) {
    const q = Q[topic] ?? { m: [topic], y: [topic] };
    q.m.forEach((tag) => tasks.push(mastodonTag(tag, topic)));
    q.y.forEach((y) => tasks.push(youtubeQuery(y, topic, youtubeApiKey)));
  }
  const results = await Promise.allSettled(tasks);
  const seen = new Set<string>(); const items: Item[] = [];
  for (const r of results) { if (r.status === 'fulfilled') for (const it of r.value) if (!seen.has(it.id)) { seen.add(it.id); items.push(it); } }
  const textItems = items.filter((it) => it.format === 'text').sort((a, b) => engagementScore(b) - engagementScore(a)).slice(0, 15);
  const mediaItems = items.filter((it) => it.format !== 'text');
  const mixed = interleaveByFormat([...mediaItems, ...textItems]);
  return { items: mixed, count: mixed.length };
}

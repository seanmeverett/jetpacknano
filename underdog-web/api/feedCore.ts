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

// X/Twitter public bearer token (embedded in x.com web client JS, not secret)
const X_BEARER = 'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA';
const X_GUEST_ACTIVATE = 'https://api.twitter.com/1.1/guest/activate.json';
const X_USER_TWEETS = 'https://api.twitter.com/graphql/RyDU3I9VJtPF-Pnl6vrRlw/UserTweets';
const X_FEATURES = encodeURIComponent(JSON.stringify({
  rweb_tipjar_consumption_enabled: true, responsive_web_graphql_exclude_directive_enabled: false,
  verified_phone_label_enabled: false, creator_subscriptions_tweet_preview_api_enabled: true,
  responsive_web_graphql_timeline_navigation_enabled: true, responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
  communities_web_enable_tweet_community_results_fetch: true, c9s_tweet_anatomy_moderator_badge_enabled: true,
  articles_preview_enabled: true, responsive_web_edit_tweet_api_enabled: true,
  graphql_is_translatable_rweb_tweet_is_translatable_enabled: true, view_counts_everywhere_api_enabled: true,
  longform_notetweets_consumption_enabled: true, responsive_web_twitter_article_tweet_consumption_enabled: true,
  tweet_awards_web_tipping_enabled: false, creator_subscriptions_quote_tweet_preview_enabled: false,
  freedom_of_speech_not_reach_fetch_enabled: true, standardized_nudges_misinfo: true,
  tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
  longform_notetweets_rich_text_read_enabled: true, longform_notetweets_inline_media_enabled: true,
  responsive_web_grok_image_annotation_enabled: true, responsive_web_grok_imagine_annotation_enabled: true,
  responsive_web_enhance_cards_enabled: true,
}));

// Curated X accounts per topic: screen_name → user_id (pre-resolved to avoid extra API calls)
const X_ACCOUNTS: Record<string, { s: string; id: string }[]> = {
  ai: [
    { s: 'OpenAI', id: '4398626122' }, { s: 'AnthropicAI', id: '1353836358901501952' },
    { s: 'GoogleAI', id: '33838201' }, { s: 'xai', id: '1661523610111193088' },
    { s: 'DeepMindAI', id: '1219193735180967937' }, { s: 'huggingface', id: '778764142412984320' },
    { s: 'ylecun', id: '48008938' }, { s: 'karpathy', id: '33836629' }, { s: 'sama', id: '1605' },
  ],
  'artificial intelligence': [
    { s: 'OpenAI', id: '4398626122' }, { s: 'AnthropicAI', id: '1353836358901501952' },
    { s: 'GoogleAI', id: '33838201' }, { s: 'xai', id: '1661523610111193088' },
    { s: 'DeepMindAI', id: '1219193735180967937' }, { s: 'huggingface', id: '778764142412984320' },
    { s: 'ylecun', id: '48008938' }, { s: 'karpathy', id: '33836629' }, { s: 'sama', id: '1605' },
  ],
  'machine learning': [
    { s: 'huggingface', id: '778764142412984320' }, { s: 'karpathy', id: '33836629' },
    { s: 'ylecun', id: '48008938' }, { s: 'GoogleAI', id: '33838201' }, { s: 'DeepMindAI', id: '1219193735180967937' },
  ],
  tech: [
    { s: 'verge', id: '275686563' }, { s: 'TechCrunch', id: '816653' }, { s: 'WIRED', id: '1344951' },
  ],
  science: [
    { s: 'NASA', id: '11348282' }, { s: 'SciAm', id: '14647570' },
    { s: 'nature', id: '15862891' }, { s: 'newscientist', id: '19658826' },
  ],
  fashion: [
    { s: 'VogueMagazine', id: '136361303' }, { s: 'GQMagazine', id: '21701757' },
  ],
};

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

const isEnglish = (s: any, lang = 'en'): boolean => {
  const l = s.language;
  if (l && l !== lang && !l.startsWith(lang + '-')) return false;
  const text = (s.content || '').replace(/<[^>]+>/g, '');
  const nonAscii = (text.match(/[^\x00-\x7F]/g) || []).length;
  return nonAscii / Math.max(1, text.length) < 0.3;
};

async function mastodonTag(tag: string, topic: string, lang = 'en'): Promise<Item[]> {
  try {
    const r = await fetch(`https://mastodon.social/api/v1/timelines/tag/${encodeURIComponent(tag)}?limit=30`, { headers: { 'User-Agent': UA } });
    if (!r.ok) return [];
    const statuses = (await r.json()) as any[];
    return statuses.filter((s) => isEnglish(s, lang)).map((s) => {
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

// Detect non-Latin script chars (Cyrillic, Arabic, Devanagari, CJK, Thai, Hebrew, Indic).
const hasNonLatinScript = (s: string): boolean => {
  for (const ch of s) {
    const cp = ch.codePointAt(0)!;
    if (cp >= 0x1F000 || (cp >= 0x2600 && cp <= 0x27BF)) continue;
    if (cp >= 0x0400 && cp <= 0x04FF) return true;
    if (cp >= 0x0590 && cp <= 0x05FF) return true;
    if (cp >= 0x0600 && cp <= 0x06FF) return true;
    if (cp >= 0x0900 && cp <= 0x0DFF) return true;
    if (cp >= 0x0E00 && cp <= 0x0E7F) return true;
    if (cp >= 0x4E00 && cp <= 0x9FFF) return true;
  }
  return false;
};

const parseDuration = (iso: string): number => {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] || '0') * 3600) + (parseInt(m[2] || '0') * 60) + parseInt(m[3] || '0');
};

// Official YouTube Data API v3 — trending (viewCount), English-only, 7-day window
async function youtubeOfficial(q: string, topic: string, apiKey: string, lang = 'en', region = 'US'): Promise<Item[]> {
  try {
    const publishedAfter = new Date(Date.now() - 7 * 86400000).toISOString();
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&order=relevance&maxResults=25&relevanceLanguage=${lang}&regionCode=${region}&publishedAfter=${publishedAfter}&key=${apiKey}`;
    const sr = await fetch(searchUrl, { headers: { 'Referer': REFERER } });
    if (!sr.ok) return [];
    const sj: any = await sr.json();
    const videoIds = (sj.items || []).map((v: any) => v.id?.videoId).filter(Boolean);
    if (!videoIds.length) return [];

    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics,snippet&id=${videoIds.join(',')}&key=${apiKey}`;
    const dr = await fetch(detailsUrl, { headers: { 'Referer': REFERER } });
    const dj: any = dr.ok ? await dr.json() : { items: [] };
    const detailsMap: Record<string, any> = {};
    for (const v of dj.items || []) detailsMap[v.id] = v;

    return (sj.items || []).map((v: any) => {
      const vid = v.id?.videoId;
      if (!vid) return null;
      const det = detailsMap[vid] || {};
      const ds = det.snippet || {};
      const audioLang = ds.defaultAudioLanguage;
      const vidLang = ds.defaultLanguage;
      if (audioLang && !audioLang.startsWith(lang)) return null;
      if (vidLang && !vidLang.startsWith(lang)) return null;
      const title = ds.title || v.snippet?.title || '';
      if (hasNonLatinScript(title)) return null;

      const dur = det.contentDetails?.duration ? parseDuration(det.contentDetails.duration) : undefined;
      const views = parseInt(det.statistics?.viewCount || '0');
      const format = dur != null ? (dur <= 60 ? 'short video' : 'long video') : 'video';
      const publishedAt = ds.publishedAt || v.snippet?.publishedAt;
      return {
        id: 'yt_' + vid, topic, type: 'video' as const, format,
        title: title || '(untitled)',
        author: ds.channelTitle || v.snippet?.channelTitle || 'YouTube',
        community: 'youtube.com', permalink: 'https://www.youtube.com/watch?v=' + vid,
        likes: views, comments: parseInt(det.statistics?.commentCount || '0'),
        ageHours: publishedAt ? Math.max(0, (Date.now() - new Date(publishedAt).getTime()) / 3600000) : 0,
        duration: dur, embedUrl: 'https://www.youtube.com/embed/' + vid, provider: 'youtube',
        thumb: (ds.thumbnails?.medium?.url || v.snippet?.thumbnails?.default?.url || `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`),
      };
    }).filter(Boolean);
  } catch { return []; }
}

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

async function youtubeQuery(q: string, topic: string, apiKey?: string, lang = 'en', region = 'US'): Promise<Item[]> {
  if (apiKey) {
    const official = await youtubeOfficial(q, topic, apiKey, lang, region);
    if (official.length) return official;
  }
  return youtubePiped(q, topic);
}

// ─── X/Twitter integration via guest token + GraphQL ───

let cachedGuestToken: { token: string; ts: number } | null = null;

async function getGuestToken(): Promise<string | null> {
  // Reuse token for 10 minutes
  if (cachedGuestToken && Date.now() - cachedGuestToken.ts < 600000) return cachedGuestToken.token;
  try {
    const r = await fetch(X_GUEST_ACTIVATE, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${X_BEARER}`, 'User-Agent': UA },
    });
    if (!r.ok) return null;
    const j = await r.json() as any;
    cachedGuestToken = { token: j.guest_token, ts: Date.now() };
    return j.guest_token;
  } catch { return null; }
}

async function xUserTweets(userId: string, screenName: string, topic: string, lang = 'en'): Promise<Item[]> {
  const gt = await getGuestToken();
  if (!gt) return [];
  try {
    const vars = encodeURIComponent(JSON.stringify({
      userId, count: 10, includePromotedContent: false,
      withQuickPromoteEligibilityTweetFields: true, withVoice: true, withV2Timeline: true,
    }));
    const r = await fetch(`${X_USER_TWEETS}?variables=${vars}&features=${X_FEATURES}`, {
      headers: { 'Authorization': `Bearer ${X_BEARER}`, 'x-guest-token': gt, 'User-Agent': UA },
    });
    if (!r.ok) return [];
    const j = await r.json() as any;

    // Recursively extract tweet result objects from the GraphQL response
    const tweets: any[] = [];
    const walk = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      if (obj.__typename === 'TimelineTweet' && obj.tweet_results?.result?.legacy) {
        tweets.push(obj.tweet_results.result);
      }
      for (const v of Object.values(obj)) walk(v);
    };
    walk(j.data);

    const items: Item[] = [];
    for (const tw of tweets) {
      const leg = tw.legacy;
      if (!leg) continue;
      // Skip retweets — only original content
      if (leg.full_text?.startsWith('RT @')) continue;
      if (leg.lang && leg.lang !== lang) continue;

      const text = (leg.full_text || '').replace(/https?:\/\/t\.co\/\S+/g, '').trim();
      if (!text || (lang === 'en' && hasNonLatinScript(text))) continue;

      const media: string[] = []; let type: Item['type'] = 'text'; let format = 'text';
      let thumb: string | undefined;
      const ext = leg.extended_entities?.media || [];
      for (const m of ext) {
        if (m.type === 'video' || m.type === 'animated_gif') {
          const v = m.video_info?.variants?.filter((v: any) => v.content_type === 'video/mp4')
            .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))[0];
          if (v?.url) { media.push(v.url); type = 'video'; format = 'short video'; }
        } else if (m.type === 'photo' && m.media_url_https) {
          media.push(m.media_url_https);
          if (type === 'text') { type = 'image'; format = 'image'; }
        }
      }
      if (type === 'text' && media.length > 1) { type = 'story'; format = 'story'; }
      if (!thumb && ext[0]?.media_url_https) thumb = ext[0].media_url_https;

      const tid = tw.rest_id || leg.id_str;
      const created = leg.created_at ? new Date(leg.created_at).getTime() : Date.now();
      items.push({
        id: 'x_' + tid, topic, type, format,
        title: text.slice(0, 500),
        author: '@' + screenName, community: 'x.com',
        permalink: `https://x.com/${screenName}/status/${tid}`,
        likes: leg.favorite_count || 0, comments: leg.reply_count || 0,
        ageHours: Math.max(0, (Date.now() - created) / 3600000),
        media: media.length ? media : undefined, thumb, provider: 'x',
      });
    }
    return items;
  } catch { return []; }
}

async function xTopicTweets(topic: string, lang = 'en'): Promise<Item[]> {
  const accounts = X_ACCOUNTS[topic];
  if (!accounts?.length) return [];
  // Fetch from up to 4 accounts in parallel (balance speed vs rate limits)
  const batch = accounts.slice(0, 4);
  const results = await Promise.allSettled(
    batch.map((a) => xUserTweets(a.id, a.s, topic, lang))
  );
  const seen = new Set<string>();
  const items: Item[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') for (const it of r.value) if (!seen.has(it.id)) { seen.add(it.id); items.push(it); }
  }
  return items;
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

export async function buildFeed(topics: string[], youtubeApiKey?: string, lang = 'en', region = 'US') {
  const tasks: Promise<Item[]>[] = [];
  for (const topic of topics) {
    const q = Q[topic] ?? { m: [topic], y: [topic] };
    q.m.forEach((tag) => tasks.push(mastodonTag(tag, topic, lang)));
    q.y.forEach((y) => tasks.push(youtubeQuery(y, topic, youtubeApiKey, lang, region)));
    tasks.push(xTopicTweets(topic, lang)); // X/Twitter curated accounts
  }
  const results = await Promise.allSettled(tasks);
  const seen = new Set<string>(); const items: Item[] = [];
  for (const r of results) { if (r.status === 'fulfilled') for (const it of r.value) if (!seen.has(it.id)) { seen.add(it.id); items.push(it); } }
  const textItems = items.filter((it) => it.format === 'text').sort((a, b) => engagementScore(b) - engagementScore(a)).slice(0, 15);
  const mediaItems = items.filter((it) => it.format !== 'text');
  const mixed = interleaveByFormat([...mediaItems, ...textItems]);
  return { items: mixed, count: mixed.length };
}

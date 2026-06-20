export type Item = {
  id: string; topic: string; type: 'video' | 'image' | 'text' | 'story' | 'audio';
  format: string; title: string; author: string; community: string;
  media?: string[]; audio?: string; duration?: number;
  permalink: string; likes: number; comments: number; ageHours: number;
  embedUrl?: string; provider?: string; thumb?: string; followers?: number;
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
    { s: 'huggingface', id: '778764142412984320' },
    { s: 'ylecun', id: '48008938' }, { s: 'karpathy', id: '33836629' }, { s: 'sama', id: '1605' },
    { s: 'MicrosoftAI', id: '885220904761933824' }, { s: 'MistralAI', id: '1667249535519805451' },
    { s: '_akhaliq', id: '2465283662' },
  ],
  'artificial intelligence': [
    { s: 'OpenAI', id: '4398626122' }, { s: 'AnthropicAI', id: '1353836358901501952' },
    { s: 'GoogleAI', id: '33838201' }, { s: 'xai', id: '1661523610111193088' },
    { s: 'huggingface', id: '778764142412984320' },
    { s: 'ylecun', id: '48008938' }, { s: 'karpathy', id: '33836629' }, { s: 'sama', id: '1605' },
    { s: 'MicrosoftAI', id: '885220904761933824' }, { s: 'MistralAI', id: '1667249535519805451' },
    { s: '_akhaliq', id: '2465283662' },
  ],
  'machine learning': [
    { s: 'huggingface', id: '778764142412984320' }, { s: 'karpathy', id: '33836629' },
    { s: 'ylecun', id: '48008938' }, { s: 'GoogleAI', id: '33838201' }, { s: 'DeepMindAI', id: '1219193735180967937' },
  ],
  tech: [
    { s: 'verge', id: '275686563' }, { s: 'TechCrunch', id: '816653' }, { s: 'WIRED', id: '1344951' },
    { s: 'engadget', id: '16956673' }, { s: 'Gizmodo', id: '23481152' },
  ],
  science: [
    { s: 'NASA', id: '11348282' }, { s: 'SciAm', id: '14647570' },
    { s: 'nature', id: '15862891' }, { s: 'newscientist', id: '19658826' },
  ],
  fashion: [
    { s: 'VogueMagazine', id: '136361303' }, { s: 'GQMagazine', id: '21701757' },
  ],
  bitcoin: [
    { s: 'CoinDesk', id: '15201158' }, { s: 'BitcoinMagazine', id: '87671029' },
  ],
  'space tech': [
    { s: 'SpaceX', id: '59096562' }, { s: 'NASA', id: '11348282' },
  ],
  'spatial computing': [
    { s: 'uploadvr', id: '24738671' },
  ],
  'augmented reality': [
    { s: 'MagicLeap', id: '19102735' },
  ],
};

const Q: Record<string, { m?: string[]; y: string[] }> = {
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
  ai: { y: ['artificial intelligence'] },
  'artificial intelligence': { y: ['artificial intelligence'] },
  'machine learning': { y: ['machine learning'] },
  bitcoin: { y: ['bitcoin'] },
  'spatial computing': { y: ['spatial computing'] },
  'augmented reality': { y: ['augmented reality'] },
  'space tech': { y: ['space tech'] },
};

// Parent category → sub-topic search terms (used for both YouTube and X)
const SUBTOPICS: Record<string, string[]> = {
  'emerging-tech': ['artificial intelligence', 'bitcoin', 'spatial computing', 'augmented reality', 'space tech'],
};



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
    const publishedAfter = new Date(Date.now() - 4 * 86400000).toISOString();
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
    const channelIds: string[] = [];
    for (const v of dj.items || []) { detailsMap[v.id] = v; const cid = v.snippet?.channelId; if (cid) channelIds.push(cid); }
    const subsMap = await youtubeChannelStats(channelIds, apiKey);

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
        followers: subsMap[ds.channelId || v.snippet?.channelId || ''] || 0,
      };
    }).filter(Boolean);
  } catch { return []; }
}

// Batch-fetch YouTube channel subscriber counts (official API)
async function youtubeChannelStats(channelIds: string[], apiKey: string): Promise<Record<string, number>> {
  if (!channelIds.length || !apiKey) return {};
  try {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${[...new Set(channelIds)].slice(0, 50).join(',')}&key=${apiKey}`;
    const r = await fetch(url, { headers: { 'Referer': REFERER } });
    if (!r.ok) return {};
    const j = await r.json() as any;
    const map: Record<string, number> = {};
    for (const ch of j.items || []) map[ch.id] = parseInt(ch.statistics?.subscriberCount || '0');
    return map;
  } catch { return {}; }
}

// Batch-fetch subscriber counts from Piped channel endpoints
async function pipedChannelStats(channelIds: string[]): Promise<Record<string, number>> {
  const unique = [...new Set(channelIds)].slice(0, 15);
  const entries = await Promise.allSettled(unique.map(async (cid) => {
    for (const inst of PIPED) {
      try {
        const r = await fetch(`https://${inst}/channel/${cid}`, { headers: { 'User-Agent': UA } });
        if (!r.ok) continue;
        const j = await r.json() as any;
        if (j.subscriberCount != null) return [cid, j.subscriberCount] as [string, number];
      } catch {}
    }
    return [cid, 0] as [string, number];
  }));
  const map: Record<string, number> = {};
  for (const r of entries) if (r.status === 'fulfilled') map[r.value[0]] = r.value[1];
  return map;
}

async function youtubePiped(q: string, topic: string): Promise<Item[]> {
  for (const inst of PIPED) {
    try {
      const r = await fetch(`https://${inst}/search?q=${encodeURIComponent(q)}&filter=videos`, { headers: { 'User-Agent': UA } });
      if (!r.ok) continue;
      const j: any = await r.json();
      // Collect channel IDs for subscriber count lookup
      const channelIds: string[] = [];
      const raw = (j.items ?? []).map((v: any) => {
        const vid = (v.url || '').match(/v=([\w-]{6,})/)?.[1];
        if (!vid) return null;
        const dur = typeof v.duration === 'number' ? v.duration : undefined;
        const cid = (v.uploaderUrl || '').match(/\/channel\/([\w-]+)/)?.[1] || '';
        if (cid) channelIds.push(cid);
        return { vid, dur, v, cid };
      }).filter(Boolean);
      // Fetch subscriber counts
      const subsMap = await pipedChannelStats(channelIds);
      const out: Item[] = raw.map((r: any) => { const vid = r.vid, dur = r.dur, v = r.v, cid = r.cid;
        return { id: 'yt_' + vid, topic, type: 'video' as const, format: dur != null ? (dur <= 60 ? 'short video' : 'long video') : 'video', title: v.title || '(untitled)', author: v.uploaderName || 'YouTube', community: 'youtube.com', permalink: 'https://www.youtube.com/watch?v=' + vid, likes: v.views || 0, comments: 0, ageHours: v.uploaded ? Math.max(0, (Date.now() - v.uploaded) / 3600000) : 0, duration: dur, embedUrl: 'https://www.youtube.com/embed/' + vid, provider: 'youtube', thumb: 'https://i.ytimg.com/vi/' + vid + '/hqdefault.jpg', followers: subsMap[cid] || 0 };
      }).filter((it: Item) => it.ageHours < 96).filter(Boolean);
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

// Reset cached guest token so the next call gets a fresh one (avoids per-token rate limits)
function resetGuestToken() { cachedGuestToken = null; }

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
      userId, count: 40, includePromotedContent: false,
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
      // Skip retweets (check both RT prefix and retweeted_status_result)
      if (leg.full_text?.startsWith('RT @') || tw.legacy?.retweeted_status_result) continue;
      // Skip replies (tweets that start with @ or have in_reply_to_status_id_str)
      if (leg.in_reply_to_status_id_str || /^@\w/.test(leg.full_text || '')) continue;
      if (leg.lang && leg.lang !== lang) continue;

      const text = (leg.full_text || '').replace(/https?:\/\/t\.co\/\S+/g, '').trim();
      if (!text) continue;
      if (lang === 'en' && hasNonLatinScript(text)) continue;
      

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
      const ageH = Math.max(0, (Date.now() - created) / 3600000);
      if (ageH > 720) continue; // skip tweets older than 30 days
      const userFollowers = tw.core?.user_results?.result?.legacy?.followers_count || 0;
      items.push({
        id: 'x_' + tid, topic, type, format,
        title: text.slice(0, 500),
        author: '@' + screenName, community: 'x.com',
        permalink: `https://x.com/${screenName}/status/${tid}`,
        likes: leg.favorite_count || 0, comments: leg.reply_count || 0,
        ageHours: ageH,
        media: media.length ? media : undefined, thumb, provider: 'x',
        followers: userFollowers,
      });
    }
    return items;
  } catch { return []; }
}

async function xTopicTweets(topic: string, lang = 'en'): Promise<Item[]> {
  const accounts = X_ACCOUNTS[topic];
  if (!accounts?.length) return [];
  // Fetch from up to 4 accounts in parallel (balance speed vs rate limits)
  // Fetch in batches of 4 to avoid X guest-token rate limits
  const BATCH_SIZE = 3;
  const allResults: Item[] = [];
  for (let i = 0; i < accounts.length; i += BATCH_SIZE) {
    const batch = accounts.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((a) => xUserTweets(a.id, a.s, topic, lang))
    );
    for (const r of results) {
      if (r.status === 'fulfilled') allResults.push(...r.value);
    }
    if (i + BATCH_SIZE < accounts.length) { resetGuestToken(); await new Promise((r) => setTimeout(r, 600)); }
  }
  const seen = new Set<string>();
  const items: Item[] = [];
  for (const it of allResults) {
    if (!seen.has(it.id)) { seen.add(it.id); items.push(it); }
  }
  // Sort by engagement (likes + comments*3) to surface trending/popular tweets, keep top 25
  items.sort((a, b) => (b.likes + b.comments * 3) - (a.likes + a.comments * 3));
  return items.slice(0, 25);
}


// ─── X API v2 search (proper credentials — requires Basic tier or higher) ───
// Searches ALL of X for tweets matching the topic, sorted by relevance/engagement.
// Falls back to xTopicTweets (guest token + curated accounts) if credentials are insufficient.

async function xSearchTweets(topic: string, bearerToken: string, lang = 'en'): Promise<Item[]> {
  if (!bearerToken) return [];
  try {
    // Search X for the exact topic the user entered — no extra keywords
    const query = encodeURIComponent(`${topic} -is:retweet lang:${lang} min_faves:10`);
    const url = `https://api.twitter.com/2/tweets/search/recent?query=${query}&max_results=50&sort_order=relevancy&tweet.fields=public_metrics,created_at,lang,entities,attachments,referenced_tweets&expansions=author_id,attachments.media_keys&user.fields=name,username,profile_image_url,public_metrics&media.fields=url,preview_image_url,type,duration_ms`;

    const r = await fetch(url, {
      headers: { 'Authorization': `Bearer ${bearerToken}`, 'User-Agent': UA },
    });
    if (!r.ok) return []; // 402 (CreditsDepleted) or 401 → fall back to guest token
    const j = await r.json() as any;

    const users: Record<string, any> = {};
    for (const u of j.includes?.users || []) users[u.id] = u;
    const mediaMap: Record<string, any> = {};
    for (const m of j.includes?.media || []) mediaMap[m.media_key] = m;

    const items: Item[] = [];
    for (const tw of j.data || []) {
      // Skip replies and quote tweets — only original content
      const refs = tw.referenced_tweets || [];
      if (refs.some((r: any) => r.type === 'replied_to' || r.type === 'quoted')) continue;
      if (tw.lang && tw.lang !== lang) continue;

      const text = (tw.text || '').replace(/https?:\/\/t\.co\/\S+/g, '').trim();
      if (!text || (lang === 'en' && hasNonLatinScript(text))) continue;

      const user = users[tw.author_id] || {};
      const metrics = tw.public_metrics || {};
      const userMetrics = user.public_metrics || {};
      const created = tw.created_at ? new Date(tw.created_at).getTime() : Date.now();

      // Parse media attachments
      const media: string[] = [];
      let type: Item['type'] = 'text'; let format = 'text'; let thumb: string | undefined;
      for (const key of tw.attachments?.media_keys || []) {
        const m = mediaMap[key];
        if (!m) continue;
        if (m.type === 'video' || m.type === 'animated_gif') {
          if (m.url) { media.push(m.url); type = 'video'; format = 'short video'; }
        } else if (m.type === 'photo') {
          if (m.url) { media.push(m.url); if (type === 'text') { type = 'image'; format = 'image'; } }
        }
      }
      if (type === 'text' && media.length > 1) { type = 'story'; format = 'story'; }
      if (!thumb && media[0]) thumb = media[0];

      items.push({
        id: 'xs_' + tw.id, topic, type, format,
        title: text.slice(0, 500),
        author: '@' + (user.username || 'unknown'),
        community: 'x.com',
        permalink: `https://x.com/${user.username}/status/${tw.id}`,
        likes: metrics.like_count || 0,
        comments: metrics.reply_count || 0,
        ageHours: Math.max(0, (Date.now() - created) / 3600000),
        media: media.length ? media : undefined,
        thumb, provider: 'x',
        followers: userMetrics.followers_count || 0,
      });
    }
    // Sort by engagement (likes + replies*3 + retweets*2)
    items.sort((a, b) => (b.likes + b.comments * 3) - (a.likes + a.comments * 3));
    return items.slice(0, 25);
  } catch { return []; }
}

const engagementScore = (it: Item) => it.likes + it.comments * 3;


export async function buildFeed(topics: string[], youtubeApiKey?: string, lang = 'en', region = 'US', xBearerToken?: string, seenIds: string[] = []) {
  const tasks: Promise<Item[]>[] = [];
  const seenSet = new Set(seenIds);

  // Expand parent categories (e.g. "emerging-tech") into their sub-topics
  const expandedTopics: string[] = [];
  for (const topic of topics) {
    const subs = SUBTOPICS[topic];
    if (subs) expandedTopics.push(...subs);
    else expandedTopics.push(topic);
  }

  for (const topic of expandedTopics) {
    // YouTube: search using the topic name (or Q map expansions for better results)
    const q = Q[topic];
    const ytQueries = q?.y ?? [topic];
    ytQueries.forEach((y) => tasks.push(youtubeQuery(y, topic, youtubeApiKey, lang, region)));
    // X/Twitter: search for the exact topic using v2 API, fall back to curated accounts
    if (xBearerToken) {
      tasks.push(xSearchTweets(topic, xBearerToken, lang).then((items) => items.length ? items : xTopicTweets(topic, lang)));
    } else {
      tasks.push(xTopicTweets(topic, lang));
    }
  }
  const results = await Promise.allSettled(tasks);

  // Deduplicate, filter already-seen, and drop zero-engagement content
  const dedup = new Set<string>(); const items: Item[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') for (const it of r.value) {
      if (dedup.has(it.id) || seenSet.has(it.id)) continue;
      if (it.ageHours > 96) continue; // drop content older than 4 days
      if (it.likes <= 0) continue; // only content with real engagement
      if (it.provider === 'youtube' && (!it.followers || it.followers <= 0)) continue; // drop YT channels without subscriber data
      dedup.add(it.id); items.push(it);
    }
  }

  // Rank by combined score: log-scale engagement (50%) + recency (50%)
  // Log scale balances YouTube (millions of views) vs X (tens of likes)
  // Recency score: 1.0 at 0h, decays to 0.1 at 168h (7 days)
  const recencyScore = (ageH: number) => Math.max(0.1, 1.0 - (ageH / 96) * 0.9);
  const logEngagement = (it: Item) => Math.log10(engagementScore(it) + 1);
  const maxLogEng = Math.max(0.1, ...items.map(logEngagement));
  const combinedScore = (it: Item) =>
    0.5 * (logEngagement(it) / maxLogEng) + 0.5 * recencyScore(it.ageHours);

  // Sort all items by combined score (most relevant + popular + recent first)
  items.sort((a, b) => combinedScore(b) - combinedScore(a));

  return { items, count: items.length };
}

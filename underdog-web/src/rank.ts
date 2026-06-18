import type { Post, RankedPost, RankOptions, ViewerPrefs, TopicId } from './types';
import { POSTS } from './seed';

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// deterministic small jitter so the feed isn't a dead-tie, but stable per post
const jitter = (id: string) => {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return 0.97 + ((h >>> 0) % 70) / 1000; // 0.97..1.04
};

const normalize = (vals: number[]): number[] => {
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  if (max === min) return vals.map(() => 0.6);
  return vals.map((v) => (v - min) / (max - min));
};

const relevanceOf = (post: Post, prefs: ViewerPrefs): number => {
  const w = prefs.interests[post.topic as TopicId];
  return w ?? 0.12; // 0.12 discovery baseline so new topics still surface
};

const freshnessOf = (post: Post, halfLife: number): number =>
  Math.exp(-post.ageHours / halfLife);

const reachRaw = (post: Post, opts: RankOptions): number => {
  if (opts.mode === 'standard') {
    return Math.pow(1 + post.likes, 0.3); // popularity favors likes
  }
  const p = lerp(0, 1.4, opts.inverseStrength); // 0 = no inversion, 1.4 = strong
  return 1 / Math.pow(1 + post.likes, p); // zero-likes => 1.0, mega => ~0
};

const baseWeights = (mode: RankOptions['mode']) =>
  mode === 'inverse'
    ? { rel: 0.38, reach: 0.45, fresh: 0.17 }
    : { rel: 0.3, reach: 0.55, fresh: 0.15 };

export function rankFeed(
  posts: Post[] = POSTS,
  prefs: ViewerPrefs,
  opts: RankOptions,
  recentlySeenCreators: string[] = []
): RankedPost[] {
  const reach = normalize(posts.map((p) => reachRaw(p, opts)));
  const w = baseWeights(opts.mode);

  // per-post base score (relevance + reach + freshness), before diversity
  const base = posts.map((p, i) => {
    const rel = relevanceOf(p, prefs);
    const fresh = freshnessOf(p, opts.freshnessHalfLifeHours);
    const score = (w.rel * rel + w.reach * reach[i] + w.fresh * fresh) * jitter(p.id);
    return { post: p, rel, reach: reach[i], fresh, score };
  });

  const result: RankedPost[] = [];
  const remaining = base.slice();
  const creatorPenalty: Record<string, number> = {}; // multiplicative penalty per creator
  const seenCount: Record<string, number> = {};
  recentlySeenCreators.forEach((c) => (seenCount[c] = (seenCount[c] ?? 0) + 1));

  while (remaining.length > 0) {
    // pick best with diversity multiplier applied
    let bestIdx = 0;
    let bestScore = -1;
    for (let i = 0; i < remaining.length; i++) {
      const r = remaining[i];
      const div = opts.diversityOn
        ? 1 / Math.pow(1 + (seenCount[r.post.creatorId] ?? 0), 0.7)
        : 1;
      const s = r.score * div;
      if (s > bestScore) {
        bestScore = s;
        bestIdx = i;
      }
    }
    const chosen = remaining.splice(bestIdx, 1)[0];
    const div = opts.diversityOn
      ? 1 / Math.pow(1 + (seenCount[chosen.post.creatorId] ?? 0), 0.7)
      : 1;
    result.push({
      post: chosen.post,
      factors: {
        relevance: clamp01(chosen.rel),
        reach: clamp01(chosen.reach),
        freshness: clamp01(chosen.fresh),
        diversity: clamp01(div),
      },
      score: chosen.score * div,
    });
    seenCount[chosen.post.creatorId] = (seenCount[chosen.post.creatorId] ?? 0) + 1;
    // extra stacking penalty so the same creator can't flood the top
    creatorPenalty[chosen.post.creatorId] =
      (creatorPenalty[chosen.post.creatorId] ?? 1) * 0.45;
    void creatorPenalty;
  }
  return result;
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export const fmtCount = (n: number): string => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return `${n}`;
};

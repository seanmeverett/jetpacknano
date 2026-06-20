import React, { createContext, useContext, useMemo, useState, useCallback, useEffect, useRef } from 'react';
import type { ViewerPrefs, RankOptions, FeedMode, Post } from './types';
import { TOPICS } from './seed';
import { loadUsers, loadComments, fetchLiveFeed, liveToPosts } from './api';
import { getCookie, setCookie, deleteCookie } from './cookies';

type TopicId = string; // any topic, including custom free-text

export interface Comment {
  id: string;
  text: string;
  ts: number;
  author: string;
}

interface Persisted {
  onboardingDone: boolean;
  prefs: ViewerPrefs;
  opts: RankOptions;
  liked: Record<string, boolean>;
  followed: Record<string, boolean>;
  comments: Record<string, Comment[]>;
  seedComments: Record<string, Comment[]>;
  topicOrder: string[];
  seenIds: string[];
  markSeen: (ids: string[]) => void;
}

interface AppState {
  onboardingDone: boolean;
  posts: Post[];
  usersMap: Record<string, import('./types').User>;
  prefs: ViewerPrefs;
  opts: RankOptions;
  liked: Record<string, boolean>;
  followed: Record<string, boolean>;
  comments: Record<string, Comment[]>;
  seedComments: Record<string, Comment[]>;
  screen: 'onboarding' | 'feed' | 'settings';
  setScreen: (s: AppState['screen']) => void;
  finishOnboarding: (interests: TopicId[], lang?: string, region?: string) => void;
  toggleInterest: (t: TopicId, on: boolean) => void;
  setInterestWeight: (t: TopicId, w: number) => void;
  setLang: (lang: string) => void;
  setRegion: (region: string) => void;
  setMode: (m: FeedMode) => void;
  setInverseStrength: (v: number) => void;
  toggleDiversity: (on: boolean) => void;
  setFreshnessHalfLife: (h: number) => void;
  toggleLike: (postId: string) => void;
  toggleFollow: (creatorId: string) => void;
  addComment: (postId: string, text: string) => void;
  prefetchFeed: (topics: string[], lang?: string, region?: string) => void;
  addTopic: (topic: string) => void;
  removeTopic: (topic: string) => void;
  topicOrder: string[];
  seenIds: string[];
  markSeen: (ids: string[]) => void;
  reorderTopics: (newOrder: string[]) => void;
  renameTopic: (oldName: string, newName: string) => void;
  reset: () => void;
}

const COOKIE = 'jetpacknano_state';

const emptyInterests = () =>
  TOPICS.reduce((acc, t) => {
    (acc as Record<string, number>)[t.id] = 0;
    return acc;
  }, {} as Record<string, number>) as ViewerPrefs['interests'];

const defaultOpts: RankOptions = {
  mode: 'standard',
  inverseStrength: 0.62,
  diversityOn: true,
  freshnessHalfLifeHours: 72,
};

const loadPersisted = (): Partial<Persisted> => getCookie<Partial<Persisted>>(COOKIE) ?? {};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const saved = loadPersisted();
  // Onboarding always shows on refresh — user picks topics/lang/region each visit
  // Clear stale feed cache on every load so old content doesn't interfere
  try { localStorage.removeItem('jetpacknano_feed_cache'); } catch {}
  const [onboardingDone, setOnboardingDone] = useState<boolean>(false);
  const [screen, setScreen] = useState<'onboarding' | 'feed' | 'settings'>('onboarding');
  const [prefs, setPrefs] = useState<ViewerPrefs>(
    saved.prefs ?? { interests: emptyInterests(), lang: 'en', region: 'US' }
  );
  const [opts, setOpts] = useState<RankOptions>(saved.opts ?? defaultOpts);
  const [liked, setLiked] = useState<Record<string, boolean>>(saved.liked ?? {});
  const [followed, setFollowed] = useState<Record<string, boolean>>(saved.followed ?? {});
  const [comments, setComments] = useState<Record<string, Comment[]>>(saved.comments ?? {});
  const [posts, setPosts] = useState<Post[]>([]); // live-only, no stock seed
  const [prefetched, setPrefetched] = useState<{ posts: Post[]; users: import('./types').User[] } | null>(null);
  const [topicOrder, setTopicOrder] = useState<string[]>(saved.topicOrder ?? []);
  const [seenIds, setSeenIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('jetpacknano_seen') || '[]'); } catch { return []; }
  });
  const seenIdsRef = useRef(seenIds);
  useEffect(() => { seenIdsRef.current = seenIds; }, [seenIds]);

  const [usersMap, setUsersMap] = useState<Record<string, import('./types').User>>({});
  const [seedComments, setSeedComments] = useState<Record<string, Comment[]>>({});
  // On mount: if already onboarded, start fetching live content immediately (don't wait for finishOnboarding)
  useEffect(() => {
    if (onboardingDone) {
      const interests = (saved.topicOrder ?? []).filter((t) => (prefs.interests[t] ?? 0) > 0);
      if (interests.length) refreshLive(interests, saved.prefs?.lang ?? 'en', saved.prefs?.region ?? 'US');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount only

  // Cache is cleared on every load (above) — no instant-load from stale cache
  useEffect(() => { let live = true; loadComments().then((m) => { if (live) setSeedComments(m); }).catch(() => {}); return () => { live = false; }; }, []);
  useEffect(() => { let live = true; loadUsers().then((m) => { if (live) setUsersMap(m); }).catch(() => {}); return () => { live = false; }; }, []);

  // Cache feed to localStorage for instant return-visit load (v2 = X+YouTube+Mastodon era)
  useEffect(() => {
    if (posts.length > 0) {
      const users = Object.values(usersMap);
      try { localStorage.setItem('jetpacknano_feed_cache', JSON.stringify({ posts, users, ts: Date.now(), v: 2 })); } catch {}
    }
  }, [posts, usersMap]);

  // Persist the meaningful state to a cookie whenever it changes.
  useEffect(() => {
    setCookie(COOKIE, { prefs, opts, liked, followed, comments, topicOrder });
  }, [onboardingDone, prefs, opts, liked, followed, comments, topicOrder]);


  const prefetchFeed = useCallback((topics: string[], lang = 'en', region = 'US') => {
    const currentSeen = seenIdsRef.current;
    const seenSet = new Set(currentSeen);
    fetchLiveFeed(topics, lang, region, currentSeen).then((res) => {
      const filtered = res.items.filter((it) => !seenSet.has(it.id));
      if (!filtered.length) return;
      const { posts: lp, users: lu } = liveToPosts(filtered);
      setPrefetched({ posts: lp, users: lu });
    }).catch(() => {});
  }, []);

  const refreshLive = useCallback((topics: string[], lang = 'en', region = 'US') => {
    const currentSeen = seenIdsRef.current;
    const seenSet = new Set(currentSeen);
    fetchLiveFeed(topics, lang, region, currentSeen).then((res) => {
      const filtered = res.items.filter((it) => !seenSet.has(it.id));
      if (!filtered.length) return;
      const { posts: lp, users: lu } = liveToPosts(filtered);
      setPosts(lp);
      setUsersMap((m) => { const n = { ...m }; for (const u of lu) n[u.id] = u; return n; });
    }).catch(() => {});
  }, []);

  const finishOnboarding = useCallback((interests: TopicId[], lang = 'en', region = 'US') => {
    // Clear seenIds on new onboarding so previous session's seen posts don't block new topics
    setSeenIds([]);
    try { localStorage.removeItem('jetpacknano_seen'); } catch {}
    seenIdsRef.current = [];
    setPrefs({
      interests: { ...emptyInterests(), ...Object.fromEntries(interests.map((t) => [t, 1])) } as ViewerPrefs['interests'],
      lang, region,
    });
    setOnboardingDone(true);
    setScreen('feed');
    setTopicOrder(interests as string[]);
    // Use prefetched content if available (started during onboarding) for instant load
    if (prefetched && prefetched.posts.length) {
      setPosts(prefetched.posts);
      setUsersMap((m) => { const n = { ...m }; for (const u of prefetched.users) n[u.id] = u; return n; });
    }
    // Always refresh in background for fresh content — retry if empty
    const doRefresh = (attempt = 0) => {
      fetchLiveFeed(interests as unknown as string[], lang, region, []).then((res) => {
        if (res.items.length) {
          const { posts: lp, users: lu } = liveToPosts(res.items);
          setPosts(lp);
          setUsersMap((m) => { const n = { ...m }; for (const u of lu) n[u.id] = u; return n; });
            } else if (attempt < 2) {
          setTimeout(() => doRefresh(attempt + 1), 3000);
        }
      }).catch(() => { if (attempt < 2) setTimeout(() => doRefresh(attempt + 1), 3000); });
    };
    doRefresh();
  }, [prefetched]);

  const toggleInterest = useCallback((t: TopicId, on: boolean) => {
    setPrefs((p) => ({ ...p, interests: { ...p.interests, [t]: on ? 1 : 0 } as ViewerPrefs['interests'] }));
  }, []);
  const setInterestWeight = useCallback((t: TopicId, w: number) => {
    setPrefs((p) => ({ ...p, interests: { ...p.interests, [t]: w } as ViewerPrefs['interests'] }));
  }, []);
  const setLang = useCallback((lang: string) => setPrefs((p) => ({ ...p, lang })), []);
  const markSeen = useCallback((ids: string[]) => {
    setSeenIds((prev) => {
      const set = new Set(prev);
      for (const id of ids) set.add(id);
      // Keep last 500 seen IDs to avoid unbounded growth
      const arr = [...set];
      const trimmed = arr.length > 500 ? arr.slice(arr.length - 500) : arr;
      try { localStorage.setItem('jetpacknano_seen', JSON.stringify(trimmed)); } catch {}
      return trimmed;
    });
  }, []);
  const setRegion = useCallback((region: string) => setPrefs((p) => ({ ...p, region })), []);

  const setMode = useCallback((m: FeedMode) => setOpts((o) => ({ ...o, mode: m })), []);
  const setInverseStrength = useCallback((v: number) => setOpts((o) => ({ ...o, inverseStrength: v })), []);
  const toggleDiversity = useCallback((on: boolean) => setOpts((o) => ({ ...o, diversityOn: on })), []);
  const setFreshnessHalfLife = useCallback((h: number) => setOpts((o) => ({ ...o, freshnessHalfLifeHours: h })), []);

  const toggleLike = useCallback((postId: string) => {
    setLiked((l) => ({ ...l, [postId]: !l[postId] }));
  }, []);

  const toggleFollow = useCallback((creatorId: string) => {
    setFollowed((f) => ({ ...f, [creatorId]: !f[creatorId] }));
  }, []);

  const addTopic = useCallback((topic: string) => {
    const t = topic.trim().toLowerCase();
    if (!t) return;
    setPrefs((p) => ({ ...p, interests: { ...p.interests, [t]: 1 } }));
    setTopicOrder((o) => o.includes(t) ? o : [...o, t]);
    const allTopics = [...topicOrder.filter((x) => x !== t), t].filter((x) => (prefs.interests[x] ?? 1) > 0);
    refreshLive(allTopics);
  }, [prefs.interests, topicOrder, refreshLive]);

  const removeTopic = useCallback((topic: string) => {
    setPrefs((p) => ({ ...p, interests: { ...p.interests, [topic]: 0 } }));
    setTopicOrder((o) => o.filter((x) => x !== topic));
    const allTopics = topicOrder.filter((x) => x !== topic && (prefs.interests[x] ?? 0) > 0);
    if (allTopics.length > 0) refreshLive(allTopics, prefs.lang || 'en', prefs.region || 'US'); else setPosts([]);
  }, [prefs.interests, topicOrder, refreshLive, setPosts]);

  const renameTopic = useCallback((oldName: string, newName: string) => {
    const n = newName.trim().toLowerCase();
    if (!n || n === oldName) return;
    setPrefs((p) => {
      const interests = { ...p.interests };
      interests[oldName] = 0;
      interests[n] = 1;
      return { ...p, interests };
    });
    setTopicOrder((o) => o.map((t) => (t === oldName ? n : t)));
    const active = topicOrder.map((t) => (t === oldName ? n : t))
    refreshLive(active, prefs.lang || "en", prefs.region || "US");
  }, [topicOrder, refreshLive, prefs.lang, prefs.region]);

  const reorderTopics = useCallback((newOrder: string[]) => {
    setTopicOrder(newOrder);
    const active = newOrder.filter((t) => (prefs.interests[t] ?? 0) > 0);
    if (active.length > 0) refreshLive(active, prefs.lang || 'en', prefs.region || 'US');
  }, [prefs.interests, refreshLive, prefs.lang, prefs.region]);

  const addComment = useCallback((postId: string, text: string) => {
    const clean = text.trim().slice(0, 280);
    if (!clean) return;
    setComments((c) => ({ ...c, [postId]: [...(c[postId] ?? []), { id: 'c' + Date.now(), text: clean, ts: Date.now(), author: 'you' }] }));
  }, []);

  const reset = useCallback(() => {
    setLiked({});
    setFollowed({});
    setComments({});
    setTopicOrder([]);
    setPrefs({ interests: emptyInterests(), lang: 'en', region: 'US' });
    setOpts(defaultOpts);
    setOnboardingDone(false);
    setScreen('onboarding');
    deleteCookie(COOKIE);
    setSeenIds([]);
    try { localStorage.removeItem('jetpacknano_seen'); } catch {}
  }, []);

  const value = useMemo<AppState>(
    () => ({
      onboardingDone, posts, usersMap, prefs, opts, liked, followed, comments, seedComments, screen,
      setScreen, finishOnboarding, toggleInterest, setInterestWeight, setLang, setRegion,
      setMode, setInverseStrength, toggleDiversity, setFreshnessHalfLife,
      toggleLike, toggleFollow, addComment, addTopic, removeTopic, topicOrder, seenIds, markSeen, reorderTopics, renameTopic, prefetchFeed, reset,
    }),
    [onboardingDone, posts, usersMap, prefs, opts, liked, followed, comments, seedComments, screen, seenIds, finishOnboarding, toggleInterest, setInterestWeight, setLang, setRegion, setMode, setInverseStrength, toggleDiversity, setFreshnessHalfLife, toggleLike, toggleFollow, addComment, reset]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

const Ctx = createContext<AppState | null>(null);

export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useApp must be used inside AppProvider');
  return c;
}

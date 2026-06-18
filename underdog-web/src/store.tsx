import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import type { ViewerPrefs, RankOptions, FeedMode, Post } from './types';
import { TOPICS } from './seed';
import { loadUsers, loadComments, fetchLiveFeed, liveToPosts } from './api';
import { getCookie, setCookie, deleteCookie } from './cookies';

type TopicId = ViewerPrefs['interests'] extends Record<infer K, number> ? K : never;

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
  finishOnboarding: (interests: TopicId[]) => void;
  toggleInterest: (t: TopicId, on: boolean) => void;
  setInterestWeight: (t: TopicId, w: number) => void;
  setMode: (m: FeedMode) => void;
  setInverseStrength: (v: number) => void;
  toggleDiversity: (on: boolean) => void;
  setFreshnessHalfLife: (h: number) => void;
  toggleLike: (postId: string) => void;
  toggleFollow: (creatorId: string) => void;
  addComment: (postId: string, text: string) => void;
  prefetchFeed: (topics: string[]) => void;
  reset: () => void;
}

const COOKIE = 'jetpacknano_state';

const emptyInterests = () =>
  TOPICS.reduce((acc, t) => {
    (acc as Record<string, number>)[t.id] = 0;
    return acc;
  }, {} as Record<string, number>) as ViewerPrefs['interests'];

const defaultOpts: RankOptions = {
  mode: 'inverse',
  inverseStrength: 0.62,
  diversityOn: true,
  freshnessHalfLifeHours: 72,
};

const loadPersisted = (): Partial<Persisted> => getCookie<Partial<Persisted>>(COOKIE) ?? {};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const saved = loadPersisted();
  const [onboardingDone, setOnboardingDone] = useState<boolean>(saved.onboardingDone ?? false);
  const [screen, setScreen] = useState<'onboarding' | 'feed' | 'settings'>(
    saved.onboardingDone ? 'feed' : 'onboarding'
  );
  const [prefs, setPrefs] = useState<ViewerPrefs>(
    saved.prefs ?? { interests: emptyInterests() }
  );
  const [opts, setOpts] = useState<RankOptions>(saved.opts ?? defaultOpts);
  const [liked, setLiked] = useState<Record<string, boolean>>(saved.liked ?? {});
  const [followed, setFollowed] = useState<Record<string, boolean>>(saved.followed ?? {});
  const [comments, setComments] = useState<Record<string, Comment[]>>(saved.comments ?? {});
  const [posts, setPosts] = useState<Post[]>([]); // live-only, no stock seed
  const [prefetched, setPrefetched] = useState<{ posts: Post[]; users: import('./types').User[] } | null>(null);

  const [usersMap, setUsersMap] = useState<Record<string, import('./types').User>>({});
  const [seedComments, setSeedComments] = useState<Record<string, Comment[]>>({});
  // Instant load from localStorage cache (returning users see content immediately)
  useEffect(() => {
    if (!saved.onboardingDone) return;
    try {
      const cached = JSON.parse(localStorage.getItem('jetpacknano_feed_cache') || 'null');
      if (cached && cached.posts?.length && Date.now() - cached.ts < 30 * 60 * 1000) {
        setPosts(cached.posts);
        setUsersMap((m) => { const n = { ...m }; for (const u of cached.users || []) n[u.id] = u; return n; });
      }
    } catch {}
  }, []);
  useEffect(() => { let live = true; loadComments().then((m) => { if (live) setSeedComments(m); }).catch(() => {}); return () => { live = false; }; }, []);
  useEffect(() => { let live = true; loadUsers().then((m) => { if (live) setUsersMap(m); }).catch(() => {}); return () => { live = false; }; }, []);

  // Cache feed to localStorage for instant return-visit load
  useEffect(() => {
    if (posts.length > 0) {
      const users = Object.values(usersMap);
      try { localStorage.setItem('jetpacknano_feed_cache', JSON.stringify({ posts, users, ts: Date.now() })); } catch {}
    }
  }, [posts, usersMap]);

  // Persist the meaningful state to a cookie whenever it changes.
  useEffect(() => {
    setCookie(COOKIE, { onboardingDone, prefs, opts, liked, followed, comments });
  }, [onboardingDone, prefs, opts, liked, followed, comments]);

  const prefetchFeed = useCallback((topics: string[]) => {
    fetchLiveFeed(topics).then((items) => {
      if (!items.length) return;
      const { posts: lp, users: lu } = liveToPosts(items);
      setPrefetched({ posts: lp, users: lu });
    }).catch(() => {});
  }, []);

  const refreshLive = useCallback((topics: string[]) => {
    fetchLiveFeed(topics).then((items) => {
      if (!items.length) return;
      const { posts: lp, users: lu } = liveToPosts(items);
      setPosts(lp);
      setUsersMap((m) => { const n = { ...m }; for (const u of lu) n[u.id] = u; return n; });
    }).catch(() => {});
  }, []);

  const finishOnboarding = useCallback((interests: TopicId[]) => {
    setPrefs({
      interests: { ...emptyInterests(), ...Object.fromEntries(interests.map((t) => [t, 1])) } as ViewerPrefs['interests'],
    });
    setOnboardingDone(true);
    setScreen('feed');
    // Use prefetched content if available (started during onboarding) for instant load
    if (prefetched) {
      setPosts(prefetched.posts);
      setUsersMap((m) => { const n = { ...m }; for (const u of prefetched.users) n[u.id] = u; return n; });
    }
    // Always refresh in background for fresh content
    refreshLive(interests as unknown as string[]);
  }, [refreshLive, prefetched]);

  const toggleInterest = useCallback((t: TopicId, on: boolean) => {
    setPrefs((p) => ({ interests: { ...p.interests, [t]: on ? 1 : 0 } as ViewerPrefs['interests'] }));
  }, []);
  const setInterestWeight = useCallback((t: TopicId, w: number) => {
    setPrefs((p) => ({ interests: { ...p.interests, [t]: w } as ViewerPrefs['interests'] }));
  }, []);

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

  // Background refresh: keep feed fresh every 2 minutes when viewing feed
  useEffect(() => {
    if (screen !== 'feed' || !onboardingDone) return;
    const interests = Object.entries(prefs.interests).filter(([, w]) => w > 0).map(([t]) => t);
    if (!interests.length) return;
    const id = setInterval(() => refreshLive(interests), 120000);
    return () => clearInterval(id);
  }, [screen, onboardingDone, prefs.interests, refreshLive]);

  const addComment = useCallback((postId: string, text: string) => {
    const clean = text.trim().slice(0, 280);
    if (!clean) return;
    setComments((c) => ({ ...c, [postId]: [...(c[postId] ?? []), { id: 'c' + Date.now(), text: clean, ts: Date.now(), author: 'you' }] }));
  }, []);

  const reset = useCallback(() => {
    setLiked({});
    setFollowed({});
    setComments({});
    setPrefs({ interests: emptyInterests() });
    setOpts(defaultOpts);
    setOnboardingDone(false);
    setScreen('onboarding');
    deleteCookie(COOKIE);
  }, []);

  const value = useMemo<AppState>(
    () => ({
      onboardingDone, posts, usersMap, prefs, opts, liked, followed, comments, seedComments, screen,
      setScreen, finishOnboarding, toggleInterest, setInterestWeight,
      setMode, setInverseStrength, toggleDiversity, setFreshnessHalfLife,
      toggleLike, toggleFollow, addComment, prefetchFeed, reset,
    }),
    [onboardingDone, posts, usersMap, prefs, opts, liked, followed, comments, seedComments, screen, finishOnboarding, toggleInterest, setInterestWeight, setMode, setInverseStrength, toggleDiversity, setFreshnessHalfLife, toggleLike, toggleFollow, addComment, reset]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

const Ctx = createContext<AppState | null>(null);

export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useApp must be used inside AppProvider');
  return c;
}

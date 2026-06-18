import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import type { ViewerPrefs, RankOptions, FeedMode, Post } from './types';
import { TOPICS, POSTS } from './seed';
import { loadPosts } from './api';
import { getCookie, setCookie, deleteCookie } from './cookies';

type TopicId = ViewerPrefs['interests'] extends Record<infer K, number> ? K : never;

interface Persisted {
  onboardingDone: boolean;
  prefs: ViewerPrefs;
  opts: RankOptions;
  liked: Record<string, boolean>;
  followed: Record<string, boolean>;
}

interface AppState {
  onboardingDone: boolean;
  posts: Post[];
  prefs: ViewerPrefs;
  opts: RankOptions;
  liked: Record<string, boolean>;
  followed: Record<string, boolean>;
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
  const [posts, setPosts] = useState<Post[]>(POSTS);

  // Hydrate posts from Supabase when configured; otherwise keep local seed.
  useEffect(() => { let live = true; loadPosts().then((p) => { if (live && p.length) setPosts(p); }).catch(() => {}); return () => { live = false; }; }, []);

  // Persist the meaningful state to a cookie whenever it changes.
  useEffect(() => {
    setCookie(COOKIE, { onboardingDone, prefs, opts, liked, followed });
  }, [onboardingDone, prefs, opts, liked, followed]);

  const finishOnboarding = useCallback((interests: TopicId[]) => {
    setPrefs({
      interests: { ...emptyInterests(), ...Object.fromEntries(interests.map((t) => [t, 1])) } as ViewerPrefs['interests'],
    });
    setOnboardingDone(true);
    setScreen('feed');
  }, []);

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

  const reset = useCallback(() => {
    setLiked({});
    setFollowed({});
    setPrefs({ interests: emptyInterests() });
    setOpts(defaultOpts);
    setOnboardingDone(false);
    setScreen('onboarding');
    deleteCookie(COOKIE);
  }, []);

  const value = useMemo<AppState>(
    () => ({
      onboardingDone, posts, prefs, opts, liked, followed, screen,
      setScreen, finishOnboarding, toggleInterest, setInterestWeight,
      setMode, setInverseStrength, toggleDiversity, setFreshnessHalfLife,
      toggleLike, toggleFollow, reset,
    }),
    [onboardingDone, posts, prefs, opts, liked, followed, screen, finishOnboarding, toggleInterest, setInterestWeight, setMode, setInverseStrength, toggleDiversity, setFreshnessHalfLife, toggleLike, toggleFollow, reset]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

const Ctx = createContext<AppState | null>(null);

export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useApp must be used inside AppProvider');
  return c;
}

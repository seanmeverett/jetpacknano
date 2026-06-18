import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import type { ViewerPrefs, RankOptions, FeedMode } from './types';
import { TOPICS } from './data/seed';

type TopicId = ViewerPrefs['interests'] extends Record<infer K, number> ? K : never;

interface AppState {
  onboardingDone: boolean;
  prefs: ViewerPrefs;
  opts: RankOptions;
  liked: Record<string, boolean>;
  likeBoosts: Record<string, number>; // extra likes added by tapping like
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
  reset: () => void;
}

const Ctx = createContext<AppState | null>(null);

const emptyInterests = () =>
  TOPICS.reduce((acc, t) => {
    (acc as Record<string, number>)[t.id] = 0;
    return acc;
  }, {} as Record<string, number>) as ViewerPrefs['interests'];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [screen, setScreen] = useState<'onboarding' | 'feed' | 'settings'>('onboarding');
  const [prefs, setPrefs] = useState<ViewerPrefs>({ interests: emptyInterests() });
  const [opts, setOpts] = useState<RankOptions>({
    mode: 'inverse',
    inverseStrength: 0.62,
    diversityOn: true,
    freshnessHalfLifeHours: 72,
  });
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [likeBoosts, setLikeBoosts] = useState<Record<string, number>>({});

  const finishOnboarding = useCallback((interests: TopicId[]) => {
    setPrefs({ interests: { ...emptyInterests(), ...Object.fromEntries(interests.map((t) => [t, 1])) } as ViewerPrefs['interests'] });
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
    setLiked((l) => {
      const next = { ...l, [postId]: !l[postId] };
      setLikeBoosts((b) => ({ ...b, [postId]: (b[postId] ?? 0) + (next[postId] ? 1 : -1) }));
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setLiked({});
    setLikeBoosts({});
    setPrefs({ interests: emptyInterests() });
    setOnboardingDone(false);
    setScreen('onboarding');
  }, []);

  const value = useMemo<AppState>(
    () => ({
      onboardingDone, prefs, opts, liked, likeBoosts, screen,
      setScreen, finishOnboarding, toggleInterest, setInterestWeight,
      setMode, setInverseStrength, toggleDiversity, setFreshnessHalfLife, toggleLike, reset,
    }),
    [onboardingDone, prefs, opts, liked, likeBoosts, screen, finishOnboarding, toggleInterest, setInterestWeight, setMode, setInverseStrength, toggleDiversity, setFreshnessHalfLife, toggleLike, reset]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useApp must be used inside AppProvider');
  return c;
}

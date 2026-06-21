// ─── Dwell time tracking + behavioral preference profile ───
// Tracks how long the user views each post, what they interact with,
// and builds a weighted preference profile that feeds back into ranking.

const PROFILE_KEY = 'jetpacknano_behavior';

export interface DwellRecord {
  postId: string;
  topic: string;
  format: string;
  provider: string;
  dwellMs: number;       // milliseconds viewed
  liked: boolean;         // did the user like it?
  commented: boolean;     // did the user comment?
  followed: boolean;      // did the user follow the creator?
  openedSource: boolean;  // did they click "open on X/YouTube"?
}

export interface BehaviorProfile {
  // Weighted scores per topic (0..1), updated from dwell + interactions
  topicWeights: Record<string, number>;
  // Weighted scores per format (0..1)
  formatWeights: Record<string, number>;
  // Weighted scores per provider (0..1)
  providerWeights: Record<string, number>;
  // Total interactions (likes, comments, follows, opens)
  totalInteractions: number;
  // Total dwell time in ms
  totalDwellMs: number;
  // Number of posts viewed
  postsViewed: number;
  // Last updated timestamp
  ts: number;
}

const emptyProfile = (): BehaviorProfile => ({
  topicWeights: {},
  formatWeights: {},
  providerWeights: {},
  totalInteractions: 0,
  totalDwellMs: 0,
  postsViewed: 0,
  ts: Date.now(),
});

// ─── Persistence ───
export function loadProfile(): BehaviorProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return emptyProfile();
    const p = JSON.parse(raw);
    return { ...emptyProfile(), ...p };
  } catch { return emptyProfile(); }
}

export function saveProfile(p: BehaviorProfile): void {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch {}
}

// ─── Dwell time tracker ───
// Call startDwell when a post becomes active, stopDwell when it scrolls away.
// Returns the accumulated record.

let currentDwell: { postId: string; topic: string; format: string; provider: string; startTime: number } | null = null;
let currentInteractions: { liked?: boolean; commented?: boolean; followed?: boolean; openedSource?: boolean } = {};

export function startDwell(postId: string, topic: string, format: string, provider: string): void {
  // If there's a current dwell session, finalize it first
  if (currentDwell) flushDwell();
  currentDwell = { postId, topic, format, provider, startTime: Date.now() };
  currentInteractions = {};
}

export function recordInteraction(type: 'liked' | 'commented' | 'followed' | 'openedSource'): void {
  if (!currentDwell) return;
  currentInteractions[type] = true;
}

export function flushDwell(): DwellRecord | null {
  if (!currentDwell) return null;
  const dwellMs = Date.now() - currentDwell.startTime;
  const record: DwellRecord = {
    postId: currentDwell.postId,
    topic: currentDwell.topic,
    format: currentDwell.format,
    provider: currentDwell.provider,
    dwellMs: Math.min(dwellMs, 120000), // cap at 2 minutes (avoid inflating for idle tabs)
    liked: !!currentInteractions.liked,
    commented: !!currentInteractions.commented,
    followed: !!currentInteractions.followed,
    openedSource: !!currentInteractions.openedSource,
  };
  currentDwell = null;
  currentInteractions = {};
  return record;
}

// ─── Profile update from dwell record ───
// Incorporates a dwell record into the behavioral profile using exponential
// moving average — recent behavior matters more than old behavior.

const ALPHA = 0.15; // smoothing factor (0..1) — higher = faster adaptation

export function updateProfile(profile: BehaviorProfile, record: DwellRecord): BehaviorProfile {
  const p = { ...profile };
  
  // Skip if dwell was too short (< 1 second = user scrolled past instantly)
  if (record.dwellMs < 1000) return p;

  // Engagement score for this post: dwell time + interaction bonuses
  // Interactions are strong signals — a like is worth ~30s of dwell
  const interactionBonus = (record.liked ? 30000 : 0) + (record.commented ? 45000 : 0)
    + (record.followed ? 40000 : 0) + (record.openedSource ? 20000 : 0);
  const engagement = record.dwellMs + interactionBonus;

  // Normalize to 0..1 using a sigmoid-like function (saturation at ~60s)
  const normalizedEng = Math.min(1, engagement / 60000);

  // Update topic weight with EMA
  const oldTopic = p.topicWeights[record.topic] ?? 0.5; // default neutral
  p.topicWeights[record.topic] = oldTopic * (1 - ALPHA) + normalizedEng * ALPHA;

  // Update format weight
  const oldFormat = p.formatWeights[record.format] ?? 0.5;
  p.formatWeights[record.format] = oldFormat * (1 - ALPHA) + normalizedEng * ALPHA;

  // Update provider weight
  const provKey = record.provider || 'unknown';
  const oldProvider = p.providerWeights[provKey] ?? 0.5;
  p.providerWeights[provKey] = oldProvider * (1 - ALPHA) + normalizedEng * ALPHA;

  // Update aggregates
  p.totalDwellMs += record.dwellMs;
  p.totalInteractions += interactionBonus > 0 ? 1 : 0;
  p.postsViewed += 1;
  p.ts = Date.now();

  // Clamp all weights to 0..1
  for (const k of Object.keys(p.topicWeights)) p.topicWeights[k] = Math.max(0, Math.min(1, p.topicWeights[k]));
  for (const k of Object.keys(p.formatWeights)) p.formatWeights[k] = Math.max(0, Math.min(1, p.formatWeights[k]));
  for (const k of Object.keys(p.providerWeights)) p.providerWeights[k] = Math.max(0, Math.min(1, p.providerWeights[k]));

  saveProfile(p);
  return p;
}

// ─── Personalization multiplier for ranking ───
// Given an item's topic/format/provider and the user's profile, return a
// multiplier (0.5..1.5) that boosts content matching the user's preferences.

export function personalizationBoost(topic: string, format: string, provider: string, profile: BehaviorProfile): number {
  const tw = profile.topicWeights[topic] ?? 0.5;
  const fw = profile.formatWeights[format] ?? 0.5;
  const pw = profile.providerWeights[provider || 'unknown'] ?? 0.5;
  // Weighted average: topic matters most (50%), format (30%), provider (20%)
  const combined = 0.5 * tw + 0.3 * fw + 0.2 * pw;
  // Map 0..1 to 0.7..1.3 — moderate boost/suppression, not extreme
  return 0.7 + combined * 0.6;
}

// ─── Cross-device sync via Supabase ───
// Generates a unique user ID, stores it in a cookie, and syncs the user's
// state (behavior profile, seenIds, prefs, likes, follows, comments) to Supabase.
// On a new device, the user enters their sync code to pull down their data.

const SYNC_USER_ID_KEY = 'jetpacknano_uid';
const SYNC_COOKIE_DAYS = 3650; // 10 years

// Generate a random user ID (12-char alphanumeric)
export function generateUserId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no confusing chars (0/O, 1/I)
  let id = '';
  for (let i = 0; i < 12; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

// Get or create the user's sync ID (stored in cookie)
export function getSyncUserId(): string {
  const existing = document.cookie
    .split('; ')
    .find((c) => c.startsWith(SYNC_USER_ID_KEY + '='));
  if (existing) return existing.slice(SYNC_USER_ID_KEY.length + 1);

  const newId = generateUserId();
  const exp = new Date(Date.now() + SYNC_COOKIE_DAYS * 864e5).toUTCString();
  document.cookie = `${SYNC_USER_ID_KEY}=${newId}; expires=${exp}; path=/; SameSite=Lax`;
  return newId;
}

// Set a specific sync ID (when linking a new device)
export function setSyncUserId(id: string): void {
  const exp = new Date(Date.now() + SYNC_COOKIE_DAYS * 864e5).toUTCString();
  document.cookie = `${SYNC_USER_ID_KEY}=${id}; expires=${exp}; path=/; SameSite=Lax`;
}

export interface SyncData {
  behaviorProfile: any;
  seenIds: string[];
  prefs: any;
  opts: any;
  liked: Record<string, boolean>;
  followed: Record<string, boolean>;
  comments: Record<string, any[]>;
  topicOrder: string[];
  ts: number;
}

// Push sync data to Supabase via our serverless function
export async function pushSync(userId: string, data: SyncData): Promise<boolean> {
  try {
    const r = await fetch('/api/sync?userId=' + userId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    });
    return r.ok;
  } catch { return false; }
}

// Pull sync data from Supabase
export async function pullSync(userId: string): Promise<SyncData | null> {
  try {
    const r = await fetch('/api/sync?userId=' + userId, { method: 'GET' });
    if (!r.ok) return null;
    const j = await r.json();
    return j.data || null;
  } catch { return null; }
}

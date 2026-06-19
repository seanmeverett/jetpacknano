import { supabase } from './supabaseClient';
import type { Post, User } from './types';
import type { Comment } from './store';

const mapUser = (r: any): User => ({
  id: r.id, name: r.name, handle: r.handle, followers: r.followers,
  verified: !!r.verified, joinedDaysAgo: r.joined_days_ago,
});


export interface LiveItem {
  id: string; topic: string; type: 'video' | 'image' | 'text' | 'story' | 'audio';
  title: string; author: string; community: string;
  media?: string[]; audio?: string; duration?: number; format: string; permalink: string; likes: number; comments: number; ageHours: number;
  embedUrl?: string; provider?: string; thumb?: string;
}

export async function fetchLiveFeed(topics: string[], lang = 'en', region = 'US'): Promise<LiveItem[]> {
  try {
    const params = new URLSearchParams({ topics: topics.join(','), lang, region });
    const r = await fetch('/api/feed?' + params.toString());
    if (!r.ok) return [];
    const j = await r.json();
    return (j.items || []) as LiveItem[];
  } catch { return []; }
}

const sanitize = (s: string) => s.replace(/[^a-z0-9_]/gi, '').slice(0, 40);

export function liveToPosts(items: LiveItem[]): { posts: Post[]; users: User[] } {
  const users: User[] = []; const uids = new Set<string>();
  const posts: Post[] = items.map((it) => {
    const uid = 'live_' + sanitize(it.author);
    if (!uids.has(uid)) { uids.add(uid); users.push({ id: uid, name: it.author, handle: it.author.replace(/^(u\/|@)/, ''), followers: 0, verified: false, joinedDaysAgo: 0 }); }
    return {
      id: it.id, creatorId: uid, topic: it.topic as any,
      kind: it.embedUrl ? 'video' : it.type === 'video' ? 'video' : it.type === 'audio' ? 'audio' : it.type === 'text' ? 'text' : 'image',
      imageUrl: it.media?.[0], media: it.type === 'story' ? it.media : undefined, audio: it.audio, duration: it.duration,
      caption: it.title, likes: it.likes, comments: it.comments, shares: 0, ageHours: it.ageHours,
      permalink: it.permalink, community: it.community, format: it.format,
      embedUrl: it.embedUrl, provider: it.provider, thumb: it.thumb,
    } as Post;
  });
  return { posts, users };
}

export async function loadUsers(): Promise<Record<string, User>> {
  if (!supabase) return {};
  const { data, error } = await supabase.from('users').select('*');
  if (error || !data) return {};
  const map: Record<string, User> = {};
  for (const r of data) map[r.id] = mapUser(r);
  return map;
}

// Seed comments stored in Supabase (per post). ts comes back in seconds -> convert to ms.
export async function loadComments(): Promise<Record<string, Comment[]>> {
  if (!supabase) return {};
  const { data, error } = await supabase.from('post_comments').select('id,post_id,author,text,ts');
  if (error || !data) return {};
  const map: Record<string, Comment[]> = {};
  for (const r of data) {
    const pid = r.post_id;
    (map[pid] ??= []).push({ id: r.id, author: r.author, text: r.text, ts: Number(r.ts) * 1000 });
  }
  return map;
}

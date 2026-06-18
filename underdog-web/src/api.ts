import { supabase } from './supabaseClient';
import { POSTS } from './seed';
import type { Post } from './types';

// DB row -> app Post (field names differ: snake_case -> camelCase)
const mapRow = (r: any): Post => ({
  id: r.id,
  creatorId: r.creator_id,
  topic: r.topic,
  kind: r.kind,
  imageUrl: r.image_url ?? undefined,
  bgFrom: r.bg_from ?? undefined,
  bgTo: r.bg_to ?? undefined,
  caption: r.caption,
  likes: Number(r.likes),
  comments: r.comments,
  shares: r.shares,
  ageHours: r.age_hours,
});

// Load posts from Supabase if configured, else local seed. Always resolves.
export async function loadPosts(): Promise<Post[]> {
  if (!supabase) return POSTS;
  const { data, error } = await supabase.from('posts').select('*').order('id', { ascending: true });
  if (error || !data || data.length === 0) return POSTS; // graceful fallback
  return data.map(mapRow);
}

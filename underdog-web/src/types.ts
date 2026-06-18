import type { TOPICS } from './seed';

export type TopicId = (typeof TOPICS)[number]['id'];

export interface User {
  id: string;
  name: string;
  handle: string;
  followers: number;
  verified?: boolean;
  joinedDaysAgo: number;
}

export interface Post {
  id: string;
  creatorId: string;
  topic: TopicId;
  kind: 'image' | 'text' | 'tiktok' | 'video';
  imageUrl?: string;
  tiktokUrl?: string;
  media?: string[]; // story = multiple images
  permalink?: string;
  embedUrl?: string; // for embeddable providers (YouTube, etc.)
  provider?: string;
  thumb?: string;
  community?: string;
  bgFrom?: string;
  bgTo?: string;
  caption: string;
  likes: number;
  comments: number;
  shares: number;
  ageHours: number;
}

export type FeedMode = 'inverse' | 'standard';

export interface RankOptions {
  mode: FeedMode;
  inverseStrength: number; // 0..1
  diversityOn: boolean;
  freshnessHalfLifeHours: number;
}

export interface RankedPost {
  post: Post;
  factors: {
    relevance: number; // 0..1
    reach: number; // 0..1 (boost from like-inversion, or popularity)
    freshness: number; // 0..1
    diversity: number; // 0..1
  };
  score: number;
}

export interface ViewerPrefs {
  interests: Record<TopicId, number>; // weight 0..1
}

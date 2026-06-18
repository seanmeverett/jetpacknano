import type { Post, User } from './types';

export const TOPICS = [
  { id: 'music', label: 'Music', icon: 'musical-notes', color: '#7C5CFF' },
  { id: 'comedy', label: 'Comedy', icon: 'happy', color: '#FF8A5C' },
  { id: 'art', label: 'Art', icon: 'color-palette', color: '#FF5C9D' },
  { id: 'cooking', label: 'Cooking', icon: 'restaurant', color: '#FFB14E' },
  { id: 'nature', label: 'Nature', icon: 'leaf', color: '#34C759' },
  { id: 'fitness', label: 'Fitness', icon: 'barbell', color: '#5CC8FF' },
  { id: 'tech', label: 'Tech', icon: 'hardware-chip', color: '#5C7BFF' },
  { id: 'travel', label: 'Travel', icon: 'airplane', color: '#5CD8E8' },
  { id: 'gaming', label: 'Gaming', icon: 'game-controller', color: '#9D5CFF' },
  { id: 'books', label: 'Books', icon: 'book', color: '#C77F3F' },
  { id: 'fashion', label: 'Fashion', icon: 'shirt', color: '#FF5C8A' },
  { id: 'science', label: 'Science', icon: 'flask', color: '#4FA3FF' },
  { id: 'pets', label: 'Pets', icon: 'paw', color: '#FFA55C' },
  { id: 'diy', label: 'DIY', icon: 'construct', color: '#8E8E93' },
] as const;

export const USERS: User[] = [
  { id: 'u1', name: 'Maya Okafor', handle: 'mayamakes', followers: 12, joinedDaysAgo: 2 },
  { id: 'u2', name: 'Diego Ruiz', handle: 'diego.draws', followers: 41, joinedDaysAgo: 6 },
  { id: 'u3', name: 'Aiko Tanaka', handle: 'aiko.cooks', followers: 7, joinedDaysAgo: 1 },
  { id: 'u4', name: 'Sam Whitfield', handle: 'samwalks', followers: 88, joinedDaysAgo: 14 },
  { id: 'u5', name: 'Priya Nair', handle: 'priya.lifts', followers: 23, joinedDaysAgo: 9 },
  { id: 'u6', name: 'Leo Marchetti', handle: 'leomakes', followers: 5, joinedDaysAgo: 0 },
  { id: 'u7', name: 'Nadia Haddad', handle: 'nadia.code', followers: 156, joinedDaysAgo: 20 },
  { id: 'u8', name: 'Theo Park', handle: 'theotravels', followers: 3, joinedDaysAgo: 0 },
  { id: 'u9', name: 'Rosa Vargas', handle: 'rosa.plays', followers: 64, joinedDaysAgo: 11 },
  { id: 'u10', name: 'Idris Bello', handle: 'idris.reads', followers: 18, joinedDaysAgo: 5 },
  { id: 'u11', name: 'Lina Brandt', handle: 'linawears', followers: 9, joinedDaysAgo: 3 },
  { id: 'u12', name: 'Omar Farsi', handle: 'omar.lab', followers: 27, joinedDaysAgo: 8 },
  { id: 'u13', name: 'Greta Lind', handle: 'greta.paws', followers: 2, joinedDaysAgo: 0 },
  { id: 'u14', name: 'Vikram Rao', handle: 'vik.builds', followers: 33, joinedDaysAgo: 12 },
  { id: 'u15', name: 'Chloe Adams', handle: 'chloesings', followers: 240, joinedDaysAgo: 30 },
  { id: 'u16', name: 'Marcus Lee', handle: 'marcus.jokes', followers: 1900, joinedDaysAgo: 120, verified: true },
  { id: 'u17', name: 'Sofia Costa', handle: 'sofia.eats', followers: 845000, joinedDaysAgo: 900, verified: true },
  { id: 'u18', name: 'Brent Cole', handle: 'brentfit', followers: 410000, joinedDaysAgo: 700, verified: true },
  { id: 'u19', name: 'Yuki Sato', handle: 'yuki.art', followers: 1250000, joinedDaysAgo: 1100, verified: true },
  { id: 'u20', name: 'Devin Wright', handle: 'devintech', followers: 980000, joinedDaysAgo: 800, verified: true },
  { id: 'u21', name: 'Camila Reyes', handle: 'camilatravels', followers: 760000, joinedDaysAgo: 600, verified: true },
  { id: 'u22', name: 'Jax Osei', handle: 'jaxgames', followers: 1530000, joinedDaysAgo: 1000, verified: true },
  { id: 'u23', name: 'Hana Kim', handle: 'hana.style', followers: 520000, joinedDaysAgo: 500, verified: true },
  { id: 'u24', name: 'Felix Aubert', handle: 'felix.science', followers: 388000, joinedDaysAgo: 650, verified: true },
];

// [creatorIdx, topic, caption, likes, comments, shares, ageHours, kind]
type SeedRow = [number, Post['topic'], string, number, number, number, number, Post['kind']];

const ROWS: SeedRow[] = [
  // authentic / zero-likes creators (small accounts, recent)
  [0, 'music', 'first song i ever recorded in my closet. be kind 🙏', 0, 0, 0, 1, 'text'],
  [1, 'art', 'sketched this on my lunch break. 30 mins, ballpoint pen', 0, 1, 0, 2, 'image'],
  [2, 'cooking', 'made ramen from scratch for the first time. proud of myself', 2, 0, 0, 1, 'image'],
  [3, 'nature', 'found this trail behind my apartment. nobody on it', 0, 0, 0, 3, 'image'],
  [4, 'fitness', 'day 9 of working out. still can\nt do one pull-up but trying', 5, 2, 0, 1, 'text'],
  [5, 'tech', 'soldered my first pcb today. it actually works??', 0, 0, 0, 0, 'image'],
  [7, 'travel', 'took a bus 4 hours to see the sea. worth it', 1, 0, 0, 2, 'image'],
  [9, 'books', 'halfway through dune. my brain is melting (good)', 0, 0, 0, 1, 'text'],
  [10, 'fashion', 'thrifted this jacket for $4. styling it 3 ways', 3, 0, 0, 1, 'image'],
  [12, 'pets', 'meet biscoff. he is my whole world', 0, 0, 0, 0, 'image'],
  [13, 'diy', 'built a shelf from scrap wood. wobbly but mine', 1, 0, 0, 4, 'image'],
  [14, 'music', 'busking outside the grocery store tonight 💜', 7, 1, 0, 2, 'text'],

  // small-but-real (a few dozen to few hundred likes)
  [0, 'music', 'cover of a phoebe bridgers song, feedback welcome', 47, 5, 1, 20, 'text'],
  [1, 'art', 'commission finished! thank you to whoever trusted me', 130, 18, 3, 33, 'image'],
  [2, 'cooking', 'my sourdough finally has ears 🥖', 212, 24, 6, 18, 'image'],
  [4, 'fitness', 'ran my first 5k without stopping. crying a little', 89, 12, 2, 9, 'text'],
  [6, 'tech', 'tiny cli tool i wrote to organize my screenshots', 256, 30, 14, 26, 'text'],
  [9, 'books', 'my top 5 sci-fi that aren\nt dune. fight me', 64, 21, 2, 15, 'text'],
  [11, 'fashion', 'capsule wardrobe challenge: 10 pieces, 30 days', 178, 9, 4, 22, 'image'],
  [13, 'diy', 'turned an old ladder into a bookshelf. tutorial?', 92, 11, 3, 30, 'image'],
  [8, 'gaming', 'beat hollow knight pantheon 4. hands shaking', 134, 28, 5, 12, 'text'],
  [14, 'music', 'open mic tonight went better than expected', 203, 16, 2, 8, 'text'],

  // mid (thousands to tens of thousands)
  [14, 'music', 'acoustic session in my kitchen, full song in bio', 18400, 412, 190, 40, 'image'],
  [8, 'gaming', 'speedrun pb! sub 12 mins on celeste', 9800, 210, 88, 16, 'text'],
  [11, 'fashion', 'fall lookbook drop. which one wins?', 33200, 1200, 320, 24, 'image'],
  [6, 'tech', 'i rebuilt my homepage 7 times. here\ns the final', 12400, 560, 210, 30, 'image'],
  [2, 'cooking', '15 pasta shapes ranked. controversial list', 21500, 980, 140, 50, 'image'],
  [13, 'diy', 'i renovated my entire bathroom for $300', 8900, 700, 410, 60, 'image'],

  // mega (hundreds of thousands to millions) — the attention hogs
  [17, 'cooking', 'the ultimate 60-second pasta. 40M views incoming', 1280000, 42000, 9800, 12, 'image'],
  [18, 'fitness', 'full body shred in 12 minutes. do it with me', 640000, 18000, 5200, 6, 'image'],
  [19, 'art', 'my hyperrealistic eye drawing (timelapse)', 2100000, 91000, 33000, 18, 'image'],
  [20, 'tech', 'i tested every flagship phone so you don\nt have to', 880000, 23000, 8800, 4, 'image'],
  [21, 'travel', 'bali in 60 seconds. save this. #travel', 1450000, 51000, 22000, 9, 'image'],
  [22, 'gaming', 'insane 1v5 clutch. like + follow if you cried', 1900000, 70000, 19000, 2, 'image'],
  [23, 'fashion', 'get ready with me: met gala edition', 720000, 31000, 9100, 20, 'image'],
  [23, 'science', 'i froze water using sound. here is how', 560000, 14000, 7300, 14, 'image'],
  [15, 'music', 'new single out now. stream stream stream', 410000, 12000, 8800, 28, 'text'],
  [16, 'comedy', 'when your code works on the first try (it never does)', 980000, 52000, 18000, 1, 'text'],

  // a couple more authentic zero-likes to seed each remaining topic
  [4, 'nature', 'moss is so underrated. that is the post', 0, 0, 0, 5, 'image'],
  [12, 'science', 'my backyard weather station says rain. it is wrong', 0, 0, 0, 2, 'text'],
];

const BG: Record<string, [string, string]> = {
  music: ['#7C5CFF', '#3A2A6E'],
  comedy: ['#FF8A5C', '#7A3A1E'],
  art: ['#FF5C9D', '#7A1E4E'],
  cooking: ['#FFB14E', '#7A5A1E'],
  nature: ['#34C759', '#1A5E2C'],
  fitness: ['#5CC8FF', '#1E5E7A'],
  tech: ['#5C7BFF', '#1E2E7A'],
  travel: ['#5CD8E8', '#1E6E7A'],
  gaming: ['#9D5CFF', '#4A1E7A'],
  books: ['#C77F3F', '#5E3E1E'],
  fashion: ['#FF5C8A', '#7A1E3E'],
  science: ['#4FA3FF', '#1E4E7A'],
  pets: ['#FFA55C', '#7A4A1E'],
  diy: ['#8E8E93', '#3A3A40'],
};

export const POSTS: Post[] = ROWS.map((r, i) => {
  const [cIdx, topic, caption, likes, comments, shares, ageHours, kind] = r;
  const [bgFrom, bgTo] = BG[topic] ?? ['#444', '#222'];
  return {
    id: `p${i + 1}`,
    creatorId: USERS[cIdx].id,
    topic,
    kind,
    imageUrl: kind === 'image' ? `https://picsum.photos/seed/jetpacknano${i + 1}/800/1400` : undefined,
    bgFrom,
    bgTo,
    caption,
    likes,
    comments,
    shares,
    ageHours,
  };
});

export const userById = (id: string): User =>
  USERS.find((u) => u.id === id) ?? USERS[0];

export const topicById = (id: string) =>
  TOPICS.find((t) => t.id === id) ?? TOPICS[0];

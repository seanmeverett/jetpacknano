import type { Post, User } from './types';
import { POST_IMAGE } from './postImages';

export const TOPICS = [
  { id: 'music', label: 'Music', icon: 'musical-notes', color: '#FF0000' },
  { id: 'comedy', label: 'Comedy', icon: 'happy', color: '#990000' },
  { id: 'art', label: 'Art', icon: 'color-palette', color: '#FF0000' },
  { id: 'cooking', label: 'Cooking', icon: 'restaurant', color: '#990000' },
  { id: 'nature', label: 'Nature', icon: 'leaf', color: '#FF0000' },
  { id: 'fitness', label: 'Fitness', icon: 'barbell', color: '#990000' },
  { id: 'tech', label: 'Tech', icon: 'hardware-chip', color: '#FF0000' },
  { id: 'travel', label: 'Travel', icon: 'airplane', color: '#990000' },
  { id: 'gaming', label: 'Gaming', icon: 'game-controller', color: '#FF0000' },
  { id: 'books', label: 'Books', icon: 'book', color: '#990000' },
  { id: 'fashion', label: 'Fashion', icon: 'shirt', color: '#FF0000' },
  { id: 'science', label: 'Science', icon: 'flask', color: '#990000' },
  { id: 'pets', label: 'Pets', icon: 'paw', color: '#FF0000' },
  { id: 'diy', label: 'DIY', icon: 'construct', color: '#990000' },
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
  [0, 'music', 'recorded this at 3am in my closet. please be gentle 🙏', 0, 0, 0, 1, 'text'],
  [1, 'art', '30 minutes. ballpoint pen. no undo button. rate it', 0, 1, 0, 2, 'image'],
  [2, 'cooking', 'first ever homemade ramen. i am literally shaking', 2, 0, 0, 1, 'image'],
  [3, 'nature', 'found a hidden trail. zero humans. just me and the trees', 0, 0, 0, 3, 'image'],
  [4, 'fitness', 'day 9. still cannot do one pull-up. but watch me', 5, 2, 0, 1, 'text'],
  [5, 'tech', 'i soldered my FIRST pcb and it did not explode???', 0, 0, 0, 0, 'image'],
  [7, 'travel', 'took a 4-hour bus just to see the ocean. worth every minute', 1, 0, 0, 2, 'image'],
  [9, 'books', 'halfway through dune and my brain has left the chat', 0, 0, 0, 1, 'text'],
  [10, 'fashion', 'USD4 thrifted jacket. styling it 3 ways. which slaps?', 3, 0, 0, 1, 'image'],
  [12, 'pets', 'everybody meet biscoff. he is my entire personality now', 0, 0, 0, 0, 'image'],
  [13, 'diy', 'shelf from scrap wood. wobbly. mine. i love it', 1, 0, 0, 4, 'image'],
  [14, 'music', 'busking outside the grocery store. come say hi', 7, 1, 0, 2, 'text'],

  // small-but-real (a few dozen to few hundred likes)
  [0, 'music', 'phoebe bridgers cover. recorded on my phone. be kind', 47, 5, 1, 20, 'text'],
  [1, 'art', 'finished a commission. someone actually paid me to draw this', 130, 18, 3, 33, 'image'],
  [2, 'cooking', 'my sourdough finally got ears. crying real tears', 212, 24, 6, 18, 'image'],
  [4, 'fitness', 'ran my first 5k without stopping. literally sobbing', 89, 12, 2, 9, 'text'],
  [6, 'tech', 'tiny CLI tool that auto-organizes your screenshots. free', 256, 30, 14, 26, 'text'],
  [9, 'books', 'top 5 sci-fi that are not dune. number 3 will hurt you', 64, 21, 2, 15, 'text'],
  [11, 'fashion', 'capsule wardrobe: 10 pieces, 30 days, zero buying', 178, 9, 4, 22, 'image'],
  [13, 'diy', 'turned an old ladder into a bookshelf. tutorial?', 92, 11, 3, 30, 'image'],
  [8, 'gaming', 'beat hollow knight pantheon 4. my hands are vibrating', 134, 28, 5, 12, 'text'],
  [14, 'music', 'open mic went off. here is the best 20 seconds', 203, 16, 2, 8, 'text'],

  // mid (thousands to tens of thousands)
  [14, 'music', 'acoustic kitchen session. full song in bio', 18400, 412, 190, 40, 'image'],
  [8, 'gaming', 'NEW PB. sub-12 celeste. my fingers are on fire', 9800, 210, 88, 16, 'text'],
  [11, 'fashion', 'fall lookbook drop. comment which one wins', 33200, 1200, 320, 24, 'image'],
  [6, 'tech', 'rebuilt my homepage 7 times. this is the final form', 12400, 560, 210, 30, 'image'],
  [2, 'cooking', '15 pasta shapes ranked. the list that ends friendships', 21500, 980, 140, 50, 'image'],
  [13, 'diy', 'renovated my entire bathroom for USD300. here is how', 8900, 700, 410, 60, 'image'],

  // mega (attention hogs)
  [17, 'cooking', '60-second pasta that broke the internet. again', 1280000, 42000, 9800, 12, 'image'],
  [18, 'fitness', '12-min full body shred. do it with me, cry later', 640000, 18000, 5200, 6, 'image'],
  [19, 'art', 'hyperrealistic eye drawing. 11 hours in 30 seconds', 2100000, 91000, 33000, 18, 'image'],
  [20, 'tech', 'i tested every flagship phone so you do not have to', 880000, 23000, 8800, 4, 'image'],
  [21, 'travel', 'bali in 60 seconds. save this for your bucket list', 1450000, 51000, 22000, 9, 'image'],
  [22, 'gaming', '1v5 clutch. i do not even play this game. clip of the year', 1900000, 70000, 19000, 2, 'image'],
  [22, 'fashion', 'get ready with me: met gala edition. millions spent', 720000, 31000, 9100, 20, 'image'],
  [23, 'science', 'i froze water using SOUND. physics goes hard', 560000, 14000, 7300, 14, 'image'],
  [15, 'music', 'new single out now. stream it or do not, whatever', 410000, 12000, 8800, 28, 'text'],
  [16, 'comedy', 'when your code works on the first try (it never does)', 980000, 52000, 18000, 1, 'text'],

  // a couple more authentic zero-likes to seed each remaining topic
  [4, 'nature', 'moss is underrated and i will die on this hill', 0, 0, 0, 5, 'image'],
  [12, 'science', 'my backyard weather station lied about rain. again', 0, 0, 0, 2, 'text'],
];

const BG: Record<string, [string, string]> = {
  music: ['#FF0000', '#590000'],
  comedy: ['#990000', '#590000'],
  art: ['#FF0000', '#590000'],
  cooking: ['#990000', '#590000'],
  nature: ['#FF0000', '#590000'],
  fitness: ['#990000', '#590000'],
  tech: ['#FF0000', '#590000'],
  travel: ['#990000', '#590000'],
  gaming: ['#FF0000', '#590000'],
  books: ['#990000', '#590000'],
  fashion: ['#FF0000', '#590000'],
  science: ['#990000', '#590000'],
  pets: ['#FF0000', '#590000'],
  diy: ['#990000', '#590000'],
};

export const POSTS: Post[] = ROWS.map((r, i) => {
  const [cIdx, topic, caption, likes, comments, shares, ageHours, kind] = r;
  const [bgFrom, bgTo] = BG[topic] ?? ['#444', '#222'];
  return {
    id: `p${i + 1}`,
    creatorId: USERS[cIdx].id,
    topic,
    kind,
    imageUrl: kind === 'image' ? POST_IMAGE[`p${i + 1}`] : undefined,
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

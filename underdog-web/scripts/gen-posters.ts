import { POSTS, userById, topicById } from '../src/seed';

const EMOJI: Record<string, string> = {
  music: '🎵', comedy: '😂', art: '🎨', cooking: '🍳', nature: '🌿', fitness: '🏋️',
  tech: '💻', travel: '✈️', gaming: '🎮', books: '📚', fashion: '👗', science: '🔬',
  pets: '🐾', diy: '🔧',
};

const fmtCount = (n: number) =>
  n >= 1_000_000 ? (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  : n >= 1_000 ? (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  : `${n}`;

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
   .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// naive word-wrap into lines of <= maxChars
const wrap = (text: string, maxChars: number): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars) {
      if (cur) lines.push(cur);
      cur = w;
    } else {
      cur = (cur + ' ' + w).trim();
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 5);
};

function svgFor(postId: string): string {
  const post = POSTS.find((p) => p.id === postId)!;
  const creator = userById(post.creatorId);
  const topic = topicById(post.topic);
  const c1 = topic.color;
  const c2 = '#3a0000';
  const emoji = EMOJI[post.topic] ?? '✦';
  const captionLines = wrap(post.caption, 26);
  const start = 640 - (captionLines.length * 52) / 2;
  const tspans = captionLines
    .map((l, i) => `<tspan x="400" dy="${i === 0 ? 0 : 58}">${esc(l)}</tspan>`)
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1400" viewBox="0 0 800 1400">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
    <radialGradient id="v" cx="0.5" cy="0.32" r="0.9">
      <stop offset="0" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.55"/>
    </radialGradient>
  </defs>
  <rect width="800" height="1400" fill="url(#g)"/>
  <circle cx="640" cy="220" r="180" fill="#ffffff" opacity="0.06"/>
  <circle cx="150" cy="1150" r="230" fill="#000000" opacity="0.18"/>
  <rect width="800" height="1400" fill="url(#v)"/>
  <text x="400" y="540" font-size="220" text-anchor="middle" dominant-baseline="central">${emoji}</text>
  <text x="400" y="${start}" font-family="Montserrat, Arial, sans-serif" font-size="44" font-weight="800" fill="#ffffff" text-anchor="middle">${tspans}</text>
  <text x="44" y="120" font-family="Montserrat, Arial, sans-serif" font-size="26" font-weight="900" fill="#ffffff" opacity="0.92">JETPACK NANO</text>
  <text x="44" y="156" font-family="Montserrat, Arial, sans-serif" font-size="22" font-weight="700" fill="#ffffff" opacity="0.7">${esc(topic.label)} · @${esc(creator.handle)}</text>
  <text x="756" y="1330" font-family="Montserrat, Arial, sans-serif" font-size="30" font-weight="800" fill="#ffffff" opacity="0.8" text-anchor="end">♥ ${fmtCount(post.likes)}</text>
</svg>`;
}

let n = 0;
for (const p of POSTS) {
  if (p.kind !== 'image') continue;
  const out = `public/posts/${p.id}.svg`;
  const fs = require('fs');
  fs.writeFileSync(out, svgFor(p.id));
  n++;
}
console.log(`generated ${n} post posters into public/posts/`);

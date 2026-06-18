import { writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { existsSync } from 'node:fs';

const UA = 'JetpackNano/1.0 (https://github.com/seanmeverett/jetpacknano; contact: seansmeverett@gmail.com)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const Q = {
  p2: 'doodle drawing', p3: 'ramen noodles', p4: 'hiking forest', p6: 'soldering electronics',
  p7: 'ocean waves', p9: 'thrift shopping', p10: 'cute dog', p11: 'woodworking', p14: 'painting art',
  p15: 'sourdough bread', p19: 'fashion outfit', p20: 'bookshelf', p23: 'acoustic guitar',
  p25: 'autumn fashion', p26: 'coding', p27: 'pasta', p28: 'home renovation', p29: 'cooking food',
  p30: 'workout gym', p31: 'eye drawing', p32: 'smartphone', p33: 'bali beach', p34: 'video game',
  p35: 'red carpet', p36: 'ice frozen', p39: 'moss',
};
const Qov = {
  p2: 'drawing', p3: 'ramen', p4: 'forest', p6: 'soldering', p7: 'ocean', p9: 'fashion',
  p10: 'dog', p11: 'woodworking', p14: 'painting', p15: 'bread', p19: 'fashion', p20: 'books',
  p23: 'guitar', p25: 'autumn', p26: 'coding', p27: 'pasta', p28: 'renovation', p29: 'cooking',
  p30: 'workout', p31: 'eye', p32: 'smartphone', p33: 'beach', p34: 'gaming', p35: 'fireworks',
  p36: 'ice', p39: 'moss',
};

const Q2 = {
  p2: 'sketching', p3: 'cooking', p4: 'waterfall', p6: 'circuit', p7: 'sea waves', p9: 'fashion',
  p10: 'dog', p11: 'wood', p14: 'painting', p15: 'bread', p19: 'fashion', p20: 'books',
  p23: 'guitar', p25: 'autumn leaves', p26: 'computer', p27: 'noodles', p28: 'construction',
  p29: 'chef', p30: 'running', p31: 'eye', p32: 'phone', p33: 'beach', p34: 'arcade', p35: 'fireworks',
  p36: 'ice', p39: 'plant',
};

async function openverseCands(query) {
  const url = 'https://api.openverse.org/v1/images/?' + new URLSearchParams({ q: query, extension: 'gif', page_size: '12' });
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error('openverse ' + r.status);
  const j = await r.json();
  return (j.results || []).map((x) => ({
    url: x.url,
    source: x.foreign_landing_url || x.url,
    credit: (x.creator ? x.creator : x.title) || 'Openverse contributor',
    license: (x.license || 'CC') + (x.license_version ? ' ' + x.license_version : ''),
  }));
}

async function commonsCands(query) {
  const url = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({
    action: 'query', generator: 'search', gsrsearch: query, gsrnamespace: '6', gsrlimit: '15',
    prop: 'imageinfo', iiprop: 'url|mime|extmetadata', iiurlwidth: '640', format: 'json',
  });
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error('commons ' + r.status);
  const j = await r.json();
  const pages = Object.values(j.query?.pages ?? {}).sort((a, b) => (a.index ?? 99) - (a.index ?? 99));
  const out = [];
  for (const pg of pages) {
    const ii = pg.imageinfo?.[0];
    if (!ii?.thumburl || !/gif/i.test(ii.mime || '')) continue;
    out.push({
      url: ii.thumburl,
      source: ii.descriptionurl || ii.url,
      credit: (ii.extmetadata?.Artist?.value?.replace(/<[^>]+>/g, '').trim()) || 'Wikimedia contributor',
      license: ii.extmetadata?.LicenseShortName?.value || 'see source',
    });
  }
  return out;
}

async function validate(buf) {
  if (buf.length < 8000) return 'too small';
  if (buf.length > 12_000_000) return 'too large';
  let animated = buf.includes(Buffer.from('NETSCAPE2.0'));
  if (!animated) {
    try { const m = await sharp(buf).metadata(); animated = (m.pages || 1) > 1; } catch { return 'meta-fail'; }
  }
  if (!animated) return 'static';
  try {
    const st = await sharp(buf).stats();
    const sd = (st.channels[0]?.stdev || 0) + (st.channels[1]?.stdev || 0) + (st.channels[2]?.stdev || 0);
    if (sd < 15) return 'monochrome';
  } catch { return 'stats-fail'; }
  return null;
}

async function tryCands(cands) {
  for (const c of cands) {
    try {
      const r = await fetch(c.url, { headers: { 'User-Agent': UA } });
      if (!r.ok) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      if (await validate(buf)) continue;
      return { buf, cred: c };
    } catch {}
  }
  return null;
}

const imgMap = {}, credMap = {};
let okGif = 0, fallback = 0;
for (const id of Object.keys(Q)) {
  let found = null;
  for (const fn of [() => openverseCands(Qov[id]), () => commonsCands(Q[id]), () => commonsCands(Q2[id])]) {
    let cands = [];
    try { cands = await fn(); } catch (e) { console.log(`${id}: ${fn.name} ${e.message}`); }
    found = await tryCands(cands);
    if (found) break;
    await sleep(800);
  }
  if (found) {
    await writeFile(`public/posts/${id}.gif`, found.buf);
    imgMap[id] = `/posts/${id}.gif`;
    credMap[id] = found.cred;
    console.log(`OK   ${id} -> ${id}.gif [${found.cred.license}]`);
    okGif++;
  } else {
    const fb = existsSync(`public/posts/${id}.jpg`) ? `/posts/${id}.jpg` : existsSync(`public/posts/${id}.png`) ? `/posts/${id}.png` : null;
    imgMap[id] = fb;
    console.log(`FB   ${id} -> ${fb || 'NONE'}`);
    fallback++;
  }
  await sleep(9000);
}
await writeFile('src/postImages.ts', '// AUTO-GENERATED by scripts/fetch-gifs.mjs\nexport const POST_IMAGE: Record<string, string> = ' + JSON.stringify(imgMap, null, 2) + ';\n');
await writeFile('src/postImageCredits.ts', '// AUTO-GENERATED by scripts/fetch-gifs.mjs\nexport const POST_CREDIT: Record<string, { credit: string; license: string; source: string }> = ' + JSON.stringify(credMap, null, 2) + ';\n');
console.log(`\nDONE: ${okGif} gifs, ${fallback} fallbacks`);

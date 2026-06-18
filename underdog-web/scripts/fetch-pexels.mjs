import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

// topic -> pexels search slug
const SLUG = {
  music:'music', comedy:'funny', art:'art', cooking:'cooking', nature:'nature', fitness:'fitness',
  tech:'technology', travel:'travel', gaming:'gaming', books:'books', fashion:'fashion',
  science:'science', pets:'pets', diy:'diy',
};
const CAPTIONS = {
  music:['this melody would not leave me alone until i recorded it','playing it until my fingers give out','a little late-night piano moment'],
  comedy:['i cannot believe this actually worked lmao','me explaining my bad idea with full confidence','when the plan comes together perfectly (it did not)'],
  art:['30 minutes with a ballpoint pen, no undo','layering until it finally clicks','painting over it for the fourth time'],
  cooking:['first time making this, do not judge','the garlic bread that ruined all other garlic bread','crispy on the outside, soft on the inside'],
  nature:['found this spot with zero people in it','the trail nobody talks about','sat here watching the water for way too long'],
  fitness:['day 9 and i still cannot do one pull-up but watch me','the workout that humbled me in 4 minutes','consistency over intensity, every time'],
  tech:['soldered my first board and it did not explode','the tiny tool that fixed my whole workflow','rebuilding this until it is finally clean'],
  travel:['took the long way just for this view','a place that actually looks like the photos','48 hours, one backpack, zero regrets'],
  gaming:['one more run turned into six','the clutch that made me drop my controller','finally beat it after 200 tries'],
  books:['the ending ruined me in the best way','three books i cannot stop thinking about','a storytime that got out of hand'],
  fashion:['thrifted this for nothing and styled it three ways','capsule wardrobe day 12, still holding','the one outfit i would wear forever'],
  science:['i froze water using sound and it broke my brain','the experiment that should not have worked','physics goes hard, actually'],
  pets:['he is my entire personality now','bath time went exactly as expected (chaos)','meet the smallest chaos machine'],
  diy:['built this from scrap and it is somehow sturdy','the fix that cost two dollars','renovating one corner at a time'],
};
const PER = 3;

const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const dur=(f)=>{ try { return parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1 "${f}"`).toString()); } catch { return 999; } };
const trim=(src,dst)=>{ execSync(`ffmpeg -y -i "${src}" -t 10 -an -vf "scale=720:-2" -r 24 -c:v libx264 -pix_fmt yuv420p -movflags +faststart "${dst}" >/dev/null 2>&1`); };

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36', viewport:{width:1280,height:900}, locale:'en-US' });
const p = await ctx.newPage();
const out = []; let n = 0;
for (const topic of Object.keys(SLUG)) {
  await p.goto('https://www.pexels.com/search/videos/'+encodeURIComponent(SLUG[topic]+' vertical'), { waitUntil:'domcontentloaded', timeout:45000 }).catch(e=>console.log('goto',topic,e.message));
  await p.waitForTimeout(6000);
  const urls = await p.evaluate(() => {
    const set = new Set();
    const re = /https:\/\/videos\.pexels\.com\/video-files\/[^"'\\ ]+\.mp4/g;
    (document.documentElement.outerHTML.match(re)||[]).forEach(x=>set.add(x.split('?')[0]));
    // prefer portrait (height 640/720/1080 with width<height)
    return [...set].sort((a,b)=>{
      const pa=/_(\d+)_(\d+)_/.exec(a), pb=/_(\d+)_(\d+)_/.exec(b);
      const ap = pa && pa[2]>pa[1] ? 0 : 1, bp = pb && pb[2]>pb[1] ? 0 : 1;
      return ap-bp;
    });
  });
  console.log(topic, 'urls', urls.length);
  let taken=0; let ci=0;
  for (const u of urls) {
    if (taken>=PER) break;
    const id = 'v'+(++n);
    const tmp = `/tmp/${id}.mp4`, dst = `public/posts/${id}.mp4`;
    try {
      const r = await fetch(u, { headers:{'User-Agent':'Mozilla/5.0'} });
      if (!r.ok) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      await writeFile(tmp, buf);
      const d = dur(tmp);
      if (d<=10) { execSync(`cp "${tmp}" "${dst}"`); }
      else { trim(tmp, dst); }
      out.push({ id, topic, url:`/posts/${id}.mp4`, caption: CAPTIONS[topic][ci % 3], dur: Math.min(d,10).toFixed(1) });
      console.log('  ok', id, topic, (d<=10?'kept':'trimmed'), out[out.length-1].dur+'s');
      taken++; ci++;
    } catch(e) { console.log('  fail', u.slice(-40), e.message.slice(0,60)); }
    await sleep(300);
  }
  await sleep(1000);
}
await b.close();
await writeFile('/tmp/pexels_clips.json', JSON.stringify(out,null,2));
console.log('\nTOTAL', out.length, '-> /tmp/pexels_clips.json');

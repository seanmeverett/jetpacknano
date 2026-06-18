import { useMemo, useRef, useState } from 'react';
import { useApp } from '../store';
import { userById, topicById } from '../seed';
import { POST_CREDIT } from '../postImageCredits';
import { POST_CREDIT as JPG_CREDIT } from '../postImageCreditsJpg';
import { rankFeed, fmtCount } from '../rank';
import type { RankedPost } from '../types';
import { WhySheet } from './WhySheet';
import { TikTokEmbed } from './TikTokEmbed';
import {
  TOPIC_ICONS, IoTrendingDownOutline, IoTrendingUpOutline, IoOptionsOutline,
  IoHeart, IoHeartOutline, IoChatbubbleOutline, IoArrowRedoOutline, IoHelpCircleOutline,
  IoSparkles, IoCheckmarkCircle,
} from '../icons';

const initials = (name: string) => name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
const ageText = (h: number) => (h < 1 ? 'just now' : h < 24 ? `${Math.round(h)}h ago` : `${Math.round(h / 24)}d ago`);

export function Feed() {
  const { prefs, opts, liked, followed, posts, setScreen, toggleLike, toggleFollow } = useApp();
  const [why, setWhy] = useState<RankedPost | null>(null);
  const [idx, setIdx] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);

  const ranked = useMemo<RankedPost[]>(() => {
    const eff = posts.map((p) => ({ ...p, likes: p.likes + (liked[p.id] ? 1 : 0) }));
    return rankFeed(eff, prefs, opts);
  }, [posts, prefs, opts, liked]);

  const onScroll = () => {
    const el = scroller.current; if (!el) return;
    const i = Math.round(el.scrollTop / el.clientHeight);
    if (i !== idx && i >= 0 && i < ranked.length) setIdx(i);
  };

  return (
    <div className="feed-wrap">
      <div className="feed" ref={scroller} onScroll={onScroll}>
        {ranked.map((rp) => (
          <PostCard key={rp.post.id} rp={rp} liked={!!liked[rp.post.id]} followed={!!followed[rp.post.creatorId]} onLike={() => toggleLike(rp.post.id)} onFollow={() => toggleFollow(rp.post.creatorId)} onWhy={() => setWhy(rp)} />
        ))}
      </div>

      <div className="topbar">
        <span className="brand"><span className="brand-icon" />&nbsp;Jetpack Nano</span>
        <button className={`mode-pill ${opts.mode}`} onClick={() => setScreen('settings')}>
          {opts.mode === 'inverse' ? <IoTrendingDownOutline size={13} /> : <IoTrendingUpOutline size={13} />}
          {opts.mode === 'inverse' ? 'Inverse' : 'Standard'}
        </button>
        <button className="icon-btn" onClick={() => setScreen('settings')}><IoOptionsOutline size={22} /></button>
      </div>
      <div className="counter">{idx + 1}/{ranked.length}</div>

      <WhySheet ranked={why} onClose={() => setWhy(null)} />
    </div>
  );
}

function PostCard({ rp, liked, followed, onLike, onFollow, onWhy }: { rp: RankedPost; liked: boolean; followed: boolean; onLike: () => void; onFollow: () => void; onWhy: () => void }) {
  const { post, factors } = rp;
  const creator = userById(post.creatorId);
  const topic = topicById(post.topic);
  const TopicIcon = TOPIC_ICONS[post.topic];
  const freshFace = creator.followers < 100;
  const lastTap = useRef(0);
  const [burst, setBurst] = useState(false);

  const tapBg = () => {
    const now = Date.now();
    if (now - lastTap.current < 280) { if (!liked) onLike(); setBurst(true); setTimeout(() => setBurst(false), 420); }
    else lastTap.current = now;
  };

  return (
    <section className="card" style={{ background: post.kind === 'image' ? undefined : `linear-gradient(${post.bgFrom}, ${post.bgTo})` }}>
      {post.kind === 'tiktok' && post.tiktokUrl
        ? <TikTokEmbed url={post.tiktokUrl} />
        : post.kind === 'image' && post.imageUrl && (post.imageUrl.endsWith('.mp4')
          ? <video className="card-bg" src={post.imageUrl} autoPlay loop muted playsInline preload="metadata" />
          : <img src={post.imageUrl} alt="" className="card-bg" />)}
      <div className="tap-layer" onClick={tapBg} />
      <div className="grad-top" />
      <div className="grad-bottom" />
      {burst && <div className="burst"><IoHeart size={92} color="var(--brand2)" /></div>}

      <div className="rail">
        <button className="rail-btn" onClick={onLike}>{liked ? <IoHeart size={32} color="var(--brand2)" /> : <IoHeartOutline size={32} />}<span style={{ color: liked ? 'var(--brand2)' : 'var(--text)' }}>{fmtCount(post.likes + (liked ? 1 : 0))}</span></button>
        <button className="rail-btn"><IoChatbubbleOutline size={32} /><span>{fmtCount(post.comments)}</span></button>
        <button className="rail-btn"><IoArrowRedoOutline size={30} /><span>{fmtCount(post.shares)}</span></button>
        <button className="rail-btn why-rail" onClick={onWhy}><IoHelpCircleOutline size={30} /><span>Why?</span></button>
      </div>

      <div className="reach-meter">
        <div className="reach-title">REACH BOOST</div>
        <div className="meter-track"><div className="meter-fill" style={{ width: `${Math.max(4, factors.reach * 100)}%` }} /></div>
        <div className="reach-sub">{factors.reach > 0.7 ? 'high — low likes spread far' : factors.reach < 0.25 ? 'low — crowded post' : 'mid'}</div>
      </div>

      <div className="bottom-info">
        <div className="creator-row">
          <div className="avatar" style={{ background: topic.color }}>{initials(creator.name)}</div>
          <div className="creator-meta">
            <div className="name-row">
              <span className="name">{creator.name}</span>
              {creator.verified && <IoCheckmarkCircle size={13} color="var(--accent)" />}
              {freshFace && <span className="fresh-badge">FRESH FACE</span>}
            </div>
            <div className="handle">@{creator.handle} · {fmtCount(creator.followers)} followers</div>
          </div>
          <button className={`follow-btn ${followed ? "following" : ""}`} onClick={onFollow}>{followed ? "Following" : "Follow"}</button>
        </div>
        <div className="tag-row">
          <span className="tag" style={{ background: topic.color, color: '#FFFFFF' }}><TopicIcon size={12} /> {topic.label}</span>
          <span className="age">{ageText(post.ageHours)}</span>
        </div>
        <p className="caption">{post.caption}</p>
        <button className="why-link" onClick={onWhy}><IoSparkles size={13} color="var(--accent)" /> Why am I seeing this?</button>
        {post.kind === 'image' && (() => { const c = POST_CREDIT[post.id] || JPG_CREDIT[post.id]; return c ? (
          <a className="photo-credit" href={c.source} target="_blank" rel="noreferrer">Photo: {c.credit} &middot; {c.license}</a>
        ) : null; })()}
      </div>
    </section>
  );
}

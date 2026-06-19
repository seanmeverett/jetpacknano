import { useMemo, useRef, useState, useEffect } from 'react';
import { useApp } from '../store';
import { userById, topicById } from '../seed';
import { POST_CREDIT } from '../postImageCredits';
import { POST_CREDIT as JPG_CREDIT } from '../postImageCreditsJpg';
import { rankFeed, fmtCount } from '../rank';
import type { RankedPost } from '../types';
import { WhySheet } from './WhySheet';
import { CommentSheet } from './CommentSheet';
import { ShareSheet } from './ShareSheet';
import { TikTokEmbed } from './TikTokEmbed';
import { StoryView } from './StoryView';
import { LinkText } from './LinkText';
import { TopicsSheet } from './TopicsSheet';
import {
  TOPIC_ICONS, IoTrendingDownOutline, IoTrendingUpOutline, IoOptionsOutline,
  IoHeart, IoHeartOutline, IoChatbubbleOutline, IoArrowRedoOutline, IoHelpCircleOutline,
  IoSparkles, IoCheckmarkCircle, IoVolumeMuteOutline, IoVolumeHighOutline,
  IoTextOutline, IoImageOutline, IoAlbumsOutline, IoPlayCircleOutline, IoVideocamOutline, IoLogoYoutube, IoMusicalNotesOutline, IoFunnelOutline,
} from '../icons';

const initials = (name: string) => name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
const ageText = (h: number) => (h < 1 ? 'just now' : h < 24 ? `${Math.round(h)}h ago` : `${Math.round(h / 24)}d ago`);


// Build a shareable deeplink URL for a single post (?p=<id>).
const deeplink = (postId: string) => `${window.location.origin}${window.location.pathname}?p=${postId}`;

export function Feed() {
  const { prefs, opts, liked, followed, posts, usersMap, comments, seedComments, addComment, setScreen, toggleLike, toggleFollow } = useApp();
  const [why, setWhy] = useState<RankedPost | null>(null);
  const [commentFor, setCommentFor] = useState<RankedPost | null>(null);
  const [shareFor, setShareFor] = useState<RankedPost | null>(null);
  const [topicsOpen, setTopicsOpen] = useState(false);
  const mergedComments = (id: string) => [...(seedComments[id] ?? []), ...(comments[id] ?? [])];
  const [idx, setIdx] = useState(0);
  const [soundOn, setSoundOn] = useState(false); // global sound preference (persists across posts)
  const scroller = useRef<HTMLDivElement>(null);

  // NOTE: ranking intentionally does NOT depend on `liked` — tapping the heart should
  // only fill it in + bump the displayed count, never reorder the feed (which would
  // snap the viewer to a different video).
  const ranked = useMemo<RankedPost[]>(() => rankFeed(posts, prefs, opts), [posts, prefs, opts]);

  // Deep-link: if the URL has ?p=<postId>, snap the feed to that post.
  useEffect(() => {
    const pid = new URLSearchParams(window.location.search).get('p');
    if (!pid || !scroller.current) return;
    const idx = ranked.findIndex((r) => r.post.id === pid);
    if (idx >= 0) scroller.current.scrollTo({ top: idx * scroller.current.clientHeight, behavior: 'auto' });
  }, [ranked]);

  if (posts.length === 0) {
    return (
      <div className="app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading-state">
          <div className="loading-text">Finding fresh content for you…</div>
          <div className="loading-sub">Searching the open social web + YouTube for your interests.</div>
        </div>
      </div>
    );
  }

  const onScroll = () => {
    const el = scroller.current; if (!el) return;
    const i = Math.round(el.scrollTop / el.clientHeight);
    if (i !== idx && i >= 0 && i < ranked.length) setIdx(i);
  };

  return (
    <div className="feed-wrap">
      <div className="feed" ref={scroller} onScroll={onScroll}>
        {ranked.map((rp, i) => (
          <PostCard key={rp.post.id} rp={rp} index={i} activeIndex={idx} creator={usersMap[rp.post.creatorId] || userById(rp.post.creatorId)} liked={!!liked[rp.post.id]} followed={!!followed[rp.post.creatorId]} onLike={() => toggleLike(rp.post.id)} onFollow={() => toggleFollow(rp.post.creatorId)} onWhy={() => setWhy(rp)} commentCount={mergedComments(rp.post.id).length} onComment={() => setCommentFor(rp)} onShare={() => setShareFor(rp)} muted={!soundOn} onToggleMute={() => setSoundOn((v) => !v)} />
        ))}
      </div>

      <div className="topbar">
        <span className="brand"><span className="brand-icon" />&nbsp;Jetpack Nano</span>
        <button className={`mode-pill ${opts.mode}`} onClick={() => setScreen('settings')}>
          {opts.mode === 'inverse' ? <IoTrendingDownOutline size={13} /> : <IoTrendingUpOutline size={13} />}
          {opts.mode === 'inverse' ? 'Inverse' : 'Standard'}
        </button>
        <button className="icon-btn" onClick={() => setTopicsOpen(true)}><IoFunnelOutline size={20} /></button>
        <button className="icon-btn" onClick={() => setScreen('settings')}><IoOptionsOutline size={22} /></button>
      </div>
      <div className="counter">{idx + 1}/{ranked.length}</div>

      <WhySheet ranked={why} onClose={() => setWhy(null)} />
      {commentFor && <CommentSheet comments={mergedComments(commentFor.post.id)} onClose={() => setCommentFor(null)} onAdd={(t) => addComment(commentFor.post.id, t)} />}
      {shareFor && <ShareSheet url={deeplink(shareFor.post.id)} onClose={() => setShareFor(null)} />}
      {topicsOpen && <TopicsSheet onClose={() => setTopicsOpen(false)} />}
    </div>
  );
}

const FORMAT_ICONS: Record<string, any> = {
  'text': IoTextOutline, 'image': IoImageOutline, 'story': IoAlbumsOutline, 'audio': IoMusicalNotesOutline,
  'video': IoPlayCircleOutline, 'short video': IoPlayCircleOutline, 'long video': IoVideocamOutline, 'youtube': IoLogoYoutube,
};
const formatInfo = (post: any) => {
  const fmt = post.format || (post.embedUrl ? 'youtube' : post.audio ? 'audio' : post.media && post.media.length > 1 ? 'story' : post.imageUrl && /\.mp4/.test(post.imageUrl) ? 'video' : post.imageUrl ? 'image' : 'text');
  const Icon = FORMAT_ICONS[fmt] || IoTextOutline;
  return { fmt, Icon };
};
const hasControllableAudio = (post: any) => !!(post.audio) || !!(post.imageUrl && /\.mp4(\?|$)/.test(post.imageUrl) && !post.embedUrl);

function PostCard({ rp, index, activeIndex, creator, liked, followed, onLike, onFollow, onWhy, onComment, onShare, commentCount, muted, onToggleMute }: { rp: RankedPost; index: number; activeIndex: number; creator: import('../types').User; liked: boolean; followed: boolean; onLike: () => void; onFollow: () => void; onWhy: () => void; onComment: () => void; onShare: () => void; commentCount: number; muted: boolean; onToggleMute: () => void }) {
  const { post, factors } = rp;
  const active = Math.abs(index - activeIndex) <= 1;
  // only the active card can ever play sound; adjacent pre-mounted videos stay muted
  const cardMuted = muted || index !== activeIndex;
  const topic = topicById(post.topic);
  const TopicIcon = TOPIC_ICONS[post.topic] || null; // null for custom topics (no icon)
  const freshFace = creator.followers < 100;
  const lastTap = useRef(0);
  const [burst, setBurst] = useState(false);

  const tapBg = () => {
    const now = Date.now();
    if (now - lastTap.current < 280) { if (!liked) onLike(); setBurst(true); setTimeout(() => setBurst(false), 420); }
    else lastTap.current = now;
  };

  return (
    <section className="card" style={{ background: (post.kind === 'image' || post.kind === 'video' || post.kind === 'tiktok') ? undefined : `linear-gradient(${post.bgFrom}, ${post.bgTo})` }}>
      {post.kind === 'tiktok' && post.tiktokUrl
        ? (active ? <TikTokEmbed url={post.tiktokUrl} /> : <div className="tiktok-placeholder"><span>▶ TikTok</span></div>)
        : post.embedUrl
        ? (active ? <iframe className="card-bg yt-embed" src={post.embedUrl + '?autoplay=1&mute=1&playsinline=1&rel=0'} title={post.caption} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen /> : <img className="card-bg" src={post.thumb} alt="" />)
        : post.audio
        ? <div className="audio-card"><IoMusicalNotesOutline size={48} color="var(--brand)" /><span className="audio-label">Audio post</span><audio src={post.audio} autoPlay loop muted={cardMuted} playsInline /></div>
        : post.media && post.media.length > 1
        ? <StoryView images={post.media} alt={post.caption} />
        : post.imageUrl && /\.mp4(\?|$)/.test(post.imageUrl)
        ? (active ? <video className="card-bg" src={post.imageUrl} autoPlay loop muted={cardMuted} playsInline preload="metadata" /> : <div className="tiktok-placeholder"><span>▶</span></div>)
        : post.imageUrl ? <img src={post.imageUrl} alt="" className="card-bg" /> : <div className="text-center"><p className="text-body"><LinkText text={post.caption} /></p></div>}
      {(post.imageUrl || post.media || post.embedUrl || post.audio || post.tiktokUrl) && <div className="tap-layer" onClick={tapBg} />}
      <div className="grad-top" />
      <div className="media-badge">{(() => { const fi = formatInfo(post); return <><fi.Icon size={14} /> <span>{fi.fmt}</span></>; })()}</div>
      <div className="grad-bottom" />
      {burst && <div className="burst"><IoHeart size={92} color="var(--brand2)" /></div>}

      <div className="rail">
        {hasControllableAudio(post) && <button className="rail-btn vol-btn" onClick={onToggleMute}>{muted ? <IoVolumeMuteOutline size={30} /> : <IoVolumeHighOutline size={30} />}<span>{muted ? "Tap" : "Sound"}</span></button>}
        <button className="rail-btn" onClick={onLike}>{liked ? <IoHeart size={32} color="var(--brand2)" /> : <IoHeartOutline size={32} />}<span style={{ color: liked ? 'var(--brand2)' : 'var(--text)' }}>{fmtCount(post.likes + (liked ? 1 : 0))}</span></button>
        <button className="rail-btn" onClick={onComment}><IoChatbubbleOutline size={32} /><span>{fmtCount(post.comments + commentCount)}</span></button>
        <button className="rail-btn" onClick={onShare}><IoArrowRedoOutline size={30} /><span>{fmtCount(post.shares)}</span></button>
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
          <span className="tag" style={{ background: topic.color, color: '#FFFFFF' }}>{TopicIcon && <TopicIcon size={12} />} {topic.label}</span>
          <span className="age">{ageText(post.ageHours)}</span>
        </div>
        {(post.imageUrl || post.media || post.embedUrl || post.audio) && <p className="caption"><LinkText text={post.caption} /></p>}
        <button className="why-link" onClick={onWhy}><IoSparkles size={13} color="var(--accent)" /> Why am I seeing this?</button>
        {post.permalink
          ? <a className="photo-credit" href={post.permalink} target="_blank" rel="noreferrer">↗ {post.community || 'source'} &middot; open original</a>
          : (post.kind === 'image' || post.kind === 'video') && (() => { const c = POST_CREDIT[post.id] || JPG_CREDIT[post.id]; return c ? (
            <a className="photo-credit" href={c.source} target="_blank" rel="noreferrer">Photo: {c.credit} &middot; {c.license}</a>
          ) : (post.kind === 'video' ? <a className="photo-credit" href="https://www.pexels.com" target="_blank" rel="noreferrer">Clip: Pexels &middot; Free License</a> : null); })()}
      </div>
    </section>
  );
}

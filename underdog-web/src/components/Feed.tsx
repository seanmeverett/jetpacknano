import { useMemo, useRef, useState, useEffect } from 'react';
import { useApp } from '../store';
import { userById, topicById } from '../seed';
import { rankFeed, fmtCount } from '../rank';
import type { RankedPost } from '../types';
import { WhySheet } from './WhySheet';
import { CommentSheet } from './CommentSheet';
import { ShareSheet } from './ShareSheet';
import { TikTokEmbed } from './TikTokEmbed';
import { StoryView } from './StoryView';
import { LinkText } from './LinkText';
import { startDwell, flushDwell, recordInteraction } from '../behavior';
import { TopicsSheet } from './TopicsSheet';
import {
  TOPIC_ICONS, IoTrendingDownOutline, IoTrendingUpOutline, IoOptionsOutline,
  IoHeart, IoHeartOutline, IoChatbubbleOutline, IoArrowRedoOutline, IoHelpCircleOutline,
  IoSparkles, IoCheckmarkCircle, IoVolumeMuteOutline, IoVolumeHighOutline,
  IoTextOutline, IoImageOutline, IoAlbumsOutline, IoPlayCircleOutline, IoVideocamOutline, IoLogoYoutube, IoMusicalNotesOutline, IoFunnelOutline, IoOpenOutline,
} from '../icons';

const initials = (name: string) => name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
const ageText = (h: number) => (h < 1 ? 'just now' : h < 24 ? `${Math.round(h)}h ago` : `${Math.round(h / 24)}d ago`);


// Build a shareable deeplink URL for a single post (?p=<id>).
const deeplink = (postId: string) => `${window.location.origin}${window.location.pathname}?p=${postId}`;

export function Feed() {
  const { prefs, opts, liked, followed, posts, usersMap, comments, seedComments, addComment, setScreen, toggleLike, toggleFollow, markSeen, loadMore, loadingMore, behaviorProfile, recordDwell } = useApp();
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
  const ranked = useMemo<RankedPost[]>(() => rankFeed(posts, prefs, opts, [], behaviorProfile), [posts, prefs, opts, behaviorProfile]);

  // Deep-link: if the URL has ?p=<postId>, snap the feed to that post.
  useEffect(() => {
    const pid = new URLSearchParams(window.location.search).get('p');
    if (!pid || !scroller.current) return;
    const idx = ranked.findIndex((r) => r.post.id === pid);
    if (idx >= 0) scroller.current.scrollTo({ top: idx * scroller.current.clientHeight, behavior: 'auto' });
  }, [ranked]);

  // Mark posts as seen when the user scrolls past them (idx advances)
  // MUST be before any early return — React hooks can't be conditional
  useEffect(() => {
    if (idx > 0 && ranked[idx - 1]) {
      markSeen([ranked[idx - 1].post.id]);
    }
  }, [idx, ranked, markSeen]);

  // Dwell time tracking: start timer when post becomes active, flush when scrolling away
  // MUST be before any early return — React hooks can't be conditional
  useEffect(() => {
    const current = ranked[idx];
    if (current) {
      startDwell(current.post.id, current.post.topic as string, current.post.format || 'text', current.post.provider || '');
    }
    // Flush the previous post's dwell and record it
    const prevRecord = flushDwell();
    if (prevRecord && prevRecord.dwellMs >= 1000) {
      recordDwell(prevRecord);
    }
  }, [idx, ranked, recordDwell]);

  const loadingMoreRef = useRef(false);

  if (posts.length === 0) {
    return (
      <div className="app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading-state">
          <span className="loading-icon" />
          <div className="loading-text">Finding fresh content for you…</div>
          <div className="loading-sub">Searching X + YouTube for trending content in your interests.</div>
        </div>
      </div>
    );
  }

  const onScroll = () => {
    const el = scroller.current; if (!el) return;
    const i = Math.round(el.scrollTop / el.clientHeight);
    if (i !== idx && i >= 0 && i < ranked.length) setIdx(i);
    // Trigger load more when user reaches the last 2 cards
    if (i >= ranked.length - 2 && !loadingMoreRef.current && !loadingMore) {
      loadingMoreRef.current = true;
      loadMore();
      setTimeout(() => { loadingMoreRef.current = false; }, 3000);
    }
  };

  return (
    <div className="feed-wrap">
      <div className="feed" ref={scroller} onScroll={onScroll}>
        {ranked.map((rp, i) => (
          <PostCard key={rp.post.id} rp={rp} index={i} activeIndex={idx} creator={usersMap[rp.post.creatorId] || userById(rp.post.creatorId)} liked={!!liked[rp.post.id]} followed={!!followed[rp.post.creatorId]} onLike={() => toggleLike(rp.post.id)} onFollow={() => toggleFollow(rp.post.creatorId)} onWhy={() => setWhy(rp)} commentCount={mergedComments(rp.post.id).length} onComment={() => setCommentFor(rp)} onShare={() => setShareFor(rp)} muted={!soundOn} onToggleMute={() => setSoundOn((v) => !v)} />
        ))}
        {/* End-of-feed loading / end card — full height so user can scroll to it */}
        <div className="card end-card">
          <div className="end-card-content"><div className="spinner" /><span>{loadingMore ? 'Loading more content...' : 'Loading...'}</span></div>
        </div>
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
const hasControllableAudio = (post: any) => !!(post.audio) || !!(post.embedUrl) || !!(post.imageUrl && /\.mp4(\?|$)/.test(post.imageUrl));

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
  const [paused, setPaused] = useState(false);
  const ytRef = useRef<HTMLIFrameElement>(null);
  const vidRef = useRef<HTMLVideoElement>(null);
  const isVideo = !!(post.embedUrl) || !!(post.imageUrl && /\.mp4(\?|$)/.test(post.imageUrl));

  // Control YouTube iframe mute via postMessage (no reload needed)
  useEffect(() => {
    if (!ytRef.current || !post.embedUrl) return;
    const cmd = cardMuted ? 'mute' : 'unMute';
    ytRef.current.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: cmd, args: '' }), '*');
  }, [cardMuted, post.embedUrl]);

  const togglePlayPause = () => {
    setPaused((p) => {
      const next = !p;
      if (post.embedUrl && ytRef.current) {
        ytRef.current.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: next ? 'pauseVideo' : 'playVideo', args: '' }), '*');
      } else if (vidRef.current) {
        if (next) vidRef.current.pause(); else vidRef.current.play().catch(() => {});
      }
      return next;
    });
  };

  const tapBg = () => {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      // Double tap → like (undo any pause triggered by first tap)
      lastTap.current = 0;
      if (paused) { setPaused(false); if (vidRef.current) vidRef.current.play().catch(() => {});
        if (ytRef.current) ytRef.current.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: '' }), '*'); }
      if (!liked) onLike();
      setBurst(true);
      setTimeout(() => setBurst(false), 420);
    } else {
      // Single tap → wait to see if a double tap follows
      lastTap.current = now;
      setTimeout(() => {
        if (lastTap.current === now && isVideo) togglePlayPause();
      }, 300);
    }
  };

  return (
    <section className="card" style={{ background: (post.kind === 'image' || post.kind === 'video' || post.kind === 'tiktok') ? undefined : `linear-gradient(${post.bgFrom}, ${post.bgTo})` }}>
      {post.kind === 'tiktok' && post.tiktokUrl
        ? (active ? <TikTokEmbed url={post.tiktokUrl} /> : <div className="tiktok-placeholder"><span>▶ TikTok</span></div>)
        : post.embedUrl
        ? (active ? <iframe ref={ytRef} className="card-bg yt-embed" src={post.embedUrl + '?autoplay=1&mute=1&enablejsapi=1&playsinline=1&rel=0'} title={post.caption} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen /> : <img className="card-bg" src={post.thumb} alt="" />)
        : post.audio
        ? <div className="audio-card"><IoMusicalNotesOutline size={48} color="var(--brand)" /><span className="audio-label">Audio post</span><audio src={post.audio} autoPlay loop muted={cardMuted} playsInline /></div>
        : post.media && post.media.length > 1
        ? <StoryView images={post.media} alt={post.caption} />
        : post.imageUrl && /\.mp4(\?|$)/.test(post.imageUrl)
        ? (active ? <video ref={vidRef} className="card-bg" src={post.imageUrl} poster={post.thumb} autoPlay loop muted={cardMuted} playsInline preload="auto" /> : <img className="card-bg" src={post.thumb} alt="" />)
        : post.imageUrl ? <img src={post.imageUrl} alt="" className="card-bg" /> : <div className="text-center"><p className="text-body"><LinkText text={post.caption} /></p></div>}
      {(post.imageUrl || post.media || post.embedUrl || post.audio || post.tiktokUrl) && <div className="tap-layer" onClick={tapBg} />}
      <div className="grad-top" />
      <div className="media-badge">{(() => { const fi = formatInfo(post); return <><fi.Icon size={14} /> <span>{fi.fmt}</span></>; })()}</div>
      <div className="grad-bottom" />
      {burst && <div className="burst"><IoHeart size={92} color="var(--brand2)" /></div>}
      {paused && isVideo && <div className="pause-overlay"><IoPlayCircleOutline size={72} color="rgba(255,255,255,0.85)" /></div>}

      <div className="rail">
        {hasControllableAudio(post) && <button className="rail-btn vol-btn" onClick={onToggleMute}>{muted ? <IoVolumeMuteOutline size={30} /> : <IoVolumeHighOutline size={30} />}<span>{muted ? "Tap" : "Sound"}</span></button>}
        <button className="rail-btn" onClick={() => { recordInteraction('liked'); onLike(); }}>{liked ? <IoHeart size={32} color="var(--brand2)" /> : <IoHeartOutline size={32} />}<span style={{ color: liked ? 'var(--brand2)' : 'var(--text)' }}>{fmtCount(liked ? 1 : 0)}</span></button>
        <button className="rail-btn" onClick={() => { recordInteraction('commented'); onComment(); }}><IoChatbubbleOutline size={32} /><span>{fmtCount(commentCount)}</span></button>
        <button className="rail-btn" onClick={onShare}><IoArrowRedoOutline size={30} /><span></span></button>
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
              {post.authorUrl ? <a className="name" href={post.authorUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>{creator.name}</a> : <span className="name">{creator.name}</span>}
              {creator.verified && <IoCheckmarkCircle size={13} color="var(--accent)" />}
              {freshFace && <span className="fresh-badge">FRESH FACE</span>}
            </div>
            <div className="handle">{post.authorUrl ? <a href={post.authorUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>@{creator.handle}</a> : <>@{creator.handle}</>} · {fmtCount(creator.followers)} followers</div>
          </div>
          <button className={`follow-btn ${followed ? "following" : ""}`} onClick={() => { recordInteraction('followed'); onFollow(); }}>{followed ? "Following" : "Follow"}</button>
        </div>
        <div className="tag-row">
          <span className="tag" style={{ background: topic.color, color: '#FFFFFF' }}>{TopicIcon && <TopicIcon size={12} />} {topic.label}</span>
          <span className="age">{ageText(post.ageHours)}</span>
        </div>
        {post.likes > 0 && (
          <div className="source-stats">
            <IoTrendingUpOutline size={13} color="var(--brand2)" />
            <span>{fmtCount(post.likes)} {post.community === 'x.com' ? 'likes' : 'views'} · {fmtCount(post.comments)} comments on {post.community === 'x.com' ? 'X' : 'YouTube'}</span>
          </div>
        )}
        {(post.imageUrl || post.media || post.embedUrl || post.audio) && <p className="caption"><LinkText text={post.caption} /></p>}
        <button className="why-link" onClick={onWhy}><IoSparkles size={13} color="var(--accent)" /> Why am I seeing this?</button>
        {post.permalink && (
          <a className="open-source-btn" href={post.permalink} target="_blank" rel="noreferrer" onClick={(e) => { e.stopPropagation(); recordInteraction('openedSource'); }}>
            <IoOpenOutline size={16} /> Open on {post.community === 'x.com' ? 'X' : post.community === 'youtube.com' ? 'YouTube' : (post.community || 'source')}
          </a>
        )}
      </div>
    </section>
  );
}

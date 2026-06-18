import type { RankedPost } from '../types';
import { userById, topicById } from '../seed';
import { fmtCount } from '../rank';
import { IoClose, IoInformationCircleOutline } from '../icons';

const Bar = ({ label, value, color, note }: { label: string; value: number; color: string; note: string }) => (
  <div className="bar-row">
    <div className="bar-head"><span className="bar-label">{label}</span><span className="bar-val" style={{ color }}>{Math.round(value * 100)}</span></div>
    <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.max(3, value * 100)}%`, background: color }} /></div>
    <div className="bar-note">{note}</div>
  </div>
);

export function WhySheet({ ranked, onClose }: { ranked: RankedPost | null; onClose: () => void }) {
  if (!ranked) return null;
  const { post, factors: f } = ranked;
  const creator = userById(post.creatorId);
  const topic = topicById(post.topic);
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-head"><span className="sheet-title">Why you're seeing this</span><button onClick={onClose} className="icon-btn"><IoClose size={22} /></button></div>
        <div className="post-line"><span className="dot" style={{ background: topic.color }} />{creator.name} · {topic.label} · {fmtCount(post.likes)} likes</div>
        <Bar label="Reach boost" value={f.reach} color="var(--accent)" note={post.likes === 0 ? 'Zero likes = maximum reach. This is the core inversion.' : `Low likes beat high likes. A mega post with ${fmtCount(post.likes)} likes would score ~0 here.`} />
        <Bar label="Relevance to you" value={f.relevance} color="var(--brand2)" note={f.relevance > 0.5 ? 'Matches an interest you picked.' : 'Discovery baseline — outside your picks, surfaced for variety.'} />
        <Bar label="Freshness" value={f.freshness} color="var(--good)" note={f.freshness > 0.7 ? 'Posted recently.' : 'Older post, freshness decay applies.'} />
        <Bar label="Creator diversity" value={f.diversity} color="var(--warn)" note={f.diversity > 0.8 ? "You haven't seen much from this creator." : "You've seen this creator recently, so reach is lowered to spread attention."} />
        <div className="explainer"><IoInformationCircleOutline size={16} color="var(--faint)" /><span>Standard apps rank by likes, so attention concentrates on a few huge accounts. Underdog multiplies relevance by an inverse-reach boost: the fewer the likes, the farther it spreads. Combined with creator diversity, attention gets shared across many more people.</span></div>
      </div>
    </div>
  );
}

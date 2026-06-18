import { useState, useEffect } from 'react';
import { useApp } from '../store';
import { TOPICS } from '../seed';
import { TOPIC_ICONS, IoCheckmark, IoArrowForwardOutline } from '../icons';

export function Onboarding() {
  const { finishOnboarding, prefetchFeed } = useApp();
  const [picked, setPicked] = useState<string[]>([]);
  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const ready = picked.length >= 3;

  // Preload live content as soon as the user has picked enough topics
  useEffect(() => {
    if (picked.length >= 3) prefetchFeed(picked);
  }, [picked.length, prefetchFeed]);

  return (
    <div className="onboard" style={{ background: 'radial-gradient(120% 80% at 50% 0%, #590000 0%, #000000 70%)' }}>
      <div className="onboard-scroll">
        <div className="logo-row"><span className="brand-icon logo-icon" /><span className="logo">Jetpack Nano</span></div>
        <h1 className="h1">Where zero wins.</h1>
        <p className="lede">The feed that spreads attention around. Posts with fewer likes reach farther — so you meet original people, not the same five accounts. Pick a few things you like and we'll show you the originals.</p>
        <div className="section-label">Choose at least 3 interests</div>
        <div className="chip-grid">
          {TOPICS.map((t) => {
            const on = picked.includes(t.id);
            const Icon = TOPIC_ICONS[t.id];
            return (
              <button key={t.id} className={`chip ${on ? 'on' : ''}`} style={on ? { borderColor: t.color, background: t.color + '22' } : undefined} onClick={() => toggle(t.id)}>
                <Icon size={18} color={on ? t.color : 'var(--dim)'} />
                <span style={{ color: on ? 'var(--text)' : 'var(--dim)' }}>{t.label}</span>
                {on && <IoCheckmark size={15} color={t.color} />}
              </button>
            );
          })}
        </div>
        <button className={`primary-btn ${ready ? '' : 'disabled'}`} disabled={!ready} onClick={() => finishOnboarding(picked as any)}>
          {ready ? 'Enter the feed' : `Pick ${3 - picked.length} more`}
          <IoArrowForwardOutline size={18} />
        </button>
      </div>
    </div>
  );
}

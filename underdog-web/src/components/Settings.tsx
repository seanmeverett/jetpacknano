import { useApp } from '../store';
import { TOPICS } from '../seed';
import { TOPIC_ICONS, IoTrendingDownOutline, IoTrendingUpOutline, IoPeopleOutline, IoTimeOutline, IoHeartOutline, IoChevronBack, IoRefreshOutline, IoSwapHorizontalOutline, IoCheckmark } from '../icons';

export function Settings() {
  const { opts, prefs, setScreen, setMode, setInverseStrength, toggleDiversity, toggleInterest, setInterestWeight, setFreshnessHalfLife, reset } = useApp();

  return (
    <div className="settings">
      <div className="settings-header">
        <button className="icon-btn" onClick={() => setScreen('feed')}><IoChevronBack size={24} /></button>
        <span className="settings-title">Tune the algorithm</span>
        <span style={{ width: 28 }} />
      </div>
      <div className="settings-scroll">
        <Card icon={<IoSwapHorizontalOutline size={17} color="var(--brand2)" />} title="Ranking mode">
          <div className="segment">
            <button className={`seg ${opts.mode === 'inverse' ? 'active' : ''}`} onClick={() => setMode('inverse')}><IoTrendingDownOutline size={15} /> Inverse</button>
            <button className={`seg ${opts.mode === 'standard' ? 'active' : ''}`} onClick={() => setMode('standard')}><IoTrendingUpOutline size={15} /> Standard</button>
          </div>
          <p className="help">{opts.mode === 'inverse' ? 'Zero-likes posts reach farthest. Mega posts get suppressed.' : 'Like every other app: more likes = more reach. See the difference.'}</p>
        </Card>

        <Card icon={<IoTrendingDownOutline size={17} color="var(--brand2)" />} title="Inverse strength">
          <label className="slider-label">Intensity <span style={{ color: 'var(--brand)' }}>{Math.round(opts.inverseStrength * 100)}%</span></label>
          <input type="range" min={0} max={1} step={0.01} value={opts.inverseStrength} onChange={(e) => setInverseStrength(+e.target.value)} />
          <div className="slider-caps"><span>Off — no inversion</span><span>Max — zero dominates</span></div>
          <p className="help">Controls how aggressively low-like posts beat popular ones. At 0% reach is neutral; at 100% a post with zero likes can outrank one with millions.</p>
        </Card>

        <Card icon={<IoPeopleOutline size={17} color="var(--brand2)" />} title="Spread attention">
          <div className="switch-row">
            <div><div className="row-title">Creator diversity</div><p className="help">Keep lowering reach for creators you've already seen, so many more people get attention.</p></div>
            <label className="switch"><input type="checkbox" checked={opts.diversityOn} onChange={(e) => toggleDiversity(e.target.checked)} /><span className="slider-track-elm" /></label>
          </div>
        </Card>

        <Card icon={<IoTimeOutline size={17} color="var(--brand2)" />} title="Freshness decay">
          <label className="slider-label">Half-life <span style={{ color: 'var(--good)' }}>{Math.round(opts.freshnessHalfLifeHours)}h</span></label>
          <input type="range" className="good" min={6} max={240} step={1} value={opts.freshnessHalfLifeHours} onChange={(e) => setFreshnessHalfLife(+e.target.value)} />
          <p className="help">How fast older posts lose reach. A 6h half-life favors brand-new posts; 240h lets older posts stay in play.</p>
        </Card>

        <Card icon={<IoHeartOutline size={17} color="var(--brand2)" />} title="Your interests">
          <p className="help">We read these to deliver relevant content — but reach is still inverted, so it stays authentic.</p>
          <div className="interests">
            {TOPICS.map((t) => {
              const w = (prefs.interests as Record<string, number>)[t.id] ?? 0;
              const on = w > 0;
              const Icon = TOPIC_ICONS[t.id];
              return (
                <div key={t.id} className="interest-item">
                  <button className={`interest-head ${on ? 'on' : ''}`} style={on ? { borderColor: t.color } : undefined} onClick={() => toggleInterest(t.id as any, !on)}>
                    <Icon size={16} color={on ? t.color : 'var(--faint)'} />
                    <span style={{ color: on ? 'var(--text)' : 'var(--dim)' }}>{t.label}</span>
                    {on && <IoCheckmark size={15} color={t.color} className="ml-auto" />}
                  </button>
                  {on && <input type="range" min={0} max={1} step={0.01} value={w} onChange={(e) => setInterestWeight(t.id as any, +e.target.value)} />}
                </div>
              );
            })}
          </div>
        </Card>

        <button className="reset-btn" onClick={reset}><IoRefreshOutline size={16} color="var(--bad)" /> Reset &amp; re-onboard</button>
        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}

const Card = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <div className="card-set"><div className="card-head">{icon}<span className="card-title">{title}</span></div>{children}</div>
);

import { useState, useEffect } from 'react';
import { useApp } from '../store';
import { IoArrowForwardOutline, IoCheckmarkCircle } from '../icons';

export function Onboarding() {
  const { finishOnboarding, prefetchFeed } = useApp();
  const [picked] = useState<string[]>(['emerging-tech']);
  const [lang, setLang] = useState('en');
  const [region] = useState('US');

  const ready = picked.length >= 1;

  useEffect(() => {
    if (picked.length >= 1) prefetchFeed(picked, lang, region);
  }, [picked.length, prefetchFeed]);

  return (
    <div className="onboard" style={{ background: 'radial-gradient(120% 80% at 50% 0%, #590000 0%, #000000 70%)' }}>
      <div className="onboard-scroll">
        <div className="logo-row"><span className="brand-icon" /><span className="logo">Jetpack Nano</span></div>
        <h1 className="h1">Where zero wins.</h1>
        <p className="lede">The feed that spreads attention around. Posts with fewer likes reach farther — so you meet original people, not the same five accounts. Pick a few things you like and we'll show you the underdogs.</p>

        <div className="emerging-tech-card">
          <div className="emerging-tech-icon"><span className="brand-icon" /></div>
          <div className="emerging-tech-text">
            <div className="emerging-tech-label">Emerging Tech</div>
            <div className="emerging-tech-sub">AI · Bitcoin · SpaceX · Quantum · Robotics · Wearables · AR · Spatial · Physics</div>
          </div>
          <IoCheckmarkCircle size={24} color="var(--brand)" />
        </div>

        <div className="section-label">Language &amp; region</div>
        <div className="lang-region-row">
          <select className="lang-select" value={lang} onChange={(e) => setLang(e.target.value)}>
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="ja">Japanese</option>
            <option value="ko">Korean</option>
            <option value="pt">Portuguese</option>
            <option value="it">Italian</option>
            <option value="hi">Hindi</option>
            <option value="ar">Arabic</option>
          </select>
          <select className="region-select" value={region} disabled>
            <option value="US">United States</option>
            <option value="GB">United Kingdom</option>
            <option value="CA">Canada</option>
            <option value="DE">Germany</option>
            <option value="FR">France</option>
            <option value="JP">Japan</option>
            <option value="KR">South Korea</option>
            <option value="IN">India</option>
            <option value="BR">Brazil</option>
            <option value="AU">Australia</option>
            <option value="ES">Spain</option>
            <option value="IT">Italy</option>
            <option value="MX">Mexico</option>
          </select>
        </div>

        <button className={`primary-btn ${ready ? '' : 'disabled'}`} disabled={!ready} onClick={() => finishOnboarding(picked as any, lang, region)}>
          Enter the feed
          <IoArrowForwardOutline size={18} />
        </button>
      </div>
    </div>
  );
}

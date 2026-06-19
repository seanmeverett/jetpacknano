import { useState, useEffect, useRef } from 'react';
import { useApp } from '../store';
import { TOPICS } from '../seed';
import { TOPIC_ICONS, IoCheckmark, IoArrowForwardOutline, IoClose, IoCheckmarkCircle } from '../icons';

export function Onboarding() {
  const { finishOnboarding, prefetchFeed } = useApp();
  const [picked, setPicked] = useState<string[]>([]);
  const [lang, setLang] = useState('en');
  const [region, setRegion] = useState('US');
  const [customInput, setCustomInput] = useState('');
  const [editingTopic, setEditingTopic] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const editRef = useRef<HTMLInputElement>(null);

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const addCustom = () => {
    const t = customInput.trim().toLowerCase();
    if (t && !picked.includes(t)) setPicked((p) => [...p, t]);
    setCustomInput('');
  };

  const removeCustom = (t: string) => setPicked((p) => p.filter((x) => x !== t));

  const startEdit = (t: string) => {
    setEditingTopic(t);
    setEditValue(t);
    setTimeout(() => editRef.current?.focus(), 50);
  };

  const saveEdit = () => {
    if (!editingTopic) return;
    const newVal = editValue.trim().toLowerCase();
    if (newVal && newVal !== editingTopic && !picked.includes(newVal)) {
      setPicked((p) => p.map((x) => (x === editingTopic ? newVal : x)));
    }
    setEditingTopic(null);
    setEditValue('');
  };

  const cancelEdit = () => { setEditingTopic(null); setEditValue(''); };

  const ready = picked.length >= 3;
  const customTopics = picked.filter((t) => !TOPICS.some((tp) => tp.id === t));

  useEffect(() => {
    if (picked.length >= 3) prefetchFeed(picked, lang, region);
  }, [picked.length, prefetchFeed]);

  return (
    <div className="onboard" style={{ background: 'radial-gradient(120% 80% at 50% 0%, #590000 0%, #000000 70%)' }}>
      <div className="onboard-scroll">
        <div className="logo-row"><span className="brand-icon" /><span className="logo">Jetpack Nano</span></div>
        <h1 className="h1">Where zero wins.</h1>
        <p className="lede">The feed that spreads attention around. Posts with fewer likes reach farther — so you meet original people, not the same five accounts. Pick a few things you like and we'll show you the underdogs.</p>

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

        <div className="section-label">Or add your own topic</div>
        <div className="custom-topic-row">
          <input
            className="custom-topic-input"
            placeholder="e.g. SpaceX, machine learning, sourdough…"
            value={customInput}
            maxLength={40}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addCustom(); }}
          />
          <button className="custom-topic-add" onClick={addCustom} disabled={!customInput.trim()}>Add</button>
        </div>
        {customTopics.length > 0 && (
          <div className="custom-chips">
            {customTopics.map((t) => (
              <div key={t} className="custom-chip-wrapper">
                {editingTopic === t ? (
                  <div className="custom-chip-editing">
                    <input
                      ref={editRef}
                      className="custom-chip-edit-input"
                      value={editValue}
                      maxLength={40}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                    />
                    <button className="chip-submit-btn" onClick={saveEdit}><IoCheckmarkCircle size={18} color="var(--brand)" /></button>
                    <button className="chip-remove-btn" onClick={() => { cancelEdit(); removeCustom(t); }}><IoClose size={14} color="var(--faint)" /></button>
                  </div>
                ) : (
                  <div className="chip on custom-chip" onClick={() => startEdit(t)}>
                    <span>#{t}</span>
                    <button className="chip-remove-btn" onClick={(e) => { e.stopPropagation(); removeCustom(t); }}><IoClose size={14} color="var(--brand)" /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

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
          <select className="region-select" value={region} onChange={(e) => setRegion(e.target.value)}>
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
          {ready ? 'Enter the feed' : `Pick ${3 - picked.length} more`}
          <IoArrowForwardOutline size={18} />
        </button>
      </div>
    </div>
  );
}

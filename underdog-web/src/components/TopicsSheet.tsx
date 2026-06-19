import { useState } from 'react';
import { useApp } from '../store';
import { TOPICS } from '../seed';
import { TOPIC_ICONS, IoClose, IoAddOutline, IoCheckmark } from '../icons';

export function TopicsSheet({ onClose }: { onClose: () => void }) {
  const { prefs, addTopic, removeTopic } = useApp();
  const [input, setInput] = useState('');

  const activeTopics = Object.entries(prefs.interests).filter(([, w]) => w > 0).map(([t]) => t);
  const customActive = activeTopics.filter((t) => !TOPICS.some((tp) => tp.id === t));

  const add = () => {
    const t = input.trim().toLowerCase();
    if (t) addTopic(t);
    setInput('');
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="sheet-handle" />
        <div className="sheet-head">
          <span className="sheet-title">Your topics</span>
          <button onClick={onClose} className="icon-btn"><IoClose size={22} /></button>
        </div>

        {/* Active custom topics (removable) */}
        {customActive.length > 0 && (
          <div className="topic-section">
            <div className="topic-section-label">Custom topics</div>
            <div className="topic-chips">
              {customActive.map((t) => (
                <button key={t} className="topic-chip active" onClick={() => removeTopic(t)}>
                  <span>#{t}</span>
                  <IoClose size={14} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Add new topic */}
        <div className="topic-add-row">
          <input
            className="custom-topic-input"
            placeholder="Add a topic (e.g. SpaceX, AI art…)"
            value={input}
            maxLength={40}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
          />
          <button className="custom-topic-add" onClick={add} disabled={!input.trim()}><IoAddOutline size={18} /></button>
        </div>

        {/* Category chips (toggle) */}
        <div className="topic-section">
          <div className="topic-section-label">Categories</div>
          <div className="topic-chips">
            {TOPICS.map((t) => {
              const on = activeTopics.includes(t.id);
              const Icon = TOPIC_ICONS[t.id];
              return (
                <button key={t.id} className={`topic-chip ${on ? 'active' : ''}`} onClick={() => on ? removeTopic(t.id) : addTopic(t.id)}>
                  <Icon size={14} color={on ? 'var(--brand)' : 'var(--faint)'} />
                  <span>{t.label}</span>
                  {on && <IoCheckmark size={12} color="var(--brand)" />}
                </button>
              );
            })}
          </div>
        </div>

        <p className="topic-hint">Adding or removing topics refreshes your feed in real time.</p>
      </div>
    </div>
  );
}

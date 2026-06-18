import { useState, useEffect } from 'react';
import type { Comment } from '../store';
import { IoClose, IoSendOutline, IoChatbubbleOutline } from '../icons';

const rel = (ts: number) => {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return s + 's';
  if (s < 3600) return Math.floor(s / 60) + 'm';
  if (s < 86400) return Math.floor(s / 3600) + 'h';
  return Math.floor(s / 86400) + 'd';
};

export function CommentSheet({ comments, onClose, onAdd }: { comments: Comment[]; onClose: () => void; onAdd: (text: string) => void }) {
  const [text, setText] = useState('');
  const submit = () => { onAdd(text); setText(''); };
  useEffect(() => { const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [onClose]);
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet comment-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-head">
          <span className="sheet-title">{comments.length} comment{comments.length === 1 ? '' : 's'}</span>
          <button onClick={onClose} className="icon-btn"><IoClose size={22} /></button>
        </div>
        <div className="comment-list">
          {comments.length === 0 && (
            <div className="comment-empty"><IoChatbubbleOutline size={26} color="var(--faint)" /><span>Be the first to comment.</span></div>
          )}
          {comments.map((c) => (
            <div key={c.id} className="comment-item">
              <div className="comment-avatar">{c.author[0]?.toUpperCase() || 'U'}</div>
              <div className="comment-body">
                <div className="comment-meta"><span className="comment-author">{c.author}</span><span className="comment-time">{rel(c.ts)}</span></div>
                <div className="comment-text">{c.text}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="comment-input-row">
          <input className="comment-input" placeholder="Add a comment…" value={text} maxLength={280}
            onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} />
          <button className="comment-send" onClick={submit} disabled={!text.trim()}><IoSendOutline size={20} /></button>
        </div>
      </div>
    </div>
  );
}

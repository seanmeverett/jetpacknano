import { useState, useEffect } from 'react';
import { IoClose, IoCopyOutline, IoShareOutline, IoLinkOutline, IoCheckmark } from '../icons';

export function ShareSheet({ url, onClose }: { url: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); } catch { /* fallback below */ }
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  };
  const nativeShare = async () => {
    if (navigator.share) { try { await navigator.share({ title: 'Jetpack Nano', url }); } catch {} } else copy();
  };
  useEffect(() => { const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [onClose]);
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="sheet-handle" />
        <div className="sheet-head"><span className="sheet-title">Share post</span><button onClick={onClose} className="icon-btn"><IoClose size={22} /></button></div>
        <button className="share-row" onClick={nativeShare}><IoShareOutline size={20} /> Share via…</button>
        <div className="share-link-box">
          <IoLinkOutline size={18} color="var(--faint)" />
          <span className="share-url">{url}</span>
        </div>
        <button className="primary-btn" onClick={copy}>{copied ? <><IoCheckmark size={18} /> Copied!</> : <><IoCopyOutline size={18} /> Copy deeplink</>}</button>
      </div>
    </div>
  );
}

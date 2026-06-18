import { useState, useEffect } from 'react';

export function StoryView({ images, alt }: { images: string[]; alt?: string }) {
  const [i, setI] = useState(0);
  const n = images.length;
  useEffect(() => {
    const id = setInterval(() => setI((p) => (p + 1) % n), 4000);
    return () => clearInterval(id);
  }, [n]);
  const go = (d: number) => setI((p) => (p + d + n) % n);
  return (
    <div className="story-view" onClick={(e) => { /* handled by halves */ e.stopPropagation(); }}>
      <div className="story-bars">{images.map((_, idx) => (
        <div key={idx} className="story-bar"><div className="story-bar-fill" style={{ width: idx < i ? '100%' : idx === i ? '50%' : '0%' }} /></div>
      ))}</div>
      <img className="card-bg story-img" src={images[i]} alt={alt || ''} />
      <button className="story-half story-left" aria-label="previous" onClick={(e) => { e.stopPropagation(); go(-1); }} />
      <button className="story-half story-right" aria-label="next" onClick={(e) => { e.stopPropagation(); go(1); }} />
      <div className="story-count">{i + 1}/{n}</div>
    </div>
  );
}

import { useEffect, useRef } from 'react';

// Parse the numeric video id from a TikTok URL.
// Supports https://www.tiktok.com/@user/video/1234567890 and short links (best-effort).
const videoIdFromUrl = (url: string): string | null => {
  const m = url.match(/\/video\/(\d+)/);
  if (m) return m[1];
  const m2 = url.match(/\/(\d{6,})/);
  return m2 ? m2[1] : null;
};

let scriptLoading: Promise<void> | null = null;
const loadEmbedScript = () => {
  if (scriptLoading) return scriptLoading;
  scriptLoading = new Promise((resolve) => {
    const id = 'tiktok-embed-script';
    if (document.getElementById(id)) return resolve();
    const s = document.createElement('script');
    s.id = id; s.src = 'https://www.tiktok.com/embed.js'; s.async = true;
    s.onload = () => resolve();
    s.onerror = () => resolve();
    document.head.appendChild(s);
  });
  return scriptLoading;
};

export function TikTokEmbed({ url }: { url: string }) {
  const ref = useRef<HTMLQuoteElement>(null);
  const videoId = videoIdFromUrl(url);

  useEffect(() => {
    loadEmbedScript().then(() => {
      // TikTok's embed.js renders .tiktok-embed blocks. For dynamically inserted
      // blocks, re-trigger by calling the lib if present, else reload the script.
      const w = window as any;
      if (w.tiktokEmbed?.lib?.render) {
        try { w.tiktokEmbed.lib.render(ref.current); } catch {}
      } else if (ref.current && !ref.current.querySelector('iframe')) {
        // fallback: re-append the script so it scans again
        const s = document.createElement('script');
        s.src = 'https://www.tiktok.com/embed.js'; s.async = true;
        ref.current.ownerDocument.body.appendChild(s);
      }
    });
  }, [url]);

  return (
    <div className="tiktok-card">
      <blockquote
        ref={ref}
        className="tiktok-embed"
        cite={url}
        data-video-id={videoId || undefined}
        style={{ maxWidth: '100%', minWidth: '288px' }}
      >
        <section>Loading TikTok…</section>
      </blockquote>
    </div>
  );
}

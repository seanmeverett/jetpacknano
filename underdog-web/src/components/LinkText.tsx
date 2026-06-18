import React from 'react';

// Splits text by URLs and renders them as clickable <a> tags. Safe (no dangerouslySetInnerHTML).
const URL_RE = /(https?:\/\/[^\s<>'"]+)/gi;

export function LinkText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(URL_RE);
  const nodes: React.ReactNode[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) {
      // odd indices are URL matches
      const url = parts[i];
      nodes.push(
        <a key={i} href={url} target="_blank" rel="noreferrer" className="inline-link" onClick={(e) => e.stopPropagation()}>
          {url.length > 50 ? url.slice(0, 47) + '…' : url}
        </a>
      );
    } else if (parts[i]) {
      nodes.push(<React.Fragment key={i}>{parts[i]}</React.Fragment>);
    }
  }
  return <span className={className}>{nodes}</span>;
}

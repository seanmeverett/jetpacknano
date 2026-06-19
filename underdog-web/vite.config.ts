import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { buildFeed } from './api/feedCore'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'live-feed-api',
      configureServer(server) {
        server.middlewares.use('/api/feed', async (req, res) => {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          const u = new URL(req.url || '', 'http://x');
          const topics = (u.searchParams.get('topics') || '').split(',').map((t) => t.trim()).filter(Boolean);
          if (!topics.length) { res.end(JSON.stringify({ items: [], sources: [], count: 0 })); return; }
          try { res.end(JSON.stringify(await buildFeed(topics, process.env.YOUTUBE_API_KEY))); }
          catch { res.end(JSON.stringify({ items: [], sources: [], count: 0 })); }
        });
      },
    },
  ],
  server: { port: 5500, host: true, strictPort: true },
})

// @ts-check
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import { embedsPlugin } from './src/lib/embeds.mjs';
import { sitemap } from './src/lib/sitemap.mjs';

// The site lives at its own domain (noticiasxtra.com, through Cloudflare; GitHub Pages → Settings → Pages →
// Custom domain). Before that it was publisher-noticel.github.io/noticias-xtra: the 404 page sends those old
// addresses to the new ones.
export default defineConfig({
  site: 'https://noticiasxtra.com',
  base: '/',
  // A link alone on its own line in a story becomes a YouTube/X/Instagram/Facebook/TikTok/Spotify/Maps embed
  markdown: { processor: satteri({ mdastPlugins: [embedsPlugin] }) },
  // sitemap.xml, news-sitemap.xml and robots.txt, made from the finished pages after each build
  integrations: [sitemap()],
});

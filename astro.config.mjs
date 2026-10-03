// @ts-check
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import { embedsPlugin } from './src/lib/embeds.mjs';

// 1) Replace with your GitHub username.
// 2) If you rename the repository, change REPO to match.
const GITHUB_USER = 'publisher-noticel';
const REPO = 'noticias-xtra';

export default defineConfig({
  site: `https://${GITHUB_USER}.github.io`,
  base: `/${REPO}`,
  // A link alone on its own line in a story becomes a YouTube/X/Instagram/Facebook/TikTok/Spotify/Maps embed
  markdown: { processor: satteri({ mdastPlugins: [embedsPlugin] }) },
});

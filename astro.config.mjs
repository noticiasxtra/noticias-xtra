// @ts-check
import { defineConfig } from 'astro/config';

// 1) Replace with your GitHub username.
// 2) If you rename the repository, change REPO to match.
const GITHUB_USER = 'publisher-noticel';
const REPO = 'noticias-xtra';

export default defineConfig({
  site: `https://${GITHUB_USER}.github.io`,
  base: `/${REPO}`,
});

# Noticias Xtra

News website for Noticias Xtra (Puerto Rico), built with [Astro](https://astro.build) and hosted free on GitHub Pages. New stories are drafted by AI from official sources and published after an editor approves them.

## Run it on your computer

You need [Node.js](https://nodejs.org) (version 22 or newer).

```bash
npm install      # first time only
npm run dev      # opens the site at http://localhost:4321/noticias-xtra/
```

## Publish it on GitHub Pages

1. In `astro.config.mjs`, the GitHub username is already set to `publisher-noticel` (change it if you move the project).
2. Create a repository called `noticias-xtra` on GitHub and push this folder to it (include `package-lock.json`).
3. On GitHub: **Settings > Pages > Source: GitHub Actions**.
4. Every push to `main` rebuilds the site automatically. The link will be `https://publisher-noticel.github.io/noticias-xtra/`.

## Where things are

| What | Where |
| --- | --- |
| News stories (one Markdown file each) | `src/content/noticias/` |
| Site name, breaking banner, sections, videos, weather, demo mode | `src/lib/site.ts` |
| Colors, fonts, layout | `src/styles/global.css` |
| Header, menu, footer | `src/layouts/Base.astro` |
| Pages (home, article, section, live, etc.) | `src/pages/` |
| Logo and app icons | `public/` |
| AI drafting script and its sources | `scripts/fetch-news.mjs`, `scripts/sources.json` |

### Writing a story by hand

Create a file in `src/content/noticias/`, for example `2026-10-02-nuevo-parque.md`:

```markdown
---
title: "Título de la noticia"
description: "Resumen de una o dos oraciones."
section: puerto-rico      # puerto-rico, politica, gobierno, estados-unidos, mundo, economia, deportes, entretenimiento, clima, salud, opinion
place: "Caguas"
date: 2026-10-02T09:00:00-04:00
aiAssisted: false
author: "Noticias Xtra"   # optional; this is the default
featured: false           # true = becomes the main story on the home page
image: "https://..."      # optional
sources:
  - name: "Municipio de Caguas"
    url: "https://..."
---

Primer párrafo.

Segundo párrafo.
```

## AI news automation

`.github/workflows/daily-news.yml` runs at 7 a.m. and 5 p.m. Puerto Rico time:

1. `scripts/fetch-news.mjs` checks every enabled source in `scripts/sources.json`.
2. For each new item, Claude writes a short story in Spanish using only facts from that source.
3. The new stories are opened as a **pull request**. An editor reviews them on GitHub (phone works too) and clicks **Merge** to publish.

One-time setup on GitHub:

- **Settings > Secrets and variables > Actions > New repository secret**: `ANTHROPIC_API_KEY` (get one at console.anthropic.com).
- **Settings > Actions > General > Workflow permissions**: check *Allow GitHub Actions to create and approve pull requests*.
- Optional variables: `ANTHROPIC_MODEL` (which Claude model to use), `MAX_ARTICLES` (max stories per run, default 6), `MAX_AI_CALLS` (max paid AI requests per run, including discarded drafts, default 15) and `MAX_AGE_HOURS` (ignore source items older than this, default 36).
- Until `ANTHROPIC_API_KEY` is added, the scheduled runs finish quietly without drafting anything.
- To test it right away: **Actions > Noticias con IA > Run workflow**.

Test locally without using the AI: `DRY_RUN=1 npm run news`

### Adding sources

Add entries to `scripts/sources.json`. Supported types:

- `rss`: any RSS or Atom feed (agency press releases, municipalities, official blogs). Set `"fullText": true` to read the full page for more detail.
- `nws-alerts`: National Weather Service alerts (already set up for Puerto Rico).

Optional fields for any source:

- `"keywords": ["Puerto Rico"]`: only items that mention one of these words go to the AI (free filter for busy national feeds).
- `"maxPerRun": 1`: max stories from this source per run (default 2), so one source can't fill every slot.
- `"enabled": false`: keep the source in the list but skip it.

Stick to **primary sources** (government agencies, municipalities, police, utilities, weather service, official press releases). Rewriting other news outlets' articles can cause copyright problems and hurts search ranking.

### Opinión

The `opinion` section is for signed columns and editorials. The AI script never writes there. Create the file by hand with `section: opinion` and `aiAssisted: false`; the article page labels it as opinion.

## RSS feed

The site publishes its own feed at `/rss.xml`. Social media tools like Buffer, Zapier, or Make can watch it and post new stories to Facebook, Instagram, and X automatically.

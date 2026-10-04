# Noticias Xtra

News website for Noticias Xtra (Puerto Rico), built with [Astro](https://astro.build) and hosted free on GitHub Pages. New stories are drafted by AI from official sources and published after an editor approves them.

## Run it on your computer

You need [Node.js](https://nodejs.org) (version 22 or newer).

```bash
npm install      # first time only
npm run dev      # opens the site at http://localhost:4321/
```

## Publish it on GitHub Pages

1. In `astro.config.mjs`, the GitHub username is already set to `publisher-noticel` (change it if you move the project).
2. Create a repository called `noticias-xtra` on GitHub and push this folder to it (include `package-lock.json`).
3. On GitHub: **Settings > Pages > Source: GitHub Actions**.
4. Every push to `main` rebuilds the site automatically. The site is at `https://noticiasxtra.com` (custom domain set in Settings → Pages).

## Where things are

| What | Where |
| --- | --- |
| News stories (one Markdown file each) | `src/content/noticias/` |
| Site name, newsroom email, sections, section photos, on/off features, demo mode | `src/lib/site.ts` |
| Red news bar logic | `src/lib/breaking.ts` |
| Sports leagues and scores | `src/lib/leagues.ts`, `src/data/marcadores.json` |
| Photos (free licenses, credited in each caption) | `public/images/` |
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
- `wordpress`: a WordPress site whose feed is off but whose posts API works (the BSN uses this). Optional `linkBase` points links to the public site.
- `page`: an agency page with no feed (e.g. Departamento de Salud). Set `linkPattern` to a regular expression that matches the press-release links. The first run only records the links already there; later runs draft new ones.

Optional fields for any source:

- `"keywords": ["Puerto Rico"]`: only items that mention one of these words go to the AI (free filter for busy national feeds).
- `"maxPerRun": 1`: max stories from this source per run (default 2), so one source can't fill every slot.
- `"enabled": false`: keep the source in the list but skip it.

Stick to **primary sources** (government agencies, municipalities, police, utilities, weather service, official press releases). Rewriting other news outlets' articles can cause copyright problems and hurts search ranking.

### Opinión

The `opinion` section is for signed columns and editorials. The AI script never writes there. Create the file by hand with `section: opinion` and `aiAssisted: false`; the article page labels it as opinion.

### Deportes

The Deportes page (`src/pages/seccion/deportes.astro`) has league tabs, a big lead story, headlines, a card for each league, and a page per league at `/deportes/bsn/`, `/deportes/doble-a/`, etc.

- **Leagues** (name, color, description, official site): `src/lib/leagues.ts`. Only add an official site after checking it's real.
- **Tag a sports story with its league** by adding `league: bsn` (or `doble-a`, `invernal`, `voleibol`, `futbol`, `boxeo`, `selecciones`, `mlb`, `nba`) to the story. The AI does this by itself.
- **Scores strip:** type games in `src/data/marcadores.json`. It stays hidden while the file is `[]`. Example:

```json
[
  { "league": "bsn", "date": "2027-05-10T20:00:00-04:00", "away": "Vaqueros", "home": "Santeros", "awayScore": 88, "homeScore": 92, "status": "final" },
  { "league": "invernal", "date": "2026-11-12T19:00:00-04:00", "away": "Cangrejeros", "home": "Criollos", "status": "programado" }
]
```

`status` is `final`, `en-vivo` or `programado`. Optional `note` (e.g. `"4to parcial"`) and `venue`. Games show on the home page, the Deportes page and the league page.

- **Standings:** `src/data/posiciones.json`, by league:

```json
{ "invernal": { "updated": "20 de noviembre", "groups": [ { "rows": [
  { "team": "Cangrejeros", "w": 10, "l": 4 },
  { "team": "Criollos", "w": 8, "l": 6, "gb": "2.0" }
] } ] } }
```

- **Playoff brackets:** `src/data/llaves.json`, by league:

```json
{ "invernal": { "name": "Postemporada 2027", "rounds": [
  { "name": "Semifinal", "series": [ { "a": "Cangrejeros", "b": "Indios", "aWins": 3, "bWins": 1 } ] },
  { "name": "Final", "series": [ { "a": "Cangrejeros", "b": "Por definir" } ] }
] } }
```

- **Team statistics:** `src/data/estadisticas.json`, by league: `{ "bsn": { "columns": ["PPJ", "REB"], "rows": [ { "team": "Vaqueros", "values": ["92.4", "39.1"] } ] } }`
- **Game pages:** give a game an `id` in `marcadores.json` and it gets its own page at `/deportes/juego/<id>/`. Optional: `awayFull`, `homeFull`, `awayRecord`, `homeRecord`, `linescore`, `stats`, `plays` (see `src/lib/scores.ts`).
- **Demo data:** while `sportsDemo` is `true` in `src/lib/site.ts`, sample scores, standings, stats, a bracket and game pages (from `src/lib/demo-sports.ts`) fill the empty spots, each labeled DEMO. Real data always replaces the demo for that league. Set it to `false` to remove all of it.
- **League logos:** put the official file from each league's press office in `public/logos/` named by league id (`bsn.png`, `invernal.svg`...). Until then the site shows a colored badge with the league's initials.
- **Automatic scores:** not connected yet. Free feeds that work technically (MLB, ESPN, the BSN site) don't allow use by a news site, and the BSN's terms forbid automated collection. A licensed provider can later fill these same three files from a script.

### Red news bar

The red bar at the top updates by itself every hour (the site rebuilds hourly). It shows, in order: a story marked `breaking: true` in the last 12 hours (ÚLTIMA HORA), our recent story that best matches what people in Puerto Rico are searching on Google (TENDENCIA), or our newest story (LO ÚLTIMO). To force a specific story, set `breaking` in `src/lib/site.ts`. Weather alerts drafted by the AI are marked `breaking: true` automatically.

### Dark mode and English

The header has a dark-mode button (remembered per browser) and an **ES | EN** switch. EN opens the current page through Google Translate, so it only works on the published site, not on `localhost`.

### Team logos

Team logos go in `public/logos/teams/<league>-<abbr>.png` (abbreviations in `src/lib/teams.ts`). La Pro's six logos come from the league's official site. They show on score cards, game pages, standings and team stats.

### League pages

Each league page (`/deportes/<id>/`) has tabs, a score strip, Titulares, an Equipos list with logos, the top story, games, standings, team stats and playoffs. Team lists live in `src/data/equipos.json` (full names, by league). Leagues: `bsn`, `doble-a`, `invernal` (La Pro), `lvsm` and `lvsf` (voleibol masculino y femenino), `boxeo`, `tenis`, `mlb`, `nba`.

### Columnists

The Opinión page lists columnists from `src/data/columnistas.json`. A column with `section: opinion` and `author` matching a columnist's name appears under that columnist.

### Ads

Ad placeholders ("Espacio publicitario") appear across the site in standard sizes: a 728×90 banner under the header and above the footer on every page (320×100 on phones), 728×90 spots inside the home page, articles, sections and sports pages, and 300×250 / 300×600 spots in the right column (the tall one stays in view while scrolling). They link to the Anúnciate page. Turn them all off with `ads: false` in `src/lib/site.ts`. When ads are sold, put the ad network's code inside `src/components/AdSlot.astro`.

## RSS feed

The site publishes its own feed at `/rss.xml`. Social media tools like Buffer, Zapier, or Make can watch it and post new stories to Facebook, Instagram, and X automatically.

# Project notes for Claude Code

Noticias Xtra is a Spanish-language (Puerto Rico) news site built with Astro 7, deployed to GitHub Pages.

## Commands
- `npm install` then `npm run dev` (http://localhost:4321/noticias-xtra/)
- `npm run build` must pass before committing.
- `DRY_RUN=1 npm run news` tests the AI script without calling the API.

## Conventions
- All user-facing text is in Spanish (Puerto Rico). Code comments in English.
- The site uses a `base` path (`/noticias-xtra`). Always build internal links with `url()` from `src/lib/site.ts`, never hard-coded `/` paths.
- Stories are Markdown files in `src/content/noticias/`; their schema is in `src/content.config.ts`. The AI script `scripts/fetch-news.mjs` writes the same shape, so keep both in sync when changing fields.
- Brand colors: purple `#2B1185`, blue `#1F90DA`, red `#D7263D` only for breaking/live. Fonts: Poppins (headings), Noto Sans (body). Styles live in `src/styles/global.css`.
- No frameworks (React etc.) unless needed; plain Astro components and small inline scripts.
- Keep it static (no server). Everything must work on GitHub Pages.

## Editorial rules for the AI pipeline
- Only primary/official sources in `scripts/sources.json`. Do not add other news outlets as sources.
- One exception, approved by the user on 2026-10-03: "Redactar con IA" (panel → Escribir, admin only; `supabase/functions/redactar-ia/`, `src/components/panel/AiDraft.astro`). It may read pages from the sites in the `ai_outlets` table ("Fuentes autorizadas"): NotiCel, CPI, PR government (Fortaleza, Cámara, Senado, Policía, NMEAD, Salud, Rama Judicial, Junta, LUMA, AAA), NWS/NHC, U.S. federal (FEMA, CDC, Census, White House, Congress) and official league sites (BSN, Doble A, LBPRC, MLB). Add a news outlet only if it agreed. The writer step sees only the extracted facts, the outlets are credited, a code check flags 8+ word matches, and the result is always a draft in `articles` with status `review`. The admin pastes one link; with fewer than 3, Claude web search (limited to the authorized domains) finds the others. These stories carry no AI label (`aiAssisted: false`, user's choice 2026-10-03). Rejecting deletes the draft and erases the text, facts and source texts from the log (only title, links, who and when stay). It never publishes, and only the admin approves it. Wire stories (EFE, AP…) republished by an outlet are not covered by that outlet's permission.
- Review levels (approved by the user on 2026-10-02), set per source with `"review"` in `scripts/sources.json`:
  - `auto`: publish right away. Weather and hurricane alerts, earthquakes, product recalls, league results.
  - `check`: publish right away, and list the story in a "Vistazo rápido" GitHub issue for an editor.
  - `always`: pull request for approval. Political, legal and court sources.
- Whatever the source, a story waits for approval if the AI marks it sensitive (crime, accidents, deaths, minors, private individuals, partisan politics) or low-confidence, or if its section is Política or Gobierno. Never auto-publish those.
- Government press releases are rewritten as neutral facts: no promotional tone, and claims attributed. Stories run 250–400 words, about 2/3 of a typical Puerto Rico outlet's story.
- Top spots on every page favor Puerto Rico stories (`topOrder` in `src/lib/site.ts`), unless a U.S. or world story is trending (`trending`, `breaking`, `live` or `featured`).

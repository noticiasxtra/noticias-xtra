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
- AI drafts always go through a pull request for human review; never auto-merge stories about crime, accidents, minors, or private individuals.

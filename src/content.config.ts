import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { LEAGUE_IDS } from './lib/leagues';

const SECTION_IDS = ['puerto-rico', 'politica', 'gobierno', 'estados-unidos', 'mundo', 'economia', 'deportes', 'entretenimiento', 'clima', 'salud', 'opinion'] as const;

// Each news story is a Markdown file in src/content/noticias/.
// The AI script (scripts/fetch-news.mjs) writes files with this same shape.
const noticias = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/noticias' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    section: z.enum(SECTION_IDS),
    place: z.string().default('Puerto Rico'),
    date: z.coerce.date(),
    author: z.string().default('Noticias Xtra'),
    featured: z.boolean().default(false),
    live: z.boolean().default(false),
    image: z.string().optional(),
    imageCaption: z.string().optional(),
    imageCredit: z.string().optional(), // e.g. "Foto: NASA/Joel Kowsky (dominio público)"
    imageCreditUrl: z.string().optional(), // link to the photo's license page
    // Optional extra photos: the story page shows the main photo and these as a slideshow
    gallery: z.array(z.object({ src: z.string(), caption: z.string().default(''), credit: z.string().default(''), creditUrl: z.string().optional() })).default([]),
    breaking: z.boolean().default(false), // eligible for the red ÚLTIMA HORA bar for 12 hours
    trending: z.boolean().default(false), // editor's "tendencia": a U.S. or world story big enough to lead over local news
    pinned: z.boolean().default(false), // 📌 locked in the home page's main spot until an editor unpins it (pinTop in src/lib/site.ts)
    homeLead: z.boolean().default(false), // editor's pick for the big top story of the home page (topOrder + pinFirst in src/lib/site.ts)
    sectionLead: z.boolean().default(false), // editor's pick for the top story of its section page
    sectionPinned: z.boolean().default(false), // 📌 locked at the top of its section page until an editor unpins it (sectionTop)
    aiAssisted: z.boolean().default(true),
    sources: z.array(z.object({ name: z.string(), url: z.string().optional() })).default([]),
    related: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    league: z.enum(LEAGUE_IDS).optional(), // sports stories only: bsn, doble-a, invernal... (src/lib/leagues.ts)
    correction: z.string().optional(), // shown at the end of the story, e.g. "2 de octubre: se corrigió la cifra de..." 
  }),
});

export const collections = { noticias };

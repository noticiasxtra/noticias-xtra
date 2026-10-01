import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const SECTION_IDS = ['puerto-rico', 'politica', 'gobierno', 'estados-unidos', 'mundo', 'economia', 'deportes', 'entretenimiento', 'clima', 'salud'] as const;

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
    aiAssisted: z.boolean().default(true),
    sources: z.array(z.object({ name: z.string(), url: z.string().optional() })).default([]),
    related: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { noticias };

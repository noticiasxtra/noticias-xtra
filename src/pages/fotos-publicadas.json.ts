import { getStories, SECTION_IMAGES, SECTIONS, url } from '../lib/site';

// For the photo library (panel → Fotos): the photos already used in published stories and the section photos,
// with their captions and credits, so they can be found and reused. Everything here is already public on the site.
export async function GET() {
  const stories = await getStories();
  const abs = (src: string) => (/^https?:/.test(src) ? src : url(src.replace(/^\//, '')));
  const seen = new Set<string>();
  const photos = [
    ...stories.filter((s) => s.data.image).map((s) => ({
      src: abs(s.data.image!), caption: s.data.imageCaption ?? '', credit: s.data.imageCredit ?? '', creditUrl: s.data.imageCreditUrl ?? '',
      story: s.data.title, storyUrl: url(`noticia/${s.id}/`), section: SECTIONS.find((x) => x.id === s.data.section)?.name ?? '', date: s.data.date.toISOString(),
    })),
    ...Object.entries(SECTION_IMAGES).map(([id, p]) => ({
      src: abs(p.src), caption: p.caption, credit: p.credit, creditUrl: p.creditUrl,
      story: '', storyUrl: '', section: `Foto de la sección ${SECTIONS.find((x) => x.id === id)?.name ?? ''}`, date: '',
    })),
  ].filter((p) => !seen.has(p.src) && seen.add(p.src));
  return new Response(JSON.stringify(photos), { headers: { 'Content-Type': 'application/json' } });
}

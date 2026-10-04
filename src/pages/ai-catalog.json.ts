import { getStories, SECTION_IMAGES, SPORT_IMAGES, url } from '../lib/site';

// For "Redactar con IA" (supabase/functions/redactar-ia): the published stories (to find related ones and to learn the
// site's style) and the site's own photo library (story photos and the default section photos, all with their credits).
// Everything here is already public on the site.
export async function GET() {
  const stories = await getStories();
  const abs = (src: string) => (/^https?:/.test(src) ? src : `https://publisher-noticel.github.io${url(src.replace(/^\//, ''))}`);
  const items = stories.slice(0, 200).map((s) => ({
    id: s.id, title: s.data.title, description: s.data.description, section: s.data.section, league: s.data.league ?? '',
    place: s.data.place, date: s.data.date.toISOString(), ai: s.data.aiAssisted, body: (s.body ?? '').slice(0, 2500),
  }));
  const seen = new Set<string>();
  const photos = [
    ...stories.filter((s) => s.data.image && s.data.imageCredit).map((s) => ({ src: abs(s.data.image!), caption: s.data.imageCaption ?? '', credit: s.data.imageCredit!, creditUrl: s.data.imageCreditUrl ?? '', story: s.data.title })),
    ...[...Object.values(SECTION_IMAGES), ...Object.values(SPORT_IMAGES)].filter((p) => !p.src.endsWith('.svg')).map((p) => ({ src: abs(p.src), caption: p.caption, credit: p.credit, creditUrl: p.creditUrl, story: '' })),
  ].filter((p) => !seen.has(p.src) && seen.add(p.src));
  return new Response(JSON.stringify({ stories: items, photos }), { headers: { 'Content-Type': 'application/json' } });
}

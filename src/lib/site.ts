import { getCollection, type CollectionEntry } from 'astro:content';
import { league } from './leagues';

/* =========================================================
   SITE SETTINGS: edit these to change the whole site
   ========================================================= */
export const SITE = {
  name: 'Noticias Xtra',
  tagline: 'Actualidad de Puerto Rico',
  description: 'Noticias de Puerto Rico: gobierno, política, economía, deportes, entretenimiento y clima.',
  // Shows the "sitio de demostración" bar at the top. Set to false when going live.
  demoMode: false,
  // Newsroom email: tips, corrections and privacy questions go here. Empty = pages say "muy pronto".
  email: '',
  // Red bar: chosen automatically (see src/lib/breaking.ts). Set this only to force a story by hand.
  // `id` is the story's file name without .md, e.g. { text: 'Titular', id: '2026-10-01-mi-noticia' }
  breaking: null as
    | { text: string; id: string }
    | null,
  // Sample scores, standings, stats and game pages, labeled "DEMO" everywhere they appear.
  // Turn off (false) before relying on real data; see src/lib/demo-sports.ts.
  sportsDemo: true,
  // Turn parts of the site on (true) or off (false). Off parts are hidden everywhere.
  features: {
    videos: false, // video section and pages (VIDEOS below are samples)
    live: false, // "En vivo" button and TV schedule (SCHEDULE below is a sample)
    weather: false, // town temperatures (TOWNS below are samples); a link to the official forecast shows instead
    newsletter: false, // newsletter sign-up box (needs an email service first)
    app: false, // "Descarga la app" link and banner
    ads: true, // ad placeholders ("Espacio publicitario") across the site; see src/components/AdSlot.astro
  },
  // Official National Weather Service forecast for Puerto Rico
  forecastUrl: 'https://www.weather.gov/sju/',
};

export const SECTIONS = [
  { id: 'puerto-rico', name: 'Puerto Rico', color: '#2B1185' },
  { id: 'politica', name: 'Política', color: '#3B1FA3' },
  { id: 'gobierno', name: 'Gobierno', color: '#244C9A' },
  { id: 'estados-unidos', name: 'Estados Unidos', color: '#1B3A7A' },
  { id: 'mundo', name: 'Mundo', color: '#2E5E8C' },
  { id: 'economia', name: 'Economía', color: '#14708F' },
  { id: 'deportes', name: 'Deportes', color: '#1F90DA' },
  { id: 'entretenimiento', name: 'Entretenimiento', color: '#7A2A9C' },
  { id: 'clima', name: 'Clima', color: '#0F7FA6' },
  { id: 'salud', name: 'Salud', color: '#1A6E7A' },
  // Editorial voice. Written and signed by people, never by the AI script.
  { id: 'opinion', name: 'Opinión', color: '#5A2A82' },
] as const;

export type SectionId = (typeof SECTIONS)[number]['id'];

/* Default photo for each section, used when a story has no image of its own.
   All are free to use (public domain or Creative Commons) and must keep their credit. */
type Photo = { src: string; caption: string; credit: string; creditUrl: string };
const commons = (file: string) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, '_'))}`;
export const SECTION_IMAGES: Record<SectionId, Photo> = {
  'puerto-rico': { src: 'images/pr-desde-el-aire-2.jpg', caption: 'Puerto Rico visto desde el espacio.', credit: 'Foto: NASA (dominio público)', creditUrl: commons('Puerto Rico From Above (154856 - 36 lrg).jpg') },
  politica: { src: 'images/capitolio-pr.jpg', caption: 'El Capitolio de Puerto Rico, en San Juan.', credit: 'Foto: Brad Clinesmith, CC BY-SA 2.0, vía Wikimedia Commons', creditUrl: commons('Capitolio de Puerto Rico (28755163211) (cropped).jpg') },
  gobierno: { src: 'images/la-fortaleza.jpg', caption: 'La Fortaleza, sede del Gobierno de Puerto Rico, en el Viejo San Juan.', credit: 'Foto: vxla, CC BY 2.0, vía Wikimedia Commons', creditUrl: commons('La Fortaleza in San Juan, Puerto Rico.jpg') },
  'estados-unidos': { src: 'images/casa-blanca.jpg', caption: 'La Casa Blanca, en Washington D.C.', credit: 'Foto: Nishkid64 (dominio público), vía Wikimedia Commons', creditUrl: commons('North Façade White House.JPG') },
  mundo: { src: 'images/tierra.jpg', caption: 'La Tierra vista desde el espacio.', credit: 'Imagen: NASA (dominio público)', creditUrl: commons('Blue Marble Western Hemisphere.jpg') },
  economia: { src: 'images/milla-de-oro.jpg', caption: 'La Milla de Oro, centro financiero en Hato Rey.', credit: 'Foto: Jose A. Perez, CC BY 2.0, vía Wikimedia Commons', creditUrl: commons('Rain clouds over Milla de Oro in Hato Rey, Puerto Rico.jpg') },
  deportes: { src: 'images/estadio-hiram-bithorn.jpg', caption: 'Estadio Hiram Bithorn, en San Juan.', credit: 'Foto: Servicio de Parques Nacionales (dominio público)', creditUrl: commons('Hiram Bithorn Stadium in Puerto Rico in 2013 (exterior).jpg') },
  entretenimiento: { src: 'images/bellas-artes.jpg', caption: 'Centro de Bellas Artes Luis A. Ferré, en Santurce.', credit: 'Foto: Nortegawiki, CC0, vía Wikimedia Commons', creditUrl: commons('Fachada Centro de Bellas Artes Luis A. Ferré.jpg') },
  clima: { src: 'images/pr-desde-el-aire.jpg', caption: 'La costa norte de Puerto Rico vista desde el espacio.', credit: 'Foto: NASA (dominio público)', creditUrl: commons('Puerto Rico From Above (154856 - 42 lrg).jpg') },
  salud: { src: 'images/estetoscopio.jpg', caption: 'Imagen de referencia.', credit: 'Foto: Jacek Halicki, CC BY-SA 4.0, vía Wikimedia Commons', creditUrl: commons('2023 Stetoskop.jpg') },
  opinion: { src: 'images/periodicos.jpg', caption: 'Imagen de referencia.', credit: 'Foto: Babak Farrokhi, CC BY 2.0, vía Wikimedia Commons', creditUrl: commons('Newspaper Stack (8582618448).jpg') },
};

/* Sports photos by sport, so a basketball story doesn't get the baseball stadium */
const SPORT_IMAGES: Record<'basketball' | 'baseball' | 'volleyball' | 'boxing' | 'tennis', Photo> = {
  basketball: { src: 'images/canasto-baloncesto.jpg', caption: 'Imagen de referencia.', credit: 'Foto: J.smith, CC BY-SA 4.0, vía Wikimedia Commons', creditUrl: commons('Basketball net.jpg') },
  baseball: SECTION_IMAGES.deportes,
  volleyball: { src: 'images/voleibol-balon.jpg', caption: 'Imagen de referencia.', credit: 'Foto: Sami Mlouhi, CC BY-SA 4.0, vía Wikimedia Commons', creditUrl: commons('Volleyball ball - le ballon de volley-ball - كرة الكرة الطائرة Espérance sportive de Tunis photo1.jpg') },
  boxing: { src: 'images/ring-boxeo.jpg', caption: 'Imagen de referencia.', credit: 'Foto: Micheal Kaluba, CC BY-SA 4.0, vía Wikimedia Commons', creditUrl: commons('Set-up of a boxing Ring.jpg') },
  tennis: { src: 'images/pelota-tenis.jpg', caption: 'Imagen de referencia.', credit: 'Foto: Santeri Viinamäki, CC BY-SA 4.0, vía Wikimedia Commons', creditUrl: commons('Tennis ball on tennis court 20170619.jpg') },
};

/** Default photo for a story without its own: by league (sports) or by section. */
export function defaultPhoto(sectionId: SectionId, leagueId?: string): Photo {
  const sport = league(leagueId)?.photo;
  return sport ? SPORT_IMAGES[sport] : SECTION_IMAGES[sectionId];
}

export const ICONS: Record<SectionId, string> = {
  'puerto-rico': '<path d="M3 15c3-1 4-4 7-4s4 2 7 1 3-2 4-2M5 19h14"/><circle cx="17" cy="6" r="2"/>',
  politica: '<path d="M4 20h16M6 20v-8M10 20v-8M14 20v-8M18 20v-8M3 12l9-7 9 7z"/>',
  gobierno: '<path d="M5 21V8l7-5 7 5v13M9 21v-6h6v6M3 21h18"/>',
  'estados-unidos': '<path d="M5 21V4M5 4h12l-2 4 2 4H5"/>',
  mundo: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  economia: '<path d="M4 19V5M4 19h16M7 15l4-4 3 3 5-6"/>',
  deportes: '<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c3 3 3 13 0 16M12 4c-3 3-3 13 0 16"/>',
  entretenimiento: '<path d="M9 18V6l11-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  clima: '<path d="M7 17h10a4 4 0 0 0 0-8 6 6 0 0 0-11.5 1.5A3.3 3.3 0 0 0 7 17zM9 20l-1 2M13 20l-1 2M17 20l-1 2"/>',
  salud: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/><path d="M9 11h6M12 8v6"/>',
  opinion: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
};

/* Sample videos. Later these can come from YouTube or a video host. */
export const VIDEOS = [
  { id: 'lluvias-zona-este', section: 'clima', title: 'Así se ven las lluvias en la zona este esta tarde', duration: '1:42', date: '2026-10-01T16:00:00-04:00' },
  { id: 'vecinos-santurce', section: 'puerto-rico', title: 'Vecinos de Santurce reaccionan a la repavimentación', duration: '2:15', date: '2026-10-01T14:00:00-04:00' },
  { id: 'practicas-baloncesto', section: 'deportes', title: 'Primer día de prácticas de la selección de baloncesto', duration: '3:08', date: '2026-10-01T10:00:00-04:00' },
  { id: 'festival-ponce', section: 'entretenimiento', title: 'Lo que debes saber antes de ir al festival en Ponce', duration: '1:55', date: '2026-10-01T09:00:00-04:00' },
  { id: 'centro-caguas', section: 'economia', title: 'Recorrido por la construcción del nuevo centro en Caguas', duration: '2:40', date: '2026-10-01T11:00:00-04:00' },
  { id: 'vacunas-mayaguez', section: 'salud', title: 'Dónde vacunarte gratis este fin de semana', duration: '0:58', date: '2026-10-01T08:00:00-04:00' },
] as const satisfies ReadonlyArray<{ id: string; section: SectionId; title: string; duration: string; date: string }>;

export type Video = (typeof VIDEOS)[number];

/* Sample weather. Later this can be fetched from the National Weather Service during each build. */
export const TOWNS = [
  { name: 'San Juan', temp: 31, sky: 'Parcialmente nublado' },
  { name: 'Bayamón', temp: 32, sky: 'Soleado' },
  { name: 'Caguas', temp: 29, sky: 'Aguaceros' },
  { name: 'Ponce', temp: 33, sky: 'Soleado' },
  { name: 'Mayagüez', temp: 30, sky: 'Tormentas aisladas' },
  { name: 'Fajardo', temp: 28, sky: 'Lluvia' },
];

export const SCHEDULE = [
  { at: '6:00 a.m.', show: 'Xtra Temprano' },
  { at: '12:00 p.m.', show: 'Noticias al Mediodía', now: true },
  { at: '5:00 p.m.', show: 'Xtra Deportes' },
  { at: '6:00 p.m.', show: 'Edición Estelar' },
  { at: '10:00 p.m.', show: 'Noticias Xtra Noche' },
];

/* =========================================================
   Helpers
   ========================================================= */

/** Builds a link that works with the GitHub Pages base path, e.g. url('noticia/abc') */
export function url(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const clean = path.replace(/^\//, '');
  return clean ? `${base}/${clean}${clean.includes('.') || clean.endsWith('/') ? '' : '/'}` : `${base}/`;
}

export function section(id: string) {
  return SECTIONS.find((s) => s.id === id) ?? SECTIONS[0];
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString('es-PR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Puerto_Rico' });
}

export type Story = CollectionEntry<'noticias'>;

/** All published stories, newest first. */
export async function getStories(): Promise<Story[]> {
  const all = await getCollection('noticias', ({ data }) => !data.draft);
  return all.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** Stories by view count would come from analytics later. For now: featured first, then newest. */
export function mostRead(stories: Story[], n = 5): Story[] {
  return [...stories].sort((a, b) => Number(b.data.featured) - Number(a.data.featured) || Number(b.data.live) - Number(a.data.live)).slice(0, n);
}

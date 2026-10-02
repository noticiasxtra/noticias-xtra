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
    videos: true, // video section and pages (VIDEOS below: NotiCel and BSN YouTube channels)
    live: true, // "En vivo" button and page: LIVE_SOURCE's YouTube live stream, or its newest video when it isn't live
    weather: false, // town temperatures (TOWNS below are samples); a link to the official forecast shows instead
    newsletter: true, // newsletter sign-up box (demo: nothing is sent until an email service is connected)
    app: true, // "Descarga la app" link and banner (buttons say the app is coming soon)
    ads: true, // ad placeholders ("Espacio publicitario") across the site; see src/components/AdSlot.astro
  },
  // GIPHY key for GIF search in comments (free account at developers.giphy.com). Empty = only our own animated GIFs Xtra.
  giphyKey: '',
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
/* Videos: the official YouTube channels of NotiCel and of the BSN (Baloncesto Superior Nacional),
   shown with YouTube's own embedded player (allowed by YouTube; nothing is downloaded). Each video page
   credits its source and links to the video on YouTube. Titles are our Spanish summaries.
   To add one: copy the 11-character code after "watch?v=" into `yt` and pick its `src`. */
export const VIDEO_SOURCES = {
  noticel: { name: 'NotiCel', short: 'NotiCel', url: 'https://www.youtube.com/noticeloficial', channel: 'UC7rGX_tpwX0S4rCgWTXBeIQ' },
  bsn: { name: 'Baloncesto Superior Nacional (BSN)', short: 'BSN', url: 'https://www.youtube.com/@BaloncestoSuperiorNacionalPR', channel: 'UCZOFf3DbBqAMSwmzYl8RPnA' },
} as const;
export const VIDEOS = [
  // NotiCel (latest first)
  { id: 'noticel-gobernadora-ramon-luis-rivera', yt: '8KITO1HogJ4', src: 'noticel', section: 'gobierno', title: 'La gobernadora recuerda el legado de Ramón Luis Rivera', duration: '6:56' },
  { id: 'noticel-pj-sin-suela-10-anos', yt: 'Ps_OE5Q-G80', src: 'noticel', section: 'entretenimiento', title: 'Rapero y médico: PJ Sin Suela repasa 10 años de trayectoria', duration: '8:43' },
  { id: 'noticel-dalvin-seis-sold-outs', yt: '29f4hmLJgBI', src: 'noticel', section: 'entretenimiento', title: 'Dalvin “La Melodía” en concierto: seis llenos en Puerto Rico', duration: '15:00' },
  { id: 'noticel-montaner-ultimo-regreso', yt: 'm6Tyg16Fg24', src: 'noticel', section: 'entretenimiento', title: 'Ricardo Montaner en su “Último Regreso” a San Juan', duration: '9:04' },
  { id: 'noticel-torres-montalvo-tribunal', yt: 'CJ5RRB4SLG8', src: 'noticel', section: 'politica', title: 'Hiram Torres Montalvo defiende su candidatura a Cataño en el tribunal', duration: '4:43' },
  { id: 'noticel-trauma-severo', yt: 'X3-0incEkUY', src: 'noticel', section: 'salud', title: '¿Está Puerto Rico preparado para atender un trauma severo?', duration: '25:00' },
  { id: 'noticel-beto-cuevas-la-ley', yt: 'dYSaZ6MuBvc', src: 'noticel', section: 'entretenimiento', title: 'Beto Cuevas rinde homenaje a La Ley en el Music Hall', duration: '4:43' },
  { id: 'noticel-centro-tecnologico-comunidades', yt: '7qXhgcxWu7U', src: 'noticel', section: 'puerto-rico', title: 'Inauguran un centro tecnológico para dar voz a comunidades vulnerables', duration: '3:45' },
  // BSN
  { id: 'bsn-celebracion-bayamon-2026', yt: '7vcPJaj3vGA', src: 'bsn', section: 'deportes', title: 'Desde la cancha en Bayamón: así celebraron los Vaqueros el campeonato 2026', duration: '11:43' },
  { id: 'bsn-bayamon-repite-campeon', yt: 'elqiQDkvjVk', src: 'bsn', section: 'deportes', title: 'Bayamón repite como campeón del BSN', duration: '2:12' },
  { id: 'bsn-vaqueros-santeros-resumen-final', yt: 'KHbE8xipLcI', src: 'bsn', section: 'deportes', title: 'Vaqueros vs. Santeros: resumen del juego que coronó a Bayamón', duration: '14:11' },
  { id: 'bsn-vaqueros-santeros-mejores-jugadas', yt: 'wLYomIbSvqk', src: 'bsn', section: 'deportes', title: 'Vaqueros vs. Santeros: las mejores jugadas', duration: '3:29' },
  { id: 'bsn-final-juego-5', yt: 'mBpcnM4pnLE', src: 'bsn', section: 'deportes', title: 'Santeros vs. Vaqueros: resumen del Juego 5 de la Final', duration: '14:51' },
  { id: 'bsn-final-juego-3', yt: 'zhSGVmdknZI', src: 'bsn', section: 'deportes', title: 'Santeros vs. Vaqueros: resumen del Juego 3 de la Final', duration: '16:13' },
  { id: 'bsn-bayamon-gana-juego-1', yt: 'ze3yvdAUW4k', src: 'bsn', section: 'deportes', title: '¡Bayamón se lleva el primero de La Final Brava!', duration: '1:22' },
  { id: 'bsn-final-juego-1', yt: '2VMwFuhnQWk', src: 'bsn', section: 'deportes', title: 'Santeros vs. Vaqueros: resumen del Juego 1 de la Final', duration: '13:26' },
  { id: 'bsn-capitulo-final-2026', yt: 'kqHEowKdtIs', src: 'bsn', section: 'deportes', title: 'Llega el capítulo final de la temporada 2026', duration: '1:49' },
] as const satisfies ReadonlyArray<{ id: string; yt: string; src: keyof typeof VIDEO_SOURCES; section: SectionId; title: string; duration: string }>;

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

// "En vivo" page (src/pages/en-vivo.astro): live YouTube channels in order of priority. Each time the site
// rebuilds (every 15 minutes), the first one that is live plays; if none is live, the first one's newest video plays.
export const LIVE_SOURCES = [
  { id: 'noticel', name: 'NotiCel', channel: VIDEO_SOURCES.noticel.channel, url: VIDEO_SOURCES.noticel.url },
  { id: 'camara', name: 'Cámara de Representantes', channel: 'UCm0SWjunIA5PDT9l4qW59Kw', url: 'https://www.youtube.com/channel/UCm0SWjunIA5PDT9l4qW59Kw' },
  { id: 'casa-blanca', name: 'Casa Blanca (EE. UU.)', channel: 'UCYxRlFDqcWM4y7FfpiAN3KQ', url: 'https://www.youtube.com/@WhiteHouse' },
  // Other official channels (public bodies; YouTube allows embedding them)
  { id: 'gobierno', name: 'Gobierno de Puerto Rico', channel: 'UCU4E9onNJk_vMOq22EisoCQ', url: 'https://www.youtube.com/@GobiernodePR' },
  { id: 'senado', name: 'Senado de Puerto Rico', channel: 'UC4B_LPWngCxJS9bUzFVf0gA', url: 'https://www.youtube.com/channel/UC4B_LPWngCxJS9bUzFVf0gA' },
  { id: 'nasa', name: 'NASA', channel: 'UCLA_DiR1FfKNvjuUpBHmylQ', url: 'https://www.youtube.com/@NASA' },
];
// Section pages with a live video box at the top of the right column (ids from LIVE_SOURCES)
export const SECTION_LIVE: Record<string, string> = { gobierno: 'camara', 'estados-unidos': 'casa-blanca' };

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

/* =========================================================
   Sports leagues for the Deportes hub (src/pages/seccion/deportes.astro)
   and the league pages (src/pages/deportes/[liga].astro).
   No Astro imports here: src/content.config.ts reads LEAGUE_IDS too.
   Only add an `url` after checking it is the league's real official site.
   `logoBg` is the badge background behind a logo made for dark backgrounds.
   `abbr` is shown in the league badge until an official logo is added as
   public/logos/<id>.png or .svg (see src/components/deportes/LeagueBadge.astro).
   `season` is a short note shown on the league page (only facts we have checked);
   `starts` (ISO date) shows the "la temporada arranca" banner on Deportes until that day.
   ========================================================= */

export const LEAGUES = [
  // Puerto Rico
  { id: 'bsn', name: 'BSN', abbr: 'BSN', full: 'Baloncesto Superior Nacional', local: true, color: '#F26B1D', photo: 'basketball',
    about: 'La liga de baloncesto profesional de Puerto Rico.', url: 'https://www.bsnpr.com' },
  { id: 'doble-a', name: 'Doble A', abbr: 'LBSDA', full: 'Liga de Béisbol Superior Doble A', local: true, color: '#1B3A8C', photo: 'baseball',
    about: 'El béisbol de los pueblos, organizado por la Federación de Béisbol de Puerto Rico.', season: 'Campeón 2026: Comerío.', url: 'https://beisboldobleapr.com' },
  { id: 'invernal', name: 'La Pro', abbr: 'LBPRC', full: 'Liga de Béisbol Profesional Roberto Clemente', local: true, color: '#C8202F', logoBg: '#14213D', photo: 'baseball',
    about: 'La Pro: el béisbol profesional de invierno de Puerto Rico, con seis equipos.', url: 'https://www.ligapr.com',
    season: 'Temporada 2026-27: arranca el 4 de noviembre; la fase regular termina el 28 de diciembre y las semifinales empiezan el 2 de enero de 2027.', starts: '2026-11-04T00:00:00-04:00' },
  { id: 'voleibol', name: 'Voleibol', abbr: 'LVS', full: 'Voleibol Superior', local: true, color: '#0F8C8C',
    about: 'El voleibol superior masculino y femenino de Puerto Rico.' },
  { id: 'futbol', name: 'Fútbol', abbr: 'FPF', full: 'Fútbol en Puerto Rico', local: true, color: '#3C9D3C',
    about: 'Las selecciones y los torneos de la Federación Puertorriqueña de Fútbol.', url: 'https://fpfpuertorico.com' },
  { id: 'boxeo', name: 'Boxeo', abbr: 'BOX', full: 'Boxeo', local: true, color: '#9C1F2E',
    about: 'Los boxeadores boricuas en Puerto Rico y en el mundo.' },
  { id: 'selecciones', name: 'Selecciones', abbr: 'PUR', full: 'Selecciones Nacionales', local: true, color: '#C99A2E',
    about: 'Los equipos nacionales de Puerto Rico en competencias internacionales.', url: 'https://www.copur.pr' },
  // Beyond the island
  { id: 'mlb', name: 'Grandes Ligas', abbr: 'MLB', full: 'Grandes Ligas (MLB)', local: false, color: '#13274F', photo: 'baseball',
    about: 'Los peloteros boricuas en las Grandes Ligas.' },
  { id: 'nba', name: 'NBA', abbr: 'NBA', full: 'NBA', local: false, color: '#C8102E', photo: 'basketball',
    about: 'La NBA y los boricuas en el mejor baloncesto del mundo.' },
] as const satisfies ReadonlyArray<{
  id: string; name: string; abbr: string; full: string; local: boolean; color: string; about: string; url?: string; season?: string; starts?: string; logoBg?: string; photo?: 'basketball' | 'baseball';
}>;

export const LEAGUE_IDS = LEAGUES.map((l) => l.id) as unknown as readonly [(typeof LEAGUES)[number]['id'], ...(typeof LEAGUES)[number]['id'][]];
export type LeagueId = (typeof LEAGUES)[number]['id'];
export type League = (typeof LEAGUES)[number];

export const league = (id?: string): League | undefined => LEAGUES.find((l) => l.id === id);

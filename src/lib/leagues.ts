/* =========================================================
   Sports leagues for the Deportes hub (src/pages/seccion/deportes.astro)
   and the league pages (src/pages/deportes/[liga].astro).
   No Astro imports here: src/content.config.ts reads LEAGUE_IDS too.
   Only add an `url` after checking it is the league's real official site.
   ========================================================= */

export const LEAGUES = [
  // Puerto Rico
  { id: 'bsn', name: 'BSN', full: 'Baloncesto Superior Nacional', local: true, color: '#F26B1D', photo: 'basketball',
    about: 'La liga de baloncesto profesional de Puerto Rico.', url: 'https://www.bsnpr.com' },
  { id: 'doble-a', name: 'Doble A', full: 'Béisbol Doble A', local: true, color: '#1B8A5A', photo: 'baseball',
    about: 'El béisbol aficionado de Puerto Rico, con equipos que representan a los pueblos.' },
  { id: 'invernal', name: 'Invernal', full: 'Liga de Béisbol Profesional Roberto Clemente', local: true, color: '#1F3A93', photo: 'baseball',
    about: 'El béisbol profesional de invierno en Puerto Rico.' },
  { id: 'voleibol', name: 'Voleibol', full: 'Voleibol Superior', local: true, color: '#0F8C8C',
    about: 'El voleibol superior masculino y femenino de Puerto Rico.' },
  { id: 'futbol', name: 'Fútbol', full: 'Fútbol en Puerto Rico', local: true, color: '#3C9D3C',
    about: 'Las selecciones y los torneos de la Federación Puertorriqueña de Fútbol.', url: 'https://fpfpuertorico.com' },
  { id: 'boxeo', name: 'Boxeo', full: 'Boxeo', local: true, color: '#9C1F2E',
    about: 'Los boxeadores boricuas en Puerto Rico y en el mundo.' },
  { id: 'selecciones', name: 'Selecciones', full: 'Selecciones Nacionales', local: true, color: '#C99A2E',
    about: 'Los equipos nacionales de Puerto Rico en competencias internacionales.', url: 'https://www.copur.pr' },
  // Beyond the island
  { id: 'mlb', name: 'Grandes Ligas', full: 'Grandes Ligas (MLB)', local: false, color: '#13274F', photo: 'baseball',
    about: 'Los peloteros boricuas en las Grandes Ligas.' },
  { id: 'nba', name: 'NBA', full: 'NBA', local: false, color: '#C8102E', photo: 'basketball',
    about: 'La NBA y los boricuas en el mejor baloncesto del mundo.' },
] as const satisfies ReadonlyArray<{
  id: string; name: string; full: string; local: boolean; color: string; about: string; url?: string; photo?: 'basketball' | 'baseball';
}>;

export const LEAGUE_IDS = LEAGUES.map((l) => l.id) as unknown as readonly [(typeof LEAGUES)[number]['id'], ...(typeof LEAGUES)[number]['id'][]];
export type LeagueId = (typeof LEAGUES)[number]['id'];
export type League = (typeof LEAGUES)[number];

export const league = (id?: string): League | undefined => LEAGUES.find((l) => l.id === id);

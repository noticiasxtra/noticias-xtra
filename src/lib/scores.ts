/* Sports data for the score strips, league pages and home page.
   Two sources, same shapes: files typed by an editor (marcadores.json, posiciones.json…) and the automatic ones
   that scripts/fetch-scores.mjs fills from Highlightly (marcadores-auto.json, posiciones-auto.json: BSN and NBA).
   For a league the automatic files cover, theirs win.
   Every section hides itself or shows a note when its file is empty,
   so we never show made-up results. */
import realGames from '../data/marcadores.json';
import autoGames from '../data/marcadores-auto.json';
import autoStandings from '../data/posiciones-auto.json';
import autoStats from '../data/estadisticas-auto.json';
import standingsData from '../data/posiciones.json';
import bracketsData from '../data/llaves.json';
import statsData from '../data/estadisticas.json';
import type { LeagueId } from './leagues';
import { SITE } from './site';
import { DEMO_GAMES, DEMO_STANDINGS, DEMO_STATS, DEMO_BRACKETS } from './demo-sports';

export type Game = {
  league: LeagueId;
  date: string; // e.g. "2026-11-04T19:30:00-04:00"
  away: string; // visitor, e.g. "Cangrejeros"
  home: string;
  awayScore?: number;
  homeScore?: number;
  status: 'final' | 'en-vivo' | 'programado';
  note?: string; // e.g. "4to parcial", "7ma entrada"
  venue?: string;
  // Optional, for the game page (/deportes/juego/<id>/)
  id?: string; // e.g. "bsn-2027-05-10-vaqueros-santeros"
  demo?: boolean;
  awayFull?: string; // e.g. "Vaqueros de Bayamón"
  homeFull?: string;
  awayRecord?: string; // e.g. "22-10"
  homeRecord?: string;
  linescore?: { labels: string[]; away: Array<number | string>; home: Array<number | string>; totals: string[]; awayTotals: Array<number | string>; homeTotals: Array<number | string> };
  stats?: Array<{ label: string; away: string; home: string }>;
  plays?: Array<{ when: string; text: string }>; // newest first
  videos?: Array<{ title: string; url: string; embed: string; img: string; channel: string }>; // highlights (scripts/fetch-scores.mjs)
};

export type TeamStats = { columns: string[]; rows: Array<{ team: string; values: string[] }> };

export type Standings = {
  updated?: string; // e.g. "2026-11-20"
  groups: Array<{
    name?: string; // e.g. "Sección A"; leave out if there's only one table
    columns?: string[]; // extra columns, e.g. ["DIF"]; default shows G, P, PCT, DIF
    rows: Array<{ team: string; w: number; l: number; gb?: string; extra?: string[] }>;
  }>;
};

export type Bracket = {
  name?: string; // e.g. "Serie Final 2027"
  updated?: string; // e.g. "1 de octubre de 2026. Fuente: MLB.com"
  rounds: Array<{
    name: string; // e.g. "Semifinal"
    series: Array<{ a: string; b: string; aWins?: number; bWins?: number; note?: string }>;
  }>;
};

const t = (g: Game) => new Date(g.date).valueOf();
const demo = SITE.sportsDemo;
/** Real data plus, while SITE.sportsDemo is on, the demo data. */
// Each team's record and place, from the automatic standings ("4-1 · 2.º en la Conferencia Este")
const recordOf = (league: string, name?: string, short?: string) => {
  for (const grp of (autoStandings as Record<string, Standings>)[league]?.groups ?? []) {
    const i = grp.rows.findIndex((r) => r.team === name || r.team === short); // MLB tables use the short name
    if (i >= 0) return `${grp.rows[i].w}-${grp.rows[i].l}${grp.name ? ` · ${i + 1}.º en ${/^Grupo/.test(grp.name) ? 'el' : 'la'} ${grp.name}` : ''}`;
  }
  return undefined;
};
const auto = (autoGames as Array<Game & { _checked?: string }>).filter((g) => g.league)
  .map((g) => ({ ...g, awayRecord: g.awayRecord ?? recordOf(g.league, g.awayFull, g.away), homeRecord: g.homeRecord ?? recordOf(g.league, g.homeFull, g.home) }));
const autoLeagues = new Set(auto.map((g) => g.league));
const allGames = (): Game[] => [...auto, ...(realGames as Game[]).filter((g) => !autoLeagues.has(g.league)), ...(demo ? DEMO_GAMES : [])];

/** Live games first, then upcoming (soonest first), then finals (newest first). */
export function scores(league?: string, max = 16): Game[] {
  const list = allGames().filter((g) => !league || g.league === league);
  const live = list.filter((g) => g.status === 'en-vivo');
  const next = list.filter((g) => g.status === 'programado').sort((a, b) => t(a) - t(b));
  const done = list.filter((g) => g.status === 'final').sort((a, b) => t(b) - t(a));
  return [...live, ...next, ...done].slice(0, max);
}

/** Only what's current: live games, results from the last `days` days and games in the next `days` days. Used by the
 *  home page and the score strips, so a league whose season ended (e.g. MLB in October) leaves them on its own.
 *  League pages keep their full list. */
export const recent = (list: Game[], days = 4): Game[] =>
  list.filter((g) => g.status === 'en-vivo' || Math.abs(t(g) - Date.now()) < days * 864e5);

export const games = (): Game[] => allGames().filter((g) => g.id);
export const standings = (league: string): Standings | undefined =>
  (autoStandings as Record<string, Standings>)[league] ?? (standingsData as Record<string, Standings>)[league] ?? (demo ? DEMO_STANDINGS[league] : undefined);
export const bracket = (league: string): Bracket | undefined =>
  (bracketsData as Record<string, Bracket>)[league] ?? (demo ? DEMO_BRACKETS[league] : undefined);
export const teamStats = (league: string): TeamStats | undefined =>
  (autoStats as Record<string, TeamStats>)[league] ?? (statsData as Record<string, TeamStats>)[league] ?? (demo ? DEMO_STATS[league] : undefined);
/** True when this league's tables are showing demo numbers. */
export const isDemoTable = (kind: 'standings' | 'brackets' | 'stats', league: string) =>
  demo && !({ standings: { ...standingsData, ...autoStandings }, brackets: bracketsData, stats: statsData }[kind] as Record<string, unknown>)[league];

export const gameTime = (d: string) =>
  new Date(d).toLocaleString('es-PR', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'America/Puerto_Rico' });

/* Sports data for the score strips, league pages and home page.
   Today these files are typed by an editor; later a licensed data provider can
   fill the same files (same shapes) from a script, without changing the pages.
   Every section hides itself or shows a note when its file is empty,
   so we never show made-up results. */
import games from '../data/marcadores.json';
import standingsData from '../data/posiciones.json';
import bracketsData from '../data/llaves.json';
import type { LeagueId } from './leagues';

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
};

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
  rounds: Array<{
    name: string; // e.g. "Semifinal"
    series: Array<{ a: string; b: string; aWins?: number; bWins?: number; note?: string }>;
  }>;
};

const t = (g: Game) => new Date(g.date).valueOf();

/** Live games first, then upcoming (soonest first), then finals (newest first). */
export function scores(league?: string, max = 16): Game[] {
  const list = (games as Game[]).filter((g) => !league || g.league === league);
  const live = list.filter((g) => g.status === 'en-vivo');
  const next = list.filter((g) => g.status === 'programado').sort((a, b) => t(a) - t(b));
  const done = list.filter((g) => g.status === 'final').sort((a, b) => t(b) - t(a));
  return [...live, ...next, ...done].slice(0, max);
}

export const standings = (league: string): Standings | undefined => (standingsData as Record<string, Standings>)[league];
export const bracket = (league: string): Bracket | undefined => (bracketsData as Record<string, Bracket>)[league];

export const gameTime = (d: string) =>
  new Date(d).toLocaleString('es-PR', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'America/Puerto_Rico' });

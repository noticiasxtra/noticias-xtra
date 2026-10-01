/* Scores for the strip at the top of Deportes. Typed by an editor in src/data/marcadores.json.
   The strip hides itself when the file is empty, so we never show made-up results. */
import data from '../data/marcadores.json';
import type { LeagueId } from './leagues';

export type Game = {
  league: LeagueId;
  date: string; // e.g. "2026-10-03T19:30:00-04:00"
  away: string; // visitor, e.g. "Vaqueros"
  home: string;
  awayScore?: number;
  homeScore?: number;
  status: 'final' | 'en-vivo' | 'programado';
  note?: string; // e.g. "4to parcial", "Extra innings"
};

/** Live games first, then upcoming (soonest first), then finals (newest first). Max 12. */
export function scores(): Game[] {
  const games = data as Game[];
  const t = (g: Game) => new Date(g.date).valueOf();
  const live = games.filter((g) => g.status === 'en-vivo');
  const next = games.filter((g) => g.status === 'programado').sort((a, b) => t(a) - t(b));
  const done = games.filter((g) => g.status === 'final').sort((a, b) => t(b) - t(a));
  return [...live, ...next, ...done].slice(0, 12);
}

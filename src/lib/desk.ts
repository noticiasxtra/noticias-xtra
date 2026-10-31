// Sports items the newsroom types in the panel (Deportes tab): boxing fights and Puerto Rican champions, tennis players
// to follow and tournaments. Saved in Supabase (supabase/deportes-panel.sql, table sports_desk); the site reads the ones
// that are on when it is built. Until the table exists (or if it can't be reached) it uses src/data/deportes-desk.json.
// Server/build only: never import this from a page's <script>.
import data from '../data/deportes-desk.json';
import { BACKEND } from './backend';

export type Side = { name: string; record?: string; country?: string };
export type Fight = { date: string; venue?: string; city?: string; a: Side; b: Side; weight?: string; titles?: string; status: 'programada' | 'final' | 'cancelada'; winner?: 'a' | 'b' | 'empate' | ''; method?: string; round?: string; tv?: string; note?: string };
export type Champion = { name: string; weight: string; org: string; since?: string };
export type Player = { name: string; tour?: string; ranking?: string; next?: string; note?: string };
export type Tournament = { name: string; start: string; end?: string; place?: string; surface?: string; level?: string };
export type DeskItem = { id: string; sport: 'boxeo' | 'tenis'; kind: 'fight' | 'champion' | 'player' | 'tournament'; data: any; sort?: number; active?: boolean };

async function fromDatabase(): Promise<DeskItem[] | null> {
  if (!BACKEND.url || !BACKEND.anonKey) return null;
  try {
    const r = await fetch(`${BACKEND.url.replace(/\/$/, '')}/rest/v1/sports_desk?select=id,sport,kind,data,sort&active=eq.true&order=sort.asc`, {
      headers: { apikey: BACKEND.anonKey, Authorization: `Bearer ${BACKEND.anonKey}` }, signal: AbortSignal.timeout(8000),
    });
    return r.ok ? r.json() : null; // table not created yet: use the file
  } catch { return null; }
}
const ITEMS: DeskItem[] = (await fromDatabase()) ?? (data as DeskItem[]);
const of = <T>(sport: string, kind: string) => ITEMS.filter((i) => i.sport === sport && i.kind === kind).map((i) => ({ id: i.id, ...(i.data as T) }));

const t = (d?: string) => (d ? Date.parse(d) : 0);
/** Upcoming fights (soonest first) and results (newest first), the last 60 days. */
export function fights() {
  const all = of<Fight>('boxeo', 'fight');
  const now = Date.now();
  return {
    next: all.filter((f) => f.status !== 'final' && t(f.date) > now - 864e5).sort((a, b) => t(a.date) - t(b.date)),
    done: all.filter((f) => f.status === 'final' && now - t(f.date) < 60 * 864e5).sort((a, b) => t(b.date) - t(a.date)),
  };
}
export const champions = () => of<Champion>('boxeo', 'champion');
export const players = () => of<Player>('tenis', 'player');
/** Tournaments not over yet, soonest first. */
export const tournaments = () => of<Tournament>('tenis', 'tournament').filter((x) => t(x.end || x.start) > Date.now() - 864e5).sort((a, b) => t(a.start) - t(b.start));

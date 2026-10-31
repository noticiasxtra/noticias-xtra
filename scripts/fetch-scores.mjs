#!/usr/bin/env node
/**
 * Real scores and standings from Highlightly (https://highlightly.net), run by .github/workflows/scores.yml.
 * Writes src/data/marcadores-auto.json (games) and src/data/posiciones-auto.json (standings), the same shapes as the
 * hand-typed marcadores.json and posiciones.json (src/lib/scores.ts merges them; these win for the leagues they cover).
 * Covered on the account (checked 2026-10-31, scripts/sports-discovery.json): BSN and NBA. Highlightly has no
 * La Pro, Doble A or Puerto Rico volleyball; those stay hand-typed.
 * Free plan: 100 requests a day per sport. Each run asks for today's games (1 request per league); the first run of
 * the day also asks for yesterday's finals and the standings.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GAMES_FILE = path.join(ROOT, 'src/data/marcadores-auto.json');
const TABLES_FILE = path.join(ROOT, 'src/data/posiciones-auto.json');
const KEY = process.env.HIGHLIGHTLY_API_KEY;
const TZ = 'America/Puerto_Rico';

// Highlightly league ids (from scripts/sports-discovery.json)
const LEAGUES = [
  { id: 'bsn', base: 'https://basketball.highlightly.net', leagueId: 65460 },
  { id: 'nba', base: 'https://basketball.highlightly.net', leagueId: 10996 },
];

const readJson = async (f, fb) => { try { return JSON.parse(await fs.readFile(f, 'utf8')); } catch { return fb; } };
const day = (offset = 0) => new Date(Date.now() + offset * 864e5).toLocaleDateString('en-CA', { timeZone: TZ }); // YYYY-MM-DD in PR
let calls = 0;
async function get(base, p) {
  calls++;
  const r = await fetch(base + p, { headers: { 'x-rapidapi-key': KEY }, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`${r.status} en ${p}: ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

// "Vaqueros de Bayamón" → "Vaqueros"; "Los Angeles Lakers" → "Lakers" (the short name the score cards use)
const NBA_TWO = ['Trail Blazers'];
const short = (league, name) => {
  if (league === 'bsn') return name.split(/\s+de\s+/i)[0].trim();
  const two = NBA_TWO.find((t) => name.endsWith(t));
  return two ?? name.split(/\s+/).pop();
};
const PERIOD = { 'First quarter': '1er cuarto', 'Second quarter': '2do cuarto', 'Third quarter': '3er cuarto', 'Fourth quarter': '4to cuarto', 'Over time': 'Tiempo extra', 'Half time': 'Medio tiempo', 'Break time': 'Descanso' };
const OFF = { Postponed: 'Pospuesto', Cancelled: 'Cancelado', Suspended: 'Suspendido', Abandoned: 'Suspendido' };

function toGame(league, m) {
  const st = m.state?.description ?? 'Unknown';
  const [home, away] = String(m.state?.score?.current ?? '').split('-').map((x) => Number.parseInt(x, 10));
  const final = /^Finished|^Awarded/.test(st), live = !!PERIOD[st];
  const g = {
    league, date: m.date, away: short(league, m.awayTeam.name), home: short(league, m.homeTeam.name),
    awayFull: m.awayTeam.name, homeFull: m.homeTeam.name,
    status: final ? 'final' : live ? 'en-vivo' : 'programado',
    src: `highlightly:${m.id}`,
    id: `${league}-${m.id}`, // its own page: /deportes/juego/<id>/
  };
  if ((final || live) && Number.isFinite(home) && Number.isFinite(away)) { g.homeScore = home; g.awayScore = away; }
  if (live) g.note = PERIOD[st] + (m.state.clock && st.endsWith('quarter') ? ` · ${m.state.clock}'` : '');
  if (st === 'Finished after over time') g.note = 'Final · tiempo extra';
  // Score by quarter (Highlightly gives "home - away" for each one played)
  const sc = m.state?.score ?? {};
  const parts = [['q1', '1'], ['q2', '2'], ['q3', '3'], ['q4', '4'], ['overTime', 'TE']].filter(([k]) => sc[k]);
  if (parts.length && (final || live)) {
    const split = (k) => String(sc[k]).split('-').map((x) => Number.parseInt(x, 10));
    g.linescore = { labels: parts.map(([, n]) => n), home: parts.map(([k]) => split(k)[0]), away: parts.map(([k]) => split(k)[1]), totals: ['T'], homeTotals: [g.homeScore ?? ''], awayTotals: [g.awayScore ?? ''] };
  }
  if (OFF[st]) g.note = OFF[st];
  return g;
}

const GROUP = { 'Eastern Conference': 'Conferencia Este', 'Western Conference': 'Conferencia Oeste' };
function toTable(data, season) {
  let src = data.groups || [];
  if (src.some((g) => /Conference$/.test(g.name))) src = src.filter((g) => /Conference$/.test(g.name)); // NBA: the two conferences, not divisions
  const groups = src.map((grp) => {
    const rows = [...grp.standings].sort((a, b) => a.position - b.position);
    const top = rows[0];
    return {
      ...(src.length > 1 ? { name: GROUP[grp.name] ?? grp.name.replace(/^Group /, 'Grupo ') } : {}),
      rows: rows.map((r) => {
        const gb = top ? ((top.wins - r.wins) + (r.loses - top.loses)) / 2 : 0;
        return { team: r.team.name, w: r.wins, l: r.loses, gb: gb === 0 ? '—' : String(gb) };
      }),
    };
  }).filter((g) => g.rows.length);
  return groups.length ? { updated: `Temporada ${season}. Fuente: Highlightly`, groups } : null;
}

async function main() {
  if (!KEY) { console.log('HIGHLIGHTLY_API_KEY no está configurada. No se buscaron marcadores.'); return; }
  const games = await readJson(GAMES_FILE, []);
  const tables = await readJson(TABLES_FILE, {});
  const firstOfDay = !games.some((g) => g._checked === day()) || process.env.FULL === '1';
  const byKey = new Map(games.filter((g) => !g._checked).map((g) => [g.src, g]));

  for (const l of LEAGUES) {
    try {
      for (const d of firstOfDay ? [day(-1), day()] : [day()]) {
        const r = await get(l.base, `/matches?leagueId=${l.leagueId}&date=${d}&timezone=${encodeURIComponent(TZ)}&limit=100`);
        for (const m of r.data || []) byKey.set(`highlightly:${m.id}`, toGame(l.id, m));
        console.log(`${l.id} ${d}: ${(r.data || []).length} juegos`);
      }
      if (firstOfDay) {
        // The current season first (NBA 2026 = 2026-27); before it has a table, the one before
        const year = Number(day().slice(0, 4));
        let t = null, season = year;
        for (season of [year, year - 1]) {
          t = toTable(await get(l.base, `/standings?leagueId=${l.leagueId}&season=${season}`), l.id === 'nba' ? `${season}-${String(season + 1).slice(2)}` : String(season));
          if (t) break;
        }
        if (t) tables[l.id] = t;
        console.log(`${l.id}: posiciones ${t ? 'actualizadas' : 'sin datos'} (temporada ${season})`);
      }
    } catch (e) { console.warn(`${l.id}: ${e.message}`); }
  }

  // Keep the last 7 days of results and the next 7 days of games
  const keep = (g) => Math.abs(Date.parse(g.date) - Date.now()) < 7 * 864e5;
  const list = [...byKey.values()].filter(keep).sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  await fs.writeFile(GAMES_FILE, JSON.stringify([...list, { _checked: day() }], null, 2) + '\n');
  await fs.writeFile(TABLES_FILE, JSON.stringify(tables, null, 2) + '\n');
  console.log(`Listo: ${list.length} juegos guardados, ${calls} consultas.`);
}
main().catch((e) => { console.error(e); process.exit(1); });

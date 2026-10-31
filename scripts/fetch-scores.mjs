#!/usr/bin/env node
/**
 * Real scores and standings from Highlightly (https://highlightly.net), run by .github/workflows/scores.yml.
 * Writes src/data/marcadores-auto.json (games) and src/data/posiciones-auto.json (standings), the same shapes as the
 * hand-typed marcadores.json and posiciones.json (src/lib/scores.ts merges them; these win for the leagues they cover).
 * Covered on the account (checked 2026-10-31, scripts/sports-discovery.json): BSN and NBA; NFL once its plan is added. Highlightly has no
 * La Pro, Doble A or Puerto Rico volleyball; those stay hand-typed.
 * Free plan: 100 requests a day per sport. Each run asks for today's games (1 request per league); the first run of
 * the day also asks for yesterday's finals and the standings; each finished game is asked once more for its team
 * stats and arena (game page), at most DETAILS_PER_RUN per run.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GAMES_FILE = path.join(ROOT, 'src/data/marcadores-auto.json');
const TABLES_FILE = path.join(ROOT, 'src/data/posiciones-auto.json');
const STATS_FILE = path.join(ROOT, 'src/data/estadisticas-auto.json'); // team stats tables (NFL: points per game)
const KEY = process.env.HIGHLIGHTLY_API_KEY;
const TZ = 'America/Puerto_Rico';

// Highlightly league ids (from scripts/sports-discovery.json)
const LEAGUES = [
  // starts: between seasons the league isn't asked about until 3 days before its opener (src/lib/leagues.ts), to save requests
  { id: 'bsn', base: 'https://basketball.highlightly.net', leagueId: 65460, starts: '2027-03-20', ends: '2026-08-31' },
  { id: 'nba', base: 'https://basketball.highlightly.net', leagueId: 10996 },
  // NFL is Highlightly's separate "NFL API" product (its own free plan, same key); until it's added it's skipped
  { id: 'nfl', base: 'https://american-football.highlightly.net', league: 'NFL', football: true },
];

const DETAILS_PER_RUN = 5; // each one is 2 requests: the game's stats and its video highlights
// Stats of games in progress, refreshed on every run: turn on with the repository variable LIVE_STATS=1 once the plan
// allows it (Pro: 7,500 requests a day). On the free plan a game gets its stats once, when it ends.
const LIVE_STATS = process.env.LIVE_STATS === '1';
// Team stats on the game page, in this order (Highlightly's names → Spanish); anything else is left out
const STAT = [
  ['Points', 'Puntos'], ['Successful Field Goals', 'Tiros de campo anotados'], ['Field Goals', 'Tiros de campo intentados'], ['Field Goal %', '% tiros de campo'], ['Field Goals %', '% tiros de campo'],
  ['Successful 3 Pointers', 'Triples anotados'], ['3 Pointers', 'Triples intentados'], ['Three Pointers', 'Triples intentados'], ['3 Point %', '% de triples'], ['Three Point %', '% de triples'],
  ['Successful Free Throws', 'Tiros libres anotados'], ['Free Throws', 'Tiros libres intentados'], ['Free Throw %', '% tiros libres'], ['Rebounds', 'Rebotes'], ['Total Rebounds', 'Rebotes'],
  ['Offensive Rebounds', 'Rebotes ofensivos'], ['Defensive Rebounds', 'Rebotes defensivos'], ['Assists', 'Asistencias'],
  ['Steals', 'Robos'], ['Blocks', 'Tapones'], ['Turnovers', 'Pérdidas'], ['Fouls', 'Faltas'], ['Personal Fouls', 'Faltas'],
  ['Points In Paint', 'Puntos en la pintura'], ['Fast Break Points', 'Puntos de contraataque'], ['Points Off Turnovers', 'Puntos tras pérdidas'], ['Largest Lead', 'Mayor ventaja'],
];
const statLabel = new Map(STAT.map(([en, es]) => [en.toLowerCase(), es]));
const fmt = (v) => (typeof v === 'number' && !Number.isInteger(v) ? v.toFixed(1) : String(v));
function toStats(g, list) {
  const side = (name) => list.find((x) => x.team?.name === name)?.statistics ?? [];
  const away = side(g.awayFull), home = side(g.homeFull);
  const out = [];
  for (const [en, es] of STAT) {
    if (out.some((s) => s.label === es)) continue;
    const a = away.find((s) => s.displayName?.toLowerCase() === en.toLowerCase()), h = home.find((s) => s.displayName?.toLowerCase() === en.toLowerCase());
    if (a && h) out.push({ label: es, away: fmt(a.value), home: fmt(h.value) });
  }
  // Stats with a name not in the list still show (with Highlightly's name) so nothing is lost; translate them above
  for (const a of away) {
    if (out.length >= 20 || statLabel.has(a.displayName?.toLowerCase())) continue;
    const h = home.find((s) => s.displayName === a.displayName);
    if (h) out.push({ label: a.displayName, away: fmt(a.value), home: fmt(h.value) });
  }
  return out;
}

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

// NFL games come in a slightly different shape (state "In progress" + period, team displayName)
const QTR = ['', '1er cuarto', '2do cuarto', '3er cuarto', '4to cuarto'];
function toFootball(league, m) {
  const st = m.state?.description ?? 'Unknown';
  const [home, away] = String(m.state?.score?.current ?? '').split('-').map((x) => Number.parseInt(x, 10));
  const final = st === 'Finished', live = ['In progress', 'End period', 'Half time'].includes(st);
  const g = {
    league, date: m.date, away: m.awayTeam.name, home: m.homeTeam.name, awayFull: m.awayTeam.displayName, homeFull: m.homeTeam.displayName,
    status: final ? 'final' : live ? 'en-vivo' : 'programado', src: `highlightly:${m.id}`, id: `${league}-${m.id}`, statsChecked: true,
  };
  if ((final || live) && Number.isFinite(home) && Number.isFinite(away)) { g.homeScore = home; g.awayScore = away; }
  if (live) g.note = st === 'Half time' ? 'Medio tiempo' : (m.state.period > 4 ? 'Tiempo extra' : QTR[m.state.period] ?? 'En vivo') + (st === 'In progress' && m.state.clock ? ` · ${m.state.clock}'` : '');
  if (final && /OT/i.test(m.state?.report ?? '')) g.note = 'Final · tiempo extra';
  if (OFF[st]) g.note = OFF[st];
  const sc = m.state?.score ?? {};
  const parts = [['firstPeriod', '1'], ['secondPeriod', '2'], ['thirdPeriod', '3'], ['fourthPeriod', '4'], ['firstOvertimePeriod', 'TE']].filter(([k]) => sc[k]);
  if (parts.length && (final || live)) {
    const split = (k) => String(sc[k]).split('-').map((x) => Number.parseInt(x, 10));
    g.linescore = { labels: parts.map(([, n]) => n), home: parts.map(([k]) => split(k)[0]), away: parts.map(([k]) => split(k)[1]), totals: ['T'], homeTotals: [g.homeScore ?? ''], awayTotals: [g.awayScore ?? ''] };
  }
  return g;
}

// NFL standings: Highlightly gives each conference (AFC, NFC) with its teams' season stats. Returns the table and the
// "points per game" stats table built from the same numbers.
function nflTables(data) {
  // One table per conference: Highlightly can send more than one (e.g. preseason labeled as regular); keep the one that
  // runs latest (the regular season ends in January)
  const latest = new Map();
  for (const c of (data.data || []).filter((c) => /regular/i.test(c.seasonType ?? '') && /^(AFC|NFC)$/.test(c.abbreviation))) {
    const prev = latest.get(c.abbreviation);
    if (!prev || Date.parse(c.endDate) > Date.parse(prev.endDate)) latest.set(c.abbreviation, c);
  }
  const confs = [...latest.values()].sort((a, b) => a.abbreviation.localeCompare(b.abbreviation));
  if (!confs.length) return null;
  const val = (t, ...names) => { const s = t.statistics?.find((x) => names.some((n) => x.displayName?.toLowerCase() === n)); return s ? String(s.value) : ''; };
  const num = (v) => Number.parseFloat(v) || 0;
  const all = [];
  const groups = confs.map((c) => {
    const rows = c.data.map((t) => {
      const w = num(val(t, 'wins')), l = num(val(t, 'losses')), pf = num(val(t, 'points for', 'pointsfor')), pa = num(val(t, 'points against', 'pointsagainst'));
      const row = { team: t.team.displayName, w, l, extra: [String(pf), String(pa), val(t, 'streak').replace(/^W/, 'G').replace(/^L/, 'P')] };
      all.push({ team: t.team.displayName, games: w + l + num(val(t, 'ties')), pf, pa });
      return row;
    }).sort((a, b) => b.w - a.w || a.l - b.l);
    const top = rows[0];
    rows.forEach((r) => { const gb = ((top.w - r.w) + (r.l - top.l)) / 2; r.gb = gb === 0 ? '—' : String(gb); });
    return { name: c.abbreviation, columns: ['PF', 'PC', 'RACHA'], rows };
  });
  const per = (x, g) => (g ? (x / g).toFixed(1) : '0.0');
  const stats = { columns: ['PTS/J', 'PC/J', 'DIF', 'J'], rows: all.filter((t) => t.games).sort((a, b) => b.pf / b.games - a.pf / a.games).slice(0, 10)
    .map((t) => ({ team: t.team, values: [per(t.pf, t.games), per(t.pa, t.games), `${t.pf - t.pa >= 0 ? '+' : ''}${t.pf - t.pa}`, String(t.games)] })) };
  return { table: { updated: `Temporada ${confs[0].year}. Fuente: Highlightly`, groups }, stats };
}

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
  const teamStats = await readJson(STATS_FILE, {});
  const firstOfDay = !games.some((g) => g._checked === day()) || process.env.FULL === '1';
  const byKey = new Map(games.filter((g) => !g._checked).map((g) => [g.src, g]));

  const now = Date.now();
  for (const l of LEAGUES) {
    if (l.starts && now > Date.parse(l.ends) && now < Date.parse(l.starts) - 3 * 864e5) { console.log(`${l.id}: fuera de temporada`); continue; }
    try {
      // Today on every run; the first run of the day also yesterday's finals and the coming days' games
      // (NFL: the next 6 days, since it plays mostly on Sundays; basketball: tomorrow)
      const ahead = Array.from({ length: l.football ? 6 : 1 }, (_, i) => day(i + 1));
      for (const d of firstOfDay ? [day(-1), day(), ...ahead] : [day()]) {
        const r = await get(l.base, `/matches?${l.football ? `league=${l.league}` : `leagueId=${l.leagueId}`}&date=${d}&timezone=${encodeURIComponent(TZ)}&limit=100`);
        for (const m of r.data || []) {
          const old = byKey.get(`highlightly:${m.id}`), g = l.football ? toFootball(l.id, m) : toGame(l.id, m);
          if (old?.statsChecked && g.status === 'final') Object.assign(g, { stats: old.stats, venue: old.venue, videos: old.videos, statsChecked: true });
          byKey.set(`highlightly:${m.id}`, g);
        }
        console.log(`${l.id} ${d}: ${(r.data || []).length} juegos`);
      }
      if (firstOfDay && l.football) {
        const year = Number(day().slice(0, 4)), month = Number(day().slice(5, 7));
        const t = nflTables(await get(l.base, `/standings?leagueType=${l.league}&year=${month < 3 ? year - 1 : year}&limit=10`));
        if (t) { tables[l.id] = t.table; teamStats[l.id] = t.stats; }
        console.log(`${l.id}: posiciones ${t ? 'actualizadas' : 'sin datos'}`);
      }
      if (firstOfDay && !l.football) {
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

  // Finished games: team stats and arena once (one request each), so the game page has more than the score
  let details = 0;
  if (LIVE_STATS) for (const g of byKey.values()) {
    if (g.status !== 'en-vivo' || !g.src) continue;
    const l = LEAGUES.find((x) => x.id === g.league); if (!l || l.football) continue;
    try {
      const r = await get(l.base, `/matches/${g.src.split(':')[1]}`);
      const m = Array.isArray(r) ? r[0] : r.data?.[0] ?? r;
      const stats = toStats(g, m?.statistics ?? []);
      if (stats.length) g.stats = stats;
      if (m?.venue?.name) g.venue = [m.venue.name, m.venue.city].filter(Boolean).join(', ');
    } catch (e) { console.warn(`en vivo ${g.id}: ${e.message}`); }
  }
  for (const g of byKey.values()) {
    if (g.status !== 'final' || g.statsChecked || details >= DETAILS_PER_RUN || !g.src) continue;
    const l = LEAGUES.find((x) => x.id === g.league); if (!l) continue;
    try {
      details++;
      const r = await get(l.base, `/matches/${g.src.split(':')[1]}`);
      const m = Array.isArray(r) ? r[0] : r.data?.[0] ?? r;
      const stats = toStats(g, m?.statistics ?? []);
      if (stats.length) g.stats = stats;
      if (m?.venue?.name) g.venue = [m.venue.name, m.venue.city].filter(Boolean).join(', ');
      // The game's video highlights (official channels on YouTube and the like), up to 3
      const hl = await get(l.base, `/highlights?matchId=${g.src.split(':')[1]}&limit=10`).catch(() => null);
      const vids = (hl?.data ?? []).filter((v) => v.url && (v.embedUrl || /youtu/.test(v.url))).slice(0, 3);
      if (vids.length) g.videos = vids.map((v) => ({ title: v.title, url: v.url, embed: v.embedUrl ?? '', img: v.imgUrl ?? '', channel: v.channel ?? '' }));
      g.statsChecked = true;
    } catch (e) { console.warn(`detalles de ${g.id}: ${e.message}`); }
  }
  if (details) console.log(`Detalles de ${details} juegos terminados`);

  // Keep the last 7 days of results and the next 7 days of games
  const keep = (g) => Math.abs(Date.parse(g.date) - Date.now()) < 7 * 864e5;
  const list = [...byKey.values()].filter(keep).sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  await fs.writeFile(GAMES_FILE, JSON.stringify([...list, { _checked: day() }], null, 2) + '\n');
  await fs.writeFile(TABLES_FILE, JSON.stringify(tables, null, 2) + '\n');
  await fs.writeFile(STATS_FILE, JSON.stringify(teamStats, null, 2) + '\n');
  console.log(`Listo: ${list.length} juegos guardados, ${calls} consultas.`);
}
main().catch((e) => { console.error(e); process.exit(1); });

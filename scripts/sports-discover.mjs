#!/usr/bin/env node
/**
 * One-time check of the Highlightly sports data account (run by .github/workflows/sports-discover.yml).
 * Finds which Puerto Rico leagues (and MLB, NBA, NFL) each sport API has, with their ids and seasons, and what the
 * account's plan allows. Writes the answers to scripts/sports-discovery.json (no key or secret is ever written).
 * Uses about 15 requests of the daily allowance.
 */
import fs from 'node:fs/promises';

const KEY = process.env.HIGHLIGHTLY_API_KEY;
if (!KEY) { console.error('Falta HIGHLIGHTLY_API_KEY (GitHub → Settings → Secrets → Actions).'); process.exit(1); }

// Each sport has its own API; the "All Sports" address is tried when the sport's own one isn't available on the plan
const SPORTS = {
  basketball: ['https://basketball.highlightly.net', 'https://sports.highlightly.net/basketball'],
  baseball: ['https://baseball.highlightly.net', 'https://sports.highlightly.net/baseball'],
  volleyball: ['https://volleyball.highlightly.net', 'https://sports.highlightly.net/volleyball'],
  'american-football': ['https://american-football.highlightly.net', 'https://sports.highlightly.net/american-football'],
};
const WANT = { basketball: ['NBA'], baseball: ['MLB'], volleyball: [], 'american-football': ['NFL'] };

async function call(base, path) {
  try {
    const r = await fetch(base + path, { headers: { 'x-rapidapi-key': KEY }, signal: AbortSignal.timeout(20000) });
    const text = await r.text();
    let body; try { body = JSON.parse(text); } catch { body = text.slice(0, 300); }
    return { status: r.status, body };
  } catch (e) { return { status: 0, body: String(e) }; }
}
const slim = (l) => ({ id: l.id, name: l.name, country: l.country?.name, seasons: (l.seasons || []).map((s) => s.season ?? s).slice(-3) });

const out = { checked: new Date().toISOString(), sports: {} };
for (const [sport, bases] of Object.entries(SPORTS)) {
  const res = { base: null, status: null, plan: null, puertoRico: [], other: [] };
  for (const base of bases) {
    const pr = await call(base, '/leagues?countryName=Puerto%20Rico&limit=100');
    res.status = pr.status;
    if (pr.status === 200 && Array.isArray(pr.body?.data)) {
      res.base = base; res.plan = pr.body.plan ?? null;
      res.puertoRico = pr.body.data.map(slim);
      for (const name of WANT[sport]) {
        const o = await call(base, `/leagues?leagueName=${encodeURIComponent(name)}&limit=10`);
        if (o.status === 200 && Array.isArray(o.body?.data)) res.other.push(...o.body.data.map(slim));
      }
      break;
    }
    res.error = typeof pr.body === 'string' ? pr.body : pr.body?.message ?? JSON.stringify(pr.body).slice(0, 300);
  }
  out.sports[sport] = res;
  console.log(sport, res.status, res.base ?? '(no disponible)', res.puertoRico.map((l) => l.name).join(', '));
}
await fs.writeFile(new URL('./sports-discovery.json', import.meta.url), JSON.stringify(out, null, 2) + '\n');

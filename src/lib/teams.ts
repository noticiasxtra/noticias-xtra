/* =========================================================
   Teams for the score cards: abbreviation and color, keyed by
   "<league id>:<name as written in the games>" (e.g. "bsn:Vaqueros").
   Colors are decorative; La Pro colors follow each team's logo. Adjust others as needed.
   La Pro team logos (public/logos/teams/invernal-*.png) come from the league's official site, ligapr.com.
   An official team logo can be added as public/logos/teams/<league>-<abbr>.png (lowercase),
   e.g. public/logos/teams/bsn-bay.png, and the card will use it instead of the badge.
   ========================================================= */

type Team = { abbr: string; color: string };

export const TEAMS: Record<string, Team> = {
  // La Pro (Liga de Béisbol Profesional Roberto Clemente)
  'invernal:Cangrejeros': { abbr: 'SAN', color: '#1B3F8B' },
  'invernal:Senadores': { abbr: 'SJ', color: '#E35205' },
  'invernal:Criollos': { abbr: 'CAG', color: '#C8202F' },
  'invernal:Indios': { abbr: 'MAY', color: '#7A1F2B' },
  'invernal:Leones': { abbr: 'PON', color: '#D52B1E' },
  'invernal:Gigantes': { abbr: 'CAR', color: '#1A1A1A' },
  // BSN
  'bsn:Vaqueros': { abbr: 'BAY', color: '#1D4F91' },
  'bsn:Santeros': { abbr: 'AGU', color: '#2E7D32' },
  'bsn:Capitanes': { abbr: 'ARE', color: '#B71C1C' },
  'bsn:Piratas': { abbr: 'QUE', color: '#212121' },
  'bsn:Mets': { abbr: 'GUA', color: '#F57C00' },
  'bsn:Atléticos': { abbr: 'SGE', color: '#1565C0' },
  'bsn:Leones': { abbr: 'PON', color: '#D4472A' },
  'bsn:Indios': { abbr: 'MAY', color: '#A6192E' },
  'bsn:Gigantes': { abbr: 'CAR', color: '#1F4E9C' },
  'bsn:Criollos': { abbr: 'CAG', color: '#E3A21A' },
  'bsn:Cangrejeros': { abbr: 'SAN', color: '#C8102E' },
  'bsn:Osos': { abbr: 'MAN', color: '#5D4037' },
  // Doble A
  'doble-a:Toritos': { abbr: 'CAY', color: '#C62828' },
  'doble-a:Grises': { abbr: 'HUM', color: '#616161' },
  'doble-a:Cariduros': { abbr: 'FAJ', color: '#0277BD' },
  'doble-a:Bravos': { abbr: 'CID', color: '#1B5E20' },
};

/** Abbreviation and color for a team, by short name ("Cangrejeros") or full name
    ("Cangrejeros de Santurce"); unknown teams get their first three letters in gray. */
export function team(league: string, name: string): Team {
  const short = name.split(' de ')[0].trim();
  const fallback = { abbr: short.normalize('NFD').replace(/\p{M}/gu, '').slice(0, 3).toUpperCase(), color: '#5C5F6E' };
  return TEAMS[`${league}:${name}`] ?? TEAMS[`${league}:${short}`] ?? fallback;
}

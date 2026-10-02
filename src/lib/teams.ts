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
  // LVSM (voleibol masculino, temporada 2026)
  'lvsm:Cafeteros': { abbr: 'YAU', color: '#6D4C41' },
  'lvsm:Patriotas': { abbr: 'LAR', color: '#C62828' },
  'lvsm:Plataneros': { abbr: 'COR', color: '#F9A825' },
  'lvsm:Changos': { abbr: 'NAR', color: '#2E7D32' },
  'lvsm:Gigantes de Adjuntas': { abbr: 'ADJ', color: '#1565C0' },
  'lvsm:Gigantes de Carolina': { abbr: 'CAR', color: '#1A1A1A' },
  // LVSF (voleibol femenino; equipos confirmados en comunicados de la FPV)
  'lvsf:Cangrejeras': { abbr: 'SAN', color: '#1B3F8B' },
  'lvsf:Leonas': { abbr: 'PON', color: '#D52B1E' },
  'lvsf:Criollas': { abbr: 'CAG', color: '#C8202F' },
  'lvsf:Valencianas': { abbr: 'JUN', color: '#00897B' },
  // Doble A (45 equipos; nombres y logos del sitio oficial, beisboldobleapr.com)
  'doble-a:Artesanos de Las Piedras': { abbr: 'LPI', color: '#0B11CE' },
  'doble-a:Cariduros de Fajardo': { abbr: 'FAJ', color: '#0B080D' },
  'doble-a:Mulos del Valenciano de Juncos': { abbr: 'JUN', color: '#F90103' },
  'doble-a:Guerrilleros de Río Grande': { abbr: 'RGR', color: '#090606' },
  'doble-a:Cocoteros de Loíza': { abbr: 'LOI', color: '#0C0705' },
  'doble-a:Halcones de Gurabo': { abbr: 'GUR', color: '#090909' },
  'doble-a:Azucareros de Yabucoa': { abbr: 'YAB', color: '#3B3B3B' },
  'doble-a:Jueyeros de Maunabo': { abbr: 'MAU', color: '#096867' },
  'doble-a:Leones de Patillas': { abbr: 'PAT', color: '#B52B34' },
  'doble-a:Grises de Humacao': { abbr: 'HUM', color: '#ED1F24' },
  'doble-a:Samaritanos de San Lorenzo': { abbr: 'SLO', color: '#0D2341' },
  'doble-a:Toritos de Cayey': { abbr: 'CAY', color: '#070504' },
  'doble-a:Pescadores del Plata de Comerío': { abbr: 'COM', color: '#05372E' },
  'doble-a:Criollos de Caguas': { abbr: 'CAG', color: '#C8202F' },
  'doble-a:Bravos de Cidra': { abbr: 'CID', color: '#F60605' },
  'doble-a:Próceres de Barranquitas': { abbr: 'BQS', color: '#0B1A4E' },
  'doble-a:Polluelos de Aibonito': { abbr: 'AIB', color: '#142A4C' },
  'doble-a:Arenosos de Camuy': { abbr: 'CAM', color: '#3D81D0' },
  'doble-a:Tigres de Hatillo': { abbr: 'HAT', color: '#092950' },
  'doble-a:Atenienses de Manatí': { abbr: 'MAN', color: '#E31F25' },
  'doble-a:Titanes de Florida': { abbr: 'FLO', color: '#011133' },
  'doble-a:Industriales de Barceloneta': { abbr: 'BAR', color: '#840808' },
  'doble-a:Montañeses de Utuado': { abbr: 'UTU', color: '#0C0A31' },
  'doble-a:Guardianes de Dorado': { abbr: 'DOR', color: '#BAA05B' },
  'doble-a:Gigantes de Carolina': { abbr: 'CAR', color: '#FDD130' },
  'doble-a:Lancheros de Cataño': { abbr: 'CAT', color: '#011C3C' },
  'doble-a:Maceteros de Vega Alta': { abbr: 'VAL', color: '#ED1B27' },
  'doble-a:Mets de Guaynabo': { abbr: 'GNB', color: '#FA8E38' },
  'doble-a:Melao Melao de Vega Baja': { abbr: 'VBA', color: '#0C3026' },
  'doble-a:Patrulleros de San Sebastián': { abbr: 'SSE', color: '#030202' },
  'doble-a:Libertadores de Hormigueros': { abbr: 'HOR', color: '#2D2F32' },
  'doble-a:Tiburones de Aguadilla': { abbr: 'AGD', color: '#293475' },
  'doble-a:Fundadores de Añasco': { abbr: 'ANA', color: '#2E4612' },
  'doble-a:Navegantes de Aguada': { abbr: 'AGU', color: '#022F62' },
  'doble-a:Poetas de Juana Díaz': { abbr: 'JDI', color: '#030201' },
  'doble-a:Brujos de Guayama': { abbr: 'GMA', color: '#1B1936' },
  'doble-a:Maratonistas de Coamo': { abbr: 'COA', color: '#040201' },
  'doble-a:Peces Voladores de Salinas': { abbr: 'SAL', color: '#0E100F' },
  'doble-a:Potros de Santa Isabel': { abbr: 'SIS', color: '#6C0604' },
  'doble-a:Cachorros de Ponce': { abbr: 'PON', color: '#D52B1E' },
  'doble-a:Petateros de Sabana Grande': { abbr: 'SGR', color: '#060433' },
  'doble-a:Petroleros de Peñuelas': { abbr: 'PEN', color: '#333333' },
  'doble-a:Cafeteros de Yauco': { abbr: 'YAU', color: '#070706' },
  'doble-a:Piratas de Cabo Rojo': { abbr: 'CRJ', color: '#221351' },
  'doble-a:Cardenales de Lajas': { abbr: 'LAJ', color: '#231F20' },
};

/** Abbreviation and color for a team, by short name ("Cangrejeros") or full name
    ("Cangrejeros de Santurce"); unknown teams get their first three letters in gray. */
export function team(league: string, name: string): Team {
  const short = name.split(' de ')[0].trim();
  const fallback = { abbr: short.normalize('NFD').replace(/\p{M}/gu, '').slice(0, 3).toUpperCase(), color: '#5C5F6E' };
  return TEAMS[`${league}:${name}`] ?? TEAMS[`${league}:${short}`] ?? fallback;
}

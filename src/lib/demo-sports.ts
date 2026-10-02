/* =========================================================
   DEMO sports data (scores, standings, team stats, brackets, game pages).
   Used only while SITE.sportsDemo is true (src/lib/site.ts). Every place that
   shows it labels it "DEMO". Results are invented; no player names are used.
   Dates are built relative to today so the demo always looks current.
   ========================================================= */
import type { Game, Standings, Bracket, TeamStats } from './scores';

// "YYYY-MM-DDTHH:MM:00-04:00" for today + `days` in Puerto Rico
function at(days: number, time: string): string {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Puerto_Rico' });
  const d = new Date(`${today}T12:00:00-04:00`);
  d.setUTCDate(d.getUTCDate() + days);
  return `${d.toISOString().slice(0, 10)}T${time}:00-04:00`;
}

const inningLabels = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export const DEMO_GAMES: Game[] = [
  // La Pro (Liga de Béisbol Profesional Roberto Clemente): six real teams and stadiums, invented results
  {
    id: 'demo-lbprc-1', demo: true, league: 'invernal', status: 'en-vivo', note: 'Alta 7ma',
    date: at(0, '19:21'), away: 'Cangrejeros', home: 'Criollos', awayScore: 3, homeScore: 2,
    awayFull: 'Cangrejeros de Santurce', homeFull: 'Criollos de Caguas', venue: 'Estadio Yldefonso Solá Morales, Caguas',
    awayRecord: '12-6', homeRecord: '11-7',
    linescore: { labels: inningLabels, away: [0, 1, 0, 0, 2, 0, 0, '', ''], home: [1, 0, 0, 1, 0, 0, '', '', ''], totals: ['C', 'H', 'E'], awayTotals: [3, 7, 0], homeTotals: [2, 6, 1] },
    stats: [
      { label: 'Hits', away: '7', home: '6' }, { label: 'Jonrones', away: '1', home: '0' },
      { label: 'Bases por bolas', away: '3', home: '2' }, { label: 'Ponches', away: '5', home: '8' },
      { label: 'Errores', away: '0', home: '1' }, { label: 'Corredores dejados en base', away: '5', home: '4' },
    ],
    plays: [
      { when: 'Alta 7ma', text: 'Santurce tiene corredor en primera con un out.' },
      { when: 'Baja 6ta', text: 'Caguas deja dos corredores en base tras un elevado al jardín central.' },
      { when: 'Alta 5ta', text: 'Jonrón de dos carreras al jardín izquierdo pone arriba a Santurce, 3-2.' },
      { when: 'Baja 4ta', text: 'Doble al jardín derecho empuja la segunda carrera de Caguas.' },
      { when: 'Alta 2da', text: 'Sencillo productor empata el juego 1-1.' },
      { when: 'Baja 1ra', text: 'Caguas anota primero con un elevado de sacrificio.' },
    ],
  },
  {
    id: 'demo-lbprc-2', demo: true, league: 'invernal', status: 'final', note: '10 entradas',
    date: at(0, '16:21'), away: 'Indios', home: 'Leones', awayScore: 5, homeScore: 4,
    awayFull: 'Indios de Mayagüez', homeFull: 'Leones de Ponce', venue: 'Estadio Francisco "Paquito" Montaner, Ponce',
    awayRecord: '9-9', homeRecord: '8-10',
    linescore: { labels: [...inningLabels, '10'], away: [0, 0, 2, 0, 0, 1, 0, 1, 0, 1], home: [1, 0, 0, 0, 2, 0, 0, 0, 1, 0], totals: ['C', 'H', 'E'], awayTotals: [5, 11, 1], homeTotals: [4, 9, 0] },
    stats: [
      { label: 'Hits', away: '11', home: '9' }, { label: 'Jonrones', away: '0', home: '1' },
      { label: 'Bases por bolas', away: '4', home: '3' }, { label: 'Ponches', away: '9', home: '7' },
      { label: 'Errores', away: '1', home: '0' }, { label: 'Corredores dejados en base', away: '10', home: '6' },
    ],
    plays: [
      { when: 'Baja 10ma', text: 'Rodado a segunda termina el juego. Mayagüez gana 5-4.' },
      { when: 'Alta 10ma', text: 'Sencillo al jardín central impulsa la carrera de la ventaja para Mayagüez.' },
      { when: 'Baja 9na', text: 'Ponce empata 4-4 con un doble al jardín izquierdo.' },
      { when: 'Alta 8va', text: 'Mayagüez se va arriba 4-3 con un toque de sacrificio.' },
    ],
  },
  {
    id: 'demo-lbprc-3', demo: true, league: 'invernal', status: 'programado',
    date: at(1, '19:21'), away: 'Senadores', home: 'Gigantes', awayFull: 'Senadores de San Juan', homeFull: 'Gigantes de Carolina',
    venue: 'Estadio Roberto Clemente Walker, Carolina', awayRecord: '10-8', homeRecord: '4-14',
  },
  {
    id: 'demo-lbprc-4', demo: true, league: 'invernal', status: 'programado',
    date: at(2, '19:21'), away: 'Criollos', home: 'Indios', awayFull: 'Criollos de Caguas', homeFull: 'Indios de Mayagüez',
    venue: 'Estadio Isidoro "Cholo" García, Mayagüez', awayRecord: '11-7', homeRecord: '9-9',
  },
  // BSN
  {
    id: 'demo-bsn-1', demo: true, league: 'bsn', status: 'en-vivo', note: '4to parcial · 3:12',
    date: at(0, '20:00'), away: 'Santeros', home: 'Vaqueros', awayScore: 74, homeScore: 78,
    awayFull: 'Santeros de Aguada', homeFull: 'Vaqueros de Bayamón', venue: 'Coliseo Rubén Rodríguez, Bayamón',
    awayRecord: '20-12', homeRecord: '22-10',
    linescore: { labels: ['1', '2', '3', '4'], away: [19, 22, 18, 15], home: [21, 18, 20, 19], totals: ['T'], awayTotals: [74], homeTotals: [78] },
    stats: [
      { label: 'Tiros de campo', away: '28-61 (45.9%)', home: '29-58 (50.0%)' }, { label: 'Triples', away: '8-24', home: '7-19' },
      { label: 'Tiros libres', away: '10-13', home: '13-16' }, { label: 'Rebotes', away: '33', home: '37' },
      { label: 'Asistencias', away: '16', home: '19' }, { label: 'Pérdidas de balón', away: '11', home: '9' },
    ],
    plays: [
      { when: '4to · 3:12', text: 'Tiempo pedido por Aguada. Bayamón arriba por cuatro.' },
      { when: '4to · 3:40', text: 'Triple desde la esquina para Bayamón, 78-74.' },
      { when: '4to · 5:05', text: 'Aguada empata 72-72 con una bandeja en contraataque.' },
      { when: '3ro · 0:00', text: 'El tercer parcial termina empatado 59-59.' },
    ],
  },
  {
    id: 'demo-bsn-2', demo: true, league: 'bsn', status: 'final',
    date: at(-1, '20:00'), away: 'Piratas', home: 'Capitanes', awayScore: 88, homeScore: 91,
    awayFull: 'Piratas de Quebradillas', homeFull: 'Capitanes de Arecibo', venue: 'Coliseo Manuel "Petaca" Iguina, Arecibo',
    awayRecord: '18-14', homeRecord: '19-13',
    linescore: { labels: ['1', '2', '3', '4'], away: [22, 20, 25, 21], home: [18, 26, 22, 25], totals: ['T'], awayTotals: [88], homeTotals: [91] },
    stats: [
      { label: 'Tiros de campo', away: '32-70 (45.7%)', home: '33-66 (50.0%)' }, { label: 'Triples', away: '11-30', home: '9-24' },
      { label: 'Tiros libres', away: '13-17', home: '16-20' }, { label: 'Rebotes', away: '35', home: '40' },
      { label: 'Asistencias', away: '18', home: '21' }, { label: 'Pérdidas de balón', away: '12', home: '10' },
    ],
    plays: [
      { when: 'Final', text: 'Arecibo resiste en el último minuto y gana 91-88.' },
      { when: '4to · 0:24', text: 'Dos tiros libres de Arecibo para la ventaja de tres.' },
    ],
  },
  {
    id: 'demo-bsn-3', demo: true, league: 'bsn', status: 'programado',
    date: at(1, '20:00'), away: 'Mets', home: 'Atléticos', awayFull: 'Mets de Guaynabo', homeFull: 'Atléticos de San Germán',
    venue: 'Coliseo Arquelio Torres Ramírez, San Germán', awayRecord: '14-18', homeRecord: '16-16',
  },
];

const s = (team: string, w: number, l: number, gb: string, l10: string, streak: string) => ({ team, w, l, gb, extra: [l10, streak] });

export const DEMO_STANDINGS: Record<string, Standings> = {
  invernal: {
    groups: [{ columns: ['ÚLT. 10', 'RACHA'], rows: [
      s('Cangrejeros de Santurce', 12, 6, '—', '7-3', 'G3'), s('Criollos de Caguas', 11, 7, '1.0', '6-4', 'P1'),
      s('Senadores de San Juan', 10, 8, '2.0', '6-4', 'G1'), s('Indios de Mayagüez', 9, 9, '3.0', '5-5', 'G2'),
      s('Leones de Ponce', 8, 10, '4.0', '4-6', 'P2'), s('Gigantes de Carolina', 4, 14, '8.0', '2-8', 'P4'),
    ] }],
  },
  bsn: {
    groups: [
      { name: 'Sección A', columns: ['ÚLT. 10', 'RACHA'], rows: [
        s('Vaqueros de Bayamón', 22, 10, '—', '8-2', 'G4'), s('Capitanes de Arecibo', 19, 13, '3.0', '6-4', 'G1'),
        s('Cangrejeros de Santurce', 17, 15, '5.0', '5-5', 'P1'), s('Mets de Guaynabo', 14, 18, '8.0', '4-6', 'P2'),
        s('Criollos de Caguas', 13, 19, '9.0', '3-7', 'P3'), s('Gigantes de Carolina', 12, 20, '10.0', '4-6', 'G1'),
      ] },
      { name: 'Sección B', columns: ['ÚLT. 10', 'RACHA'], rows: [
        s('Santeros de Aguada', 20, 12, '—', '7-3', 'P1'), s('Piratas de Quebradillas', 18, 14, '2.0', '6-4', 'P1'),
        s('Atléticos de San Germán', 16, 16, '4.0', '5-5', 'G2'), s('Indios de Mayagüez', 15, 17, '5.0', '5-5', 'G1'),
        s('Leones de Ponce', 14, 18, '6.0', '4-6', 'P2'), s('Osos de Manatí', 11, 21, '9.0', '2-8', 'P5'),
      ] },
    ],
  },
};

export const DEMO_STATS: Record<string, TeamStats> = {
  invernal: { columns: ['PRO', 'HR', 'CA', 'EFE'], rows: [
    { team: 'Cangrejeros de Santurce', values: ['.271', '18', '96', '3.21'] }, { team: 'Criollos de Caguas', values: ['.265', '15', '88', '3.45'] },
    { team: 'Senadores de San Juan', values: ['.261', '13', '84', '3.70'] }, { team: 'Indios de Mayagüez', values: ['.258', '12', '81', '3.88'] },
    { team: 'Leones de Ponce', values: ['.249', '14', '77', '4.02'] }, { team: 'Gigantes de Carolina', values: ['.237', '9', '61', '4.66'] },
  ] },
  bsn: { columns: ['PPJ', 'REB', 'AST', '% TC'], rows: [
    { team: 'Vaqueros de Bayamón', values: ['92.4', '39.1', '20.3', '48.9'] }, { team: 'Santeros de Aguada', values: ['90.8', '37.6', '19.1', '47.5'] },
    { team: 'Capitanes de Arecibo', values: ['89.7', '38.4', '18.8', '47.0'] }, { team: 'Piratas de Quebradillas', values: ['88.2', '36.9', '19.7', '46.4'] },
    { team: 'Atléticos de San Germán', values: ['86.5', '36.2', '17.9', '45.8'] }, { team: 'Cangrejeros de Santurce', values: ['86.1', '35.8', '18.2', '45.1'] },
  ] },
};

export const DEMO_BRACKETS: Record<string, Bracket> = {
  bsn: { name: 'Postemporada', rounds: [
    { name: 'Semifinal A', series: [{ a: 'Vaqueros de Bayamón', b: 'Capitanes de Arecibo', aWins: 3, bWins: 1 }] },
    { name: 'Semifinal B', series: [{ a: 'Santeros de Aguada', b: 'Piratas de Quebradillas', aWins: 2, bWins: 2, note: 'Juego 5 el sábado' }] },
    { name: 'Final', series: [{ a: 'Vaqueros de Bayamón', b: 'Por definir' }] },
  ] },
};

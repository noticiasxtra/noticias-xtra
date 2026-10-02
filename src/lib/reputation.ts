// Commenter reputation (separate from Juegos Xtra points). Hard to farm on purpose:
//  - only comments with real text count (40+ characters, stickers/short replies don't), and only 5 a day
//  - likes from OTHER readers count most; an editor's "Destacado" counts a lot; reports cost points
//  - each level needs points AND time AND likes; Top comentarista also needs no reports in 90 days
// DEMO: until accounts exist this is kept in the reader's browser (localStorage 'nx-rep'), so likes from others and
// editor picks can't arrive yet; the rules below are the ones the real version will use.

export type Rep = {
  points: number;
  comments: number;
  likes: number; // likes received from other readers
  featured: number; // comments marked "Destacado" by the newsroom
  days: string[]; // days with a counted comment (YYYY-MM-DD, Puerto Rico)
  daily: Record<string, number>; // counted comments per day
  awarded: Record<string, number>; // comment id → points given (so deleting takes them back)
  reports: number[]; // times a comment was reported and hidden
};

export const RULES = {
  minChars: 40, perDay: 5, comment: 2, reply: 3, like: 5, featured: 50, report: -30,
};
export const LEVELS = [
  { id: 'nuevo', name: 'Nuevo', points: 0, days: 0, likes: 0 },
  { id: 'participante', name: 'Participante', points: 30, days: 0, likes: 0 },
  { id: 'comentarista', name: 'Comentarista', points: 150, days: 7, likes: 0 },
  { id: 'voz', name: 'Voz de la comunidad', points: 500, days: 30, likes: 25 },
  { id: 'top', name: 'Top comentarista', points: 1500, days: 60, likes: 100, cleanDays: 90 },
] as const;
export type LevelId = (typeof LEVELS)[number]['id'];

const KEY = 'nx-rep';
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Puerto_Rico' });
const empty = (): Rep => ({ points: 0, comments: 0, likes: 0, featured: 0, days: [], daily: {}, awarded: {}, reports: [] });

export function getRep(): Rep {
  try { return { ...empty(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return empty(); }
}
function save(r: Rep) { try { localStorage.setItem(KEY, JSON.stringify(r)); } catch { /* storage blocked */ } dispatchEvent(new CustomEvent('nx-rep')); }

/** Letters only (no emoji, spaces or @mentions) decide if a comment has real text. */
const realChars = (text: string) => text.replace(/@\S+/g, '').replace(/[^\p{L}\p{N}]/gu, '').length;

/** Points for a new comment (0 if too short or over today's limit). */
export function addComment(id: string, text: string, isReply: boolean): { pts: number; why: string } {
  const r = getRep();
  r.comments++;
  const d = today();
  let pts = 0, why = '';
  if (realChars(text) < RULES.minChars * 0.75) why = `Escribe al menos ${RULES.minChars} caracteres para sumar puntos.`;
  else if ((r.daily[d] ?? 0) >= RULES.perDay) why = `Ya sumaste puntos por ${RULES.perDay} comentarios hoy.`;
  else {
    pts = isReply ? RULES.reply : RULES.comment;
    r.daily = { [d]: (r.daily[d] ?? 0) + 1 }; // keep only today
    if (!r.days.includes(d)) r.days = [...r.days, d].slice(-400);
    r.awarded[id] = pts; r.points += pts;
    why = `+${pts} de reputación`;
  }
  save(r);
  return { pts, why };
}
/** Deleting your own comment takes its points back. */
export function removeComment(id: string) {
  const r = getRep();
  if (r.awarded[id]) { r.points = Math.max(0, r.points - r.awarded[id]); delete r.awarded[id]; }
  r.comments = Math.max(0, r.comments - 1);
  save(r);
}

const cleanFor = (r: Rep, days: number) => !r.reports.some((t) => Date.now() - t < days * 864e5);
/** The highest level whose requirements are all met. */
export function levelOf(r: Rep) {
  let i = 0;
  LEVELS.forEach((l, k) => {
    const ok = r.points >= l.points && r.days.length >= l.days && r.likes >= l.likes && (!('cleanDays' in l) || cleanFor(r, l.cleanDays));
    if (ok && k === i + 1) i = k;
  });
  return { ...LEVELS[i], index: i, next: LEVELS[i + 1] };
}
/** Requirements for a level, each with progress (for the "¿Cómo subo?" panel). */
export function needs(r: Rep, l: (typeof LEVELS)[number]) {
  const list = [
    { label: `${l.points.toLocaleString('es-PR')} puntos`, have: r.points, need: l.points },
    ...(l.days ? [{ label: `Comentar en ${l.days} días distintos`, have: r.days.length, need: l.days }] : []),
    ...(l.likes ? [{ label: `${l.likes} Me gusta de otros lectores`, have: r.likes, need: l.likes }] : []),
  ];
  return 'cleanDays' in l ? [...list, { label: `Sin reportes en ${l.cleanDays} días`, have: cleanFor(r, l.cleanDays) ? 1 : 0, need: 1 }] : list;
}

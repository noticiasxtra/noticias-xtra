// Reader notifications: someone tagged you (@name), liked or replied to your comment, you earned a badge or level,
// or the newsroom decided on a comment of yours. Shown as a dot on the profile icon, in the profile menu and on /perfil.
// PREVIEW: kept in this browser (localStorage 'nx-notifs'). Notifications that come from other readers need accounts
// (Supabase); until then badges, levels and moderation notices are real, and other readers' are examples (EJEMPLO).

export type NotifKind = 'mention' | 'reply' | 'like' | 'badge' | 'mod';
export type Notif = { id: string; at: number; kind: NotifKind; who?: string; text: string; quote?: string; url?: string; read?: boolean; demo?: boolean };

export const KINDS: Array<{ id: NotifKind; name: string; desc: string }> = [
  { id: 'mention', name: 'Menciones', desc: 'Cuando alguien escribe @tu_nombre en un comentario.' },
  { id: 'reply', name: 'Respuestas', desc: 'Cuando alguien responde a tu comentario.' },
  { id: 'like', name: 'Me gusta', desc: 'Cuando a alguien le gusta tu comentario.' },
  { id: 'badge', name: 'Insignias y niveles', desc: 'Cuando subes de nivel en comentarios o en Juegos Xtra.' },
  { id: 'mod', name: 'Moderación', desc: 'Cuando la redacción revisa un comentario tuyo.' },
];

const KEY = 'nx-notifs', PREFS = 'nx-notif-prefs';
const read = <T,>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? d; } catch { return d; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } };

export const getNotifs = (): Notif[] => read<Notif[]>(KEY, []).sort((a, b) => b.at - a.at);
export const unreadCount = () => getNotifs().filter((n) => !n.read).length;
export const getPrefs = (): Record<NotifKind, boolean> => ({ mention: true, reply: true, like: true, badge: true, mod: true, ...read(PREFS, {}) });
export const setPrefs = (p: Record<NotifKind, boolean>) => write(PREFS, p);

const changed = (added?: Notif) => dispatchEvent(new CustomEvent('nx-notifs', { detail: { added } }));

/** Adds a notification unless the reader turned that kind off, or the same id already exists. */
export function notify(n: Omit<Notif, 'at'> & { at?: number }) {
  if (!getPrefs()[n.kind]) return;
  const list = getNotifs();
  if (list.some((x) => x.id === n.id)) return;
  const full: Notif = { at: Date.now(), ...n };
  write(KEY, [full, ...list].slice(0, 60));
  changed(full);
}
export function markRead(id?: string) {
  write(KEY, getNotifs().map((n) => (!id || n.id === id ? { ...n, read: true } : n)));
  changed();
}
export function clearNotifs() { write(KEY, []); changed(); }

/** Example notifications from other readers, added once so the preview shows what they look like. */
export function seedExamples(storyUrl: string, gameUrl: string) {
  try { if (localStorage.getItem('nx-notif-seeded')) return; localStorage.setItem('nx-notif-seeded', '1'); } catch { return; }
  let me = 'tú'; try { me = JSON.parse(localStorage.getItem('nx-profile') || '{}').name || me; } catch { /* storage blocked */ }
  const now = Date.now();
  [
    { id: 'ej-like', kind: 'like', who: 'lectora_bayamon', text: 'y 4 más les gustó tu comentario.', quote: 'Esto hay que seguirlo de cerca…', url: storyUrl, at: now - 40 * 60000 },
    { id: 'ej-mention', kind: 'mention', who: 'jose.boricua', text: 'te mencionó en un comentario.', quote: `@${me} tienes toda la razón, hay que pedir vistas públicas.`, url: storyUrl, at: now - 3 * 36e5 },
    { id: 'ej-reply', kind: 'reply', who: 'tito_domino', text: 'respondió a tu comentario en Dominó.', quote: '¡Te reto a una partida hoy!', url: gameUrl, at: now - 26 * 36e5 },
  ].forEach((n) => notify({ ...(n as Notif), demo: true }));
}

/** "hace 5 min" style time. */
export const ago = (t: number) => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'ahora' : m < 60 ? `hace ${m} min` : m < 1440 ? `hace ${Math.round(m / 60)} h` : `hace ${Math.round(m / 1440)} d`; };

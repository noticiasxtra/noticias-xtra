// "Redactar con IA" (panel → Escribir, admin only): calls the "redactar-ia" Edge Function and reads the admin-only log
// (supabase/ai-drafts.sql). The function writes a draft; it never publishes. Publishing is the usual "publicar" flow.
import { BACKEND, freshToken, staffApi } from './backend';

export type AiSource = { url: string; outlet: string; title: string; author: string; date: string; text: string; words: number; links: Array<{ name: string; url: string }>; pasted?: boolean; auto?: boolean };
export type AiFact = { tipo: string; hecho: string; cita: string; quien: string; fuentes: number[]; medios: string[]; exclusivo: string };
export type AiPhoto = { provider: 'biblioteca' | 'wikimedia' | 'pexels' | 'unsplash'; src: string; thumb: string; about: string; author: string; license: string; credit: string; creditUrl: string; downloadLocation?: string; caption?: string; why?: string };
export type AiStory = { title: string; description: string; section: string; league: string; place: string; body: string; words: number; related: string[]; sources: Array<{ name: string; url?: string }> };
export type AiGen = { id: string; created_at: string; created_by_name: string; urls: string[]; sources: AiSource[]; notes: string; independent: boolean; warnings: string[];
  facts: { hechos: AiFact[]; oficiales: Array<{ name: string; url?: string }> } | null; story: AiStory | null; overlap: number | null; overlap_spans: string[]; photo_options: AiPhoto[];
  suggestions: string[]; article_id: string | null; status: 'started' | 'review' | 'published' | 'rejected'; decided_by: string | null; decided_at: string | null };
export type AiOutlet = { domain: string; name: string; permission: string; added_by: string; added_at: string };

/** One step of the Edge Function: fetch, facts, write, photos, unsplash. Errors come back in Spanish. */
export async function callAi<T = any>(action: string, payload: Record<string, unknown> = {}): Promise<T & { error?: string }> {
  const token = await freshToken(); if (!token) return { error: 'Tu sesión venció. Sal y vuelve a entrar al panel.' } as T & { error: string };
  try {
    const r = await fetch(`${BACKEND.url.replace(/\/$/, '')}/functions/v1/redactar-ia`, {
      method: 'POST', headers: { apikey: BACKEND.anonKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...payload }),
    });
    if (r.status === 404) return { error: 'Falta instalar la función “redactar-ia” en Supabase.' } as T & { error: string };
    const out = await r.json().catch(() => ({}));
    return r.ok ? out : { error: out.error || out.message || `Error ${r.status}` };
  } catch { return { error: 'No hay conexión. Intenta otra vez.' } as T & { error: string }; }
}

export async function getGen(id: string): Promise<AiGen | null> {
  const r = await staffApi(`ai_generations?id=eq.${encodeURIComponent(id)}&select=*`);
  return r?.ok ? ((await r.json())[0] ?? null) : null;
}
export async function patchGen(id: string, patch: Partial<AiGen>): Promise<boolean> {
  const r = await staffApi(`ai_generations?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch) });
  return !!r?.ok;
}
/** A rejected story: the log keeps only its title, links, who and when; the text, facts and source texts are erased. */
export const wipe = (title: string, by: string): Partial<AiGen> => ({ status: 'rejected', article_id: null, decided_by: by, decided_at: new Date().toISOString(),
  story: { title } as unknown as AiStory, facts: null, sources: [], photo_options: [], overlap_spans: [], suggestions: [] });
/** The last generations (the log: who, when, which sources, what happened). */
export async function listGens(limit = 30): Promise<AiGen[]> {
  const r = await staffApi(`ai_generations?select=id,created_at,created_by_name,urls,status,decided_by,decided_at,title:story->>title&order=created_at.desc&limit=${limit}`);
  return r?.ok ? r.json() : [];
}

export async function listOutlets(): Promise<AiOutlet[] | null> {
  const r = await staffApi('ai_outlets?select=*&order=name');
  return r?.ok ? r.json() : null;
}
export async function addOutlet(o: { domain: string; name: string; permission: string; added_by: string }): Promise<string | null> {
  const r = await staffApi('ai_outlets', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify(o) });
  return r?.ok ? null : 'No se pudo guardar el medio. Revisa el dominio (ej. noticel.com).';
}
export async function removeOutlet(domain: string): Promise<boolean> {
  const r = await staffApi(`ai_outlets?domain=eq.${encodeURIComponent(domain)}`, { method: 'DELETE' });
  return !!r?.ok;
}

/* Copy check, same rules as the Edge Function (supabase/functions/redactar-ia/index.ts → overlap): the story's words in
   runs of 8+ words that also appear in a source, quotes aside. Used to check again after the editor changes the text. */
const norm = (w: string) => w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
const toks = (s: string) => s.split(/\s+/).map(norm).filter(Boolean);
const grams = (t: string[], n: number) => { const s = new Set<string>(); for (let i = 0; i + n <= t.length; i++) s.add(t.slice(i, i + n).join(' ')); return s; };
export function overlap(story: string, sources: string[], run = 8) {
  const raw = story.replace(/[“"«][^”"»]{1,400}[”"»]/g, ' ¶ ').split(/\s+/).filter(Boolean); const t = raw.map(norm);
  const keep = t.map((w, i) => ({ w, i })).filter((x) => x.w && raw[x.i] !== '¶');
  const src = new Set<string>(); sources.forEach((s) => grams(toks(s), run).forEach((g) => src.add(g)));
  const hit = new Array(keep.length).fill(false);
  for (let i = 0; i + run <= keep.length; i++) {
    if (keep[i + run - 1].i - keep[i].i !== run - 1) continue;
    if (src.has(keep.slice(i, i + run).map((x) => x.w).join(' '))) for (let k = i; k < i + run; k++) hit[k] = true;
  }
  const spans: string[] = []; let cur: string[] = [];
  keep.forEach((x, k) => { if (hit[k]) cur.push(raw[x.i]); else if (cur.length) { spans.push(cur.join(' ')); cur = []; } });
  if (cur.length) spans.push(cur.join(' '));
  return { score: keep.length ? Math.round((hit.filter(Boolean).length / keep.length) * 1000) / 10 : 0, spans };
}

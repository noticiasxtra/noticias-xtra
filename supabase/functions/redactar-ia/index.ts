// Supabase Edge Function "redactar-ia": the admin pastes 3 articles about the same news (panel → Escribir → ✨ Redactar
// con IA) and this writes ONE original Noticias Xtra story from their facts. It NEVER publishes: it has no GitHub key.
// The panel saves the result in `articles` with status 'review' and only a person publishes it (function "publicar").
//
// Steps (the panel calls them one by one, so no call runs too long):
//   fetch   read the 3 pages: only authorized outlets (table ai_outlets), robots.txt respected, text only (never images)
//   facts   check the sources are independent, then AI step 1 lists the facts and tags each with its outlet(s)
//   write   AI step 2 writes the story from the fact list ONLY (it never sees the articles), then the copy check:
//           8+ words in a row matching a source (quotes aside) get rewritten once, and whatever remains is flagged
//   photos  own photo library → Wikimedia Commons (free licenses only) → Pexels → Unsplash; AI looks at the
//           candidates and keeps up to 3 that really fit, with a Spanish caption
//   unsplash  tells Unsplash a photo was chosen (their API rules)
//
// Deploy: Supabase → Edge Functions → Deploy a new function → Via Editor → name "redactar-ia" → paste this file.
// Secrets (Edge Functions → Secrets): ANTHROPIC_API_KEY (required), PEXELS_API_KEY and UNSPLASH_ACCESS_KEY (optional:
// without them those photo sources are skipped). Optional: ANTHROPIC_MODEL. SUPABASE_URL, SUPABASE_ANON_KEY and
// SUPABASE_SERVICE_ROLE_KEY are built in. Run supabase/ai-drafts.sql first.

const SITE = 'https://publisher-noticel.github.io/noticias-xtra';
const UA = 'NoticiasXtraBot/1.0 (+https://publisher-noticel.github.io/noticias-xtra/)';
const SECTIONS = ['puerto-rico', 'politica', 'gobierno', 'estados-unidos', 'mundo', 'economia', 'deportes', 'entretenimiento', 'clima', 'salud']; // never 'opinion'
const SECTION_NAMES: Record<string, string> = { 'puerto-rico': 'Puerto Rico', politica: 'Política', gobierno: 'Gobierno', 'estados-unidos': 'Estados Unidos', mundo: 'Mundo', economia: 'Economía', deportes: 'Deportes', entretenimiento: 'Entretenimiento', clima: 'Clima', salud: 'Salud' };
const LEAGUES: Record<string, string> = { bsn: 'BSN (baloncesto)', 'doble-a': 'Doble A (béisbol)', invernal: 'La Pro / Liga Roberto Clemente (béisbol)', lvsm: 'Voleibol Superior Masculino', lvsf: 'Voleibol Superior Femenino', boxeo: 'Boxeo', tenis: 'Tenis', mlb: 'Grandes Ligas (MLB)', nba: 'NBA', nfl: 'NFL' };
const RUN = 8; // words in a row that count as copying

const env = (k: string): string | undefined => (globalThis as any).Deno?.env.get(k) ?? (globalThis as any).process?.env[k];
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
class Oops extends Error { status: number; constructor(msg: string, status = 400) { super(msg); this.status = status; } }

/* ---------------- text helpers ---------------- */
const ENT: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', laquo: '«', raquo: '»', ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’', ndash: '–', mdash: '—', hellip: '…', aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', ntilde: 'ñ', Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú', Ntilde: 'Ñ', uuml: 'ü', iexcl: '¡', iquest: '¿' };
export const decode = (s: string) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => e[0] === '#' ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : ENT[e] ?? m);
const strip = (html: string) => decode(html.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
export const words = (s: string) => (s.match(/[\p{L}\p{N}][\p{L}\p{N}'’.,%$-]*/gu) || []).length;
const norm = (w: string) => w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
const toks = (s: string) => s.split(/\s+/).map(norm).filter(Boolean);
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const host = (u: string) => { try { return new URL(u).hostname.toLowerCase().replace(/^www\./, ''); } catch { return ''; } };

/* ---------------- 1. reading a page ---------------- */
/** robots.txt: rules for our bot or for everyone; true = this path may be read. */
export function robotsAllows(txt: string, path: string, agent = 'noticiasxtrabot'): boolean {
  const groups: Array<{ agents: string[]; rules: Array<[boolean, string]> }> = [];
  let g: { agents: string[]; rules: Array<[boolean, string]> } | null = null, lastWasAgent = false;
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim(); const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i); if (!m) continue;
    const k = m[1].toLowerCase(), v = m[2].trim();
    if (k === 'user-agent') { if (!g || !lastWasAgent) { g = { agents: [], rules: [] }; groups.push(g); } g.agents.push(v.toLowerCase()); lastWasAgent = true; continue; }
    lastWasAgent = false;
    if (g && (k === 'allow' || k === 'disallow')) g.rules.push([k === 'allow', v]);
  }
  const mine = groups.filter((x) => x.agents.some((a) => a !== '*' && agent.includes(a)));
  const rules = (mine.length ? mine : groups.filter((x) => x.agents.includes('*'))).flatMap((x) => x.rules);
  let best: [boolean, number] = [true, -1];
  for (const [allow, pat] of rules) {
    if (!pat) continue; // "Disallow:" (empty) allows everything
    const re = new RegExp('^' + pat.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$'));
    if (re.test(path) && (pat.length > best[1] || (pat.length === best[1] && allow))) best = [allow, pat.length];
  }
  return best[0];
}

type Source = { url: string; outlet: string; title: string; author: string; date: string; text: string; words: number; links: Array<{ name: string; url: string }>; pasted?: boolean };

/** Title, outlet, author, date, main text and links to official sources, from a news page's HTML. Images are ignored. */
export function extract(html: string, url: string, outletName: string): Source {
  const meta = (k: string) => { const m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${k}["'][^>]*>`, 'i'))?.[0]; return m ? decode(m.match(/content=["']([^"']*)["']/i)?.[1] ?? '').trim() : ''; };
  let title = meta('og:title') || strip(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '');
  let author = '', date = meta('article:published_time'), body = '';
  // Structured data (most news sites): NewsArticle with author, date and sometimes the full text
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(m[1].trim());
      const all: any[] = []; const walk = (x: any) => { if (Array.isArray(x)) x.forEach(walk); else if (x && typeof x === 'object') { all.push(x); if (x['@graph']) walk(x['@graph']); } }; walk(data);
      const art = all.find((x) => /(News)?Article|Report/.test(String(x['@type'])));
      if (art) {
        if (art.headline) title = decode(String(art.headline));
        if (art.datePublished) date = String(art.datePublished);
        const a = Array.isArray(art.author) ? art.author : art.author ? [art.author] : [];
        const names = a.map((p: any) => typeof p === 'string' ? p : p.name ?? all.find((x) => x['@id'] && x['@id'] === p['@id'])?.name).filter(Boolean);
        if (names.length) author = names.join(', ');
        if (typeof art.articleBody === 'string' && words(art.articleBody) > 80) body = decode(art.articleBody);
      }
    } catch { /* broken JSON-LD: ignore */ }
  }
  if (!author) author = meta('author') || meta('article:author');
  // The site name sometimes repeats in the title ("Story - NotiCel - La verdad…")
  const site = meta('og:site_name');
  const siteFirst = site.split(/\s+[|–—-]\s+/)[0].trim();
  if (siteFirst) { const i = title.indexOf(siteFirst); if (i > 10) title = title.slice(0, i).replace(/\s*[|–—-]\s*$/, '').trim(); }
  // Main text: paragraphs of the article area (the busiest block), skipping menus, footers, sidebars and captions
  const clean = html.replace(/<(script|style|noscript|svg|nav|header|footer|aside|form|figure|figcaption|iframe)[\s\S]*?<\/\1>/gi, ' ');
  const area = clean.match(/<article[\s\S]*?<\/article>/gi)?.sort((a, b) => b.length - a.length)[0]
    ?? clean.match(/<div[^>]+class=["'][^"']*(entry-content|article-body|story-body|post-content|td-post-content|content-body)[^"']*["'][\s\S]*$/i)?.[0] ?? clean;
  const links: Array<{ name: string; url: string }> = [];
  for (const a of area.matchAll(/<a[^>]+href=["'](https?:\/\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const h = host(a[1]);
    if (/(\.gov|\.gob|\.mil|pr\.gov|tribunales|poderjudicial|uscourts|justice|fbi|noaa|weather\.gov|cdc|census|\.edu)(\.|$)/.test(h) && !links.some((l) => l.url === a[1])) links.push({ name: strip(a[2]).slice(0, 80) || h, url: a[1] });
  }
  if (!body) {
    // Good paragraphs, grouped by how close they sit in the page; the group with the most words is the article
    // (menus, related stories, sign-up boxes and footers sit far from it). Captions and repeated pull quotes are dropped.
    const seenP = new Set<string>(); const groups: Array<{ end: number; paras: string[]; words: number }> = [];
    for (const p of area.matchAll(/<p([^>]*)>([\s\S]*?)<\/p>/gi)) {
      const t = strip(p[2]); const at = p.index ?? 0;
      if (t.length < 40 || /\{\{|\$\{/.test(t) || (t.length < 220 && /\b(EFE|AP|EPA|AFP|Reuters|Getty)\s*\/\s*[A-Z]/.test(t)) || /(caption|credit|wp-caption)/i.test(p[1]) || /\((foto|suministrada|archivo)[^)]*\)\s*$/i.test(t)
        || /^(lee también|lea también|te puede interesar|suscríbete|síguenos|©|copyright|relacionad)/i.test(t)) continue;
      if (seenP.has(t)) continue; seenP.add(t);
      const g = groups[groups.length - 1];
      if (g && at - g.end < 3000) { g.paras.push(t); g.words += words(t); g.end = at; } else groups.push({ end: at, paras: [t], words: words(t) });
    }
    const best = groups.sort((a, b) => b.words - a.words)[0];
    body = best ? best.paras.join('\n\n') : '';
  }
  return { url, outlet: outletName || site || host(url), title: title.slice(0, 200), author: author.slice(0, 120), date, text: body.slice(0, 20000), words: words(body), links: links.slice(0, 8) };
}

async function readPage(url: string, outlets: Array<{ domain: string; name: string }>): Promise<Source> {
  let u: URL; try { u = new URL(url); } catch { throw new Oops('El enlace no es válido.'); }
  if (!/^https?:$/.test(u.protocol)) throw new Oops('El enlace debe empezar con https://');
  const h = u.hostname.toLowerCase().replace(/^www\./, '');
  const outlet = outlets.find((o) => h === o.domain || h.endsWith(`.${o.domain}`));
  if (!outlet) throw new Oops('Este medio no está en la lista de medios autorizados. Añádelo en “Medios autorizados” solo si dio permiso.');
  const robots = await fetch(`${u.origin}/robots.txt`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8000) }).catch(() => null);
  if (robots?.ok && !robotsAllows(await robots.text(), u.pathname + u.search)) throw new Oops('El robots.txt de este sitio no permite leer esta página. Pega el texto a mano.');
  const r = await fetch(u, { headers: { 'User-Agent': UA, Accept: 'text/html' }, redirect: 'follow', signal: AbortSignal.timeout(15000) }).catch(() => null);
  if (!r) throw new Oops('No pudimos abrir la página (tardó demasiado). Pega el texto a mano.');
  if (!r.ok) throw new Oops(`No pudimos abrir la página (error ${r.status}). Pega el texto a mano.`);
  const s = extract(await r.text(), r.url || url, outlet.name);
  if (s.words < 80) throw new Oops('No encontramos el texto del artículo en la página (puede estar detrás de un muro de pago). Pega el texto a mano.');
  return s;
}

/* ---------------- 2. are the sources independent? ---------------- */
const grams = (t: string[], n: number) => { const s = new Set<string>(); for (let i = 0; i + n <= t.length; i++) s.add(t.slice(i, i + n).join(' ')); return s; };
/** Share of the smaller text's 5-word groups found in the other one (0–1). Wire copies run around 0.5 or more. */
export function sameness(a: string, b: string): number {
  const ga = grams(toks(a), 5), gb = grams(toks(b), 5); if (!ga.size || !gb.size) return 0;
  const [small, big] = ga.size < gb.size ? [ga, gb] : [gb, ga];
  let n = 0; small.forEach((g) => { if (big.has(g)) n++; }); return n / small.size;
}
const WIRE = /\b(Associated Press|\(AP\)|Agencia EFE|\(EFE\)|EFE\b|Reuters|AFP|Europa Press)/;
function independence(srcs: Source[]) {
  const warnings: string[] = []; let ok = true;
  for (let i = 0; i < srcs.length; i++) for (let j = i + 1; j < srcs.length; j++) {
    const s = sameness(srcs[i].text, srcs[j].text);
    if (s >= 0.35) { ok = false; warnings.push(`Fuentes no independientes: ${srcs[i].outlet} y ${srcs[j].outlet} tienen casi el mismo texto (${Math.round(s * 100)} % igual), posiblemente la misma nota de agencia.`); }
  }
  const wires = srcs.map((s) => s.text.slice(0, 600).match(WIRE)?.[0]).filter(Boolean) as string[];
  const dup = wires.find((w, i) => wires.findIndex((x) => x.replace(/[()]/g, '') === w.replace(/[()]/g, '')) !== i);
  if (dup) { ok = false; warnings.push(`Fuentes no independientes: más de una fuente viene de la misma agencia (${dup.replace(/[()]/g, '')}).`); }
  // A wire story republished by an authorized outlet is the agency's, not the outlet's: their permission doesn't cover it
  srcs.forEach((x) => { const w = `${x.author} ${x.text.slice(0, 300)}`.match(/\b(EFE|AP|Associated Press|Reuters|AFP|Europa Press)\b/)?.[0];
    if (w) warnings.push(`Nota de agencia: el artículo de ${x.outlet} parece ser de ${w}, no de ${x.outlet}. El permiso de ${x.outlet} no cubre notas de agencia: confirma antes de usarla.`); });
  return { ok, warnings };
}

/* ---------------- 6. originality check (code, not AI) ---------------- */
/** The story's words in runs of RUN+ words that also appear in a source. Text inside quotation marks is not counted
 *  (direct quotes are allowed when attributed). Returns the % of the story's words and the passages. */
export function overlap(story: string, sources: string[]) {
  const noQuotes = story.replace(/[“"«][^”"»]{1,400}[”"»]/g, ' ¶ ');
  const raw = noQuotes.split(/\s+/).filter(Boolean); const t = raw.map(norm);
  const keep = t.map((w, i) => ({ w, i })).filter((x) => x.w && x.w !== '¶' && raw[x.i] !== '¶');
  const srcGrams = new Set<string>(); for (const s of sources) grams(toks(s), RUN).forEach((g) => srcGrams.add(g));
  const hit = new Array(keep.length).fill(false);
  for (let i = 0; i + RUN <= keep.length; i++) {
    if (keep[i + RUN - 1].i - keep[i].i !== RUN - 1) continue; // the run crosses a quote
    if (srcGrams.has(keep.slice(i, i + RUN).map((x) => x.w).join(' '))) for (let k = i; k < i + RUN; k++) hit[k] = true;
  }
  const spans: string[] = []; let cur: string[] = [];
  keep.forEach((x, k) => { if (hit[k]) cur.push(raw[x.i]); else if (cur.length) { spans.push(cur.join(' ')); cur = []; } });
  if (cur.length) spans.push(cur.join(' '));
  const n = hit.filter(Boolean).length;
  return { score: keep.length ? Math.round((n / keep.length) * 1000) / 10 : 0, spans };
}
const quoteCount = (s: string) => (s.match(/[“"«][^”"»]{3,400}[”"»]/g) || []).length;

/* ---------------- Claude ---------------- */
async function claude(system: string, content: unknown, maxTokens = 12000): Promise<any> {
  const key = env('ANTHROPIC_API_KEY'); if (!key) throw new Oops('Falta el secreto ANTHROPIC_API_KEY en Supabase (Edge Functions → Secrets).', 500);
  const r = await fetch(env('ANTHROPIC_API_URL') || 'https://api.anthropic.com/v1/messages', {
    method: 'POST', signal: AbortSignal.timeout(140000),
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: env('ANTHROPIC_MODEL') || 'claude-opus-5-5', max_tokens: maxTokens, thinking: { type: 'adaptive' }, output_config: { effort: 'medium' }, system, messages: [{ role: 'user', content }] }),
  }).catch(() => null);
  if (!r) throw new Oops('La IA tardó demasiado en contestar. Intenta otra vez.', 502);
  if (r.status === 401) throw new Oops('La clave de la IA (ANTHROPIC_API_KEY) no es válida.', 502);
  if (r.status === 429 || r.status === 529) throw new Oops('La IA está ocupada en este momento. Intenta otra vez en un minuto.', 502);
  if (!r.ok) throw new Oops(`La IA dio un error (${r.status}). Intenta otra vez.`, 502);
  const data = await r.json();
  if (data.stop_reason === 'refusal') throw new Oops('La IA no quiso trabajar con este material.', 422);
  if (data.stop_reason === 'max_tokens') throw new Oops('La respuesta de la IA quedó cortada. Intenta otra vez.', 502);
  const text = (data.content || []).filter((c: any) => c.type === 'text').map((c: any) => c.text).join('').replace(/```json|```/g, '');
  try { return JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)); } catch { throw new Oops('La IA contestó en un formato inesperado. Intenta otra vez.', 502); }
}

/* ---------------- 4. AI step 1: the facts ---------------- */
const FACTS_SYSTEM = `Eres un editor de datos de una redacción de Puerto Rico. Recibes varios artículos sobre la misma noticia.
Tu único trabajo es sacar los HECHOS verificables de cada uno, sin redactar una noticia.
- Escribe cada hecho como una frase corta y neutral, con TUS palabras (no copies oraciones de los artículos).
- Tipos: quien, que, cuando, donde, cifra, declaracion (lo que alguien dijo, parafraseado), cita (palabras textuales entre comillas, con quién las dijo).
- En "cita", copia las palabras exactas solo si el artículo las pone entre comillas, y di quién las dijo y a qué medio (si se sabe).
- "fuentes": los números de TODOS los artículos que dicen ese hecho (1, 2, 3). Une hechos iguales de distintos artículos en uno solo.
- No inventes nada. No añadas contexto que no esté en los artículos. Si dos artículos se contradicen, anota ambos hechos y márcalo en "conflicto".
- "oficiales": fuentes primarias que los artículos mencionan (gobierno, policía, tribunal, agencia, comunicado oficial), con su enlace solo si aparece en "Enlaces oficiales del artículo".
- "ultima_hora": true solo si es un suceso urgente en desarrollo (emergencia, desastre, evento que ocurre ahora mismo).
Responde SOLO con JSON: {"hechos":[{"tipo":"","hecho":"","cita":"","quien":"","fuentes":[1]}],"conflictos":[""],"oficiales":[{"nombre":"","url":""}],"ultima_hora":false,"motivo_ultima_hora":""}`;

/* ---------------- 5. AI step 2: the story ---------------- */
const WRITE_SYSTEM = `Eres periodista de Noticias Xtra, un medio digital de Puerto Rico. Escribes noticias en español de Puerto Rico:
neutras, claras, directas, sin opinión, sin adjetivos promocionales y sin sensacionalismo.
Trabajas SOLO con la lista de hechos que te dan. No tienes los artículos originales y no debes inventar ni añadir nada que no esté en la lista.
Reglas:
- Titular claro y factual, sin clickbait, sin preguntas, máximo 110 caracteres.
- "descripcion": 1 o 2 oraciones, máximo 155 caracteres, que se entiendan solas (salen en Google y al compartir).
- Primer párrafo con lo más importante (qué, quién, dónde, cuándo). Párrafos cortos de 1 a 3 oraciones.
- Extensión: entre {MIN} y {MAX} palabras en el texto.
- Máximo 2 citas directas, cada una atribuida con el medio: «“…”, dijo X a [Medio]». Lo demás, parafraseado.
- Todo hecho marcado "EXCLUSIVO de [Medio]" debe decir su medio en el texto: «según reportó [Medio]».
- Atribuye las cifras y las afirmaciones a quien las dijo. No escribas como propias las afirmaciones del gobierno.
- "seccion": exactamente una de: {SECCIONES}. Nunca "opinion".
- "lugar": la ciudad o el país donde ocurrió la noticia. Déjalo vacío ("") si es sobre Puerto Rico en general.
- "liga": solo si la sección es "deportes" y la noticia es de una de estas ligas: {LIGAS}. Si no, "".
- "relacionadas": de 2 a 4 ids de la lista de noticias publicadas que traten de las mismas personas, el mismo tema o la misma sección (prefiere las recientes). Solo ids de esa lista; si ninguna aplica, [].
- "sugerencias": notas para el editor (por ejemplo "Posible Última hora: …" si los hechos dicen que es urgente, o datos que conviene confirmar). Nunca marques tú opciones de portada.
- "foto": personas, lugares y tema para buscar una foto, y una búsqueda corta en español y otra en inglés.
Responde SOLO con JSON: {"titular":"","descripcion":"","seccion":"","lugar":"","liga":"","parrafos":[""],"relacionadas":[""],"sugerencias":[""],"foto":{"personas":[""],"lugares":[""],"tema":"","buscar_es":"","buscar_en":""}}`;

/* ---------------- 7. photos ---------------- */
type Photo = { provider: 'biblioteca' | 'wikimedia' | 'pexels' | 'unsplash'; src: string; thumb: string; about: string; author: string; license: string; credit: string; creditUrl: string; downloadLocation?: string; caption?: string; why?: string };
const FREE = /^(public domain|pd(-|\s|$)|cc0|cc[- ]by(-sa)?[- ]?\d|cc[- ]by(-sa)?$|no restrictions)/i;
async function searchPhotos(terms: { personas?: string[]; lugares?: string[]; tema?: string; buscar_es?: string; buscar_en?: string }): Promise<Photo[]> {
  const out: Photo[] = [];
  const words = [...(terms.personas ?? []), ...(terms.lugares ?? []), terms.tema ?? '', terms.buscar_es ?? ''].join(' ');
  const want = new Set(toks(words).filter((w) => w.length > 3));
  // a) the site's own library (photos already used in stories and the section photos, with their credits)
  const cat = await fetch(`${SITE}/ai-catalog.json`).then((r) => r.json()).catch(() => ({ photos: [] }));
  const lib = (cat.photos as Array<{ src: string; caption: string; credit: string; creditUrl: string; story: string }>)
    .map((p) => ({ p, score: toks(`${p.caption} ${p.story}`).filter((w) => want.has(w)).length })).filter((x) => x.score >= 2).sort((a, b) => b.score - a.score).slice(0, 4);
  for (const { p } of lib) out.push({ provider: 'biblioteca', src: p.src, thumb: p.src, about: `${p.caption} (usada en: ${p.story || 'foto de sección'})`, author: '', license: 'Biblioteca de Noticias Xtra', credit: p.credit, creditUrl: p.creditUrl });
  // b) Wikimedia Commons: only public domain, CC0, CC BY, CC BY-SA (never NC/ND)
  const qs = [[...(terms.personas ?? []), ...(terms.lugares ?? [])].slice(0, 3).join(' '), terms.buscar_en, terms.buscar_es].filter((q) => q && q.trim()) as string[];
  for (const q of qs.slice(0, 2)) {
    const api = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=8&gsrsearch=${encodeURIComponent(`${q} filetype:bitmap`)}&prop=imageinfo&iiprop=url|extmetadata|mime&iiurlwidth=500`;
    const d = await fetch(api, { headers: { 'User-Agent': UA } }).then((r) => r.json()).catch(() => null);
    for (const pg of Object.values<any>(d?.query?.pages ?? {})) {
      const ii = pg.imageinfo?.[0]; const md = ii?.extmetadata ?? {};
      const lic = strip(md.LicenseShortName?.value ?? '');
      if (!ii || !/jpeg|png/.test(ii.mime) || !FREE.test(lic) || /nc|nd/i.test(lic.replace(/^cc[- ]by(-sa)?/i, '')) || out.some((o) => o.src === ii.url)) continue;
      const author = strip(md.Artist?.value ?? '').slice(0, 80) || 'Autor desconocido';
      out.push({ provider: 'wikimedia', src: ii.url, thumb: ii.thumburl || ii.url, about: strip(md.ImageDescription?.value ?? pg.title).slice(0, 300), author, license: lic,
        credit: `Foto: ${author} / Wikimedia Commons (${/public domain|^pd/i.test(lic) ? 'dominio público' : lic})`, creditUrl: ii.descriptionurl });
    }
  }
  // c) Pexels
  const px = env('PEXELS_API_KEY'); const q = terms.buscar_en || terms.buscar_es || terms.tema || '';
  if (px && q) {
    const d = await fetch(`https://api.pexels.com/v1/search?per_page=5&query=${encodeURIComponent(q)}`, { headers: { Authorization: px } }).then((r) => r.json()).catch(() => null);
    for (const p of d?.photos ?? []) out.push({ provider: 'pexels', src: p.src.large2x || p.src.large, thumb: p.src.medium, about: p.alt || '', author: p.photographer, license: 'Licencia de Pexels', credit: `Foto: ${p.photographer} / Pexels (Licencia de Pexels)`, creditUrl: p.url });
  }
  // d) Unsplash (hotlinked as their rules ask; the download is reported when the photo is chosen)
  const us = env('UNSPLASH_ACCESS_KEY');
  if (us && q) {
    const d = await fetch(`https://api.unsplash.com/search/photos?per_page=5&content_filter=high&query=${encodeURIComponent(q)}`, { headers: { Authorization: `Client-ID ${us}`, 'Accept-Version': 'v1' } }).then((r) => r.json()).catch(() => null);
    for (const p of d?.results ?? []) out.push({ provider: 'unsplash', src: p.urls.regular, thumb: p.urls.small, about: p.description || p.alt_description || '', author: p.user.name, license: 'Licencia de Unsplash',
      credit: `Foto: ${p.user.name} / Unsplash (Licencia de Unsplash)`, creditUrl: `${p.links.html}?utm_source=noticias_xtra&utm_medium=referral`, downloadLocation: p.links.download_location });
  }
  return out;
}
async function asImage(url: string) {
  const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10000) }).catch(() => null);
  const type = r?.headers.get('content-type')?.split(';')[0] ?? '';
  if (!r?.ok || !/^image\/(jpeg|png|webp|gif)$/.test(type)) return null;
  const buf = new Uint8Array(await r.arrayBuffer()); if (buf.length > 3_500_000) return null;
  let bin = ''; for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return { type: 'image', source: { type: 'base64', media_type: type, data: btoa(bin) } };
}
const PHOTO_SYSTEM = `Eres editor de fotografía de Noticias Xtra (Puerto Rico). Recibes una noticia y fotos candidatas numeradas, en orden de preferencia
(primero la biblioteca propia, luego Wikimedia, Pexels y Unsplash). Escoge hasta 3 que sirvan, la mejor primero; ante dos parecidas, prefiere la que vino antes.
NUNCA escojas una foto engañosa: otra persona, otro evento, otro lugar, o una escena de crimen o accidente que no es la de esta noticia. Si es una foto genérica, debe ser claramente ilustrativa.
Para cada una escribe "pie": qué muestra la foto de verdad, en español, en una oración. Si no es de este hecho, empieza con "Imagen de archivo:" (persona o lugar real de la noticia) o "Imagen ilustrativa:" (foto genérica).
Si ninguna sirve, devuelve una lista vacía. Responde SOLO con JSON: {"fotos":[{"n":1,"pie":"","por_que":""}]}`;

/* ---------------- database (service key) ---------------- */
function db() {
  const base = env('SUPABASE_URL')!, service = env('SUPABASE_SERVICE_ROLE_KEY')!;
  const h = { apikey: service, Authorization: `Bearer ${service}`, 'Content-Type': 'application/json' };
  return {
    get: async (path: string) => (await fetch(`${base}/rest/v1/${path}`, { headers: h })).json(),
    insert: async (table: string, row: unknown) => (await (await fetch(`${base}/rest/v1/${table}`, { method: 'POST', headers: { ...h, Prefer: 'return=representation' }, body: JSON.stringify(row) })).json())[0],
    patch: (path: string, row: unknown) => fetch(`${base}/rest/v1/${path}`, { method: 'PATCH', headers: h, body: JSON.stringify(row) }),
  };
}

/* ---------------- the steps ---------------- */
async function stepFetch(body: any, D: ReturnType<typeof db>) {
  const urls: string[] = (body.urls ?? []).map((u: string) => String(u).trim());
  if (urls.length !== 3 || urls.some((u) => !u)) throw new Oops('Pega los 3 enlaces.');
  if (new Set(urls.map((u) => u.replace(/[?#].*$/, '').replace(/\/$/, ''))).size < 3) throw new Oops('Los 3 enlaces deben ser artículos distintos.');
  const outlets = await D.get('ai_outlets?select=domain,name');
  const results = await Promise.all(urls.map(async (url) => { try { return { ok: true, source: await readPage(url, outlets) }; } catch (e) { return { ok: false, url, error: e instanceof Oops ? e.message : 'No pudimos leer esta página. Pega el texto a mano.' }; } }));
  return { results };
}

async function stepFacts(body: any, D: ReturnType<typeof db>, me: { id: string; name: string }) {
  const outlets: Array<{ domain: string; name: string }> = await D.get('ai_outlets?select=domain,name');
  const srcs: Source[] = (body.sources ?? []).map((s: any) => {
    const h = host(String(s.url ?? '')); const o = outlets.find((x) => h === x.domain || h.endsWith(`.${x.domain}`));
    if (!o) throw new Oops(`El enlace ${s.url} no es de un medio autorizado.`);
    const text = String(s.text ?? '').slice(0, 20000);
    return { url: String(s.url), outlet: o.name, title: String(s.title ?? '').slice(0, 200), author: String(s.author ?? '').slice(0, 120), date: String(s.date ?? '').slice(0, 40), text, words: words(text), links: Array.isArray(s.links) ? s.links.slice(0, 8) : [], pasted: !!s.pasted };
  });
  if (srcs.length !== 3) throw new Oops('Faltan fuentes: necesitamos las 3.');
  const short = srcs.find((s) => s.words < 80); if (short) throw new Oops(`El texto de ${short.outlet} es muy corto (${short.words} palabras). Pega el artículo completo.`);
  const ind = independence(srcs);
  const notes = String(body.notes ?? '').slice(0, 1000);
  const gen = await D.insert('ai_generations', { created_by: me.id, created_by_name: me.name, urls: srcs.map((s) => s.url), sources: srcs, notes, independent: ind.ok, warnings: ind.warnings });
  if (!gen?.id) throw new Oops('No pudimos guardar el registro. ¿Corriste supabase/ai-drafts.sql?', 500);
  const prompt = srcs.map((s, i) => `ARTÍCULO ${i + 1} — ${s.outlet}${s.author ? `, por ${s.author}` : ''}${s.date ? `, ${s.date}` : ''}\nTítulo: ${s.title}\nEnlaces oficiales del artículo: ${s.links.map((l) => `${l.name} <${l.url}>`).join('; ') || 'ninguno'}\nTexto:\n"""\n${s.text.slice(0, 12000)}\n"""`).join('\n\n');
  const f = await claude(FACTS_SYSTEM, prompt);
  const hechos = (Array.isArray(f.hechos) ? f.hechos : []).filter((h: any) => h?.hecho).map((h: any) => {
    const fuentes = [...new Set((Array.isArray(h.fuentes) ? h.fuentes : []).map(Number).filter((n: number) => n >= 1 && n <= 3))] as number[];
    return { tipo: String(h.tipo || 'que'), hecho: String(h.hecho), cita: String(h.cita || ''), quien: String(h.quien || ''), fuentes, medios: fuentes.map((n) => srcs[n - 1].outlet), exclusivo: fuentes.length === 1 ? srcs[fuentes[0] - 1].outlet : '' };
  });
  if (hechos.length < 3) throw new Oops('La IA no encontró suficientes hechos en las fuentes.', 422);
  const officials = (Array.isArray(f.oficiales) ? f.oficiales : []).filter((o: any) => o?.nombre).map((o: any) => ({ name: String(o.nombre).slice(0, 80), ...(/^https?:\/\//.test(o.url ?? '') ? { url: String(o.url) } : {}) }));
  const facts = { hechos, conflictos: (f.conflictos ?? []).filter(Boolean), oficiales: officials, ultima_hora: !!f.ultima_hora, motivo_ultima_hora: String(f.motivo_ultima_hora || '') };
  const warnings = [...ind.warnings, ...facts.conflictos.map((c: string) => `Las fuentes se contradicen: ${c}`)];
  await D.patch(`ai_generations?id=eq.${gen.id}`, { facts, warnings });
  return { genId: gen.id, facts, independent: ind.ok, warnings };
}

async function stepWrite(body: any, D: ReturnType<typeof db>) {
  const gen = (await D.get(`ai_generations?id=eq.${encodeURIComponent(String(body.genId))}&select=*`))[0];
  if (!gen?.facts) throw new Oops('Primero hay que sacar los hechos.');
  const srcs: Source[] = gen.sources; const facts = gen.facts;
  const shortest = Math.min(...srcs.map((s) => s.words));
  const max = Math.min(400, Math.floor(shortest * 0.9)), min = Math.min(250, Math.max(120, max - 80));
  const cat = await fetch(`${SITE}/ai-catalog.json?t=${Date.now()}`).then((r) => r.json()).catch(() => ({ stories: [] }));
  const stories: Array<{ id: string; title: string; section: string; league: string; date: string; body: string; ai: boolean }> = cat.stories ?? [];
  const examples = stories.filter((s) => s.body.length > 800).slice(0, 3);
  const factList = facts.hechos.map((h: any, i: number) => `${i + 1}. [${h.tipo}] ${h.hecho}${h.cita ? ` — CITA TEXTUAL: “${h.cita}” (${h.quien || 'sin nombre'})` : ''} — Medio(s): ${h.medios.join(', ')}${h.exclusivo ? ` — EXCLUSIVO de ${h.exclusivo}` : ''}`).join('\n');
  const system = WRITE_SYSTEM.replace('{MIN}', String(min)).replace('{MAX}', String(max)).replace('{SECCIONES}', SECTIONS.join(', ')).replace('{LIGAS}', Object.entries(LEAGUES).map(([k, v]) => `${k} (${v})`).join(', '));
  const prompt = `EJEMPLOS DEL ESTILO DE NOTICIAS XTRA (solo para el tono y la forma, no para los datos):\n${examples.map((e) => `--- ${e.title}\n${e.body.slice(0, 1800)}`).join('\n\n')}\n\n` +
    `NOTICIAS PUBLICADAS (para "relacionadas"; id | sección | fecha | titular):\n${stories.slice(0, 150).map((s) => `${s.id} | ${s.section} | ${s.date.slice(0, 10)} | ${s.title}`).join('\n')}\n\n` +
    `${gen.notes ? `NOTAS DEL EDITOR PARA TI: ${gen.notes}\n\n` : ''}${facts.ultima_hora ? `La lista de hechos indica que podría ser de última hora: ${facts.motivo_ultima_hora}\n\n` : ''}` +
    `HECHOS (tu única fuente):\n${factList}\n\nFuentes oficiales mencionadas: ${facts.oficiales.map((o: any) => o.name).join(', ') || 'ninguna'}`;
  let s = await claude(system, prompt);
  const paras = (x: any) => (Array.isArray(x.parrafos) ? x.parrafos : []).map((p: any) => String(p).trim()).filter(Boolean) as string[];
  let text = paras(s).join('\n\n');
  if (!text) throw new Oops('La IA no devolvió el texto de la noticia. Intenta otra vez.', 502);
  // Copy check, length and number of quotes: one automatic rewrite, then whatever remains is flagged for the editor
  let ov = overlap(text, srcs.map((x) => x.text)); let wc = words(text); let qc = quoteCount(text);
  if (ov.spans.length || wc > max || wc < min || qc > 2) {
    const fix = [
      ...(ov.spans.length ? [`Estas frases se parecen demasiado a cómo lo escribió otro medio. Reescríbelas con otras palabras y otra estructura, sin cambiar los hechos:\n${ov.spans.map((x) => `- «${x}»`).join('\n')}`] : []),
      ...(wc > max || wc < min ? [`El texto tiene ${wc} palabras; debe tener entre ${min} y ${max}.`] : []),
      ...(qc > 2 ? [`Tiene ${qc} citas directas; deja máximo 2 y parafrasea las demás.`] : []),
    ].join('\n\n');
    const again = await claude(system, `${prompt}\n\nESTE ES TU BORRADOR:\n${JSON.stringify({ ...s, parrafos: paras(s) })}\n\nCORRIGE:\n${fix}\n\nDevuelve el JSON completo corregido.`);
    if (paras(again).length) { s = { ...s, ...again }; text = paras(s).join('\n\n'); ov = overlap(text, srcs.map((x) => x.text)); wc = words(text); qc = quoteCount(text); }
  }
  // Fields checked by code
  const warnings: string[] = [...(gen.warnings ?? [])];
  let section = String(s.seccion || '').toLowerCase();
  if (!SECTIONS.includes(section)) { warnings.push(`La IA propuso la sección “${s.seccion}”, que no se permite: se puso Puerto Rico. Revísala.`); section = 'puerto-rico'; }
  const league = section === 'deportes' && LEAGUES[String(s.liga)] ? String(s.liga) : '';
  let place = String(s.lugar || '').trim(); if (/^puerto rico$/i.test(place)) place = '';
  let description = String(s.descripcion || '').trim();
  if (description.length > 160) { description = description.slice(0, 157).replace(/\s+\S*$/, '') + '…'; warnings.push('El resumen era muy largo y se recortó. Revísalo.'); }
  const ids = new Set(stories.map((x) => x.id));
  const related = [...new Set((Array.isArray(s.relacionadas) ? s.relacionadas : []).map(String))].filter((id) => ids.has(id)).slice(0, 4);
  if (wc > max || wc < min) warnings.push(`El texto tiene ${wc} palabras (lo esperado: ${min} a ${max}, menos que la fuente más corta, de ${shortest}).`);
  if (qc > 2) warnings.push(`El texto tiene ${qc} citas directas (máximo 2).`);
  if (ov.spans.length) warnings.push(`Copia: ${ov.spans.length} pasaje(s) de ${RUN} o más palabras iguales a una fuente. Reescríbelos antes de publicar.`);
  const suggestions = (Array.isArray(s.sugerencias) ? s.sugerencias : []).map(String).filter(Boolean);
  if (facts.ultima_hora && !suggestions.some((x: string) => /última hora/i.test(x))) suggestions.unshift(`Posible Última hora: ${facts.motivo_ultima_hora || 'la noticia parece urgente'}. Actívala tú si corresponde.`);
  const sameOutlet = new Set(srcs.map((x) => x.outlet)).size < srcs.length; // then each source also says which article
  const sources = [...srcs.map((x) => ({ name: sameOutlet && x.title ? `${x.outlet}: ${x.title.slice(0, 70)}` : x.outlet, url: x.url })), ...facts.oficiales.filter((o: any) => !srcs.some((x) => x.url === o.url))].slice(0, 10);
  const story = {
    title: String(s.titular || '').trim().slice(0, 140), description, section, league, place,
    body: paras(s).map((p) => `<p>${esc(p)}</p>`).join(''), words: wc, related, sources,
    photoTerms: s.foto ?? {},
  };
  await D.patch(`ai_generations?id=eq.${gen.id}`, { story, overlap: ov.score, overlap_spans: ov.spans, warnings, suggestions });
  return { story, overlap: ov.score, overlapSpans: ov.spans, warnings, suggestions, limits: { min, max, shortest } };
}

async function stepPhotos(body: any, D: ReturnType<typeof db>) {
  const gen = (await D.get(`ai_generations?id=eq.${encodeURIComponent(String(body.genId))}&select=story`))[0];
  if (!gen?.story) throw new Oops('Primero hay que escribir la noticia.');
  const cands = (await searchPhotos(gen.story.photoTerms ?? {})).slice(0, 12);
  let options: Photo[] = []; let note = '';
  if (cands.length) {
    const blocks: unknown[] = [{ type: 'text', text: `NOTICIA: ${gen.story.title}\n${gen.story.description}\n\nFOTOS CANDIDATAS:` }];
    const shown: Photo[] = [];
    for (const c of cands) { const img = await asImage(c.thumb); if (!img) continue; shown.push(c); blocks.push({ type: 'text', text: `Foto ${shown.length} — ${c.provider}: ${c.about || 'sin descripción'}` }, img); }
    if (shown.length) {
      const pick = await claude(PHOTO_SYSTEM, blocks, 4000);
      options = (Array.isArray(pick.fotos) ? pick.fotos : []).map((p: any) => shown[Number(p.n) - 1] && { ...shown[Number(p.n) - 1], caption: String(p.pie || '').slice(0, 200), why: String(p.por_que || '').slice(0, 200) }).filter(Boolean).slice(0, 3);
    }
  }
  if (!options.length) note = 'No encontramos una foto apropiada con licencia libre. Sube una foto propia o deja la noticia con la foto de su sección.';
  await D.patch(`ai_generations?id=eq.${encodeURIComponent(String(body.genId))}`, { photo_options: options });
  return { options, note };
}

/* ---------------- entry ---------------- */
export async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const base = env('SUPABASE_URL')!, anon = env('SUPABASE_ANON_KEY')!;
    const who = await fetch(`${base}/auth/v1/user`, { headers: { apikey: anon, Authorization: req.headers.get('Authorization') ?? '' } });
    if (!who.ok) return json({ error: 'Tu sesión venció. Sal y vuelve a entrar al panel.' }, 401);
    const user = await who.json();
    const D = db();
    const staff = (await D.get(`staff?user_id=eq.${user.id}&select=name,role`))[0];
    if (staff?.role !== 'admin') return json({ error: 'Solo el administrador puede usar Redactar con IA.' }, 403);
    const body = await req.json().catch(() => ({}));
    const me = { id: user.id, name: staff.name || user.email || 'Administrador' };
    if (body.action === 'fetch') return json(await stepFetch(body, D));
    if (body.action === 'facts') return json(await stepFacts(body, D, me));
    if (body.action === 'write') return json(await stepWrite(body, D));
    if (body.action === 'photos') return json(await stepPhotos(body, D));
    if (body.action === 'unsplash') {
      const loc = String(body.downloadLocation ?? ''); const key = env('UNSPLASH_ACCESS_KEY');
      if (key && loc.startsWith('https://api.unsplash.com/photos/')) await fetch(loc, { headers: { Authorization: `Client-ID ${key}` } }).catch(() => null);
      return json({ ok: true });
    }
    return json({ error: 'Acción desconocida.' }, 400);
  } catch (e) {
    if (e instanceof Oops) return json({ error: e.message }, e.status);
    console.error(e);
    return json({ error: 'Algo falló en el servidor. Intenta otra vez.' }, 500);
  }
}

if ((globalThis as any).Deno?.serve) (globalThis as any).Deno.serve(handler);

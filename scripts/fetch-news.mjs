#!/usr/bin/env node
/**
 * Noticias Xtra: AI news drafting script
 *
 * 1. Reads the list of sources in scripts/sources.json
 * 2. Finds items it hasn't seen before (tracked in scripts/seen.json)
 * 3. Sends each one to Claude, which writes a short news story in Spanish using ONLY facts from the source
 * 4. Saves each story as a Markdown file in src/content/noticias/
 *
 * Run locally:   ANTHROPIC_API_KEY=sk-... node scripts/fetch-news.mjs
 * Test without AI or saving:  DRY_RUN=1 node scripts/fetch-news.mjs
 *
 * In GitHub Actions (.github/workflows/daily-news.yml) the new files are sent to a
 * pull request so an editor approves them before they go live.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCES_FILE = path.join(ROOT, 'scripts/sources.json');
const SEEN_FILE = path.join(ROOT, 'scripts/seen.json');
const OUT_DIR = path.join(ROOT, 'src/content/noticias');
const PR_BODY = path.join(ROOT, 'pr-body.md');

const API_KEY = process.env.ANTHROPIC_API_KEY;
// Model can be changed with a repository variable named ANTHROPIC_MODEL.
// Current model names: https://docs.claude.com/en/docs/about-claude/models/overview
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
const API_URL = process.env.ANTHROPIC_API_URL || 'https://api.anthropic.com/v1/messages';
const MAX_ARTICLES = Number(process.env.MAX_ARTICLES || 6);
// Hard cap on paid AI requests per run (drafted + discarded), to keep costs predictable.
const MAX_AI_CALLS = Number(process.env.MAX_AI_CALLS || 15);
// Items older than this are marked as seen and ignored, so old news is never drafted.
const MAX_AGE_HOURS = Number(process.env.MAX_AGE_HOURS || 36);
const DRY_RUN = Boolean(process.env.DRY_RUN);
// Same as src/content.config.ts, minus 'opinion' (opinion pieces are written by people, never by this script)
const SECTIONS = ['puerto-rico', 'politica', 'gobierno', 'estados-unidos', 'mundo', 'economia', 'deportes', 'entretenimiento', 'clima', 'salud'];
const UA = 'NoticiasXtraBot/0.1 (+https://github.com)';

/* ---------------- helpers ---------------- */

const readJson = async (file, fallback) => {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); } catch { return fallback; }
};

const decode = (s = '') =>
  s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

const stripHtml = (html = '') =>
  decode(html)
    .replace(/<(script|style|nav|header|footer|aside|form)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>|<\/p>|<\/h\d>|<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n\n')
    .trim();

const tag = (block, name) => {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? decode(m[1]).trim() : '';
};

const slugify = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70);

async function get(url, accept = '*/*') {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: accept }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res;
}

/* ---------------- source readers ---------------- */

// RSS or Atom feed (most government agencies and press-release pages offer one)
async function readFeed(src) {
  const xml = await (await get(src.url, 'application/rss+xml, application/xml, text/xml')).text();
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  return blocks.slice(0, 15).map((b) => {
    const atomLink = b.match(/<link[^>]*href="([^"]+)"/i);
    const link = tag(b, 'link') || (atomLink ? atomLink[1] : '');
    return {
      key: tag(b, 'guid') || link || tag(b, 'title'),
      title: stripHtml(tag(b, 'title')),
      link,
      text: stripHtml(tag(b, 'description') || tag(b, 'summary') || tag(b, 'content') || tag(b, 'content:encoded')),
      published: tag(b, 'pubDate') || tag(b, 'updated') || tag(b, 'published'),
    };
  });
}

// National Weather Service active alerts (free, no key). area=PR covers Puerto Rico.
async function readNwsAlerts(src) {
  const data = await (await get(src.url, 'application/geo+json')).json();
  return (data.features || []).slice(0, 10).map((f) => {
    const p = f.properties;
    return {
      key: p.id,
      title: p.headline || p.event,
      link: p['@id'] || '',
      text: [p.event, p.areaDesc, p.description, p.instruction].filter(Boolean).join('\n\n'),
      published: p.sent,
    };
  });
}

// Agency page without a feed: collects links to press releases from a listing page.
// `linkPattern` is a regular expression the link address must match (e.g. "^/CMS/\\d{3,}$").
// These items have no date, so the first run only records what is already there (see main).
async function readPage(src) {
  const html = await (await get(src.url, 'text/html')).text();
  const pattern = new RegExp(src.linkPattern);
  const items = [];
  for (const [, href, inner] of html.matchAll(/<a[^>]+href="([^"#]+)"[^>]*>([\s\S]*?)<\/a>/gi)) {
    const title = stripHtml(inner).replace(/\s+/g, ' ').trim();
    if (!pattern.test(href) || title.length < 25) continue;
    const link = new URL(href, src.url).toString();
    if (!items.some((i) => i.key === link)) items.push({ key: link, title, link, text: '', published: '', undated: true });
  }
  return items.slice(0, 15);
}

const READERS = { rss: readFeed, 'nws-alerts': readNwsAlerts, page: readPage };

// Optionally load the full page text for more detail (only for official/primary sources)
async function fullText(link) {
  try {
    const html = await (await get(link, 'text/html')).text();
    const main = html.match(/<(article|main)[\s\S]*?<\/\1>/i);
    return stripHtml(main ? main[0] : html).slice(0, 8000);
  } catch {
    return '';
  }
}

/* ---------------- Claude ---------------- */

const SYSTEM = `Eres editor de Noticias Xtra, un medio digital de Puerto Rico para lectores puertorriqueños. Cubres noticias de Puerto Rico, de Estados Unidos (gobierno federal y asuntos nacionales) y del mundo. Redactas noticias breves en español de Puerto Rico a partir de UNA fuente oficial (comunicado, aviso oficial, documento público). La fuente puede estar en inglés; tú siempre escribes en español.

Exactitud (lo más importante):
- Usa SOLO hechos que aparecen en el texto de la fuente. No inventes cifras, nombres, cargos, citas, fechas ni lugares.
- Copia con cuidado los números, las fechas y los cargos oficiales.
- Cuando la fuente afirma algo que otros podrían disputar (logros, acusaciones, críticas), atribúyelo: "según la Casa Blanca", "afirmó el Departamento de Justicia".
- Escribe con tus propias palabras. No copies oraciones de la fuente. Las citas textuales solo si son breves, entre comillas y con su autor.

Lenguaje sencillo:
- Oraciones cortas (no más de 25 palabras) y párrafos de 2 o 3 oraciones.
- Palabras de uso diario. Explica en pocas palabras cualquier término técnico, sigla o programa la primera vez que aparece (por ejemplo: "TANF, el programa federal de ayuda económica para familias necesitadas").
- Primero lo más importante: qué pasó, dónde, cuándo y por qué importa.
- Si la noticia es de Estados Unidos o del mundo, explica en una oración cómo afecta o puede afectar a Puerto Rico, solo si la fuente lo permite. No inventes la conexión.
- Si hay algo que el lector debe hacer (fecha límite, cómo solicitar, a quién llamar), dilo claramente.
- Que un lector de 12 años o una persona mayor sin prisa lo entienda sin esfuerzo.

Tono:
- Informativo, serio y respetuoso. Sin opiniones propias, sin sensacionalismo y sin adjetivos cargados.

Cuándo descartar (skip: true):
- La fuente no tiene suficiente información para una noticia útil.
- Es publicidad, un anuncio interno, un evento menor o un trámite administrativo sin impacto para el público.
- Es un asunto local de un estado o país sin importancia nacional o mundial y sin relación con Puerto Rico.

Revisión humana (needsHumanCheck: true):
- Crímenes, arrestos, accidentes con víctimas, menores de edad o acusaciones contra personas.

Responde SOLO con un objeto JSON válido, sin texto adicional, con esta forma:
{"skip": false, "skipReason": "", "title": "titular de máximo 110 caracteres", "description": "resumen de 1 o 2 oraciones", "section": "una de: ${SECTIONS.join(', ')}", "place": "pueblo de Puerto Rico, ciudad y estado de EE.UU. o ciudad y país; si no se sabe, 'Puerto Rico', 'Estados Unidos' o el país", "body": "3 a 6 párrafos separados por una línea en blanco", "needsHumanCheck": false, "editorNote": "dudas o datos que el editor debe verificar"}`;

async function draftWithClaude(item, src) {
  const prompt = `Fuente: ${src.name}
Sección sugerida: ${src.section || 'puerto-rico'}
Enlace: ${item.link || 'no disponible'}
Fecha de la fuente: ${item.published || 'no indicada'}
Título original: ${item.title}

Texto de la fuente:
"""
${item.text.slice(0, 9000)}
"""`;

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODEL, max_tokens: 1500, system: SYSTEM, messages: [{ role: 'user', content: prompt }] }),
    signal: AbortSignal.timeout(90000),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const text = (data.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
  const json = text.replace(/```json|```/g, '').trim();
  return JSON.parse(json.slice(json.indexOf('{'), json.lastIndexOf('}') + 1));
}

/* ---------------- write story ---------------- */

const yaml = (v) => JSON.stringify(v); // JSON strings are valid YAML

async function saveStory(story, item, src) {
  const now = new Date();
  const date = item.published && !Number.isNaN(Date.parse(item.published)) ? new Date(item.published) : now;
  const day = now.toISOString().slice(0, 10);
  let slug = `${day}-${slugify(story.title)}`;
  let file = path.join(OUT_DIR, `${slug}.md`);
  for (let i = 2; await fs.access(file).then(() => true, () => false); i++) {
    file = path.join(OUT_DIR, `${slug}-${i}.md`);
  }
  const section = SECTIONS.includes(story.section) ? story.section : src.section || 'puerto-rico';
  const sources = [`  - name: ${yaml(src.name)}`, ...(item.link ? [`    url: ${yaml(item.link)}`] : [])];
  const md = [
    '---',
    `title: ${yaml(story.title)}`,
    `description: ${yaml(story.description)}`,
    `section: ${section}`,
    `place: ${yaml(story.place || src.place || 'Puerto Rico')}`,
    `date: ${date.toISOString()}`,
    'aiAssisted: true',
    ...(src.breaking ? ['breaking: true'] : []), // e.g. weather alerts can go in the red ÚLTIMA HORA bar
    'sources:',
    ...sources,
    '---',
    '',
    story.body.trim(),
    '',
  ].join('\n');
  await fs.writeFile(file, md, 'utf8');
  return path.relative(ROOT, file);
}

/* ---------------- main ---------------- */

async function main() {
  const sources = (await readJson(SOURCES_FILE, [])).filter((s) => s.enabled !== false);
  const seen = new Set(await readJson(SEEN_FILE, []));
  if (!API_KEY && !DRY_RUN) {
    if (process.env.GITHUB_ACTIONS) {
      // Not set up yet: finish quietly instead of failing twice a day.
      console.log('ANTHROPIC_API_KEY no está configurada todavía. No se redactaron noticias.');
      if (process.env.GITHUB_OUTPUT) await fs.appendFile(process.env.GITHUB_OUTPUT, 'count=0\n');
      return;
    }
    console.error('Falta ANTHROPIC_API_KEY. Para probar sin IA usa: DRY_RUN=1 node scripts/fetch-news.mjs');
    process.exit(1);
  }

  const created = [];
  const flagged = [];
  const skipped = [];
  let aiCalls = 0;
  const cutoff = Date.now() - MAX_AGE_HOURS * 36e5;

  for (const src of sources) {
    if (created.length >= MAX_ARTICLES || aiCalls >= MAX_AI_CALLS) break;
    const reader = READERS[src.type];
    if (!reader) { console.warn(`Tipo de fuente desconocido: ${src.type} (${src.name})`); continue; }

    let items = [];
    try { items = await reader(src); } catch (e) { console.warn(`No se pudo leer ${src.name}: ${e.message}`); continue; }
    console.log(`${src.name}: ${items.length} elementos`);

    // A watched page has no dates: the first time we see it, just remember what's there
    // so old press releases are never drafted. From then on, only new links are drafted.
    if (src.type === 'page' && items.length && !items.some((i) => seen.has(i.key))) {
      items.forEach((i) => seen.add(i.key));
      console.log('  (primera vez: se registraron los enlaces existentes sin redactar)');
      continue;
    }

    // Optional free pre-filter: only items that mention one of the source's keywords
    const keywords = (src.keywords || []).map((k) => k.toLowerCase());
    const matches = (item) => !keywords.length || keywords.some((k) => `${item.title} ${item.text}`.toLowerCase().includes(k));

    const perSource = src.maxPerRun ?? 2; // keeps a mix of local, national and world news
    let fromThis = 0;
    let callsHere = 0; // discarded drafts count too, so one busy source can't use up the run
    for (const item of items) {
      if (created.length >= MAX_ARTICLES || aiCalls >= MAX_AI_CALLS || fromThis >= perSource || callsHere >= perSource + 2) break;
      if (!item.key || seen.has(item.key)) continue;
      const time = Date.parse(item.published);
      if (!Number.isNaN(time) && time < cutoff) { seen.add(item.key); continue; } // too old
      if (!matches(item)) { seen.add(item.key); continue; } // not relevant
      seen.add(item.key);

      if (DRY_RUN) { console.log(`  [nuevo] ${item.title}`); continue; }

      if ((src.fullText || item.undated) && item.link) {
        const page = await fullText(item.link);
        if (page.length > item.text.length) item.text = page;
      }
      if (item.text.length < 120) { skipped.push(`${item.title} (muy poca información)`); continue; }

      try {
        aiCalls++;
        callsHere++;
        const story = await draftWithClaude(item, src);
        if (story.skip) { skipped.push(`${item.title} (${story.skipReason || 'descartada por la IA'})`); continue; }
        const file = await saveStory(story, item, src);
        fromThis++;
        created.push({ file, title: story.title, source: src.name, link: item.link, note: story.editorNote });
        if (story.needsHumanCheck) flagged.push(story.title);
        console.log(`  ✓ ${story.title}`);
      } catch (e) {
        seen.delete(item.key); // try again next run
        console.warn(`  ✗ Error con "${item.title}": ${e.message}`);
      }
    }
  }

  if (!DRY_RUN) await fs.writeFile(SEEN_FILE, JSON.stringify([...seen].slice(-3000), null, 2) + '\n');

  // Pull request description for the editor
  const body = [
    `La IA preparó **${created.length}** ${created.length === 1 ? 'noticia' : 'noticias'} para revisión.`,
    '',
    'Revisa cada una contra su fuente. Para publicar, aprueba y haz **Merge**. Para corregir, edita el archivo en esta misma pull request.',
    '',
    ...(flagged.length ? ['### ⚠️ Revisar con cuidado', ...flagged.map((t) => `- ${t}`), ''] : []),
    '### Noticias',
    ...created.map((c) => `- **${c.title}**  \n  Fuente: ${c.link ? `[${c.source}](${c.link})` : c.source}  \n  Archivo: \`${c.file}\`${c.note ? `  \n  Nota para el editor: ${c.note}` : ''}`),
    ...(skipped.length ? ['', '<details><summary>Descartadas</summary>', '', ...skipped.map((s) => `- ${s}`), '', '</details>'] : []),
  ].join('\n');
  if (!DRY_RUN) await fs.writeFile(PR_BODY, body);

  console.log(`\nListo: ${created.length} creadas, ${skipped.length} descartadas, ${aiCalls} consultas a la IA.`);
  if (process.env.GITHUB_OUTPUT) await fs.appendFile(process.env.GITHUB_OUTPUT, `count=${created.length}\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });

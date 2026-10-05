// Noticias Xtra: password page in front of noticiasxtra.com until launch (a Cloudflare Worker).
// Anyone with the password gets in and stays in for 30 days on that device; everyone else, search engines included,
// only sees this page. On launch day: Cloudflare → Workers → this worker → Settings → Domains & Routes → remove the
// routes (or delete the worker). The site itself (GitHub Pages) doesn't change.
//
// Setup (Cloudflare dashboard):
//   1. Workers & Pages → Create → Worker → name "noticias-xtra-clave" → Deploy → Edit code → paste this file → Deploy.
//   2. Settings → Variables and Secrets → Add → type Secret, name SITE_PASSWORD, value: the password you'll share.
//   3. Settings → Domains & Routes → Add → Route: noticiasxtra.com/*  and another: www.noticiasxtra.com/*  (zone noticiasxtra.com).
//   4. DNS: the @ and www records must be Proxied (orange cloud) so the visit passes through Cloudflare.
// Changing SITE_PASSWORD signs everyone out.
// Low profile: noticiasxtra.com shows a plain, unbranded page; the password page is only at /entrar (the staff door).
//
// Guest access (optional, e.g. an investor): a second password that stops working at a set time and opens the site in
// demo mode (sample ads, comments and a sample staff panel, all labeled; src/lib/demo.ts reads the nx_demo cookie).
//   Settings → Variables and Secrets → Add: type Secret, name GUEST_PASSWORD, value: the guest's password.
//   Add: type Text, name GUEST_UNTIL, value: when it stops working, in UTC, e.g. 2026-10-07T13:00:00Z (9 a.m. in Puerto Rico).
// To end it early, delete GUEST_PASSWORD (or change GUEST_UNTIL to a past time) and Deploy.
//
// Demo address (optional): the same file deployed as a second worker, e.g. "noticiasxtra-demo", with no routes, reached
// at its workers.dev address. There it shows the site under that address (every "noticiasxtra.com" is swapped for it),
// only the guest password works, and it is always demo mode. It needs the same three settings: SITE_PASSWORD (to pass
// the gate of the real site), GUEST_PASSWORD and GUEST_UNTIL.
const SITE = 'https://noticiasxtra.com';

const COOKIE = 'nx_clave';
const DOOR = '/entrar'; // where the staff types the password on the real address
const DAYS = 30;
// Always open: certificate renewal for GitHub Pages and the icon of this page
const OPEN = [/^\/\.well-known\//, /^\/favicon\.(svg|png)$/];

async function token(password) {
  const data = new TextEncoder().encode(`noticias-xtra:${password}`);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
const cookieOf = (req) => (req.headers.get('Cookie') || '').split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1) || '';
const json = (body, status = 200, cookies = []) => {
  const h = new Headers({ 'Content-Type': 'application/json' }); cookies.forEach((c) => h.append('Set-Cookie', c));
  return new Response(JSON.stringify(body), { status, headers: h });
};
/** The guest password's deadline (ms), or 0 when there is no guest access. */
const guestUntil = (env) => (env.GUEST_PASSWORD && env.GUEST_UNTIL ? Date.parse(env.GUEST_UNTIL) || 0 : 0);

/** Demo address: the real site fetched through the gate, with its address swapped for this one. */
async function proxy(req, url, good) {
  const headers = new Headers(req.headers); headers.set('Cookie', `${COOKIE}=${good}`); headers.delete('Host');
  const res = await fetch(SITE + url.pathname + url.search, { method: req.method, headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body, redirect: 'manual' });
  const out = new Headers(res.headers); out.delete('Set-Cookie'); out.set('X-Robots-Tag', 'noindex, nofollow');
  const loc = out.get('Location'); if (loc) out.set('Location', loc.replace(SITE, url.origin));
  const type = out.get('Content-Type') || '';
  if (!/text\/|javascript|json|xml|manifest/.test(type)) return new Response(res.body, { status: res.status, headers: out });
  out.delete('Content-Length'); out.delete('Content-Encoding');
  const body = (await res.text()).split(SITE).join(url.origin).split('www.noticiasxtra.com').join(url.host).split('noticiasxtra.com').join(url.host);
  return new Response(body, { status: res.status, headers: out });
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (!env.SITE_PASSWORD) return new Response('Falta la variable SITE_PASSWORD en el Worker.', { status: 500 });
    const good = await token(env.SITE_PASSWORD);
    const until = guestUntil(env), guestOpen = until > Date.now();
    const guest = until ? await token(`guest:${env.GUEST_PASSWORD}:${env.GUEST_UNTIL}`) : '';
    const demoHost = url.hostname.endsWith('.workers.dev'); // the separate demo address: guest only, always demo

    // The form sends the password here
    if (url.pathname === '/__clave' && req.method === 'POST') {
      const form = await req.formData().catch(() => null);
      const typed = await token(String(form?.get('clave') || ''));
      if (typed === good && !demoHost) return json({ ok: true }, 200, [`${COOKIE}=${good}; Path=/; Max-Age=${DAYS * 86400}; HttpOnly; Secure; SameSite=Lax`, 'nx_demo=; Path=/; Max-Age=0; Secure; SameSite=Lax']);
      if (until && typed === (await token(env.GUEST_PASSWORD))) {
        if (!guestOpen) return json({ ok: false, expired: true }, 401);
        const exp = new Date(until).toUTCString(); // both cookies end exactly at the deadline
        return json({ ok: true }, 200, [`${COOKIE}=${guest}; Path=/; Expires=${exp}; HttpOnly; Secure; SameSite=Lax`, `nx_demo=1; Path=/; Expires=${exp}; Secure; SameSite=Lax`]);
      }
      return json({ ok: false }, 401);
    }
    const c = cookieOf(req);
    if (demoHost) {
      if ((guestOpen && c === guest) || OPEN.some((r) => r.test(url.pathname))) return proxy(req, url, good);
    } else if (c === good || (guestOpen && c === guest) || OPEN.some((r) => r.test(url.pathname))) return fetch(req);
    const h = new Headers({ 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' });
    if (c && c === guest) h.append('Set-Cookie', 'nx_demo=; Path=/; Max-Age=0; Secure; SameSite=Lax'); // guest time is over
    if (!demoHost && url.pathname.replace(/\/$/, '') !== DOOR) return new Response(PLAIN(url.hostname), { status: 404, headers: h }); // looks unused
    return new Response(PAGE, { status: 401, headers: h });
  },
};

const PAGE = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Noticias Xtra · Muy pronto</title>
<link rel="icon" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@700;800&family=Noto+Sans:wght@400;600&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box} body{margin:0;min-height:100vh;display:grid;place-items:center;padding:16px;font-family:'Noto Sans',system-ui,sans-serif;
    background:linear-gradient(135deg,#2B1185 0%,#1E0B5E 55%,#1F90DA 140%);color:#16161D}
  .card{width:min(420px,100%);background:#fff;border-radius:20px;padding:32px 28px;box-shadow:0 30px 80px rgba(0,0,0,.35);text-align:center}
  .logo{font-family:Poppins,sans-serif;font-weight:800;font-size:34px;letter-spacing:-.5px;color:#2B1185;margin:0}
  .logo b{color:#1F90DA}
  h1{font-family:Poppins,sans-serif;font-size:20px;margin:18px 0 6px} p{margin:0 0 18px;color:#5C5F6E;font-size:15px;line-height:1.5}
  input{width:100%;font:inherit;font-size:16px;padding:12px 14px;border:1.5px solid #D5D6E0;border-radius:12px;outline:none}
  input:focus{border-color:#1F90DA;box-shadow:0 0 0 3px rgba(31,144,218,.2)}
  button{margin-top:12px;width:100%;font:inherit;font-weight:700;font-size:16px;padding:12px;border:0;border-radius:999px;background:#2B1185;color:#fff;cursor:pointer}
  button:disabled{opacity:.6} .err{color:#D7263D;font-size:14px;margin:10px 0 0;min-height:1.2em}
  @media (prefers-color-scheme:dark){.card{background:#181A2B;color:#ECEDF5} p{color:#A6A9BD} .logo{color:#B9A6FF} input{background:#22253A;color:#ECEDF5;border-color:#3F4362} button{background:#6D4ED6}}
</style></head>
<body><main class="card">
  <p class="logo">Noticias <b>Xtra</b></p>
  <h1>Muy pronto</h1>
  <p>Estamos preparando el nuevo Noticias Xtra. Si tienes la clave de acceso, escríbela para entrar.</p>
  <form id="f"><input id="c" name="clave" type="password" autocomplete="current-password" placeholder="Clave de acceso" aria-label="Clave de acceso" required autofocus>
  <button id="b" type="submit">Entrar</button><p class="err" id="e" role="alert"></p></form>
</main>
<script>
  document.getElementById('f').addEventListener('submit', async function (ev) {
    ev.preventDefault(); var b = document.getElementById('b'), e = document.getElementById('e'); b.disabled = true; e.textContent = '';
    var r = await fetch('/__clave', { method: 'POST', body: new FormData(this) }).catch(function () { return null; });
    if (r && r.ok) { if (/^\/entrar\/?$/.test(location.pathname)) location.href = '/'; else location.reload(); return; } // keeps the address (and any login link) the visitor came with
    var out = r ? await r.json().catch(function () { return {}; }) : null;
    b.disabled = false; e.textContent = !r ? 'No hay conexión. Intenta otra vez.' : out.expired ? 'Esa clave de invitado ya venció.' : 'Esa clave no es correcta.';
  });
</script></body></html>`;

// What strangers see on the real address: just the domain name, nothing about the site
const PLAIN = (host) => `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>${host}</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;background:#fff;color:#9A9CA8;font-size:15px}
@media (prefers-color-scheme:dark){body{background:#111;color:#666}}</style></head><body>${host}</body></html>`;

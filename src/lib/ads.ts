/* =========================================================
   ADVERTISING: prices, discounts, regions, direct campaigns and Google fill.
   Edit this file to change what the Anúnciate page shows and which ads run.
   ========================================================= */

export type AdSize = 'leaderboard' | 'rectangle' | 'halfpage' | 'infeed';

// ---- Prices (launch prices, USD per month unless `per` says otherwise) ----
// `art`: the image sizes (width × height) the client uploads, or that we create for them.
export const FORMATS = [
  { id: 'valla', name: 'Valla digital', size: 'Banner superior, rota con otras marcas', price: 29, per: 'mes', slots: ['leaderboard'] as AdSize[],
    about: 'Tu anuncio rota cada 8 segundos con hasta 3 marcas más. La forma más barata de empezar.', art: [[728, 90], [320, 100]], popular: false },
  { id: 'rectangle', name: 'Rectángulo', size: '300 × 250', price: 49, per: 'mes', slots: ['rectangle'] as AdSize[],
    about: 'Al lado de las noticias, Deportes y los juegos. Se ve igual en celular.', art: [[300, 250]], popular: true },
  { id: 'infeed', name: 'Entre noticias', size: '728 × 90', price: 49, per: 'mes', slots: ['infeed'] as AdSize[],
    about: 'Entre las noticias de la portada y al final de cada noticia.', art: [[728, 90], [320, 100]], popular: false },
  { id: 'leaderboard', name: 'Banner exclusivo', size: '728 × 90', price: 89, per: 'mes', slots: ['leaderboard'] as AdSize[],
    about: 'El banner de arriba, solo para tu marca (sin rotar).', art: [[728, 90], [320, 100]], popular: false },
  { id: 'halfpage', name: 'Media página', size: '300 × 600', price: 99, per: 'mes', slots: ['halfpage'] as AdSize[],
    about: 'El espacio más grande; se queda a la vista al bajar. Solo en computadora.', art: [[300, 600]], popular: false },
  { id: 'patrocinio', name: 'Patrocinio de sección', size: 'Juegos, Deportes, Clima…', price: 149, per: 'mes', slots: [] as AdSize[],
    about: '“Presentado por” tu marca y todos los espacios de una sección.', art: [[300, 250], [728, 90]], popular: false },
  { id: 'takeover', name: 'Toma de portada', size: 'Todo el sitio por un día', price: 99, per: 'día', slots: [] as AdSize[],
    about: 'Todos los espacios del sitio con tu marca durante 24 horas.', art: [[300, 250], [728, 90], [300, 600]], popular: false },
];
export const DESIGN_FEE = 19; // we create the ad from the client's text and logo
export const DESIGN_FREE_FROM_MONTHS = 3; // ...free in campaigns this long or longer
export const UPLOAD = { maxMB: 3, types: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] };

// ---- Where the ads show ----
// Share of the full price for each audience choice
export const REGIONS = [
  { id: 'oeste', name: 'Oeste', towns: 'Aguadilla, Mayagüez, Cabo Rojo, Rincón…' },
  { id: 'norte', name: 'Norte', towns: 'Arecibo, Manatí, Vega Baja, Hatillo…' },
  { id: 'metro', name: 'Metro', towns: 'San Juan, Bayamón, Carolina, Guaynabo…' },
  { id: 'centro', name: 'Centro', towns: 'Caguas, Cayey, Utuado, Barranquitas…' },
  { id: 'sur', name: 'Sur', towns: 'Ponce, Guayama, Yauco, Salinas…' },
  { id: 'este', name: 'Este', towns: 'Fajardo, Humacao, Río Grande, Yabucoa…' },
  { id: 'islas', name: 'Vieques y Culebra', towns: 'Las islas municipio' },
];
export const AUDIENCE = { all: 1, island: 0.85, diaspora: 0.5, perRegion: 0.25 }; // regions add up, capped at `island`

// ---- Discounts ----
export const LAUNCH_DISCOUNT = { pct: 40, months: 3, text: 'Anunciante fundador: 40% de descuento los primeros 3 meses.' };
export const DURATION_DISCOUNTS = [ // months → % off
  { months: 3, pct: 15 }, { months: 6, pct: 20 }, { months: 12, pct: 30 },
];
export const OTHER_DISCOUNTS = [
  { id: 'combo', pct: 10, text: '2 formatos o más en la misma campaña' },
  { id: 'prepago', pct: 5, text: 'Pago completo por adelantado' },
  { id: 'nonprofit', pct: 50, text: 'Organizaciones sin fines de lucro' },
];
export const MAX_DISCOUNT = 60; // discounts add up to this cap
// Free ads after the total spent (lifetime, per client)
export const REWARDS = [
  { at: 250, gift: '1 mes de Valla digital gratis' },
  { at: 500, gift: '1 mes de Rectángulo gratis' },
  { at: 1000, gift: '1 Toma de portada gratis' },
  { at: 2500, gift: '1 mes de Patrocinio de sección gratis' },
];
// Agencies and big brands: discount by yearly volume
export const VOLUME_TIERS = [
  { from: 1000, pct: 10 }, { from: 2500, pct: 15 }, { from: 5000, pct: 20 }, { from: 10000, pct: 25 },
];
export const AGENCY_COMMISSION = 15;

// ---- Direct campaigns (paid by our clients). They always show before Google ads. ----
// One entry per campaign. `regions`: 'all' | 'island' (readers in Puerto Rico) | 'diaspora'.
// `takeover: true` gives that campaign every ad space while it runs (and `skin`, an optional page background).
// Images go in public/anuncios/. Several creatives in one campaign rotate like a billboard.
export type Creative = { img: string; url: string; alt: string };
export type Campaign = {
  id: string; client: string; sizes: AdSize[]; start: string; end: string;
  regions?: 'all' | 'island' | 'diaspora'; creatives: Creative[]; weight?: number; takeover?: boolean; skin?: string;
};
export const CAMPAIGNS: Campaign[] = [
  // Example (copy, fill in and remove the // to run it):
  // { id: 'panaderia-oct', client: 'Panadería La Esquina', sizes: ['rectangle'], start: '2026-10-01', end: '2026-10-31', regions: 'island',
  //   creatives: [{ img: 'anuncios/panaderia-1.jpg', url: 'https://example.com', alt: 'Pan sobao recién hecho' }] },
];

// ---- Google fill: shows only where no direct campaign is running ----
// Paste the AdSense publisher id (ca-pub-…) and one ad-unit id per size once the account is approved.
export const GOOGLE = {
  client: '',
  slots: { leaderboard: '', rectangle: '', halfpage: '', infeed: '' } as Record<AdSize, string>,
};

export const ROTATE_SECONDS = 8;

// ---- Online payment and ad requests ----
// Fill these in once the accounts exist. While empty, the Anúnciate page works as a preview: nothing is charged
// or sent, and it tells the visitor to write to us.
//  - stripeLink: a Stripe Payment Link (https://buy.stripe.com/…) made with "Customers choose what to pay"
//    (cards, Apple Pay, Google Pay). In its "After payment" settings, choose "Don't show confirmation page" and
//    redirect to https://publisher-noticel.github.io/noticias-xtra/publicidad/?pagado=1
//  - athMovilToken: the PUBLIC token from ATH Business (Settings → API Keys). Never put the private token here.
//  - requestsUrl: where requests (with the uploaded files) are saved for the employee who approves them.
export const PAYMENTS = { stripeLink: '', athMovilToken: '' };
export const REQUESTS = { url: '', key: '' };
export const APPROVAL_HOURS = 24; // promise shown to clients

// ---- Price quote: one place for the math, used by the Anúnciate page and the sales desk (/redaccion/ → Ventas) ----
// How a campaign is priced (the "rate card"):
//  - Monthly formats: a campaign of `days` days. Shorter than a month is billed by the week: each week costs
//    WEEK_SHARE of the monthly price, and from 3 weeks on you pay the month. A month or longer is prorated by day.
//  - Per-day formats (takeover): price × days of takeover.
//  - Discounts: length (DURATION_DISCOUNTS) or, for a first-time client, the launch discount on the first 3 months
//    (never both on the same months); plus combo, prepaid, nonprofit; agencies get the agency commission plus volume.
//    Together they never pass MAX_DISCOUNT.
//  - Sales desk only: special requests (`custom` lines, each with its own discount) and a negotiated extra discount
//    (% and/or $). Sales can give up to SALES_DISCOUNT_LIMIT % on their own; above that the admin approves.
export const WEEK_SHARE = 0.4;
export const SALES_DISCOUNT_LIMIT = 15;
export const SPECIALS = [ // suggested prices for things clients and agencies ask for (sales can change them)
  { name: 'Artículo patrocinado (escrito por la redacción, identificado como patrocinado)', price: 250 },
  { name: 'Mención en el boletín', price: 40 },
  { name: 'Publicación en nuestras redes sociales', price: 75 },
  { name: 'Video patrocinado corto', price: 300 },
  { name: 'Cobertura de un evento', price: 350 },
  { name: 'Encuesta o concurso patrocinado', price: 200 },
  { name: 'Diseño de campaña (varias piezas)', price: 60 },
];
export type CustomLine = { name: string; qty: number; price: number; pct: number };
export type QuoteInput = {
  formats: string[]; days: number; takeoverDays: number; // days: campaign length; takeoverDays: 1–14
  aud: 'all' | 'island' | 'diaspora' | 'regions'; regions: number; // number of regions picked when aud = 'regions'
  who: 'retail' | 'agency' | 'nonprofit'; prepay: boolean; founder: boolean; design: boolean;
  custom?: CustomLine[]; extraPct?: number; extraAmt?: number; // sales desk only
};
export type Quote = {
  lines: Array<[string, number]>; discounts: Array<[string, number]>; // [label, amount]
  subtotal: number; off: number; capped: number; design: number | null; custom: Array<[string, number]>; customTotal: number;
  extra: number; extraPct: number; needsApproval: boolean; total: number; monthly: number; factor: number; months: number;
};
/** Human label for a campaign length, e.g. "2 semanas", "1 mes", "45 días". */
export function lengthLabel(days: number) {
  if (days % 7 === 0 && days < 28) return days === 7 ? '1 semana' : `${days / 7} semanas`;
  const m = Math.round(days / 30);
  if (Math.abs(days - m * 30) <= 1 && m >= 1) return m === 1 ? '1 mes' : `${m} meses`;
  return `${days} días`;
}
/** Price of a monthly format for a campaign of `days` days. */
export const periodCost = (monthPrice: number, days: number) =>
  days < 30 ? monthPrice * Math.min(1, Math.ceil(Math.max(1, days) / 7) * WEEK_SHARE) : monthPrice * (days / 30);

export function quote(q: QuoteInput): Quote {
  const fmts = FORMATS.filter((f) => q.formats.includes(f.id));
  const days = Math.max(1, Math.round(q.days)), months = days / 30, tDays = Math.max(1, Math.min(14, q.takeoverDays || 1));
  const factor = q.aud === 'all' ? AUDIENCE.all : q.aud === 'island' ? AUDIENCE.island : q.aud === 'diaspora' ? AUDIENCE.diaspora : Math.min(AUDIENCE.island, q.regions * AUDIENCE.perRegion);
  const lines: Array<[string, number]> = [];
  let monthly = 0, subtotal = 0, monthlyCost = 0; // monthlyCost: what the monthly formats cost over the whole campaign
  for (const f of fmts) {
    const wide = f.per === 'día' || f.id === 'patrocinio'; // site-wide formats are not split by region
    const month = f.price * (wide ? 1 : factor);
    const cost = f.per === 'día' ? f.price * tDays : periodCost(month, days);
    if (f.per !== 'día') { monthly += month; monthlyCost += cost; }
    lines.push([`${f.name} · ${f.per === 'día' ? `${tDays} día${tDays > 1 ? 's' : ''}` : lengthLabel(days)}`, Math.round(cost * 100) / 100]); subtotal += cost;
  }
  const discounts: Array<[string, number]> = [];
  // First time: 40% on the first 3 months of the monthly formats; the length discount covers the rest
  const launchBase = q.founder ? monthlyCost * Math.min(1, LAUNCH_DISCOUNT.months / months) : 0;
  if (launchBase) discounts.push([`Primera vez (${LAUNCH_DISCOUNT.pct}%)`, launchBase * LAUNCH_DISCOUNT.pct / 100]);
  const dur = [...DURATION_DISCOUNTS].reverse().find((x) => days >= x.months * 30 - 2);
  if (dur && subtotal - launchBase > 0) discounts.push([`${dur.months} meses (${dur.pct}%)`, (subtotal - launchBase) * dur.pct / 100]);
  const pct = (label: string, p: number) => discounts.push([`${label} (${p}%)`, subtotal * p / 100]);
  if (fmts.length >= 2) pct('Más de un anuncio', OTHER_DISCOUNTS.find((x) => x.id === 'combo')!.pct);
  if (q.prepay) pct('Pago completo', OTHER_DISCOUNTS.find((x) => x.id === 'prepago')!.pct);
  if (q.who === 'nonprofit') pct('Sin fines de lucro', OTHER_DISCOUNTS.find((x) => x.id === 'nonprofit')!.pct);
  if (q.who === 'agency') {
    pct('Comisión de agencia', AGENCY_COMMISSION);
    const v = [...VOLUME_TIERS].reverse().find((x) => subtotal >= x.from); if (v) pct('Volumen', v.pct);
  }
  const want = discounts.reduce((a, [, x]) => a + x, 0);
  const off = Math.min(subtotal * MAX_DISCOUNT / 100, want);
  const design = q.design && fmts.length ? (months >= DESIGN_FREE_FROM_MONTHS - 0.05 ? 0 : DESIGN_FEE) : null;
  const standard = Math.max(0, subtotal - off + (design ?? 0));
  // Sales desk: special requests and a negotiated discount
  const custom: Array<[string, number]> = (q.custom ?? []).filter((c) => c.name && c.qty > 0).map((c) => [`${c.name}${c.qty > 1 ? ` × ${c.qty}` : ''}${c.pct ? ` (−${c.pct}%)` : ''}`, c.qty * c.price * (1 - Math.min(100, c.pct || 0) / 100)]);
  const customTotal = custom.reduce((a, [, x]) => a + x, 0);
  const extraPct = Math.max(0, Math.min(100, q.extraPct || 0));
  const extra = Math.min(standard + customTotal, (standard + customTotal) * extraPct / 100 + Math.max(0, q.extraAmt || 0));
  const total = Math.max(0, standard + customTotal - extra);
  const listPrice = subtotal + (design ?? 0) + (q.custom ?? []).reduce((a, c) => a + c.qty * c.price, 0);
  const negotiated = listPrice ? ((listPrice - total) - off) / listPrice * 100 : 0; // what sales gave on top of the standard discounts
  return { lines, discounts, subtotal, off, capped: want - off, design, custom, customTotal, extra, extraPct, needsApproval: negotiated > SALES_DISCOUNT_LIMIT + 0.01,
    total: Math.round(total * 100) / 100, monthly, factor, months };
}

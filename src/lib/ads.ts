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

// ---- Price quote: one place for the math, used by the Anúnciate page and the sales desk (/redaccion/) ----
export type QuoteInput = {
  formats: string[]; months: number; days: number; // days: for per-day formats (takeover), 1–14
  aud: 'all' | 'island' | 'diaspora' | 'regions'; regions: number; // number of regions picked when aud = 'regions'
  who: 'retail' | 'agency' | 'nonprofit'; prepay: boolean; founder: boolean; design: boolean;
};
export type Quote = {
  lines: Array<[string, number]>; discounts: Array<[string, number]>; // [label, pct]
  subtotal: number; launch: number; pctOff: number; off: number; design: number | null; total: number; monthly: number; factor: number;
};
export function quote(q: QuoteInput): Quote {
  const fmts = FORMATS.filter((f) => q.formats.includes(f.id));
  const months = q.months, days = Math.max(1, Math.min(14, q.days || 1));
  const factor = q.aud === 'all' ? AUDIENCE.all : q.aud === 'island' ? AUDIENCE.island : q.aud === 'diaspora' ? AUDIENCE.diaspora : Math.min(AUDIENCE.island, q.regions * AUDIENCE.perRegion);
  const lines: Array<[string, number]> = [];
  let monthly = 0, subtotal = 0;
  for (const f of fmts) {
    const wide = f.per === 'día' || f.id === 'patrocinio'; // site-wide formats are not split by region
    const cost = f.per === 'día' ? f.price * days : f.price * months * (wide ? 1 : factor);
    if (f.per !== 'día') monthly += f.price * (wide ? 1 : factor);
    lines.push([`${f.name}${f.per === 'día' ? ` · ${days} día${days > 1 ? 's' : ''}` : ''}`, cost]); subtotal += cost;
  }
  const discounts: Array<[string, number]> = [];
  const dur = [...DURATION_DISCOUNTS].reverse().find((x) => months >= x.months); if (dur) discounts.push([`${dur.months} meses`, dur.pct]);
  if (fmts.length >= 2) discounts.push(['Más de un anuncio', OTHER_DISCOUNTS.find((x) => x.id === 'combo')!.pct]);
  if (q.prepay) discounts.push(['Pago completo', OTHER_DISCOUNTS.find((x) => x.id === 'prepago')!.pct]);
  if (q.who === 'nonprofit') discounts.push(['Sin fines de lucro', OTHER_DISCOUNTS.find((x) => x.id === 'nonprofit')!.pct]);
  if (q.who === 'agency') { const v = [...VOLUME_TIERS].reverse().find((x) => subtotal >= x.from); if (v) discounts.push(['Volumen', v.pct]); }
  const launch = q.founder ? monthly * Math.min(months, LAUNCH_DISCOUNT.months) * LAUNCH_DISCOUNT.pct / 100 : 0;
  const pctOff = subtotal * Math.min(MAX_DISCOUNT, discounts.reduce((a, [, p]) => a + p, 0)) / 100;
  const off = Math.min(subtotal * MAX_DISCOUNT / 100, pctOff + launch);
  const design = q.design && fmts.length ? (months >= DESIGN_FREE_FROM_MONTHS ? 0 : DESIGN_FEE) : null;
  return { lines, discounts, subtotal, launch, pctOff, off, design, total: Math.max(0, subtotal - off + (design ?? 0)), monthly, factor };
}

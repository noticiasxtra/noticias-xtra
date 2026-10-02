/* =========================================================
   ADVERTISING: prices, discounts, regions, direct campaigns and Google fill.
   Edit this file to change what the Anúnciate page shows and which ads run.
   ========================================================= */

export type AdSize = 'leaderboard' | 'rectangle' | 'halfpage' | 'infeed';

// ---- Prices (launch prices, USD per month unless `per` says otherwise) ----
export const FORMATS = [
  { id: 'valla', name: 'Valla digital', size: 'Rota en el banner superior', price: 69, per: 'mes', slots: ['leaderboard'] as AdSize[],
    about: 'Tu anuncio rota con hasta 3 marcas más, como una valla en la carretera. Cambia cada 8 segundos.', w: 728, h: 90 },
  { id: 'rectangle', name: 'Rectángulo', size: '300 × 250', price: 99, per: 'mes', slots: ['rectangle'] as AdSize[],
    about: 'Columna derecha de la portada, las noticias, Deportes y cada juego. Igual en celular.', w: 300, h: 250 },
  { id: 'infeed', name: 'Entre noticias', size: '728 × 90 · 320 × 100 en celular', price: 99, per: 'mes', slots: ['infeed'] as AdSize[],
    about: 'Dentro de la portada, al final de cada noticia y en las secciones.', w: 728, h: 90 },
  { id: 'leaderboard', name: 'Banner exclusivo', size: '728 × 90 · 320 × 100 en celular', price: 149, per: 'mes', slots: ['leaderboard'] as AdSize[],
    about: 'El banner horizontal de todo el sitio, solo para tu marca (sin rotación).', w: 728, h: 90 },
  { id: 'halfpage', name: 'Media página', size: '300 × 600', price: 179, per: 'mes', slots: ['halfpage'] as AdSize[],
    about: 'El espacio más grande; se queda a la vista mientras el lector baja. Solo en computadora.', w: 300, h: 600 },
  { id: 'patrocinio', name: 'Patrocinio de sección', size: 'Juegos, Deportes, Clima…', price: 299, per: 'mes', slots: [] as AdSize[],
    about: '“Presentado por” tu marca y todos los espacios de esa sección.', w: 300, h: 250 },
  { id: 'takeover', name: 'Toma de portada', size: 'Todo el sitio por un día', price: 249, per: 'día', slots: [] as AdSize[],
    about: 'Todos los espacios y el fondo de la portada con tu marca durante 24 horas.', w: 728, h: 90 },
];
export const DESIGN_FEE = 49; // we design the ad when the client has no artwork

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
export const AUDIENCE = { all: 1, island: 0.85, diaspora: 0.5, perRegion: 0.3 }; // regions add up, capped at `island`

// ---- Discounts ----
export const LAUNCH_DISCOUNT = { pct: 30, months: 3, text: 'Anunciante fundador: 30% de descuento los primeros 3 meses.' };
export const DURATION_DISCOUNTS = [ // months → % off
  { months: 3, pct: 10 }, { months: 6, pct: 15 }, { months: 12, pct: 25 },
];
export const OTHER_DISCOUNTS = [
  { id: 'combo', pct: 10, text: '2 formatos o más en la misma campaña' },
  { id: 'prepago', pct: 5, text: 'Pago completo por adelantado' },
  { id: 'nonprofit', pct: 50, text: 'Organizaciones sin fines de lucro' },
];
export const MAX_DISCOUNT = 50; // discounts add up to this cap
// Free ads after the total spent (lifetime, per client)
export const REWARDS = [
  { at: 1000, gift: '1 semana de Valla digital gratis' },
  { at: 2500, gift: '1 mes de Rectángulo gratis' },
  { at: 5000, gift: '1 Toma de portada gratis' },
  { at: 10000, gift: '1 mes de Patrocinio de sección gratis' },
];
// Agencies and big brands: discount by yearly volume
export const VOLUME_TIERS = [
  { from: 3000, pct: 10 }, { from: 7500, pct: 15 }, { from: 15000, pct: 20 }, { from: 30000, pct: 25 },
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

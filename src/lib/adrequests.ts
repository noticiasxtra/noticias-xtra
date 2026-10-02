// Ad requests: what a client sends from the Anúnciate page, and what the one employee reviews on the approval page.
// While REQUESTS.url (src/lib/ads.ts) is empty this is a PREVIEW: requests are kept only in this browser
// (localStorage 'nx-ad-requests'), so the full flow can be tried on one device. The real version saves them
// (and the uploaded files) in an online database; only save/list/update below need to change.
import { REQUESTS } from './ads';

export type ArtFile = { name: string; w: number; h: number; data: string };
export type AdRequest = {
  id: string; created: string;
  status: 'revisar' | 'disenar' | 'cambios' | 'aprobada' | 'rechazada';
  paid: boolean;
  client: { name: string; business: string; email: string; phone: string; who: string };
  formats: string[]; where: string; start: string; duration: string; total: number; lines: string[];
  art: { mode: 'upload' | 'design'; files: ArtFile[]; logo?: string; title?: string; msg?: string; cta?: string; theme?: string; notes?: string };
  link: string; note?: string;
};

const KEY = 'nx-ad-requests';
export const isPreview = () => !REQUESTS.url;

export function listRequests(): AdRequest[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
function store(list: AdRequest[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); return true; } catch { return false; } // full or blocked
}
export async function saveRequest(r: AdRequest): Promise<boolean> {
  return store([r, ...listRequests()].slice(0, 20));
}
export function updateRequest(id: string, patch: Partial<AdRequest>) {
  store(listRequests().map((r) => (r.id === id ? { ...r, ...patch } : r)));
}

/** Shrinks an image to at most `max` px and returns it as a data URL (keeps preview storage small). */
export function shrink(img: HTMLImageElement, max = 900, type = 'image/png'): string {
  const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement('canvas');
  c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL(type, 0.85);
}

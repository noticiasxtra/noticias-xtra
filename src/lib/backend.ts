// Shared database (Supabase) for ads: automatic publishing and paid views.
// While BACKEND is empty the site works as a PREVIEW (approved ads and view counts stay on one device).
// Setup (once, when the Supabase account exists):
//   1. Create a project at supabase.com and run supabase/schema.sql in its SQL editor.
//   2. Paste the project URL and the PUBLIC "anon" key below (never the "service_role" key).
//   3. Add each staff member in Supabase → Authentication → Users, and their role in the `staff` table.
import type { Campaign } from './ads';

export const BACKEND = { url: '', anonKey: '' };
export const hasBackend = () => !!(BACKEND.url && BACKEND.anonKey);

const SESSION = 'nx-staff-session'; // staff login token (only when the backend exists)
const head = (token?: string) => ({ apikey: BACKEND.anonKey, Authorization: `Bearer ${token || BACKEND.anonKey}`, 'Content-Type': 'application/json' });
const rest = (path: string) => `${BACKEND.url.replace(/\/$/, '')}/rest/v1/${path}`;
export type LiveCampaign = Campaign & { delivered: number };

/** Campaigns running right now for every reader (dates current and paid views not yet delivered). */
export async function liveCampaigns(): Promise<LiveCampaign[]> {
  if (!hasBackend()) return [];
  try {
    const r = await fetch(rest('ad_campaigns_live?select=*'), { headers: head() });
    if (!r.ok) return [];
    return (await r.json()).map((c: any) => ({ ...c, end: c.end_date, start: c.start_date, delivered: c.delivered ?? 0 }));
  } catch { return []; }
}
/** One view or one click of a campaign (counted for everyone). */
export const countView = (id: string) => hasBackend() && fetch(rest('rpc/ad_view'), { method: 'POST', headers: head(), body: JSON.stringify({ cid: id }), keepalive: true }).catch(() => {});
export const countClick = (id: string) => hasBackend() && fetch(rest('rpc/ad_click'), { method: 'POST', headers: head(), body: JSON.stringify({ cid: id }), keepalive: true }).catch(() => {});
/** Delivered views and clicks for some campaigns (staff panel, advertiser panel). */
export async function campaignStats(ids: string[]): Promise<Record<string, { views: number; clicks: number }>> {
  if (!hasBackend() || !ids.length) return {};
  try {
    const r = await fetch(rest(`ad_stats?campaign_id=in.(${ids.map((i) => `"${i}"`).join(',')})`), { headers: head() });
    return Object.fromEntries((await r.json()).map((x: any) => [x.campaign_id, { views: x.views, clicks: x.clicks }]));
  } catch { return {}; }
}

// ---- Staff login and publishing ----
export const staffToken = () => { try { return JSON.parse(localStorage.getItem(SESSION) || 'null')?.access_token as string | undefined; } catch { return undefined; } };
export async function staffLogin(email: string, password: string): Promise<boolean> {
  const r = await fetch(`${BACKEND.url.replace(/\/$/, '')}/auth/v1/token?grant_type=password`, { method: 'POST', headers: head(), body: JSON.stringify({ email, password }) });
  if (!r.ok) return false;
  try { localStorage.setItem(SESSION, JSON.stringify(await r.json())); } catch { /* storage blocked */ }
  return true;
}
/** Name and role of the logged-in staff member (from the `staff` table), or null if they're not on the team. */
export async function staffProfile(): Promise<{ name: string; role: string } | null> {
  const token = staffToken(); if (!token) return null;
  try {
    const r = await fetch(rest('staff?select=name,role'), { headers: head(token) });
    const row = (await r.json())[0];
    return row ? { name: row.name || 'Equipo', role: row.role } : null;
  } catch { return null; }
}
export const staffLogout = () => { try { localStorage.removeItem(SESSION); } catch { /* storage blocked */ } };

/** Uploads an ad image (data URL) to the public "anuncios" bucket and returns its public address. */
async function uploadImage(name: string, dataUrl: string, token: string) {
  const blob = await (await fetch(dataUrl)).blob();
  const base = BACKEND.url.replace(/\/$/, '');
  const r = await fetch(`${base}/storage/v1/object/anuncios/${name}`, { method: 'POST', headers: { apikey: BACKEND.anonKey, Authorization: `Bearer ${token}`, 'x-upsert': 'true', 'Content-Type': blob.type }, body: blob });
  if (!r.ok) throw new Error('upload');
  return `${base}/storage/v1/object/public/anuncios/${name}`;
}
/** Automatic publishing: approving an ad puts it live for every reader (no code, no rebuild). */
export async function publishCampaign(c: Campaign): Promise<boolean> {
  const token = staffToken(); if (!hasBackend() || !token) return false;
  const creatives = await Promise.all(c.creatives.map(async (cr, i) => (/^data:/.test(cr.img) ? { ...cr, img: await uploadImage(`${c.id.toLowerCase()}-${cr.w}x${cr.h}-${i}.png`, cr.img, token) } : cr)));
  const row = { id: c.id, client: c.client, sizes: c.sizes, start_date: c.start, end_date: c.end, regions: c.regions ?? 'all', takeover: !!c.takeover, skin: c.skin ?? null,
    creatives, views: c.views ?? null, weight: c.weight ?? 1, status: 'active' };
  const r = await fetch(rest('ad_campaigns'), { method: 'POST', headers: { ...head(token), Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify(row) });
  return r.ok;
}
/** Pause or end a campaign early (staff). */
export async function setCampaignStatus(id: string, status: 'active' | 'paused' | 'ended') {
  const token = staffToken(); if (!hasBackend() || !token) return false;
  const r = await fetch(rest(`ad_campaigns?id=eq.${encodeURIComponent(id)}`), { method: 'PATCH', headers: head(token), body: JSON.stringify({ status }) });
  return r.ok;
}

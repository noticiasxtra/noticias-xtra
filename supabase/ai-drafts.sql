-- Noticias Xtra: "Redactar con IA" (panel → Escribir). Run once in Supabase → SQL Editor, after articles.sql. Safe to run again.
-- The admin pastes 3 articles about the same news from authorized outlets; the "redactar-ia" Edge Function writes one
-- original story and the panel saves it in `articles` with status 'review'. It never publishes: only a person does,
-- with the usual "publicar" function.
--   ai_outlets      the outlets that agreed to be used (the admin manages the list in the panel)
--   ai_generations  one row per generation: the log (who, when, which sources) plus what only the admin sees
--                   (facts, independence warning, overlap score, photo licenses, suggestions)

create table if not exists ai_outlets (
  domain text primary key check (domain ~ '^[a-z0-9.-]+\.[a-z]{2,}$'), -- e.g. noticel.com (covers www. and subdomains)
  name text not null,
  permission text not null default '',  -- how and when they agreed (e.g. "Acuerdo con la dirección, octubre 2026")
  added_by text,
  added_at timestamptz not null default now()
);
-- The starting list (approved by the user on 2026-10-03). A domain covers its www. and subdomains. Official sites are
-- public information; U.S. federal sites (weather.gov, nhc.noaa.gov, FEMA, CDC, Census...) are public domain.
insert into ai_outlets (domain, name, permission, added_by) values
  ('noticel.com', 'NotiCel', 'Medio de la casa', 'Sistema'),
  ('periodismoinvestigativo.com', 'Centro de Periodismo Investigativo', 'Investigaciones; acreditar al CPI (confirmar sus condiciones de republicación)', 'Sistema'),
  ('fortaleza.pr.gov', 'La Fortaleza', 'Fuente oficial: información pública', 'Sistema'),
  ('camara.pr.gov', 'Cámara de Representantes de PR', 'Fuente oficial: información pública', 'Sistema'),
  ('senado.pr.gov', 'Senado de Puerto Rico', 'Fuente oficial: información pública', 'Sistema'),
  ('policia.pr.gov', 'Policía de Puerto Rico', 'Fuente oficial: información pública', 'Sistema'),
  ('manejodeemergencias.pr.gov', 'Negociado de Manejo de Emergencias', 'Fuente oficial: información pública', 'Sistema'),
  ('salud.pr.gov', 'Departamento de Salud', 'Fuente oficial: información pública', 'Sistema'),
  ('poderjudicial.pr', 'Rama Judicial', 'Fuente oficial: información pública', 'Sistema'),
  ('oversightboard.pr.gov', 'Junta de Supervisión Fiscal', 'Fuente oficial: información pública', 'Sistema'),
  ('juntasupervision.pr.gov', 'Junta de Supervisión Fiscal', 'Fuente oficial: información pública', 'Sistema'),
  ('lumapr.com', 'LUMA', 'Fuente oficial: comunicados públicos', 'Sistema'),
  ('acueductos.pr.gov', 'Autoridad de Acueductos y Alcantarillados', 'Fuente oficial: información pública', 'Sistema'),
  ('acueductospr.com', 'Autoridad de Acueductos y Alcantarillados', 'Fuente oficial: información pública', 'Sistema'),
  ('weather.gov', 'Servicio Nacional de Meteorología (San Juan)', 'Gobierno federal: dominio público', 'Sistema'),
  ('nhc.noaa.gov', 'Centro Nacional de Huracanes', 'Gobierno federal: dominio público', 'Sistema'),
  ('fema.gov', 'FEMA', 'Gobierno federal: dominio público', 'Sistema'),
  ('cdc.gov', 'CDC', 'Gobierno federal: dominio público', 'Sistema'),
  ('census.gov', 'Negociado del Censo', 'Gobierno federal: dominio público', 'Sistema'),
  ('whitehouse.gov', 'Casa Blanca', 'Gobierno federal: dominio público', 'Sistema'),
  ('congress.gov', 'Congreso de EE. UU.', 'Gobierno federal: dominio público', 'Sistema'),
  ('house.gov', 'Cámara de Representantes de EE. UU.', 'Gobierno federal: dominio público', 'Sistema'),
  ('senate.gov', 'Senado de EE. UU.', 'Gobierno federal: dominio público', 'Sistema'),
  ('bsnpr.com', 'BSN', 'Sitio oficial de la liga', 'Sistema'),
  ('beisboldobleapr.com', 'Béisbol Doble A (Federación de Béisbol Aficionado)', 'Sitio oficial de la liga', 'Sistema'),
  ('ligapr.com', 'Liga de Béisbol Profesional Roberto Clemente', 'Sitio oficial de la liga', 'Sistema'),
  ('mlb.com', 'MLB', 'Sitio oficial de la liga', 'Sistema')
on conflict (domain) do nothing;

create table if not exists ai_generations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users on delete set null,
  created_by_name text,
  urls text[] not null,
  sources jsonb not null default '[]',      -- outlet, title, author, date, words (and the text, to check for copying)
  notes text not null default '',           -- "notas para el redactor"
  independent boolean not null default true,
  warnings text[] not null default '{}',
  facts jsonb,
  story jsonb,                              -- what the AI wrote, before the editor's changes
  overlap numeric,                          -- % of the story's words in 8+ word runs found in a source (quotes excluded)
  overlap_spans jsonb not null default '[]',
  photo_options jsonb not null default '[]',
  suggestions text[] not null default '{}',
  article_id text,                          -- the draft in `articles` (empty once rejected and deleted)
  status text not null default 'started' check (status in ('started', 'review', 'published', 'rejected')),
  decided_by text,
  decided_at timestamptz
);
create index if not exists ai_generations_created on ai_generations (created_at desc);

alter table ai_outlets enable row level security;
alter table ai_generations enable row level security;
-- Admin only (the Edge Function uses the service key and checks the admin role itself)
drop policy if exists "admin outlets" on ai_outlets;
create policy "admin outlets" on ai_outlets for all using (staff_role() = 'admin') with check (staff_role() = 'admin');
drop policy if exists "admin reads generations" on ai_generations;
create policy "admin reads generations" on ai_generations for select using (staff_role() = 'admin');
drop policy if exists "admin decides generations" on ai_generations;
create policy "admin decides generations" on ai_generations for update using (staff_role() = 'admin') with check (staff_role() = 'admin');
-- No insert or delete from the site: the log is written only by the Edge Function and is never erased from the panel.

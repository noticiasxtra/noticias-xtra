-- Columnist profiles (panel → Columnistas). Run once in Supabase → SQL Editor (it is safe to run again).
-- Everyone can read the profiles that are on ("active"); admins and editors create, edit and turn them on/off.
-- The site reads the profiles that are on each time it is built; turned-off columnists leave the Opinión page.
-- Noticias Xtra's own Supabase (each site keeps its own columnists).

create table if not exists columnists (
  slug text primary key,                 -- the profile address: /opinion/<slug>/
  name text not null,                    -- exactly as it appears as the author of their columns
  role text not null default 'Columnista', -- position shown under the name (e.g. "Economía y familia")
  bio text,
  photo text,                            -- picture address (uploaded in the panel or a link)
  email text,                            -- public contact, optional
  x text, instagram text, facebook text, website text, -- social links, optional
  active boolean not null default true,  -- on: shows on the site; off: hidden
  sort integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table columnists enable row level security;
drop policy if exists "public reads active columnists" on columnists;
create policy "public reads active columnists" on columnists for select using (active or exists (select 1 from staff where user_id = auth.uid() and role in ('admin','editor')));
drop policy if exists "editors add columnists" on columnists;
create policy "editors add columnists" on columnists for insert with check (exists (select 1 from staff where user_id = auth.uid() and role in ('admin','editor')));
drop policy if exists "editors edit columnists" on columnists;
create policy "editors edit columnists" on columnists for update using (exists (select 1 from staff where user_id = auth.uid() and role in ('admin','editor')));
grant select on columnists to anon, authenticated;
grant insert, update on columnists to authenticated;

-- Photos: a public "columnistas" folder; admins and editors upload
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('columnistas', 'columnistas', true, 5242880, array['image/jpeg','image/png','image/webp']) on conflict do nothing;
drop policy if exists "editors upload columnist photos" on storage.objects;
create policy "editors upload columnist photos" on storage.objects for insert
  with check (bucket_id = 'columnistas' and exists (select 1 from staff where user_id = auth.uid() and role in ('admin','editor')));

-- The columnist already on the site. The sample profiles (EJEMPLO) in src/data/columnistas.json are left out on purpose:
-- once this table exists the site lists only the real profiles created in the panel.
insert into columnists (slug, name, role, bio, photo, active, sort) values
  ('noticias-xtra', 'Noticias Xtra', 'Editorial', 'La voz institucional de Noticias Xtra: la familia, la fe, el trabajo honrado, la ley y el buen uso del dinero del pueblo.', 'images/columnistas/editorial.svg', true, 1)
on conflict (slug) do nothing;

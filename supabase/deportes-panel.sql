-- Sports items typed by the newsroom (panel → Deportes): boxing fights and champions, tennis players and tournaments.
-- Run once in Supabase → SQL Editor (it is safe to run again). Everyone reads the ones that are on; admins and editors
-- create, edit, switch off and delete them. The site reads them each time it is built (about every 15 minutes).

create table if not exists sports_desk (
  id text primary key,                   -- e.g. "fight-pineiro-vazquez-2026-12-05"
  sport text not null check (sport in ('boxeo', 'tenis')),
  kind text not null check (kind in ('fight', 'champion', 'player', 'tournament')),
  data jsonb not null default '{}'::jsonb, -- the item's fields (see src/lib/desk.ts)
  active boolean not null default true,  -- on: shows on the site; off: hidden
  sort integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table sports_desk enable row level security;
drop policy if exists "public reads active sports items" on sports_desk;
create policy "public reads active sports items" on sports_desk for select using (active or exists (select 1 from staff where user_id = auth.uid() and role in ('admin','editor')));
drop policy if exists "editors add sports items" on sports_desk;
create policy "editors add sports items" on sports_desk for insert with check (exists (select 1 from staff where user_id = auth.uid() and role in ('admin','editor')));
drop policy if exists "editors edit sports items" on sports_desk;
create policy "editors edit sports items" on sports_desk for update using (exists (select 1 from staff where user_id = auth.uid() and role in ('admin','editor')));
drop policy if exists "editors delete sports items" on sports_desk;
create policy "editors delete sports items" on sports_desk for delete using (exists (select 1 from staff where user_id = auth.uid() and role in ('admin','editor')));
grant select on sports_desk to anon, authenticated;
grant insert, update, delete on sports_desk to authenticated;

-- The first fight on the card (from the story of 4 October 2026)
insert into sports_desk (id, sport, kind, data, sort) values
  ('fight-pineiro-vazquez-2026-12-05', 'boxeo', 'fight', '{"date":"2026-12-05T20:00:00-04:00","venue":"Coliseo Rubén Rodríguez","city":"Bayamón","a":{"name":"Stephanie Piñeiro","record":"10-1, 3 KO","country":"Puerto Rico"},"b":{"name":"Litzy Vázquez","record":"9-0, 6 KO","country":"México"},"weight":"140 libras","titles":"Dos títulos mundiales vacantes","status":"programada","tv":"Wynn Records Network"}', 1)
on conflict (id) do nothing;

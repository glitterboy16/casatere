-- Casa Tere — esquema del contenido editable desde la web.
-- Ejecutar una vez en el SQL Editor del proyecto de Supabase.
-- Es seguro volver a ejecutarlo (idempotente).

-- Un documento JSON por sección editable:
-- carta · vinos · galeria · contacto · horario
create table if not exists site_content (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table site_content enable row level security;

drop policy if exists "site_content: lectura pública" on site_content;
create policy "site_content: lectura pública"
  on site_content for select
  using (true);

drop policy if exists "site_content: insertar solo autenticados" on site_content;
create policy "site_content: insertar solo autenticados"
  on site_content for insert
  to authenticated
  with check (true);

drop policy if exists "site_content: actualizar solo autenticados" on site_content;
create policy "site_content: actualizar solo autenticados"
  on site_content for update
  to authenticated
  using (true)
  with check (true);

-- Cambios en vivo entre dispositivos (si falla, el resto sigue funcionando)
do $$
begin
  alter publication supabase_realtime add table site_content;
exception when others then
  raise notice 'Tiempo real no activado para site_content (%)', sqlerrm;
end $$;

-- Bucket público para las fotos de la galería
insert into storage.buckets (id, name, public)
values ('galeria', 'galeria', true)
on conflict (id) do nothing;

drop policy if exists "galeria: lectura pública de fotos" on storage.objects;
create policy "galeria: lectura pública de fotos"
  on storage.objects for select
  using (bucket_id = 'galeria');

drop policy if exists "galeria: subir fotos solo autenticados" on storage.objects;
create policy "galeria: subir fotos solo autenticados"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'galeria');

drop policy if exists "galeria: borrar fotos solo autenticados" on storage.objects;
create policy "galeria: borrar fotos solo autenticados"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'galeria');

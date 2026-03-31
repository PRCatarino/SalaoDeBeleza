-- Rodar no SQL Editor se seu projeto já existia sem estes campos / políticas
-- (idempotente)

alter table public.profiles add column if not exists salon_address text;
alter table public.profiles add column if not exists store_description text;
alter table public.profiles add column if not exists cnpj text;
alter table public.profiles add column if not exists owner_cpf text;
alter table public.profiles add column if not exists store_phone text;
alter table public.profiles add column if not exists store_email text;

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

-- Bucket público para fotos de perfil (opcional)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Avatars public read" on storage.objects;
create policy "Avatars public read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "Avatars authenticated upload" on storage.objects;
create policy "Avatars authenticated upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'avatars');

drop policy if exists "Avatars authenticated update" on storage.objects;
create policy "Avatars authenticated update" on storage.objects
  for update to authenticated using (bucket_id = 'avatars');

drop policy if exists "Avatars authenticated delete" on storage.objects;
create policy "Avatars authenticated delete" on storage.objects
  for delete to authenticated using (bucket_id = 'avatars');

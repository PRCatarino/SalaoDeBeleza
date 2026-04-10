-- ============================================
-- Salão de Beleza - Database Schema
-- Execute this in Supabase SQL Editor
-- ============================================

-- 1. Profiles (extends auth.users) + dados da loja
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  avatar_url text,
  role text not null default 'admin' check (role in ('admin', 'manager')),
  salon_name text not null default 'Meu Salão',
  salon_address text,
  store_description text,
  cnpj text,
  owner_cpf text,
  store_phone text,
  store_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tentativas de cadastro (rate limit; só service role / API server)
create table if not exists public.signup_attempts (
  id uuid default gen_random_uuid() primary key,
  email_norm text not null,
  ip text,
  created_at timestamptz not null default now()
);
create index if not exists signup_attempts_email_time_idx
  on public.signup_attempts (email_norm, created_at desc);
create index if not exists signup_attempts_ip_time_idx
  on public.signup_attempts (ip, created_at desc);
alter table public.signup_attempts enable row level security;

grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on table public.signup_attempts to postgres, service_role;

-- 2. Professionals (staff members)
create table if not exists public.professionals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete set null,
  full_name text not null,
  role_title text not null,
  email text,
  phone text,
  avatar_url text,
  status text not null default 'active' check (status in ('active', 'away', 'inactive')),
  commission_type text not null default 'percentage' check (commission_type in ('percentage', 'fixed')),
  commission_value numeric(10,2) not null default 0,
  color text not null default '#6d28d9',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Service Categories
create table if not exists public.service_categories (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  color text not null default '#5300b7',
  created_at timestamptz not null default now()
);

-- 4. Services
create table if not exists public.services (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  category_id uuid references public.service_categories on delete set null,
  duration_minutes integer not null default 60,
  price numeric(10,2) not null default 0,
  description text,
  online_booking boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Clients
create table if not exists public.clients (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  email text,
  phone text not null,
  cpf text not null,
  birth_date date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. Appointments
create table if not exists public.appointments (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.clients on delete set null,
  professional_id uuid references public.professionals on delete set null,
  service_id uuid references public.services on delete set null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  price numeric(10,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 7. Inventory Products
create table if not exists public.inventory_products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  sku text unique,
  category text not null default 'Geral',
  stock_quantity integer not null default 0,
  min_stock integer not null default 5,
  unit_price numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 8. Financial Transactions
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  type text not null check (type in ('income', 'expense')),
  category text not null,
  description text not null,
  amount numeric(10,2) not null,
  payment_method text,
  appointment_id uuid references public.appointments on delete set null,
  date timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

alter table public.profiles enable row level security;
alter table public.professionals enable row level security;
alter table public.service_categories enable row level security;
alter table public.services enable row level security;
alter table public.clients enable row level security;
alter table public.appointments enable row level security;
alter table public.inventory_products enable row level security;
alter table public.transactions enable row level security;

-- Profiles: users can read/update/insert their own profile
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- All other tables: authenticated users have full access (single-salon setup)
create policy "Authenticated read" on public.professionals for select to authenticated using (true);
create policy "Authenticated insert" on public.professionals for insert to authenticated with check (true);
create policy "Authenticated update" on public.professionals for update to authenticated using (true);
create policy "Authenticated delete" on public.professionals for delete to authenticated using (true);

create policy "Authenticated read" on public.service_categories for select to authenticated using (true);
create policy "Authenticated insert" on public.service_categories for insert to authenticated with check (true);
create policy "Authenticated update" on public.service_categories for update to authenticated using (true);
create policy "Authenticated delete" on public.service_categories for delete to authenticated using (true);

create policy "Authenticated read" on public.services for select to authenticated using (true);
create policy "Authenticated insert" on public.services for insert to authenticated with check (true);
create policy "Authenticated update" on public.services for update to authenticated using (true);
create policy "Authenticated delete" on public.services for delete to authenticated using (true);

create policy "Authenticated read" on public.clients for select to authenticated using (true);
create policy "Authenticated insert" on public.clients for insert to authenticated with check (true);
create policy "Authenticated update" on public.clients for update to authenticated using (true);
create policy "Authenticated delete" on public.clients for delete to authenticated using (true);

create policy "Authenticated read" on public.appointments for select to authenticated using (true);
create policy "Authenticated insert" on public.appointments for insert to authenticated with check (true);
create policy "Authenticated update" on public.appointments for update to authenticated using (true);
create policy "Authenticated delete" on public.appointments for delete to authenticated using (true);

create policy "Authenticated read" on public.inventory_products for select to authenticated using (true);
create policy "Authenticated insert" on public.inventory_products for insert to authenticated with check (true);
create policy "Authenticated update" on public.inventory_products for update to authenticated using (true);
create policy "Authenticated delete" on public.inventory_products for delete to authenticated using (true);

create policy "Authenticated read" on public.transactions for select to authenticated using (true);
create policy "Authenticated insert" on public.transactions for insert to authenticated with check (true);
create policy "Authenticated update" on public.transactions for update to authenticated using (true);
create policy "Authenticated delete" on public.transactions for delete to authenticated using (true);

-- ============================================
-- Auto-create profile on signup
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, salon_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'salon_name', 'Meu Salão')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- Updated_at trigger
-- ============================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.profiles for each row execute procedure public.update_updated_at();
create trigger set_updated_at before update on public.professionals for each row execute procedure public.update_updated_at();
create trigger set_updated_at before update on public.services for each row execute procedure public.update_updated_at();
create trigger set_updated_at before update on public.clients for each row execute procedure public.update_updated_at();
create trigger set_updated_at before update on public.appointments for each row execute procedure public.update_updated_at();
create trigger set_updated_at before update on public.inventory_products for each row execute procedure public.update_updated_at();

-- ============================================
-- Storage: avatars (foto de perfil)
-- ============================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatars public read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Avatars authenticated upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'avatars');

create policy "Avatars authenticated update" on storage.objects
  for update to authenticated using (bucket_id = 'avatars');

create policy "Avatars authenticated delete" on storage.objects
  for delete to authenticated using (bucket_id = 'avatars');

-- ============================================
-- Seed default service categories
-- ============================================
insert into public.service_categories (name, color) values
  ('Cabelo', '#6d28d9'),
  ('Unhas', '#059669'),
  ('Estética', '#5654a8'),
  ('Massagem', '#8f4200'),
  ('Barba', '#d97706')
on conflict (name) do nothing;

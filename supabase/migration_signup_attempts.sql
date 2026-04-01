-- Rate limit de cadastro (rode se o projeto já existia sem esta tabela)
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

-- API com service_role precisa aceder à tabela via PostgREST
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on table public.signup_attempts to postgres, service_role;

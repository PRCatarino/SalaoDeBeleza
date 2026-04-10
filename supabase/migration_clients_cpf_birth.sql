-- Clientes: CPF, data de nascimento e telefone obrigatórios no app.
-- Execute no SQL Editor (Supabase) ou no Postgres se a tabela clients já existir.

alter table public.clients add column if not exists cpf text;
alter table public.clients add column if not exists birth_date date;

-- Ajuste os valores abaixo se já houver clientes reais (evite CPF fictício em produção).
-- CPF de exemplo válido só para preencher linhas antigas; edite cada cliente depois.
update public.clients
set cpf = '52998224725'
where cpf is null or trim(cpf) = '';

update public.clients
set birth_date = '1990-01-01'::date
where birth_date is null;

update public.clients
set phone = '-'
where phone is null or trim(phone) = '';

alter table public.clients alter column cpf set not null;
alter table public.clients alter column birth_date set not null;
alter table public.clients alter column phone set not null;

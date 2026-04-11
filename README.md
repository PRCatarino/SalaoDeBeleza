# Atelier Concierge - Sistema de Gestão para Salões de Beleza

Sistema completo de gestão para salões de beleza com Next.js e Supabase.

## Funcionalidades

- **Autenticação** - Login/cadastro com e-mail e senha (Supabase Auth)
- **Dashboard** - Visão geral com faturamento, agendamentos, clientes e alertas
- **Agenda** - Agendamento visual por profissional com criação de clientes
- **Serviços** - CRUD completo com categorias, preços e agendamento online
- **Equipe** - Gestão de profissionais com comissão e status
- **Estoque** - Controle de produtos com alertas de estoque baixo
- **Financeiro** - Receitas, despesas, lucro e transações detalhadas
- **Perfil e Loja** - Endereço, CNPJ, CPF do responsável, contato, descrição e foto (URL ou upload no bucket `avatars`)

## Configuração

### 1. Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. No **SQL Editor**, execute o conteúdo de `supabase/schema.sql` (projeto novo)
3. Se o banco **já existia** antes dessa versão, execute também `supabase/migration_profile_store.sql` (colunas extras, política de insert em `profiles`, storage `avatars`)
4. Em **Settings > API**, copie a **URL** e a chave pública

### 2. Variáveis de Ambiente

Copie `.env.local.example` para `.env.local`. O backend fala **direto com o Postgres** (não usa SDK do Supabase no código).

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | Sim | Connection string PostgreSQL (veja Supabase abaixo). |
| `AUTH_SECRET` | Sim | Mínimo **32 caracteres**. Ex.: `openssl rand -base64 32`. Sem isso o middleware redireciona com erro. |
| `NEXT_PUBLIC_SITE_URL` | Não | URL pública do app (sem `/` no final), útil para links absolutos. |

**Supabase como banco na Vercel:** use a string **Transaction pooler** (porta **6543**, host `…pooler.supabase.com`), não a conexão direta `db.xxx.supabase.co:5432` (costuma falhar na Vercel por IPv6). Em **Supabase → Connect → ORMs → Transaction pooler** copie a URI e acrescente `?sslmode=require` se não vier na string.

Postgres em VPS **sem** TLS: defina `DATABASE_SSL=false` nas env vars.

### 3. Deploy na Vercel

1. **Settings → Environment Variables** (marque **Production** e, se quiser, **Preview**):

| Nome | Valor |
|------|--------|
| `DATABASE_URL` | URI do pooler (6543) ou do seu Postgres |
| `AUTH_SECRET` | string ≥ 32 caracteres |
| `NEXT_PUBLIC_SITE_URL` | `https://SEU-PROJETO.vercel.app` (opcional) |
| `DATABASE_SSL` | `false` só se o banco for local/VPS sem SSL |

2. Salve e faça **Redeploy** (Deployments → ⋮ → Redeploy).

**Se o build passar mas o site quebra (login/API 503):** quase sempre é `DATABASE_URL` errada, banco inacessível da Vercel, ou falta de `AUTH_SECRET`. No log da função, erros de Postgres aparecem como `db_unreachable` / `ECONNREFUSED`.

**Erro `origin_mismatch` / 403 em cadastro:** em produção a API exige `Origin` do mesmo host; uso normal pelo browser na URL do deploy está ok.

### 4. Instalar e Rodar

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`

### 5. Primeiro Acesso

1. Na tela de login, clique em **Cadastre-se**
2. Preencha e-mail, senha, nome e nome do salão (a conta é criada no Postgres do projeto)
3. Faça login e cadastre serviços, equipe e clientes

## Tecnologias

- **Next.js 15** (App Router)
- **Supabase** (Auth + PostgreSQL + RLS)
- **Tailwind CSS 4**
- **TypeScript**

## Segurança

- Row Level Security (RLS) em todas as tabelas
- Middleware de autenticação em todas as rotas
- Cookies HttpOnly para sessão
- Validação de dados no frontend e banco

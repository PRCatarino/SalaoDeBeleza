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

Copie `.env.local.example` para `.env.local` e preencha a URL do projeto e a chave pública (publishable **ou** anon JWT):

```
NEXT_PUBLIC_SITE_URL=https://salao-de-beleza-ex7t5wa5b-prcatarinos-projects.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_...
```

(Alternativa: `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...` — o app aceita qualquer uma das duas.)

### 3. Deploy na Vercel

No painel do projeto **Settings → Environment Variables**, adicione **exatamente** (em Production / Preview se quiser):

| Nome | Valor |
|------|--------|
| `NEXT_PUBLIC_SITE_URL` | `https://salao-de-beleza-ex7t5wa5b-prcatarinos-projects.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://SEU_REF.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | sua chave `sb_publishable_…` |

*(Ou use `NEXT_PUBLIC_SUPABASE_ANON_KEY` com o JWT `eyJ…` no lugar da publishable.)*

Sem essas duas variáveis o **middleware** falha ou não autentica. Depois de salvar, faça um **Redeploy**.

Adicione também **`NEXT_PUBLIC_SITE_URL`** com a URL pública do app (sem barra no final), ex.: `https://salao-de-beleza-ex7t5wa5b-prcatarinos-projects.vercel.app`. Assim o link **“Confirmar e-mail”** volta para a Vercel, e não para `localhost`.

#### Confirmação de e-mail (não cair em localhost)

No Supabase: **Authentication → URL Configuration**

| Campo | Valor sugerido |
|--------|----------------|
| **Site URL** | `https://salao-de-beleza-ex7t5wa5b-prcatarinos-projects.vercel.app` (ou domínio customizado) |
| **Redirect URLs** | Inclua todas as URLs abaixo (uma por linha): |

```
http://localhost:3000/auth/callback
https://salao-de-beleza-ex7t5wa5b-prcatarinos-projects.vercel.app/auth/callback
```

Sem isso, o Supabase pode gerar links apontando só para o Site URL antigo (ex.: localhost). Depois de alterar, peça um novo e-mail de confirmação ou cadastre de novo.

### 4. Instalar e Rodar

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`

### 5. Primeiro Acesso

1. Na tela de login, clique em "Cadastre-se"
2. Crie sua conta com e-mail e senha
3. Confirme o e-mail (verifique sua caixa de entrada)
4. Faça login e comece a cadastrar seus dados

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

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

## Configuração

### 1. Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. No **SQL Editor**, execute o conteúdo de `supabase/schema.sql`
3. Em **Settings > API**, copie a **URL** e a **anon key**

### 2. Variáveis de Ambiente

Copie `.env.local.example` para `.env.local` e preencha a URL do projeto e a chave pública (publishable **ou** anon JWT):

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_...
```

(Alternativa: `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...` — o app aceita qualquer uma das duas.)

### 3. Instalar e Rodar

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`

### 4. Primeiro Acesso

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

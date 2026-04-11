/** Textos para códigos de erro de banco devolvidos pela API (login, /me, /api/rpc). */
export function databaseErrorMessage(code: string | undefined): string {
  switch (code) {
    case "db_auth_failed":
      return "A DATABASE_URL está com utilizador ou palavra-passe incorretos no PostgreSQL. No Supabase: Settings → Database → copie de novo a URI (pooler 6543) com a password atual.";
    case "db_schema_outdated":
      return "O PostgreSQL está desatualizado em relação ao app: falta coluna ou tabela. No Supabase, abra o SQL Editor e execute os ficheiros em ordem: supabase/schema.sql (projeto novo) ou as migrations (ex.: migration_clients_cpf_birth.sql) indicadas no README.";
    case "db_unreachable":
      return "Não foi possível ligar ao PostgreSQL. Confirme DATABASE_URL na Vercel (pooler Supabase porta 6543, ?sslmode=require), rede e se o projeto Supabase está ativo.";
    default:
      return "Erro ao falar com o banco de dados. Veja os logs da função na Vercel ou confirme DATABASE_URL e migrations.";
  }
}

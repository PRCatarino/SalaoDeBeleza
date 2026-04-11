import { NextResponse } from "next/server";
import {
  isDbConnectionRefused,
  isPgPasswordAuthFailed,
  isPgSchemaMismatchError,
} from "@/lib/db-connect-error";

type RpcBody = { error: string };
type IntentBody = { ok: false; code: string };

function rpc503(error: string): NextResponse {
  return NextResponse.json({ error } satisfies RpcBody, { status: 503 });
}

function intent503(code: string): NextResponse {
  return NextResponse.json({ ok: false, code } satisfies IntentBody, {
    status: 503,
  });
}

/**
 * Mapeia erros comuns de Postgres para respostas 503 com código estável no JSON.
 * @returns resposta ou null se não for um destes erros (tratar como 500).
 */
export function nextResponseForDbError(
  e: unknown,
  logLabel: string,
  format: "rpc" | "intent" = "rpc"
): NextResponse | null {
  const log = () => console.error(`[${logLabel}]`, e);

  if (isPgPasswordAuthFailed(e)) {
    log();
    return format === "intent"
      ? intent503("db_auth_failed")
      : rpc503("db_auth_failed");
  }
  if (isDbConnectionRefused(e)) {
    log();
    return format === "intent"
      ? intent503("db_unreachable")
      : rpc503("db_unreachable");
  }
  if (isPgSchemaMismatchError(e)) {
    log();
    return format === "intent"
      ? intent503("db_schema_outdated")
      : rpc503("db_schema_outdated");
  }
  return null;
}

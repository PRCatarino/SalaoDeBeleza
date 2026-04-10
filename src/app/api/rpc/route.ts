import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, verifySession } from "@/lib/auth/jwt";
import { isDbConnectionRefused } from "@/lib/db-connect-error";
import { assertMutationOrigin } from "@/lib/request-origin";
import * as db from "@/server/salon-db";

export async function POST(request: Request) {
  try {
    assertMutationOrigin(request);
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let sub: string;
  let email: string;
  try {
    const s = await verifySession(raw);
    sub = s.sub;
    email = s.email;
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { op?: string; args?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const op = typeof body.op === "string" ? body.op : "";
  const args =
    body.args && typeof body.args === "object" && body.args !== null
      ? (body.args as Record<string, unknown>)
      : {};

  try {
    let data: unknown;
    switch (op) {
      case "dashboardLoad":
        data = await db.dashboardLoad(sub, args);
        break;
      case "professionalsList":
        data = await db.professionalsList(sub, args);
        break;
      case "professionalsListActive":
        data = await db.professionalsListActive(sub, args);
        break;
      case "professionalsInsert":
        data = await db.professionalsInsert(sub, args);
        break;
      case "professionalsUpdate":
        data = await db.professionalsUpdate(sub, args);
        break;
      case "professionalsDelete":
        data = await db.professionalsDelete(sub, args);
        break;
      case "professionalsAppointmentsMonthCount":
        data = await db.professionalsAppointmentsMonthCount(sub, args);
        break;
      case "serviceCategoriesList":
        data = await db.serviceCategoriesList(sub, args);
        break;
      case "servicesListWithCategory":
        data = await db.servicesListWithCategory(sub, args);
        break;
      case "servicesInsert":
        data = await db.servicesInsert(sub, args);
        break;
      case "servicesUpdate":
        data = await db.servicesUpdate(sub, args);
        break;
      case "servicesDelete":
        data = await db.servicesDelete(sub, args);
        break;
      case "servicesToggleBooking":
        data = await db.servicesToggleBooking(sub, args);
        break;
      case "clientsList":
        data = await db.clientsList(sub, args);
        break;
      case "clientsInsert":
        data = await db.clientsInsert(sub, args);
        break;
      case "clientsUpdate":
        data = await db.clientsUpdate(sub, args);
        break;
      case "clientsDelete":
        data = await db.clientsDelete(sub, args);
        break;
      case "appointmentsForDay":
        data = await db.appointmentsForDay(sub, args);
        break;
      case "appointmentsInsert":
        data = await db.appointmentsInsert(sub, args);
        break;
      case "appointmentsUpdateStatus":
        data = await db.appointmentsUpdateStatus(sub, args);
        break;
      case "transactionsInsert":
        data = await db.transactionsInsert(sub, args);
        break;
      case "transactionsListFrom":
        data = await db.transactionsListFrom(sub, args);
        break;
      case "transactionsDelete":
        data = await db.transactionsDelete(sub, args);
        break;
      case "inventoryList":
        data = await db.inventoryList(sub, args);
        break;
      case "inventoryInsert":
        data = await db.inventoryInsert(sub, args);
        break;
      case "inventoryUpdate":
        data = await db.inventoryUpdate(sub, args);
        break;
      case "inventoryDelete":
        data = await db.inventoryDelete(sub, args);
        break;
      case "profileGet":
        data = await db.profileGet(sub);
        break;
      case "profileEnsure":
        data = await db.profileEnsure(sub, email);
        break;
      case "profileUpsert":
        data = await db.profileUpsert(sub, args);
        break;
      default:
        return NextResponse.json({ error: "unknown_op" }, { status: 400 });
    }
    return NextResponse.json({ data });
  } catch (e) {
    const clientFieldErrors = new Set([
      "invalid_client_full_name",
      "invalid_client_phone",
      "invalid_client_cpf",
      "invalid_client_birth_date",
    ]);
    if (e instanceof Error && clientFieldErrors.has(e.message)) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    if (e instanceof Error && e.message === "invalid_avatar_url") {
      return NextResponse.json({ error: "invalid_avatar_url" }, { status: 400 });
    }
    if (isDbConnectionRefused(e)) {
      return NextResponse.json({ error: "db_unreachable" }, { status: 503 });
    }
    console.error("[rpc]", op, e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

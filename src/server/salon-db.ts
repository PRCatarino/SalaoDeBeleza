import { sanitizeAvatarUrl } from "@/lib/avatar-policy";
import { getSql, type SqlClient } from "@/lib/db";

function monthRange(year: number, month1to12: number) {
  const start = new Date(Date.UTC(year, month1to12 - 1, 1));
  const end = new Date(Date.UTC(year, month1to12, 1));
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

/** Login: find user by normalized email. */
export async function loginLookup(email: string) {
  const sql = getSql();
  const norm = email.trim().toLowerCase();
  const rows = await sql<{ id: string; password_hash: string }[]>`
    SELECT id::text, password_hash FROM app_users WHERE email = ${norm} LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;
  return { id: row.id, password_hash: row.password_hash };
}

/** Register app user + default profile (transaction). */
export async function registerUserApp(params: {
  email: string;
  passwordHash: string;
  fullName: string;
  salonName: string;
}) {
  const db = getSql();
  return await db.begin(async (tx) => {
    const sql = tx as unknown as SqlClient;
    const [user] = await sql<{ id: string }[]>`
      INSERT INTO app_users (email, password_hash)
      VALUES (${params.email.trim().toLowerCase()}, ${params.passwordHash})
      RETURNING id::text
    `;
    await sql`
      INSERT INTO profiles (id, full_name, salon_name)
      VALUES (${user.id}::uuid, ${params.fullName.trim()}, ${params.salonName.trim()})
    `;
    return { id: user.id };
  });
}

export async function profileGet(sub: string) {
  const sql = getSql();
  const rows = await sql`
    SELECT
      id::text,
      full_name,
      avatar_url,
      role,
      salon_name,
      salon_address,
      store_description,
      cnpj,
      owner_cpf,
      store_phone,
      store_email,
      created_at::text,
      updated_at::text
    FROM profiles
    WHERE id = ${sub}::uuid
    LIMIT 1
  `;
  const row = rows[0] ?? null;
  if (!row) return null;
  return {
    ...row,
    avatar_url: sanitizeAvatarUrl(row.avatar_url, sub),
  };
}

export async function profileEnsure(sub: string, email: string) {
  const sql = getSql();
  let rows = await sql`
    SELECT
      id::text,
      full_name,
      avatar_url,
      role,
      salon_name,
      salon_address,
      store_description,
      cnpj,
      owner_cpf,
      store_phone,
      store_email,
      created_at::text,
      updated_at::text
    FROM profiles
    WHERE id = ${sub}::uuid
  `;
  if (!rows.length) {
    const display = email.includes("@") ? email.split("@")[0]! : email;
    await sql`
      INSERT INTO profiles (id, full_name, salon_name)
      VALUES (${sub}::uuid, ${display || "Usuário"}, ${"Meu Salão"})
    `;
    rows = await sql`
      SELECT
        id::text,
        full_name,
        avatar_url,
        role,
        salon_name,
        salon_address,
        store_description,
        cnpj,
        owner_cpf,
        store_phone,
        store_email,
        created_at::text,
        updated_at::text
      FROM profiles
      WHERE id = ${sub}::uuid
    `;
  }
  const r = rows[0] ?? null;
  if (!r) return null;
  return {
    ...r,
    avatar_url: sanitizeAvatarUrl(r.avatar_url, sub),
  };
}

const PROFILE_PATCH_KEYS = new Set([
  "full_name",
  "avatar_url",
  "role",
  "salon_name",
  "salon_address",
  "store_description",
  "cnpj",
  "owner_cpf",
  "store_phone",
  "store_email",
]);

export async function profileUpsert(
  sub: string,
  patch: Record<string, unknown>
) {
  const sql = getSql();
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (!PROFILE_PATCH_KEYS.has(k) || v === undefined) continue;
    if (k === "role" && v !== "admin" && v !== "manager") continue;
    if (k === "avatar_url") {
      const raw =
        v === null || v === undefined
          ? null
          : typeof v === "string"
            ? v
            : null;
      const trimmed = raw?.trim() ?? "";
      const clean = sanitizeAvatarUrl(trimmed || null, sub);
      if (trimmed.length > 0 && clean === null) {
        throw new Error("invalid_avatar_url");
      }
      data[k] = clean;
      continue;
    }
    data[k] = v;
  }
  const keys = Object.keys(data);
  if (!keys.length) {
    return profileGet(sub);
  }
  await sql`
    UPDATE profiles
    SET ${sql(data, ...(keys as [string, ...string[]]))}
    WHERE id = ${sub}::uuid
  `;
  return profileGet(sub);
}

export async function dashboardLoad(
  _userId: string,
  args: Record<string, unknown>
) {
  const sql = getSql();
  const now = new Date();
  const startOfMonthIso =
    args.startOfMonth != null
      ? String(args.startOfMonth)
      : new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const todayIso =
    args.today != null
      ? String(args.today)
      : new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        ).toISOString();
  const tomorrowIso =
    args.tomorrow != null
      ? String(args.tomorrow)
      : (() => {
          const t = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          t.setDate(t.getDate() + 1);
          return t.toISOString();
        })();

  const [
    appointmentRows,
    incomeRows,
    newClientRows,
    upcomingRows,
    inventoryRows,
  ] = await Promise.all([
    sql`
      SELECT id, price::float8 FROM appointments
      WHERE start_time >= ${startOfMonthIso}
      AND status <> 'cancelled'
    `,
    sql`
      SELECT amount::float8, date::text, type FROM transactions
      WHERE type = 'income' AND date >= ${startOfMonthIso}
    `,
    sql`
      SELECT id FROM clients WHERE created_at >= ${startOfMonthIso}
    `,
    sql`
      SELECT
        a.id,
        a.client_id,
        a.professional_id,
        a.service_id,
        a.start_time::text,
        a.end_time::text,
        a.status,
        a.price::float8,
        a.notes,
        a.created_at::text,
        a.updated_at::text
      FROM appointments a
      WHERE a.start_time >= ${todayIso}
      AND a.start_time < ${tomorrowIso}
      ORDER BY a.start_time ASC
      LIMIT 5
    `,
    sql`
      SELECT id, stock_quantity, min_stock FROM inventory_products
    `,
  ]);

  const totalRevenue =
    incomeRows.reduce((s, t) => s + Number(t.amount), 0) || 0;
  const appointmentCount = appointmentRows.length;
  const avgTicket =
    appointmentCount > 0 ? totalRevenue / appointmentCount : 0;

  const days: number[] = Array(7).fill(0);
  for (const t of incomeRows) {
    const day = new Date(t.date as string).getDay();
    days[day] = (days[day] ?? 0) + Number(t.amount);
  }

  const lowStock =
    inventoryRows.filter(
      (p) => Number(p.stock_quantity) <= Number(p.min_stock)
    ).length;

  const apps = upcomingRows;
  const clientIds = [...new Set(apps.map((a) => a.client_id).filter(Boolean))];
  const profIds = [...new Set(apps.map((a) => a.professional_id).filter(Boolean))];
  const serviceIds = [...new Set(apps.map((a) => a.service_id).filter(Boolean))];

  const [clients, professionals, services] = await Promise.all([
    clientIds.length
      ? sql`SELECT * FROM clients WHERE id = ANY(${clientIds}::uuid[])`
      : sql`SELECT * FROM clients WHERE false`,
    profIds.length
      ? sql`SELECT * FROM professionals WHERE id = ANY(${profIds}::uuid[])`
      : sql`SELECT * FROM professionals WHERE false`,
    serviceIds.length
      ? sql`SELECT * FROM services WHERE id = ANY(${serviceIds}::uuid[])`
      : sql`SELECT * FROM services WHERE false`,
  ]);

  const cmap = new Map(clients.map((c) => [c.id, c]));
  const pmap = new Map(professionals.map((p) => [p.id, p]));
  const smap = new Map(services.map((s) => [s.id, s]));

  const upcomingAppointments = apps.map((a) => ({
    ...a,
    client: a.client_id ? cmap.get(a.client_id) : undefined,
    professional: a.professional_id ? pmap.get(a.professional_id) : undefined,
    service: a.service_id ? smap.get(a.service_id) : undefined,
  }));

  return {
    stats: {
      revenue: totalRevenue,
      appointments: appointmentCount,
      newClients: newClientRows.length,
      avgTicket,
    },
    upcomingAppointments,
    revenueByDay: days,
    lowStockCount: lowStock,
  };
}

function proFilter(userId: string) {
  const sql = getSql();
  return sql`user_id = ${userId}::uuid OR user_id IS NULL`;
}

export async function professionalsList(
  userId: string,
  _args: Record<string, unknown>
) {
  const sql = getSql();
  return sql`
    SELECT * FROM professionals
    WHERE ${proFilter(userId)}
    ORDER BY full_name
  `;
}

export async function professionalsListActive(
  userId: string,
  _args: Record<string, unknown>
) {
  const sql = getSql();
  return sql`
    SELECT * FROM professionals
    WHERE status = 'active' AND (${proFilter(userId)})
    ORDER BY full_name
  `;
}

export async function professionalsInsert(
  userId: string,
  args: Record<string, unknown>
) {
  const sql = getSql();
  const [row] = await sql`
    INSERT INTO professionals (
      user_id,
      full_name,
      role_title,
      email,
      phone,
      status,
      commission_type,
      commission_value,
      color
    )
    VALUES (
      ${userId}::uuid,
      ${String(args.full_name ?? "")},
      ${String(args.role_title ?? "")},
      ${args.email != null ? String(args.email) : null},
      ${args.phone != null ? String(args.phone) : null},
      ${String(args.status ?? "active")},
      ${String(args.commission_type ?? "percentage")},
      ${Number(args.commission_value ?? 0)},
      ${String(args.color ?? "#6d28d9")}
    )
    RETURNING *
  `;
  return row;
}

export async function professionalsUpdate(
  userId: string,
  args: Record<string, unknown>
) {
  const sql = getSql();
  const id = String(args.id ?? "");
  if (!id) throw new Error("id required");
  const [row] = await sql`
    UPDATE professionals SET
      full_name = ${String(args.full_name ?? "")},
      role_title = ${String(args.role_title ?? "")},
      email = ${args.email != null ? String(args.email) : null},
      phone = ${args.phone != null ? String(args.phone) : null},
      status = ${String(args.status ?? "active")},
      commission_type = ${String(args.commission_type ?? "percentage")},
      commission_value = ${Number(args.commission_value ?? 0)},
      color = ${String(args.color ?? "#6d28d9")}
    WHERE id = ${id}::uuid AND (${proFilter(userId)})
    RETURNING *
  `;
  return row ?? null;
}

export async function professionalsDelete(
  userId: string,
  args: Record<string, unknown>
) {
  const sql = getSql();
  const id = String(args.id ?? "");
  if (!id) throw new Error("id required");
  const rows = await sql`
    DELETE FROM professionals
    WHERE id = ${id}::uuid AND (${proFilter(userId)})
    RETURNING id
  `;
  return { deleted: rows.length > 0 };
}

export async function professionalsAppointmentsMonthCount(
  _userId: string,
  args: Record<string, unknown>
) {
  const sql = getSql();
  const now = new Date();
  const y = Number(args.year ?? now.getFullYear());
  const m = Number(args.month ?? now.getMonth() + 1);
  const { startIso, endIso } = monthRange(y, m);
  const profId = args.professional_id
    ? String(args.professional_id)
    : null;
  if (profId) {
    const [{ count }] = await sql<{ count: number }[]>`
      SELECT count(*)::int AS count FROM appointments
      WHERE professional_id = ${profId}::uuid
      AND start_time >= ${startIso}
      AND start_time < ${endIso}
    `;
    return count;
  }
  const [{ count }] = await sql<{ count: number }[]>`
    SELECT count(*)::int AS count FROM appointments
    WHERE start_time >= ${startIso}
    AND start_time < ${endIso}
  `;
  return count;
}

export async function serviceCategoriesList(
  _userId: string,
  _args: Record<string, unknown>
) {
  const sql = getSql();
  return sql`SELECT * FROM service_categories ORDER BY name`;
}

export async function servicesListWithCategory(
  _userId: string,
  _args: Record<string, unknown>
) {
  const sql = getSql();
  return sql`
    SELECT
      s.*,
      to_jsonb(c.*) AS category
    FROM services s
    LEFT JOIN service_categories c ON c.id = s.category_id
    ORDER BY s.name
  `;
}

export async function servicesInsert(
  _userId: string,
  args: Record<string, unknown>
) {
  const sql = getSql();
  const [row] = await sql`
    INSERT INTO services (
      name,
      category_id,
      duration_minutes,
      price,
      description,
      online_booking,
      active
    )
    VALUES (
      ${String(args.name ?? "")},
      ${args.category_id != null ? String(args.category_id) : null}::uuid,
      ${Number(args.duration_minutes ?? 60)},
      ${Number(args.price ?? 0)},
      ${args.description != null ? String(args.description) : null},
      ${args.online_booking !== false},
      ${args.active !== false}
    )
    RETURNING *
  `;
  return row;
}

export async function servicesUpdate(
  _userId: string,
  args: Record<string, unknown>
) {
  const sql = getSql();
  const id = String(args.id ?? "");
  if (!id) throw new Error("id required");
  const [row] = await sql`
    UPDATE services SET
      name = ${String(args.name ?? "")},
      category_id = ${args.category_id != null ? String(args.category_id) : null}::uuid,
      duration_minutes = ${Number(args.duration_minutes ?? 60)},
      price = ${Number(args.price ?? 0)},
      description = ${args.description != null ? String(args.description) : null},
      online_booking = ${args.online_booking !== false},
      active = ${args.active !== false}
    WHERE id = ${id}::uuid
    RETURNING *
  `;
  return row ?? null;
}

export async function servicesDelete(
  _userId: string,
  args: Record<string, unknown>
) {
  const sql = getSql();
  const id = String(args.id ?? "");
  if (!id) throw new Error("id required");
  const rows = await sql`
    DELETE FROM services WHERE id = ${id}::uuid RETURNING id
  `;
  return { deleted: rows.length > 0 };
}

export async function servicesToggleBooking(
  _userId: string,
  args: Record<string, unknown>
) {
  const sql = getSql();
  const id = String(args.id ?? "");
  if (!id) throw new Error("id required");
  const [cur] = await sql<{ online_booking: boolean }[]>`
    SELECT online_booking FROM services WHERE id = ${id}::uuid LIMIT 1
  `;
  if (!cur) return null;
  const next = args.online_booking !== undefined
    ? Boolean(args.online_booking)
    : !cur.online_booking;
  const [row] = await sql`
    UPDATE services SET online_booking = ${next}
    WHERE id = ${id}::uuid
    RETURNING *
  `;
  return row;
}

export async function clientsList(
  _userId: string,
  _args: Record<string, unknown>
) {
  const sql = getSql();
  return sql`SELECT * FROM clients ORDER BY full_name`;
}

export async function clientsInsert(
  _userId: string,
  args: Record<string, unknown>
) {
  const sql = getSql();
  const [row] = await sql`
    INSERT INTO clients (full_name, email, phone, notes)
    VALUES (
      ${String(args.full_name ?? "")},
      ${args.email != null ? String(args.email) : null},
      ${args.phone != null ? String(args.phone) : null},
      ${args.notes != null ? String(args.notes) : null}
    )
    RETURNING *
  `;
  return row;
}

export async function appointmentsForDay(
  _userId: string,
  args: Record<string, unknown>
) {
  const sql = getSql();
  let apps;

  if (args.dayStart != null && args.dayEnd != null) {
    apps = await sql`
      SELECT * FROM appointments
      WHERE start_time >= ${String(args.dayStart)}::timestamptz
      AND start_time <= ${String(args.dayEnd)}::timestamptz
      AND status <> 'cancelled'
      ORDER BY start_time
    `;
  } else {
    const dayStr = String(args.day ?? args.date ?? "");
    const start = new Date(dayStr);
    if (Number.isNaN(start.getTime())) {
      throw new Error("invalid day");
    }
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    apps = await sql`
      SELECT * FROM appointments
      WHERE start_time >= ${start.toISOString()}
      AND start_time < ${end.toISOString()}
      AND status <> 'cancelled'
      ORDER BY start_time
    `;
  }

  const clientIds = [...new Set(apps.map((a) => a.client_id).filter(Boolean))];
  const profIds = [...new Set(apps.map((a) => a.professional_id).filter(Boolean))];
  const serviceIds = [...new Set(apps.map((a) => a.service_id).filter(Boolean))];

  const [clients, professionals, services] = await Promise.all([
    clientIds.length
      ? sql`SELECT * FROM clients WHERE id = ANY(${clientIds}::uuid[])`
      : sql`SELECT * FROM clients WHERE false`,
    profIds.length
      ? sql`SELECT * FROM professionals WHERE id = ANY(${profIds}::uuid[])`
      : sql`SELECT * FROM professionals WHERE false`,
    serviceIds.length
      ? sql`SELECT * FROM services WHERE id = ANY(${serviceIds}::uuid[])`
      : sql`SELECT * FROM services WHERE false`,
  ]);

  const cmap = new Map(clients.map((c) => [c.id, c]));
  const pmap = new Map(professionals.map((p) => [p.id, p]));
  const smap = new Map(services.map((s) => [s.id, s]));

  return apps.map((a) => ({
    ...a,
    client: a.client_id ? cmap.get(a.client_id) : undefined,
    professional: a.professional_id ? pmap.get(a.professional_id) : undefined,
    service: a.service_id ? smap.get(a.service_id) : undefined,
  }));
}

export async function appointmentsInsert(
  _userId: string,
  args: Record<string, unknown>
) {
  const sql = getSql();
  const [row] = await sql`
    INSERT INTO appointments (
      client_id,
      professional_id,
      service_id,
      start_time,
      end_time,
      status,
      price,
      notes
    )
    VALUES (
      ${args.client_id != null ? String(args.client_id) : null}::uuid,
      ${args.professional_id != null ? String(args.professional_id) : null}::uuid,
      ${args.service_id != null ? String(args.service_id) : null}::uuid,
      ${String(args.start_time ?? "")}::timestamptz,
      ${String(args.end_time ?? "")}::timestamptz,
      ${String(args.status ?? "confirmed")},
      ${Number(args.price ?? 0)},
      ${args.notes != null ? String(args.notes) : null}
    )
    RETURNING *
  `;
  return row;
}

export async function appointmentsUpdateStatus(
  _userId: string,
  args: Record<string, unknown>
) {
  const sql = getSql();
  const id = String(args.id ?? "");
  if (!id) throw new Error("id required");
  const [row] = await sql`
    UPDATE appointments SET status = ${String(args.status ?? "confirmed")}
    WHERE id = ${id}::uuid
    RETURNING *
  `;
  return row ?? null;
}

export async function transactionsInsert(
  _userId: string,
  args: Record<string, unknown>
) {
  const sql = getSql();
  const dateVal =
    args.date != null ? String(args.date) : new Date().toISOString();
  const [row] = await sql`
    INSERT INTO transactions (
      type,
      category,
      description,
      amount,
      payment_method,
      appointment_id,
      date
    )
    VALUES (
      ${String(args.type ?? "income")}::text,
      ${String(args.category ?? "")},
      ${String(args.description ?? "")},
      ${Number(args.amount ?? 0)},
      ${args.payment_method != null ? String(args.payment_method) : null},
      ${args.appointment_id != null ? String(args.appointment_id) : null}::uuid,
      ${dateVal}::timestamptz
    )
    RETURNING *
  `;
  return row;
}

export async function transactionsListFrom(
  _userId: string,
  args: Record<string, unknown>
) {
  const sql = getSql();
  const from = String(args.from ?? args.startDate ?? "");
  return sql`
    SELECT * FROM transactions
    WHERE date >= ${from}::timestamptz
    ORDER BY date DESC
  `;
}

export async function transactionsDelete(
  _userId: string,
  args: Record<string, unknown>
) {
  const sql = getSql();
  const id = String(args.id ?? "");
  if (!id) throw new Error("id required");
  const rows = await sql`
    DELETE FROM transactions WHERE id = ${id}::uuid RETURNING id
  `;
  return { deleted: rows.length > 0 };
}

export async function inventoryList(
  _userId: string,
  _args: Record<string, unknown>
) {
  const sql = getSql();
  return sql`SELECT * FROM inventory_products ORDER BY name`;
}

export async function inventoryInsert(
  _userId: string,
  args: Record<string, unknown>
) {
  const sql = getSql();
  const [row] = await sql`
    INSERT INTO inventory_products (
      name,
      description,
      sku,
      category,
      stock_quantity,
      min_stock,
      unit_price
    )
    VALUES (
      ${String(args.name ?? "")},
      ${args.description != null ? String(args.description) : null},
      ${args.sku != null ? String(args.sku) : null},
      ${String(args.category ?? "Geral")},
      ${Number(args.stock_quantity ?? 0)},
      ${Number(args.min_stock ?? 5)},
      ${Number(args.unit_price ?? 0)}
    )
    RETURNING *
  `;
  return row;
}

export async function inventoryUpdate(
  _userId: string,
  args: Record<string, unknown>
) {
  const sql = getSql();
  const id = String(args.id ?? "");
  if (!id) throw new Error("id required");
  const [row] = await sql`
    UPDATE inventory_products SET
      name = ${String(args.name ?? "")},
      description = ${args.description != null ? String(args.description) : null},
      sku = ${args.sku != null ? String(args.sku) : null},
      category = ${String(args.category ?? "Geral")},
      stock_quantity = ${Number(args.stock_quantity ?? 0)},
      min_stock = ${Number(args.min_stock ?? 5)},
      unit_price = ${Number(args.unit_price ?? 0)}
    WHERE id = ${id}::uuid
    RETURNING *
  `;
  return row ?? null;
}

export async function inventoryDelete(
  _userId: string,
  args: Record<string, unknown>
) {
  const sql = getSql();
  const id = String(args.id ?? "");
  if (!id) throw new Error("id required");
  const rows = await sql`
    DELETE FROM inventory_products WHERE id = ${id}::uuid RETURNING id
  `;
  return { deleted: rows.length > 0 };
}

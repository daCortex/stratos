import { neon } from "@neondatabase/serverless";
import { buildSeed, COLLECTIONS, ORG_SCOPED, type DB, type Collection } from "./seed";
import type { ApplicationForm } from "./types";

/* ----------------------------------------------------------------
   Unified async data backend.

   - No DATABASE_URL  → seeded in-memory store (cached on globalThis so dev
     hot-reload keeps state). Runs the whole platform with zero setup.
   - DATABASE_URL set → Neon Postgres. Each entity is its own table
     (id bigint pk, org_id bigint, data jsonb). Tables auto-create on first
     connect and a fresh DB is seeded once via an atomic claim row, so two
     serverless instances can't double-seed.

   Per-entity rows mean concurrent writes to different records never clobber
   each other (unlike a whole-state snapshot).
------------------------------------------------------------------- */

/* Resolve the Postgres connection string. Accepts the standard DATABASE_URL,
   this project's custom name, the names Vercel's Neon/Postgres integrations
   inject, and — as a last resort — any env var that looks like a postgres URL.
   So it "just works" however the variable ended up named. */
function resolveDatabaseUrl(): string | undefined {
  const preferred = [
    "DATABASE_URL", "stratos_Database_URL", "STRATOS_DATABASE_URL", "stratos_DATABASE_URL",
    "POSTGRES_URL", "DATABASE_URL_UNPOOLED", "POSTGRES_URL_NON_POOLING", "POSTGRES_PRISMA_URL",
  ];
  for (const k of preferred) {
    const v = process.env[k];
    if (v && /^postgres(ql)?:\/\//.test(v)) return v;
  }
  for (const [k, v] of Object.entries(process.env)) {
    if (v && /(database|postgres).*url/i.test(k) && /^postgres(ql)?:\/\//.test(v)) return v;
  }
  return undefined;
}

const DATABASE_URL = resolveDatabaseUrl();
export const dbConfigured = !!DATABASE_URL;

/* ---------------- in-memory backend ---------------- */
const g = globalThis as unknown as { __stratos?: DB };
function mem(): DB {
  if (!g.__stratos) g.__stratos = buildSeed();
  const db = g.__stratos as any;
  for (const k of COLLECTIONS) if (!Array.isArray(db[k])) db[k] = [];
  if (!Array.isArray(db.appForms)) db.appForms = [];
  return g.__stratos!;
}

/* ---------------- postgres backend ---------------- */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sql: any = DATABASE_URL ? neon(DATABASE_URL) : null;

let initPromise: Promise<void> | null = null;
function ensureReady(): Promise<void> {
  if (!initPromise) initPromise = initPg();
  return initPromise;
}

async function initPg() {
  await sql`create sequence if not exists stratos_seq`;
  for (const c of COLLECTIONS) {
    await sql.query(`create table if not exists "${c}" (id bigint primary key, org_id bigint, data jsonb not null)`);
    if (ORG_SCOPED[c]) await sql.query(`create index if not exists "${c}_org_idx" on "${c}" (org_id)`);
  }
  await sql`create table if not exists app_forms (org_id bigint primary key, data jsonb not null)`;
  await sql`create table if not exists _meta (k text primary key)`;
  // Only the instance that wins this insert seeds the fresh database.
  const claim = await sql`insert into _meta (k) values ('seeded') on conflict do nothing returning k`;
  if (claim.length) await seedPg();
}

async function seedPg() {
  const demo = buildSeed();
  for (const c of COLLECTIONS) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of (demo as any)[c] as any[]) {
      await sql.query(`insert into "${c}" (id, org_id, data) values ($1, $2, $3::jsonb) on conflict (id) do nothing`, [row.id, row.orgId ?? null, JSON.stringify(row)]);
    }
  }
  for (const f of demo.appForms) {
    await sql.query(`insert into app_forms (org_id, data) values ($1, $2::jsonb) on conflict (org_id) do nothing`, [f.orgId, JSON.stringify(f)]);
  }
  await sql.query(`select setval('stratos_seq', $1)`, [demo.seq]);
}

/* ---------------- unified async API ---------------- */
export async function nextId(): Promise<number> {
  if (sql) { await ensureReady(); const r = await sql`select nextval('stratos_seq') as id`; return Number(r[0].id); }
  const db = mem(); db.seq += 1; return db.seq;
}

export async function all<T>(c: Collection): Promise<T[]> {
  if (sql) { await ensureReady(); const r = await sql.query(`select data from "${c}"`); return r.map((x: { data: T }) => x.data); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return [...((mem() as any)[c] as T[])];
}

export async function byOrg<T>(c: Collection, orgId: number): Promise<T[]> {
  if (sql) { await ensureReady(); const r = await sql.query(`select data from "${c}" where org_id = $1`, [orgId]); return r.map((x: { data: T }) => x.data); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((mem() as any)[c] as any[]).filter((x) => x.orgId === orgId);
}

export async function byKey<T>(c: Collection, key: string, value: number | string): Promise<T[]> {
  if (sql) { await ensureReady(); const r = await sql.query(`select data from "${c}" where data->>'${key}' = $1`, [String(value)]); return r.map((x: { data: T }) => x.data); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((mem() as any)[c] as any[]).filter((x) => x[key] === value);
}

export async function byId<T>(c: Collection, id: number): Promise<T | null> {
  if (sql) { await ensureReady(); const r = await sql.query(`select data from "${c}" where id = $1`, [id]); return r[0]?.data ?? null; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (((mem() as any)[c] as any[]).find((x) => x.id === id) ?? null);
}

export async function insert<T extends { id?: number; orgId?: number }>(c: Collection, obj: T): Promise<T> {
  if (obj.id == null) obj.id = await nextId();
  if (sql) { await ensureReady(); await sql.query(`insert into "${c}" (id, org_id, data) values ($1, $2, $3::jsonb)`, [obj.id, obj.orgId ?? null, JSON.stringify(obj)]); return obj; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (mem() as any)[c].push(obj); return obj;
}

export async function patch<T>(c: Collection, id: number, p: Partial<T>): Promise<void> {
  if (sql) { await ensureReady(); await sql.query(`update "${c}" set data = data || $2::jsonb where id = $1`, [id, JSON.stringify(p)]); return; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = ((mem() as any)[c] as any[]).find((x) => x.id === id); if (row) Object.assign(row, p);
}

export async function remove(c: Collection, id: number): Promise<void> {
  if (sql) { await ensureReady(); await sql.query(`delete from "${c}" where id = $1`, [id]); return; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (mem() as any)[c] = ((mem() as any)[c] as any[]).filter((x) => x.id !== id);
}

export async function removeWhere(c: Collection, key: string, value: number | string): Promise<void> {
  if (sql) { await ensureReady(); await sql.query(`delete from "${c}" where data->>'${key}' = $1`, [String(value)]); return; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (mem() as any)[c] = ((mem() as any)[c] as any[]).filter((x) => x[key] !== value);
}

/* appForms — keyed by orgId, no numeric id */
export async function getAppFormRow(orgId: number): Promise<ApplicationForm | null> {
  if (sql) { await ensureReady(); const r = await sql.query(`select data from app_forms where org_id = $1`, [orgId]); return r[0]?.data ?? null; }
  return mem().appForms.find((f) => f.orgId === orgId) ?? null;
}
export async function upsertAppForm(form: ApplicationForm): Promise<void> {
  if (sql) { await ensureReady(); await sql.query(`insert into app_forms (org_id, data) values ($1, $2::jsonb) on conflict (org_id) do update set data = $2::jsonb`, [form.orgId, JSON.stringify(form)]); return; }
  const db = mem();
  const i = db.appForms.findIndex((f) => f.orgId === form.orgId);
  if (i >= 0) db.appForms[i] = form; else db.appForms.push(form);
}

/* bulk: mark a member's notifications read */
export async function markNotifsRead(membershipId: number): Promise<void> {
  if (sql) { await ensureReady(); await sql.query(`update "notifications" set data = data || '{"read":true}'::jsonb where data->>'membershipId' = $1`, [String(membershipId)]); return; }
  mem().notifications.filter((n) => n.membershipId === membershipId).forEach((n) => (n.read = true));
}

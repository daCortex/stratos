import { NextResponse } from "next/server";
import { dbConfigured } from "@/lib/backend";
import { listAllOrgs } from "@/lib/store";

export const dynamic = "force-dynamic";

/* Lightweight health check. Reports which persistence backend is active and
   whether a live query succeeds. Never exposes the connection string. */
export async function GET() {
  let orgs = -1;
  let ok = true;
  let error: string | null = null;
  try {
    orgs = (await listAllOrgs()).length;
  } catch (e: unknown) {
    ok = false;
    error = e instanceof Error ? e.message : String(e);
  }
  return NextResponse.json({
    persistence: dbConfigured ? "postgres" : "memory",
    ok,
    orgs,
    error,
  });
}

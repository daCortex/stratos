import { NextRequest, NextResponse } from "next/server";
import { getOrgByDomain } from "@/lib/store";

/* Resolves a custom hostname → VA slug. Called by middleware (which runs on
   the edge and can't touch the DB directly). Cached briefly on both ends. */
export async function GET(req: NextRequest) {
  const host = req.nextUrl.searchParams.get("host") || "";
  const org = host ? await getOrgByDomain(host) : null;
  return NextResponse.json(
    { slug: org?.slug ?? null },
    { headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } }
  );
}

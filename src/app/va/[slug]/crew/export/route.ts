import { NextRequest, NextResponse } from "next/server";
import { getOrgBySlug, listMembers, listPireps, memberStats, getMembershipById } from "@/lib/store";
import { currentUser, orgRole } from "@/lib/auth";
import { toCsv } from "@/lib/csv";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = await getOrgBySlug(slug);
  if (!org) return new NextResponse("Not found", { status: 404 });
  const user = await currentUser();
  const { canManage } = await orgRole(org, user);
  if (!canManage) return new NextResponse("Forbidden", { status: 403 });

  const type = req.nextUrl.searchParams.get("type") || "roster";
  let csv = "";
  let filename = "export.csv";

  if (type === "roster") {
    const members = await listMembers(org.id);
    const rows = [];
    for (const m of members) {
      const s = await memberStats(m);
      rows.push([m.callsign, m.ifUsername, m.role, m.rankLabel || "", (s.minutes / 60).toFixed(1), s.pireps, m.status, m.joinedAt]);
    }
    csv = toCsv(["callsign", "ifc", "role", "rank", "hours", "pireps", "status", "joined"], rows);
    filename = `${org.slug}-roster.csv`;
  } else if (type === "pireps") {
    const pireps = await listPireps(org.id);
    const rows = [];
    for (const p of pireps) {
      const m = await getMembershipById(p.membershipId);
      rows.push([m?.callsign || "", p.flightNo, p.dep, p.arr, p.aircraft, (p.minutes / 60).toFixed(2), p.multiplier, p.multiplierCode || "", p.status, p.filedAt]);
    }
    csv = toCsv(["callsign", "flight", "dep", "arr", "aircraft", "hours", "multiplier", "code", "status", "filed"], rows);
    filename = `${org.slug}-pireps.csv`;
  }

  return new NextResponse(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"` },
  });
}

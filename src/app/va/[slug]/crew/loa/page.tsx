import { getOrgBySlug, listLoas, getMembershipById } from "@/lib/store";
import { resolveLoaAction } from "../actions";

export default async function CrewLoa({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = (await getOrgBySlug(slug))!;
  const loas = await listLoas(org.id);
  const name = async (id: number) => (await getMembershipById(id))?.callsign || "—";

  return (
    <>
      <h2 style={{ marginTop: 0, fontSize: "1.3rem" }}>Leave of absence</h2>
      {loas.length === 0 ? <p className="muted">No leave requests.</p> : (
        <div style={{ display: "grid", gap: 10 }}>
          {await Promise.all(loas.map(async (l) => (
            <div key={l.id} className="card" style={{ padding: "1rem 1.2rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 600 }}>{await name(l.membershipId)} · {l.days} days</div>
                <div className="faint" style={{ fontSize: "0.84rem" }}>{l.reason || "No reason given"} · <span style={{ textTransform: "capitalize" }}>{l.status}</span></div>
              </div>
              <form action={resolveLoaAction.bind(null, slug)} style={{ display: "flex", gap: 6 }}>
                <input type="hidden" name="id" value={l.id} />
                {l.status === "pending" && <><button name="decision" value="approve" className="btn btn-primary btn-sm">Approve</button><button name="decision" value="reject" className="btn btn-ghost btn-sm" style={{ color: "#e0556a" }}>Reject</button></>}
                {l.status === "active" && <button name="decision" value="end" className="btn btn-ghost btn-sm">End leave</button>}
              </form>
            </div>
          )))}
        </div>
      )}
    </>
  );
}

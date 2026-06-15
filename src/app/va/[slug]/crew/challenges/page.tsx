import { getOrgBySlug, listChallenges } from "@/lib/store";
import { addChallengeAction, deleteChallengeAction } from "../actions";

export default async function CrewChallenges({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = (await getOrgBySlug(slug))!;
  const challenges = await listChallenges(org.id);
  const cur = org.settings.currency;
  return (
    <>
      <form action={addChallengeAction.bind(null, slug)} className="card" style={{ padding: "1.3rem", display: "grid", gap: 10, marginBottom: 18 }}>
        <h3 style={{ margin: 0 }}>Create a challenge</h3>
        <input name="title" className="input" placeholder="Challenge title" required />
        <textarea name="description" className="input" rows={2} placeholder="Description" />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div><label className="label">Goal type</label><select name="goalType" className="input" style={{ width: 120 }}><option value="pireps">Flights</option><option value="hours">Hours</option><option value="route">Specific route</option></select></div>
          <div><label className="label">Goal value</label><input name="goalValue" type="number" className="input" style={{ width: 90 }} defaultValue={5} /></div>
          <div><label className="label">Route (DEP-ARR)</label><input name="routeIcaoPair" className="input" placeholder="EGLL-KJFK" style={{ width: 130 }} /></div>
          <div><label className="label">Reward ({cur})</label><input name="reward" type="number" className="input" style={{ width: 100 }} defaultValue={500} /></div>
          <button className="btn btn-primary btn-sm" type="submit">Add challenge</button>
        </div>
      </form>

      <div style={{ display: "grid", gap: 10 }}>
        {challenges.map((c) => (
          <div key={c.id} className="card" style={{ padding: "1rem 1.2rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 600 }}>{c.title} <span className="pill" style={{ color: "var(--primary)", borderColor: "var(--primary)", fontSize: "0.62rem" }}>+{c.reward} {cur}</span></div>
              <div className="faint" style={{ fontSize: "0.82rem" }}>{c.goalType === "route" ? `Route ${c.routeIcaoPair}` : `${c.goalValue} ${c.goalType}`}</div>
            </div>
            <form action={deleteChallengeAction.bind(null, slug)}><input type="hidden" name="id" value={c.id} /><button className="btn btn-ghost btn-sm" type="submit" style={{ color: "#e0556a" }}>Delete</button></form>
          </div>
        ))}
        {challenges.length === 0 && <p className="muted">No challenges yet.</p>}
      </div>
    </>
  );
}

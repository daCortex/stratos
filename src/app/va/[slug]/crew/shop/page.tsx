import { getOrgBySlug, listShop, listRedemptions, getMembershipById } from "@/lib/store";
import { addShopItemAction, deleteShopItemAction, resolveRedemptionAction } from "../actions";

export default async function CrewShop({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = (await getOrgBySlug(slug))!;
  const items = await listShop(org.id);
  const reds = await listRedemptions(org.id);
  const cur = org.settings.currency;
  const name = async (id: number) => (await getMembershipById(id))?.callsign || "—";
  const itemName = (id: number) => items.find((i) => i.id === id)?.name || "item";

  return (
    <>
      <form action={addShopItemAction.bind(null, slug)} className="card" style={{ padding: "1.3rem", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 18 }}>
        <div><label className="label">Icon</label><input name="icon" className="input" placeholder="🎁" style={{ width: 60 }} /></div>
        <div><label className="label">Name</label><input name="name" className="input" placeholder="Reward name" required /></div>
        <div style={{ flex: 1, minWidth: 140 }}><label className="label">Description</label><input name="description" className="input" /></div>
        <div><label className="label">Cost ({cur})</label><input name="cost" type="number" className="input" style={{ width: 100 }} required /></div>
        <div><label className="label">Stock (-1=∞)</label><input name="stock" type="number" className="input" style={{ width: 90 }} defaultValue={-1} /></div>
        <button className="btn btn-primary btn-sm" type="submit">Add item</button>
      </form>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginBottom: 24 }}>
        {items.map((it) => (
          <div key={it.id} className="card" style={{ padding: "1.1rem" }}>
            <div style={{ fontSize: "1.6rem" }}>{it.icon}</div>
            <div style={{ fontWeight: 700 }}>{it.name}</div>
            <div className="faint" style={{ fontSize: "0.78rem" }}>{it.description}</div>
            <div style={{ color: "var(--primary)", fontWeight: 700, marginTop: 6 }}>{it.cost.toLocaleString()} {cur} {it.stock >= 0 && <span className="faint" style={{ fontWeight: 400, fontSize: "0.75rem" }}>· {it.stock} left</span>}</div>
            <form action={deleteShopItemAction.bind(null, slug)} style={{ marginTop: 8 }}><input type="hidden" name="id" value={it.id} /><button className="btn btn-ghost btn-sm" type="submit" style={{ color: "#e0556a" }}>Delete</button></form>
          </div>
        ))}
      </div>

      <h3>Redemption requests</h3>
      <div className="card" style={{ overflow: "hidden" }}>
        <table className="data">
          <thead><tr><th>Pilot</th><th>Item</th><th>Cost</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {await Promise.all(reds.map(async (r) => (
              <tr key={r.id}>
                <td>{await name(r.membershipId)}</td>
                <td className="muted">{itemName(r.itemId)}</td>
                <td>{r.cost.toLocaleString()} {cur}</td>
                <td><span className="pill" style={{ fontSize: "0.66rem", textTransform: "capitalize" }}>{r.status}</span></td>
                <td>{r.status === "pending" && (
                  <form action={resolveRedemptionAction.bind(null, slug)} style={{ display: "flex", gap: 6 }}>
                    <input type="hidden" name="id" value={r.id} />
                    <button name="decision" value="fulfil" className="btn btn-primary btn-sm" type="submit">Fulfil</button>
                    <button name="decision" value="cancel" className="btn btn-ghost btn-sm" type="submit">Cancel</button>
                  </form>
                )}</td>
              </tr>
            )))}
          </tbody>
        </table>
        {reds.length === 0 && <p className="muted" style={{ padding: "1.2rem", textAlign: "center" }}>No redemptions yet.</p>}
      </div>
    </>
  );
}

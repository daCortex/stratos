import { getOrgBySlug, listShop, getMembership, pointsBalance } from "@/lib/store";
import { currentUser } from "@/lib/auth";
import { redeemAction } from "../pilot/actions";

export default async function ShopPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ redeemed?: string; error?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const org = (await getOrgBySlug(slug))!;
  const items = await listShop(org.id);
  const user = await currentUser();
  const m = user ? await getMembership(org.id, user.id) : null;
  const balance = m ? await pointsBalance(m.id) : 0;
  const cur = org.settings.currency;

  return (
    <main className="container-x" style={{ paddingTop: 44, paddingBottom: 80, maxWidth: 860 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 10 }}>
        <div>
          <span className="eyebrow" style={{ color: "var(--primary)" }}>Frequent Flyer</span>
          <h1 style={{ fontSize: "2rem", margin: "6px 0 0" }}>Rewards shop</h1>
        </div>
        {m && <div className="card" style={{ padding: "0.7rem 1.2rem" }}><span className="faint" style={{ fontSize: "0.78rem" }}>Your balance</span><div style={{ fontWeight: 700, fontSize: "1.3rem", color: "var(--primary)" }}>{balance.toLocaleString()} {cur}</div></div>}
      </div>

      {sp.redeemed && <p className="pill" style={{ color: "var(--primary)", borderColor: "var(--primary)", marginTop: 14 }}>✓ Redeemed — staff will fulfil it shortly.</p>}
      {sp.error && <p className="pill" style={{ color: "#e0556a", borderColor: "#e0556a", marginTop: 14 }}>{sp.error}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14, marginTop: 22 }}>
        {items.map((it) => (
          <div key={it.id} className="card" style={{ padding: "1.4rem", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: "2rem" }}>{it.icon}</div>
            <div style={{ fontWeight: 700 }}>{it.name}</div>
            <div className="faint" style={{ fontSize: "0.84rem", flex: 1 }}>{it.description}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
              <span style={{ fontWeight: 700, color: "var(--primary)" }}>{it.cost.toLocaleString()} {cur}</span>
              {it.stock === 0 ? <span className="faint" style={{ fontSize: "0.8rem" }}>Sold out</span> : m ? (
                <form action={redeemAction.bind(null, slug)}>
                  <input type="hidden" name="itemId" value={it.id} />
                  <button className="btn btn-primary btn-sm" type="submit" disabled={balance < it.cost}>{balance < it.cost ? "Not enough" : "Redeem"}</button>
                </form>
              ) : <span className="faint" style={{ fontSize: "0.78rem" }}>Sign in</span>}
            </div>
            {it.stock > 0 && <div className="faint" style={{ fontSize: "0.72rem" }}>{it.stock} left</div>}
          </div>
        ))}
      </div>
      {items.length === 0 && <p className="muted">The shop is empty right now.</p>}
    </main>
  );
}

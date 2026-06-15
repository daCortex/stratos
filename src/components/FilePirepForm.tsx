"use client";

import { useState } from "react";
import type { Org } from "@/lib/types";
import { filePirepAction } from "@/app/va/[slug]/pilot/actions";

export default function FilePirepForm({ org }: { org: Org }) {
  const [hours, setHours] = useState(0);
  const [mins, setMins] = useState(0);
  const [code, setCode] = useState("");
  const mult = org.multipliers.find((m) => m.code === code)?.value ?? 1;
  const credited = Math.round((hours * 60 + mins) * mult);

  return (
    <form action={filePirepAction.bind(null, org.slug)} className="card" style={{ padding: "1.4rem", display: "grid", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div><label className="label">Flight no.</label><input name="flightNo" className="input" placeholder={`${org.callsignPrefix}123`} required /></div>
        <div><label className="label">From</label><input name="dep" className="input" placeholder="EGLL" maxLength={4} required /></div>
        <div><label className="label">To</label><input name="arr" className="input" placeholder="LFPG" maxLength={4} required /></div>
      </div>
      <div>
        <label className="label">Aircraft</label>
        <select name="aircraft" className="input" required>
          {org.fleet.map((a) => <option key={a.id} value={a.type}>{a.type}</option>)}
          <option value="Other">Other</option>
        </select>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div><label className="label">Hours</label><input name="hours" type="number" min={0} className="input" value={hours} onChange={(e) => setHours(+e.target.value)} /></div>
        <div><label className="label">Minutes</label><input name="minutes" type="number" min={0} max={59} className="input" value={mins} onChange={(e) => setMins(+e.target.value)} /></div>
        <div>
          <label className="label">Bonus code</label>
          <select name="multiplierCode" className="input" value={code} onChange={(e) => setCode(e.target.value)}>
            <option value="">None (1×)</option>
            {org.multipliers.map((m) => <option key={m.code} value={m.code}>{m.code} ({m.value}×)</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div><label className="label">Fuel (kg)</label><input name="fuelKg" type="number" className="input" /></div>
        <div><label className="label">Landing rate</label><input name="landingRate" type="number" className="input" placeholder="-150" /></div>
        <div><label className="label">Server</label><select name="server" className="input"><option>Expert</option><option>Training</option><option>Casual</option></select></div>
      </div>
      <div><label className="label">Remarks</label><textarea name="remarks" className="input" rows={2} /></div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div className="muted" style={{ fontSize: "0.9rem" }}>Credited time: <b style={{ color: "var(--primary)" }}>{Math.floor(credited / 60)}h {credited % 60}m</b>{mult !== 1 && <span className="faint"> · {mult}× bonus</span>}</div>
        <button className="btn btn-primary" type="submit">File PIREP</button>
      </div>
      <p className="faint" style={{ fontSize: "0.78rem", margin: 0 }}>{org.settings.pirepRequireReview ? "Your report goes to staff for review before hours are credited." : "Hours are credited instantly on this VA."}</p>
    </form>
  );
}

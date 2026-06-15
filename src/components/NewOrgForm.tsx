"use client";

import { useState } from "react";
import { createOrgAction } from "@/app/actions";

export default function NewOrgForm() {
  const [name, setName] = useState("");
  const [hue, setHue] = useState(215);
  const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32);

  return (
    <form action={createOrgAction} className="card" style={{ padding: "1.5rem", display: "grid", gap: 16 }}>
      <div>
        <label className="label">Airline name</label>
        <input name="name" className="input" placeholder="Skyline Virtual" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 12 }}>
        <div>
          <label className="label">Web address</label>
          <div className="input" style={{ display: "flex", alignItems: "center", color: "var(--text-dim)" }}>
            <span className="faint">/va/</span><span style={{ color: "var(--text)" }}>{slug || "your-airline"}</span>
          </div>
          <input type="hidden" name="slug" value={slug} />
        </div>
        <div>
          <label className="label">Callsign</label>
          <input name="prefix" className="input" placeholder="SKY" maxLength={4} style={{ textTransform: "uppercase" }} />
        </div>
      </div>
      <div>
        <label className="label">Brand colour</label>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <input type="range" name="hue" min={0} max={360} value={hue} onChange={(e) => setHue(+e.target.value)} style={{ flex: 1, accentColor: `hsl(${hue} 70% 55%)` }} />
          <span style={{ width: 46, height: 46, borderRadius: 12, background: `hsl(${hue} 70% 55%)`, border: "2px solid var(--border)" }} />
        </div>
        <p className="faint" style={{ fontSize: "0.78rem", marginTop: 6 }}>You can fine-tune everything — fonts, background, theme — right after.</p>
      </div>
      <button className="btn btn-primary" type="submit" style={{ marginTop: 4 }}>Create crew center →</button>
    </form>
  );
}

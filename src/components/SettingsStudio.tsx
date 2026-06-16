"use client";

import { useEffect, useMemo, useState } from "react";
import type { Org, Branding, NavItem, Hub, Aircraft, Rank, Multiplier, Codeshare } from "@/lib/types";
import { brandingToCss, FONT_CATALOG, googleFontHref, orgModules } from "@/lib/theme";
import { saveOrgConfigAction } from "@/app/va/[slug]/settings/actions";

type Cfg = {
  name: string; callsignPrefix: string; branding: Branding;
  nav: NavItem[]; hubs: Hub[]; fleet: Aircraft[]; ranks: Rank[]; multipliers: Multiplier[];
  settings: Org["settings"]; codeshares: Codeshare[];
};

const TABS = ["Brand", "Feel", "Background", "Menu", "Hubs", "Fleet", "Ranks", "Bonuses", "Engage", "Modules", "General", "Data"] as const;
const uid = () => Math.random().toString(36).slice(2, 9);

export default function SettingsStudio({ org, saved }: { org: Org; saved?: boolean }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Brand");
  const [cfg, setCfg] = useState<Cfg>(() => ({
    name: org.name, callsignPrefix: org.callsignPrefix,
    branding: { density: "cozy", buttonShape: "soft", headerStyle: "blur", saturation: 60, flat: false, ...org.branding },
    nav: org.nav.map((n) => ({ ...n })), hubs: org.hubs.map((h) => ({ ...h })),
    fleet: org.fleet.map((f) => ({ ...f })), ranks: org.ranks.map((r) => ({ ...r })),
    multipliers: org.multipliers.map((m) => ({ ...m })), settings: { ...org.settings, modules: orgModules(org.settings) },
    codeshares: (org.codeshares || []).map((c) => ({ ...c })),
  }));
  const setS = (p: Partial<Org["settings"]>) => setCfg((c) => ({ ...c, settings: { ...c.settings, ...p } }));

  const setBrand = (p: Partial<Branding>) => setCfg((c) => ({ ...c, branding: { ...c.branding, ...p } }));
  const vars = useMemo(() => brandingToCss(cfg.branding) as React.CSSProperties, [cfg.branding]);

  // Load the chosen Google fonts live so the preview repaints in the real typeface.
  useEffect(() => {
    const href = googleFontHref([cfg.branding.font, cfg.branding.headingFont]);
    if (!href) return;
    const id = "studio-fonts";
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) { link = document.createElement("link"); link.id = id; link.rel = "stylesheet"; document.head.appendChild(link); }
    link.href = href;
  }, [cfg.branding.font, cfg.branding.headingFont]);

  const onLogo = (file: File | null) => {
    if (!file) return;
    if (file.size > 600_000) { alert("Please use a logo under 600 KB."); return; }
    const r = new FileReader();
    r.onload = () => setBrand({ logoUrl: String(r.result) });
    r.readAsDataURL(file);
  };

  return (
    <div className="studio-shell">
      <aside className="studio-sidebar">
        <div className="eyebrow" style={{ padding: "0 0.5rem 0.5rem", color: "var(--text-faint)" }}>Customize</div>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className="studio-tab" data-active={tab === t}>{t}</button>
        ))}
      </aside>

      <div className="studio-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 22, alignItems: "start", flex: 1, minWidth: 0 }}>
        {/* ---- editor ---- */}
        <div>
        {tab === "Brand" && (
          <Panel>
            <Field label="Logo">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {cfg.branding.logoUrl ? <img src={cfg.branding.logoUrl} alt="" style={{ height: 40, maxWidth: 160, objectFit: "contain", background: "var(--surface-2)", borderRadius: 8, padding: 4 }} /> : <span className="faint">No logo</span>}
                <input type="file" accept="image/*" onChange={(e) => onLogo(e.target.files?.[0] || null)} className="input" style={{ padding: 6 }} />
                {cfg.branding.logoUrl && <button className="btn btn-ghost btn-sm" onClick={() => setBrand({ logoUrl: null })}>Remove</button>}
              </div>
            </Field>
            <Field label={`Brand hue · ${cfg.branding.hue}°`}>
              <input type="range" min={0} max={360} value={cfg.branding.hue} onChange={(e) => setBrand({ hue: +e.target.value })} style={{ width: "100%", accentColor: `hsl(${cfg.branding.hue} 70% 55%)` }} />
            </Field>
            <Field label={`Accent hue · ${cfg.branding.accentHue}°`}>
              <input type="range" min={0} max={360} value={cfg.branding.accentHue} onChange={(e) => setBrand({ accentHue: +e.target.value })} style={{ width: "100%", accentColor: `hsl(${cfg.branding.accentHue} 70% 55%)` }} />
            </Field>
            <Field label="Theme">
              <div style={{ display: "flex", gap: 8 }}>
                {(["dark", "light"] as const).map((m) => (
                  <button key={m} onClick={() => setBrand({ mode: m })} className="btn btn-sm" style={{ flex: 1, textTransform: "capitalize", border: "1px solid var(--border)", background: cfg.branding.mode === m ? "var(--primary)" : "transparent", color: cfg.branding.mode === m ? "var(--on-primary)" : "var(--text)" }}>{m}</button>
                ))}
              </div>
            </Field>
            <Field label="Body font">
              <select className="input" value={cfg.branding.font} onChange={(e) => setBrand({ font: e.target.value })}>
                {FONT_CATALOG.map((f) => <option key={f.key} value={f.key}>{f.name}</option>)}
              </select>
            </Field>
            <Field label="Heading font">
              <select className="input" value={cfg.branding.headingFont} onChange={(e) => setBrand({ headingFont: e.target.value })}>
                {FONT_CATALOG.map((f) => <option key={f.key} value={f.key}>{f.name}</option>)}
              </select>
            </Field>
            <Field label={`Corner radius · ${cfg.branding.radius}px`}>
              <input type="range" min={0} max={24} value={cfg.branding.radius} onChange={(e) => setBrand({ radius: +e.target.value })} style={{ width: "100%" }} />
            </Field>
          </Panel>
        )}

        {tab === "Feel" && (
          <Panel>
            <Field label="Density">
              <Segmented value={cfg.branding.density ?? "cozy"} options={[["compact", "Compact"], ["cozy", "Cozy"], ["spacious", "Spacious"]]} onChange={(v) => setBrand({ density: v as any })} />
            </Field>
            <Field label={`Colour intensity · ${cfg.branding.saturation ?? 60}`}>
              <input type="range" min={30} max={90} value={cfg.branding.saturation ?? 60} onChange={(e) => setBrand({ saturation: +e.target.value })} style={{ width: "100%", accentColor: "var(--primary)" }} />
            </Field>
            <Field label="Button shape">
              <Segmented value={cfg.branding.buttonShape ?? "soft"} options={[["soft", "Soft"], ["pill", "Pill"], ["sharp", "Sharp"]]} onChange={(v) => setBrand({ buttonShape: v as any })} />
            </Field>
            <Field label="Header style">
              <Segmented value={cfg.branding.headerStyle ?? "blur"} options={[["blur", "Glass"], ["solid", "Solid"], ["minimal", "Minimal"]]} onChange={(v) => setBrand({ headerStyle: v as any })} />
            </Field>
            <Toggle label="Flat surfaces (no shadows)" v={!!cfg.branding.flat} set={(v) => setBrand({ flat: v })} />
          </Panel>
        )}

        {tab === "Background" && (
          <Panel>
            <Field label="Background style">
              <div style={{ display: "flex", gap: 8 }}>
                {(["solid", "gradient", "image"] as const).map((t) => (
                  <button key={t} onClick={() => setBrand({ bgType: t })} className="btn btn-sm" style={{ flex: 1, textTransform: "capitalize", border: "1px solid var(--border)", background: cfg.branding.bgType === t ? "var(--primary)" : "transparent", color: cfg.branding.bgType === t ? "var(--on-primary)" : "var(--text)" }}>{t}</button>
                ))}
              </div>
            </Field>
            {cfg.branding.bgType === "solid" && <p className="faint" style={{ fontSize: "0.85rem" }}>The page uses your brand hue as a tinted canvas. Adjust it on the Brand tab.</p>}
            {cfg.branding.bgType === "gradient" && (
              <Field label="Gradient hues (from | to)">
                <input className="input" value={cfg.branding.bgValue || `${cfg.branding.hue}|${cfg.branding.accentHue}`} onChange={(e) => setBrand({ bgValue: e.target.value })} placeholder="210|265" />
                <p className="faint" style={{ fontSize: "0.78rem", marginTop: 4 }}>Two hue numbers separated by a pipe.</p>
              </Field>
            )}
            {cfg.branding.bgType === "image" && (
              <Field label="Background image URL">
                <input className="input" value={cfg.branding.bgValue} onChange={(e) => setBrand({ bgValue: e.target.value })} placeholder="https://…/clouds.jpg" />
                <p className="faint" style={{ fontSize: "0.78rem", marginTop: 4 }}>A subtle overlay keeps text readable.</p>
              </Field>
            )}
          </Panel>
        )}

        {tab === "Menu" && (
          <Panel>
            <p className="faint" style={{ fontSize: "0.85rem", marginTop: 0 }}>Reorder, rename, hide, add or remove navigation items. The home item should stay first.</p>
            {cfg.nav.map((n, i) => (
              <div key={n.key} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}>
                <input className="input" value={n.label} onChange={(e) => setCfg((c) => { const nav = [...c.nav]; nav[i] = { ...n, label: e.target.value }; return { ...c, nav }; })} style={{ flex: 1 }} />
                <input className="input" value={n.href} onChange={(e) => setCfg((c) => { const nav = [...c.nav]; nav[i] = { ...n, href: e.target.value }; return { ...c, nav }; })} style={{ width: 110 }} placeholder="/path" />
                <button className="btn btn-ghost btn-sm" onClick={() => setCfg((c) => { const nav = [...c.nav]; nav[i] = { ...n, enabled: !n.enabled }; return { ...c, nav }; })} title="Toggle visibility">{n.enabled ? "👁" : "🚫"}</button>
                <button className="btn btn-ghost btn-sm" disabled={i === 0} onClick={() => setCfg((c) => { const nav = [...c.nav]; [nav[i - 1], nav[i]] = [nav[i], nav[i - 1]]; return { ...c, nav }; })}>↑</button>
                <button className="btn btn-ghost btn-sm" disabled={i === cfg.nav.length - 1} onClick={() => setCfg((c) => { const nav = [...c.nav]; [nav[i + 1], nav[i]] = [nav[i], nav[i + 1]]; return { ...c, nav }; })}>↓</button>
                <button className="btn btn-ghost btn-sm" style={{ color: "#e0556a" }} onClick={() => setCfg((c) => ({ ...c, nav: c.nav.filter((_, j) => j !== i) }))}>✕</button>
              </div>
            ))}
            <button className="btn btn-ghost btn-sm" onClick={() => setCfg((c) => ({ ...c, nav: [...c.nav, { key: uid(), label: "New page", href: "/news", enabled: true }] }))}>+ Add item</button>
          </Panel>
        )}

        {tab === "Hubs" && (
          <ArrayEditor
            items={cfg.hubs}
            onChange={(hubs) => setCfg((c) => ({ ...c, hubs }))}
            blank={() => ({ id: uid(), icao: "", city: "", kind: "focus", departures: 0, destinations: 0 } as Hub)}
            render={(h, set) => (
              <>
                <input className="input" placeholder="ICAO" value={h.icao} onChange={(e) => set({ icao: e.target.value.toUpperCase() })} style={{ width: 80 }} />
                <input className="input" placeholder="City" value={h.city} onChange={(e) => set({ city: e.target.value })} style={{ flex: 1 }} />
                <select className="input" value={h.kind} onChange={(e) => set({ kind: e.target.value as Hub["kind"] })} style={{ width: 110 }}><option value="primary">primary</option><option value="secondary">secondary</option><option value="focus">focus</option></select>
                <input className="input" type="number" title="departures/day" value={h.departures} onChange={(e) => set({ departures: +e.target.value })} style={{ width: 64 }} />
                <input className="input" type="number" title="destinations" value={h.destinations} onChange={(e) => set({ destinations: +e.target.value })} style={{ width: 64 }} />
              </>
            )}
            addLabel="+ Add hub"
          />
        )}

        {tab === "Fleet" && (
          <ArrayEditor
            items={cfg.fleet}
            onChange={(fleet) => setCfg((c) => ({ ...c, fleet }))}
            blank={() => ({ id: uid(), type: "", registration: "", seats: 0, rangeNm: 0, tagline: "" } as Aircraft)}
            render={(a, set) => (
              <>
                <input className="input" placeholder="Type" value={a.type} onChange={(e) => set({ type: e.target.value })} style={{ width: 110 }} />
                <input className="input" placeholder="Reg" value={a.registration} onChange={(e) => set({ registration: e.target.value })} style={{ width: 90 }} />
                <input className="input" type="number" title="seats" value={a.seats} onChange={(e) => set({ seats: +e.target.value })} style={{ width: 64 }} />
                <input className="input" type="number" title="range nm" value={a.rangeNm} onChange={(e) => set({ rangeNm: +e.target.value })} style={{ width: 80 }} />
                <input className="input" placeholder="Tagline" value={a.tagline} onChange={(e) => set({ tagline: e.target.value })} style={{ flex: 1, minWidth: 120 }} />
              </>
            )}
            addLabel="+ Add aircraft"
          />
        )}

        {tab === "Ranks" && (
          <ArrayEditor
            items={cfg.ranks}
            onChange={(ranks) => setCfg((c) => ({ ...c, ranks }))}
            blank={() => ({ id: uid(), label: "", hours: 0, note: "" } as Rank)}
            render={(r, set) => (
              <>
                <input className="input" placeholder="Rank name" value={r.label} onChange={(e) => set({ label: e.target.value })} style={{ flex: 1 }} />
                <input className="input" type="number" title="min hours" value={r.hours} onChange={(e) => set({ hours: +e.target.value })} style={{ width: 80 }} />
                <input className="input" placeholder="Note" value={r.note} onChange={(e) => set({ note: e.target.value })} style={{ flex: 1, minWidth: 100 }} />
              </>
            )}
            addLabel="+ Add rank"
          />
        )}

        {tab === "Bonuses" && (
          <ArrayEditor
            items={cfg.multipliers}
            onChange={(multipliers) => setCfg((c) => ({ ...c, multipliers }))}
            blank={() => ({ code: "", value: 2, label: "" } as Multiplier)}
            keyOf={(m) => m.code || uid()}
            render={(m, set) => (
              <>
                <input className="input" placeholder="CODE" value={m.code} onChange={(e) => set({ code: e.target.value.toUpperCase() })} style={{ width: 120 }} />
                <input className="input" type="number" step="0.1" title="multiplier" value={m.value} onChange={(e) => set({ value: +e.target.value })} style={{ width: 80 }} />
                <input className="input" placeholder="Label" value={m.label} onChange={(e) => set({ label: e.target.value })} style={{ flex: 1 }} />
              </>
            )}
            addLabel="+ Add bonus code"
          />
        )}

        {tab === "Engage" && (
          <Panel>
            <h3 style={{ margin: 0 }}>Frequent Flyer</h3>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div><label className="label">Points per hour</label><input type="number" className="input" style={{ width: 110 }} value={cfg.settings.pointsPerHour} onChange={(e) => setS({ pointsPerHour: +e.target.value })} /></div>
              <div><label className="label">Points per PIREP</label><input type="number" className="input" style={{ width: 110 }} value={cfg.settings.pointsPerPirep} onChange={(e) => setS({ pointsPerPirep: +e.target.value })} /></div>
              <div><label className="label">Currency name</label><input className="input" style={{ width: 120 }} value={cfg.settings.currency} onChange={(e) => setS({ currency: e.target.value })} /></div>
            </div>
            <Field label="Hero banner — image or video URL (animated banner)">
              <input className="input" value={cfg.settings.bannerUrl} onChange={(e) => setS({ bannerUrl: e.target.value })} placeholder="https://…/banner.mp4" />
            </Field>
            <Toggle label="Banner URL is a looping video" v={cfg.settings.bannerVideo} set={(v) => setS({ bannerVideo: v })} />
            <Toggle label="Show SimBrief flight-briefing links on routes" v={cfg.settings.simbrief} set={(v) => setS({ simbrief: v })} />
            <Field label="Discord webhook URL (fires on PIREPs & events)">
              <input className="input" value={cfg.settings.discordWebhook} onChange={(e) => setS({ discordWebhook: e.target.value })} placeholder="https://discord.com/api/webhooks/…" />
            </Field>
            <div>
              <label className="label">Codeshare partners</label>
              {cfg.codeshares.map((c, i) => (
                <div key={c.id} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                  <input className="input" value={c.name} onChange={(e) => setCfg((x) => { const cs = [...x.codeshares]; cs[i] = { ...c, name: e.target.value }; return { ...x, codeshares: cs }; })} placeholder="Partner name" />
                  <button type="button" className="btn btn-ghost btn-sm" style={{ color: "#e0556a" }} onClick={() => setCfg((x) => ({ ...x, codeshares: x.codeshares.filter((_, j) => j !== i) }))}>✕</button>
                </div>
              ))}
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCfg((x) => ({ ...x, codeshares: [...x.codeshares, { id: uid(), name: "", logoUrl: null }] }))}>+ Add partner</button>
            </div>
          </Panel>
        )}

        {tab === "Modules" && (
          <Panel>
            <p className="faint" style={{ fontSize: "0.86rem", marginTop: 0 }}>Optional power features. Switch on what you want — each adds pages and tools without cluttering VAs that don't need them.</p>
            <ModuleToggle label="Live flight map" desc="Real-time map of your pilots airborne on Infinite Flight. Adds a Live page to your menu." v={!!cfg.settings.modules?.liveMap} set={(v) => setS({ modules: { ...orgModules(cfg.settings), liveMap: v } })} />
            <ModuleToggle label="Infinite Flight verification" desc="Pilots prove they own their IFC account and pull their real grade & hours — trustworthy data, no cheating." v={!!cfg.settings.modules?.ifVerify} set={(v) => setS({ modules: { ...orgModules(cfg.settings), ifVerify: v } })} />
            <ModuleToggle label="Analytics dashboard" desc="Charts and trends for owners — flights per month, growth, top routes and pilots. Adds an Analytics tab to your crew center." v={!!cfg.settings.modules?.analytics} set={(v) => setS({ modules: { ...orgModules(cfg.settings), analytics: v } })} />
          </Panel>
        )}

        {tab === "General" && (
          <Panel>
            <Field label="Airline name"><input className="input" value={cfg.name} onChange={(e) => setCfg((c) => ({ ...c, name: e.target.value }))} /></Field>
            <Field label="Callsign prefix"><input className="input" value={cfg.callsignPrefix} maxLength={4} onChange={(e) => setCfg((c) => ({ ...c, callsignPrefix: e.target.value.toUpperCase() }))} style={{ width: 120 }} /></Field>
            <Field label="Tagline"><input className="input" value={cfg.settings.tagline} onChange={(e) => setCfg((c) => ({ ...c, settings: { ...c.settings, tagline: e.target.value } }))} /></Field>
            <Field label="About"><textarea className="input" rows={3} value={cfg.settings.about} onChange={(e) => setCfg((c) => ({ ...c, settings: { ...c.settings, about: e.target.value } }))} /></Field>
            <Field label="External application form URL (optional)"><input className="input" value={cfg.settings.applyUrl} onChange={(e) => setCfg((c) => ({ ...c, settings: { ...c.settings, applyUrl: e.target.value } }))} placeholder="https://forms.gle/…" /></Field>
            <Toggle label="New pilots need staff approval" v={cfg.settings.requireApproval} set={(v) => setCfg((c) => ({ ...c, settings: { ...c.settings, requireApproval: v } }))} />
            <Toggle label="PIREPs must be reviewed before crediting hours" v={cfg.settings.pirepRequireReview} set={(v) => setCfg((c) => ({ ...c, settings: { ...c.settings, pirepRequireReview: v } }))} />
            <Toggle label="Show a public Apply page" v={cfg.settings.allowPublicApply} set={(v) => setCfg((c) => ({ ...c, settings: { ...c.settings, allowPublicApply: v } }))} />
          </Panel>
        )}

        {tab === "Data" && (
          <Panel>
            <h3 style={{ marginTop: 0 }}>Import &amp; export</h3>
            <p className="faint" style={{ fontSize: "0.86rem" }}>Move your whole crew center in and out as CSV. Roster and PIREP importing lives in the Crew Center → Roster tab; exports are one click.</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <a href={`/va/${org.slug}/crew/export?type=roster`} className="btn btn-ghost btn-sm">Export roster CSV ↓</a>
              <a href={`/va/${org.slug}/crew/export?type=pireps`} className="btn btn-ghost btn-sm">Export PIREPs CSV ↓</a>
              <a href={`/va/${org.slug}/crew/pilots`} className="btn btn-primary btn-sm">Import roster →</a>
            </div>
          </Panel>
        )}

        <form action={saveOrgConfigAction.bind(null, org.slug)} style={{ position: "sticky", bottom: 0, paddingTop: 18, marginTop: 18 }}>
          <input type="hidden" name="config" value={JSON.stringify(cfg)} />
          <button className="btn btn-primary" type="submit" style={{ width: "100%" }}>Save changes</button>
          {saved && <p className="pill" style={{ color: "var(--primary)", borderColor: "var(--primary)", marginTop: 10, justifyContent: "center" }}>✓ Saved — your site is live.</p>}
        </form>
      </div>

      {/* ---- live preview ---- */}
      <div style={{ position: "sticky", top: 90 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Live preview</div>
        <div style={{ ...vars, background: "var(--page-bg)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden", fontFamily: "var(--font-body)", color: "var(--text)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: "1px solid var(--border)", background: "color-mix(in srgb, var(--surface) 80%, transparent)" }}>
            {cfg.branding.logoUrl ? <img src={cfg.branding.logoUrl} alt="" style={{ height: 26, maxWidth: 120, objectFit: "contain" }} /> : <><span style={{ width: 24, height: 24, borderRadius: 7, background: "linear-gradient(135deg, var(--primary), var(--accent))" }} /><b style={{ fontFamily: "var(--font-head)" }}>{cfg.name}</b></>}
            <div style={{ display: "flex", gap: 12, marginLeft: "auto", fontSize: "0.78rem" }} className="muted">
              {cfg.nav.filter((n) => n.enabled).slice(0, 4).map((n) => <span key={n.key}>{n.label}</span>)}
            </div>
          </div>
          <div style={{ padding: "30px 22px 36px" }}>
            <div className="eyebrow" style={{ color: "var(--primary)" }}>{cfg.callsignPrefix} · Virtual Airline</div>
            <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: "1.9rem", lineHeight: 1.1, margin: "8px 0" }}>{cfg.name}</div>
            <div className="muted" style={{ fontSize: "0.95rem" }}>{cfg.settings.tagline}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <span style={{ background: "var(--primary)", color: "var(--on-primary)", padding: "0.5rem 1rem", borderRadius: "calc(var(--radius) - 4px)", fontWeight: 600, fontSize: "0.85rem" }}>Join the crew</span>
              <span style={{ border: "1px solid var(--border)", padding: "0.5rem 1rem", borderRadius: "calc(var(--radius) - 4px)", fontSize: "0.85rem" }}>Explore fleet</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 22 }}>
              {[["Pilots", "24"], ["Hours", "1,820"], ["Hubs", String(cfg.hubs.length)]].map(([l, v]) => (
                <div key={l} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "12px 14px" }}>
                  <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: "1.3rem", background: "linear-gradient(100deg, var(--primary), var(--accent))", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>{v}</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-faint)" }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="faint" style={{ fontSize: "0.78rem", marginTop: 10 }}>This is exactly how pilots will see {cfg.name}. Save to publish.</p>
      </div>
      </div>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="card" style={{ padding: "1.3rem", display: "grid", gap: 14 }}>{children}</div>;
}
function ModuleToggle({ label, desc, v, set }: { label: string; desc: string; v: boolean; set: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => set(!v)} className="card-2" style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "0.9rem 1rem", textAlign: "left", cursor: "pointer", border: v ? "1px solid var(--primary)" : "1px solid var(--border)", background: v ? "color-mix(in srgb, var(--primary) 10%, transparent)" : "var(--surface-2)" }}>
      <span style={{ width: 38, height: 22, borderRadius: 99, background: v ? "var(--primary)" : "var(--surface)", border: "1px solid var(--border)", position: "relative", flexShrink: 0, marginTop: 2 }}>
        <span style={{ position: "absolute", top: 2, left: v ? 18 : 2, width: 16, height: 16, borderRadius: 99, background: v ? "var(--on-primary)" : "var(--text-faint)", transition: "left .15s" }} />
      </span>
      <span>
        <span style={{ fontWeight: 600, display: "block" }}>{label}</span>
        <span className="muted" style={{ fontSize: "0.82rem" }}>{desc}</span>
      </span>
    </button>
  );
}
function Segmented({ value, options, onChange }: { value: string; options: [string, string][]; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {options.map(([val, label]) => (
        <button key={val} type="button" onClick={() => onChange(val)} className="btn btn-sm"
          style={{ flex: 1, border: "1px solid var(--border)", background: value === val ? "var(--primary)" : "transparent", color: value === val ? "var(--on-primary)" : "var(--text)" }}>{label}</button>
      ))}
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="label">{label}</label>{children}</div>;
}
function Toggle({ label, v, set }: { label: string; v: boolean; set: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => set(!v)} style={{ display: "flex", alignItems: "center", gap: 10, background: "transparent", border: "none", cursor: "pointer", color: "var(--text)", textAlign: "left", padding: 0 }}>
      <span style={{ width: 38, height: 22, borderRadius: 99, background: v ? "var(--primary)" : "var(--surface-2)", border: "1px solid var(--border)", position: "relative", flexShrink: 0 }}>
        <span style={{ position: "absolute", top: 2, left: v ? 18 : 2, width: 16, height: 16, borderRadius: 99, background: v ? "var(--on-primary)" : "var(--text-faint)", transition: "left .15s" }} />
      </span>
      <span style={{ fontSize: "0.88rem" }}>{label}</span>
    </button>
  );
}

function ArrayEditor<T>({ items, onChange, blank, render, addLabel, keyOf }: {
  items: T[]; onChange: (items: T[]) => void; blank: () => T;
  render: (item: T, set: (p: Partial<T>) => void) => React.ReactNode; addLabel: string; keyOf?: (item: T, i: number) => string;
}) {
  return (
    <Panel>
      {items.map((item, i) => (
        <div key={keyOf ? keyOf(item, i) : (item as any).id || i} style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          {render(item, (p) => { const next = [...items]; next[i] = { ...item, ...p }; onChange(next); })}
          <button className="btn btn-ghost btn-sm" style={{ color: "#e0556a" }} onClick={() => onChange(items.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
      <button className="btn btn-ghost btn-sm" onClick={() => onChange([...items, blank()])} style={{ justifySelf: "start" }}>{addLabel}</button>
    </Panel>
  );
}

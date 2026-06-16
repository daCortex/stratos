"use client";

import { useState } from "react";

type Block = { h?: string; p?: string; steps?: string[]; note?: string };
type Topic = { key: string; title: string; blocks: Block[] };

const TOPICS: Topic[] = [
  {
    key: "start", title: "Getting started",
    blocks: [
      { p: "Stratos hosts a fully-branded crew center for your virtual airline. You sign up once with your Infinite Flight Community (IFC) username, then create as many VAs as you like." },
      { h: "Create your account", steps: ["Click “Create a crew center” (or go to /signup).", "Enter your IFC username, a display name and a password.", "You're signed in immediately."] },
      { h: "Create a VA", steps: ["From your dashboard, click “Create a crew center”.", "Give it a name, a callsign prefix (e.g. SKY) and pick a brand colour.", "You land straight in the customization studio — make it yours, then Save."] },
      { note: "One account can own several VAs and also fly as a pilot for others. Your dashboard (/app) lists them all." },
    ],
  },
  {
    key: "customize", title: "Customizing your site",
    blocks: [
      { p: "Open your VA → Customize (or Crew center → “Customize site”). The studio is a left sidebar of sections with a live preview that repaints as you edit. Hit Save to publish." },
      { h: "Brand", p: "Upload a logo, set the brand + accent hue, dark/light mode, body and heading fonts, and corner radius." },
      { h: "Feel", p: "Density (compact/cozy/spacious), colour intensity, button shape (soft/pill/sharp), header style (glass/solid/minimal) and a flat-surfaces toggle." },
      { h: "Background", p: "Solid tint, two-colour gradient, or a full-bleed image." },
      { h: "Menu", p: "Reorder, rename, hide, add or remove navigation items. Items past the 7th collapse into a “More” menu automatically." },
      { h: "Hubs · Fleet · Ranks · Bonuses", p: "Edit your network, aircraft, rank ladder and PIREP multiplier codes." },
      { h: "Engage", p: "Frequent-Flyer points rates + currency name, an animated hero banner, the SimBrief toggle, a Discord webhook, and codeshare partners." },
      { note: "Changes are per-VA. Pilots never see “Stratos” — it's your site." },
    ],
  },
  {
    key: "invites", title: "Invite codes & joining",
    blocks: [
      { p: "All invite tools live in Crew center → Invites (/va/<slug>/crew/invites)." },
      { h: "Permanent join code", p: "Every VA has a code (e.g. SKYLINE). Share it freely — anyone who enters it can request to join. Use Regenerate to retire old codes." },
      { h: "One-time & targeted invites", steps: ["Pick “One-time” for a single-use code, or “Reusable”.", "Optionally lock it to one IFC username so only that person can redeem it.", "Click Generate — share the code or the /join?code=… link."] },
      { h: "Add a pilot directly", p: "In Crew center → Roster, type an IFC username under “Add a pilot” to put them on the roster instantly (no code needed)." },
      { h: "How pilots join", p: "A pilot signs in, goes to your VA's Join page, and enters the code. If your VA requires approval, they appear as “pending” until staff accept them in the Roster." },
    ],
  },
  {
    key: "pireps", title: "Pilots & PIREPs",
    blocks: [
      { h: "Filing a flight", p: "Pilots open their Flight deck (/va/<slug>/pilot) and file a PIREP: flight number, route, aircraft, time, optional bonus code, fuel, landing rate and remarks. Credited time updates live as they type." },
      { h: "Review", p: "If “PIREPs must be reviewed” is on (Settings → General), reports go to Crew center → PIREPs for staff to Approve or Reject. Turn it off to auto-credit on filing." },
      { h: "What approval triggers", steps: ["Frequent-Flyer points are awarded (per hour + per PIREP).", "Milestone award badges are auto-granted.", "Challenge progress advances.", "The pilot gets a notification."] },
      { note: "Carried-over hours/PIREPs from an old crew center can be set per pilot in the Roster, or bulk-imported via CSV." },
    ],
  },
  {
    key: "engage", title: "Points, awards, shop, challenges",
    blocks: [
      { h: "Frequent Flyer points", p: "Pilots earn your currency (default “miles”) on every approved flight. Set the rate in Settings → Engage." },
      { h: "Rewards shop", p: "Add items in Crew center → Shop. Pilots redeem with points; you fulfil or cancel requests there." },
      { h: "Awards & badges", p: "Define awards in Crew center → Awards. Set them to auto-grant at hours/PIREP/points milestones, or grant manually. Pilots see earned badges on their flight deck and the Awards page." },
      { h: "Challenges", p: "Create goals (X flights, X hours, or a specific route) that pay out points on completion. Progress advances automatically as pilots fly." },
    ],
  },
  {
    key: "ops", title: "Routes, events, NOTAMs",
    blocks: [
      { h: "Routes", p: "Add routes in Crew center → Routes. Star one as “Route of the Week”. Pilots see them on a live map with one-click SimBrief flight plans (toggle SimBrief in Settings → Engage)." },
      { h: "Events", p: "Create group flights in Crew center → Events with a date, route, server and optional bonus code. Pilots sign up; a Discord webhook announces it if configured." },
      { h: "NOTAMs", p: "Publish notices in Crew center → NOTAMs with Info / Advisory / Urgent severity." },
    ],
  },
  {
    key: "apps", title: "Applications & exams",
    blocks: [
      { p: "Build a custom application form in Crew center → Applications." },
      { h: "Form builder", steps: ["Add questions: short text, paragraph, multiple-choice, or quiz.", "Quiz questions are auto-graded — set the correct option and a pass score.", "Toggle “Accepting applications” on/off."] },
      { h: "Reviewing", p: "Submissions show each answer plus the quiz score. Accept (adds them to the roster) or Reject." },
    ],
  },
  {
    key: "data", title: "Import & export (CSV)",
    blocks: [
      { h: "Import a roster", p: "Crew center → Roster → paste CSV. Headers are matched flexibly — callsign, ifc, hours, pireps, rank all work. Bring your whole roster from another crew center in seconds." },
      { h: "Export", p: "One-click CSV export of your roster and PIREPs from the Roster and PIREPs tabs (or Settings → Data)." },
    ],
  },
  {
    key: "discord", title: "Discord webhooks",
    blocks: [
      { steps: ["In Discord: Server Settings → Integrations → Webhooks → New Webhook → Copy URL.", "In Stratos: Settings → Engage → paste it into “Discord webhook URL”.", "Save. New PIREPs and events now post to that channel."] },
      { note: "Leave it blank to disable. Stratos never blocks your action if Discord is unreachable." },
    ],
  },
  {
    key: "admin", title: "Platform admin (Mission Control)",
    blocks: [
      { p: "Platform admins manage every account and every VA at /admin." },
      { h: "Becoming admin", p: "Sign up (or have an account) with an admin username — “AviatorChina” is admin by default. Add more via the PLATFORM_ADMINS env var. A gold “Admin” button appears in the header." },
      { h: "Airlines", p: "Open / customize any VA, rename it, transfer ownership to another IFC user, or delete it (removes all its data)." },
      { h: "Accounts", p: "Rename users, reset passwords, grant/revoke admin, or delete accounts. You can't delete your own account." },
    ],
  },
  {
    key: "errors", title: "Troubleshooting & errors",
    blocks: [
      { h: "“Incorrect username or password”", p: "Usernames are case-insensitive but must match an existing account. If you forgot a password, a platform admin can reset it in /admin → Accounts." },
      { h: "Invite code says “invalid”", p: "Codes are case-insensitive but must be exact. One-time codes work once; targeted codes only work for the locked IFC username. Ask staff to regenerate if unsure." },
      { h: "My PIREP didn't credit hours", p: "If the VA reviews PIREPs, it stays “pending” until staff approve it. Approved flights then count toward hours, points, badges and challenges." },
      { h: "Studio changes didn't save", p: "You must click “Save changes” at the bottom of the studio — the live preview is unsaved until then. Only the VA owner (or a platform admin) can save." },
      { h: "Data reset / disappeared", p: "If the site is running without a database it uses an in-memory store that resets on restart. Connect Neon Postgres (set DATABASE_URL) for permanent storage — check /status to see which mode is active." },
      { h: "Can't see the crew center", p: "Only owners and staff can open Crew center. Ask the owner to set your role to staff in the Roster." },
      { h: "A page won't load", p: "Check /status for live system health. If the database shows an error there, it's a platform-wide issue — watch that page for updates." },
    ],
  },
  {
    key: "faq", title: "FAQ",
    blocks: [
      { h: "Is it free?", p: "This deployment runs on your own infrastructure (Vercel + Neon). There are no per-VA charges built in." },
      { h: "Can one pilot fly for multiple VAs?", p: "Yes. One IFC account joins any number of VAs and files for each separately." },
      { h: "Does it connect to Infinite Flight automatically?", p: "PIREPs are filed by pilots. SimBrief flight plans and Discord webhooks integrate out of the box; a live IF API key is optional for future live tracking." },
      { h: "How do I move my old VA in?", p: "Customize the look, then CSV-import your roster and PIREP history. Most VAs are fully migrated in under an hour." },
      { h: "Where do I get support?", p: "Join our Discord — it's the community and support hub for everything Stratos. Link: discord.gg/f4rhKFa6MD (also at the top of this page and in the footer)." },
    ],
  },
];

export default function HelpCenter() {
  const [active, setActive] = useState(TOPICS[0].key);
  const topic = TOPICS.find((t) => t.key === active)!;

  return (
    <div className="studio-shell">
      <aside className="studio-sidebar">
        <div className="eyebrow" style={{ padding: "0 0.5rem 0.5rem", color: "var(--text-faint)" }}>Guides</div>
        {TOPICS.map((t) => (
          <button key={t.key} onClick={() => setActive(t.key)} className="studio-tab" data-active={active === t.key}>{t.title}</button>
        ))}
      </aside>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="card" style={{ padding: "1.6rem 1.8rem" }}>
          <h2 style={{ marginTop: 0, fontSize: "1.5rem" }}>{topic.title}</h2>
          {topic.blocks.map((b, i) => (
            <div key={i} style={{ marginTop: i ? 18 : 8 }}>
              {b.h && <h3 style={{ fontSize: "1.05rem", margin: "0 0 6px" }}>{b.h}</h3>}
              {b.p && <p className="muted" style={{ margin: 0, lineHeight: 1.7 }}>{b.p}</p>}
              {b.steps && (
                <ol className="muted" style={{ margin: "4px 0 0", paddingLeft: 20, lineHeight: 1.8 }}>
                  {b.steps.map((s, j) => <li key={j}>{s}</li>)}
                </ol>
              )}
              {b.note && (
                <div style={{ marginTop: 8, padding: "0.7rem 0.9rem", borderRadius: "var(--radius)", background: "color-mix(in srgb, var(--primary) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--primary) 35%, var(--border))", fontSize: "0.88rem" }}>
                  <b style={{ color: "var(--primary)" }}>Tip · </b><span className="muted">{b.note}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

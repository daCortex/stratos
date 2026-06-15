# Stratos

The platform that powers virtual-airline crew centers. One sign-up, and any VA gets a
fully-branded crew center that feels like a website they built themselves — not a tenant
on someone else's platform. Part of the Aileron family.

Built with Next.js 16 (App Router) + React 19 + TypeScript + Tailwind 4. Runs on port **3500**.
Brand: Abyssal Navy `#0D1B2A` · Champagne Gold `#C9A84C` · the geometric **Jost** typeface
(assets in `public/brand/`).

## What it does

- **VA signup & multi-tenancy** — one platform user (identified by their IFC username) can own
  or fly for many VAs. Every crew-center entity is scoped by `orgId`.
- **Deep customization studio** (`/va/[slug]/settings`) with a live preview that repaints as you edit:
  - Logo upload, brand hue, accent hue, dark/light theme, body + heading **fonts** (11 Google fonts), radius
  - Background: solid tint, gradient, or image
  - **Menu builder** — reorder / rename / hide / add / remove nav items
  - Editable **hubs, fleet, ranks, bonus multipliers**
  - **Engage** tab: Frequent Flyer economy (points per hour / per PIREP, currency name), animated hero
    banner (image or looping video), SimBrief toggle, Discord webhook, codeshare partners
  - General settings: approval flow, PIREP review, apply link, about/tagline
- **Full crew center**: roster management, PIREP filing + review queue, rank progression, leaderboards,
  news, leave of absence, reports — plus everything below.
- **Routes** — a searchable route network on a **live Leaflet map** with gold great-circle lines, a
  **Route of the Week**, and one-click **SimBrief OFP** generation.
- **Events** — group flights with sign-ups, bonus multipliers, and per-event route maps.
- **Frequent Flyer programme** — pilots earn points on every approved flight, spend them in a
  **rewards shop** (staff fulfil redemptions), and climb **challenges** that pay out on completion.
- **Awards & badges** — auto-granted on hours / PIREP / points milestones, or granted manually.
- **NOTAMs**, **codeshare partners**, **Discord webhooks**, and pilot **notifications**.
- **Recruitment** — a custom **application-form builder** with **auto-graded quiz questions**; accepted
  applicants are added straight to the roster.
- **Joining** — each VA has a permanent join code, can mint one-time invite codes, or lock an invite to a
  specific IFC username. Add a pilot instantly by their IFC username.
- **Import / export** — paste a CSV roster from any other crew center (headers matched flexibly:
  callsign / ifc / hours / pireps / rank). Export roster and PIREPs as CSV anytime.

### Engagement engine
`onPirepApproved()` runs whenever a PIREP is credited (instantly if the VA auto-approves, else on staff
approval) and awards points, auto-grants milestone badges, advances challenges, and notifies the pilot.

## Running it

```bash
npm install
npm run dev        # http://localhost:3500
```

Boots on a **seeded in-memory store** — no database required. A demo VA "Skyline Virtual" is pre-built.
Sign in with IFC username **demo**, password **demo** (owner of Skyline).

> Note: after adding new collections to the store, restart the dev server so the demo data reseeds.

## Going to production (Neon Postgres)

The data layer (`src/lib/store.ts`) is written as an **async interface** so it swaps to Postgres without
touching any callers. To go live: create a Neon database, set `DATABASE_URL` / `SESSION_SECRET` (and
optional `IF_API_KEY`) in `.env.local` (see `.env.local.example`), and implement the Neon-backed branch of
each store function. Nested config (branding / nav / hubs / fleet / ranks / answers) maps to JSONB columns.
`dbConfigured` already flips to `true` when `DATABASE_URL` is present.

## Layout

- `src/lib/` — `types.ts`, `store.ts` (data + engagement engine), `auth.ts` (sessions),
  `theme.ts` (branding→CSS + fonts), `ranks.ts`, `csv.ts`, `crypto.ts`, `airports.ts`, `webhook.ts`
- `src/app/` — platform shell (landing, login, signup, dashboard, new, join, explore)
- `src/app/va/[slug]/` — each VA's branded site: home, routes, events, fleet, ranks, network, awards,
  shop, challenges, notams, news, roster, codeshares, apply, leaderboard, join, **pilot** (flight deck),
  **crew** (staff center), **settings** (studio)
- `src/components/` — `SettingsStudio`, `FlightMap`, `AppFormBuilder`, `FilePirepForm`, `VAHeader`,
  `PlatformHeader`, `NewOrgForm`

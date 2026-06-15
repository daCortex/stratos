-- Stratos — Neon Postgres schema.
--
-- You do NOT normally need to run this by hand: src/lib/backend.ts creates these
-- objects automatically (CREATE ... IF NOT EXISTS) the first time the app connects
-- with DATABASE_URL set, and seeds the demo VA once via an atomic claim row.
-- This file documents the shape and lets you provision a database up front if you prefer.
--
-- Design: one table per entity, each row = (id bigint pk, org_id bigint, data jsonb).
-- The full object lives in `data`; `id`/`org_id` are mirrored as columns for fast lookups.
-- Per-entity rows mean concurrent writes to different records never clobber each other.
-- All numeric ids come from a single shared sequence so they're globally unique.

create sequence if not exists stratos_seq;

-- Entity tables (same structure for every collection).
create table if not exists users              (id bigint primary key, org_id bigint, data jsonb not null);
create table if not exists orgs               (id bigint primary key, org_id bigint, data jsonb not null);
create table if not exists members            (id bigint primary key, org_id bigint, data jsonb not null);
create table if not exists pireps             (id bigint primary key, org_id bigint, data jsonb not null);
create table if not exists news               (id bigint primary key, org_id bigint, data jsonb not null);
create table if not exists loas               (id bigint primary key, org_id bigint, data jsonb not null);
create table if not exists reports            (id bigint primary key, org_id bigint, data jsonb not null);
create table if not exists invites            (id bigint primary key, org_id bigint, data jsonb not null);
create table if not exists routes             (id bigint primary key, org_id bigint, data jsonb not null);
create table if not exists events             (id bigint primary key, org_id bigint, data jsonb not null);
create table if not exists awards             (id bigint primary key, org_id bigint, data jsonb not null);
create table if not exists earned             (id bigint primary key, org_id bigint, data jsonb not null);
create table if not exists notams             (id bigint primary key, org_id bigint, data jsonb not null);
create table if not exists challenges         (id bigint primary key, org_id bigint, data jsonb not null);
create table if not exists "challengeProgress"(id bigint primary key, org_id bigint, data jsonb not null);
create table if not exists points             (id bigint primary key, org_id bigint, data jsonb not null);
create table if not exists shop               (id bigint primary key, org_id bigint, data jsonb not null);
create table if not exists redemptions        (id bigint primary key, org_id bigint, data jsonb not null);
create table if not exists notifications      (id bigint primary key, org_id bigint, data jsonb not null);
create table if not exists applications       (id bigint primary key, org_id bigint, data jsonb not null);

-- Application forms are keyed by org (one per VA), no numeric id.
create table if not exists app_forms (org_id bigint primary key, data jsonb not null);

-- Seed-claim marker so only one instance seeds a fresh database.
create table if not exists _meta (k text primary key);

-- org_id indexes for the per-VA lookups the app does constantly.
create index if not exists members_org_idx            on members (org_id);
create index if not exists pireps_org_idx             on pireps (org_id);
create index if not exists news_org_idx               on news (org_id);
create index if not exists loas_org_idx               on loas (org_id);
create index if not exists reports_org_idx            on reports (org_id);
create index if not exists invites_org_idx            on invites (org_id);
create index if not exists routes_org_idx             on routes (org_id);
create index if not exists events_org_idx             on events (org_id);
create index if not exists awards_org_idx             on awards (org_id);
create index if not exists earned_org_idx             on earned (org_id);
create index if not exists notams_org_idx             on notams (org_id);
create index if not exists challenges_org_idx         on challenges (org_id);
create index if not exists "challengeProgress_org_idx" on "challengeProgress" (org_id);
create index if not exists points_org_idx             on points (org_id);
create index if not exists shop_org_idx               on shop (org_id);
create index if not exists redemptions_org_idx        on redemptions (org_id);
create index if not exists notifications_org_idx      on notifications (org_id);
create index if not exists applications_org_idx       on applications (org_id);

-- Stratos — Neon Postgres schema. Mirrors the in-memory shapes in src/lib/types.ts 1:1.
-- JSON-shaped config (branding, nav, hubs, fleet, ranks, multipliers, settings) is stored
-- as jsonb on the org row so the customization studio can save the whole config atomically.

create table if not exists users (
  id            serial primary key,
  ifc_username  text unique not null,
  display_name  text not null,
  password_hash text,
  avatar        text,
  created_at    timestamptz not null default now()
);

create table if not exists orgs (
  id              serial primary key,
  slug            text unique not null,
  name            text not null,
  callsign_prefix text not null,
  owner_user_id   integer not null references users(id),
  join_code       text not null,
  created_at      timestamptz not null default now(),
  branding        jsonb not null,
  nav             jsonb not null,
  hubs            jsonb not null,
  fleet           jsonb not null,
  ranks           jsonb not null,
  multipliers     jsonb not null,
  settings        jsonb not null
);

create table if not exists memberships (
  id           serial primary key,
  org_id       integer not null references orgs(id) on delete cascade,
  user_id      integer not null references users(id) on delete cascade,
  role         text not null default 'pilot',           -- owner | staff | pilot
  callsign     text not null,
  status       text not null default 'active',          -- pending | active | suspended
  rank_label   text,
  base_minutes integer not null default 0,
  base_pireps  integer not null default 0,
  if_username  text,
  joined_at    timestamptz not null default now(),
  warnings     jsonb not null default '[]',
  unique (org_id, user_id)
);

create table if not exists pireps (
  id              serial primary key,
  org_id          integer not null references orgs(id) on delete cascade,
  membership_id   integer not null references memberships(id) on delete cascade,
  flight_no       text, dep text, arr text, aircraft text,
  minutes         integer not null default 0,
  raw_minutes     integer not null default 0,
  multiplier      real not null default 1,
  multiplier_code text,
  fuel_kg         integer, landing_rate integer, server text, remarks text,
  status          text not null default 'pending',      -- pending | approved | rejected
  filed_at        timestamptz not null default now(),
  reviewed_at     timestamptz, reviewer text
);

create table if not exists news (
  id         serial primary key,
  org_id     integer not null references orgs(id) on delete cascade,
  title text, body text, category text, image_url text, author text,
  created_at timestamptz not null default now()
);

create table if not exists loas (
  id            serial primary key,
  org_id        integer not null references orgs(id) on delete cascade,
  membership_id integer not null references memberships(id) on delete cascade,
  reason text, days integer not null default 0,
  status text not null default 'pending',                -- pending | active | rejected | ended
  start_at timestamptz, end_at timestamptz, resolver text,
  created_at timestamptz not null default now()
);

create table if not exists reports (
  id        serial primary key,
  org_id    integer not null references orgs(id) on delete cascade,
  category text, target text, message text, reporter_name text,
  status text not null default 'open',                   -- open | resolved | dismissed
  resolver text, created_at timestamptz not null default now()
);

create table if not exists invites (
  id            serial primary key,
  org_id        integer not null references orgs(id) on delete cascade,
  code          text unique not null,
  kind          text not null default 'single',          -- multi | single
  ifc_username  text,
  created_by    text,
  used_by_user_id integer references users(id),
  created_at    timestamptz not null default now(),
  expires_at    timestamptz
);

create index if not exists idx_members_org on memberships(org_id);
create index if not exists idx_pireps_org on pireps(org_id);
create index if not exists idx_pireps_member on pireps(membership_id);
create index if not exists idx_news_org on news(org_id);

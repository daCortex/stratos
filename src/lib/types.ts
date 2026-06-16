/* ----------------------------------------------------------------
   Stratos — shared types for the multi-tenant crew center platform.

   One platform, many VAs ("orgs"). A platform user (identified by their
   IFC username) can own/belong to multiple orgs. Every crew-center entity
   is scoped by orgId so each VA is fully isolated and feels like its own site.
------------------------------------------------------------------- */

export type Role = "owner" | "staff" | "pilot";
export type MemberStatus = "pending" | "active" | "suspended";
export type PirepStatus = "pending" | "approved" | "rejected";

/* ---- platform-level account ---- */
export type PlatformUser = {
  id: number;
  ifcUsername: string; // login identity (Infinite Flight Community username)
  displayName: string;
  passwordHash: string | null; // scrypt salt:hash; null until they set one
  avatar: string | null;
  createdAt: string;
  isAdmin?: boolean; // platform super-admin (controls every account & VA)
  discordId?: string | null; // linked Discord account (OAuth sign-in)
};

/* ---- per-VA branding & customization ---- */
export type BgType = "solid" | "gradient" | "image";

export type Density = "compact" | "cozy" | "spacious";
export type ButtonShape = "soft" | "pill" | "sharp";
export type HeaderStyle = "blur" | "solid" | "minimal";

export type Branding = {
  logoUrl: string | null; // data URL or remote URL
  hue: number; // 0–360 primary brand hue, drives the whole palette
  accentHue: number; // secondary accent hue
  mode: "dark" | "light";
  font: string; // key into FONT_CATALOG
  headingFont: string; // key into FONT_CATALOG
  radius: number; // px corner radius (0–24)
  bgType: BgType;
  bgValue: string; // color, "hueA|hueB" for gradient, or image URL
  /* --- feel & layout (all optional; default in brandingToCss) --- */
  density?: Density; // whitespace / padding scale
  buttonShape?: ButtonShape; // button corner style
  headerStyle?: HeaderStyle; // nav bar treatment
  saturation?: number; // 35–85 colour intensity of the palette
  flat?: boolean; // remove card shadows for a flat, minimal look
};

export type NavItem = {
  key: string; // stable id
  label: string;
  href: string; // relative within the VA, e.g. "/news"
  enabled: boolean;
};

export type Hub = {
  id: string;
  icao: string;
  city: string;
  kind: "primary" | "secondary" | "focus";
  departures: number;
  destinations: number;
};

export type Aircraft = {
  id: string;
  type: string; // e.g. "A350-900"
  registration: string;
  seats: number;
  rangeNm: number;
  tagline: string;
};

export type Rank = {
  id: string;
  label: string;
  hours: number; // minimum hours; -1 = manual-only special rank
  note: string;
};

export type Multiplier = {
  code: string;
  value: number;
  label: string;
};

export type OrgSettings = {
  tagline: string;
  about: string;
  allowPublicApply: boolean; // show a public "apply" link
  requireApproval: boolean; // pilots join as pending until staff accept
  pirepRequireReview: boolean; // PIREPs need staff approval to credit hours
  applyUrl: string; // optional external application form
  /* --- engagement / integrations --- */
  pointsPerHour: number; // Frequent Flyer points earned per credited hour
  pointsPerPirep: number; // flat points per approved PIREP
  bannerUrl: string; // hero banner image/video (animated banner)
  bannerVideo: boolean; // treat bannerUrl as a looping video
  discordWebhook: string; // Discord webhook fired on PIREP/events
  simbrief: boolean; // show SimBrief briefing links
  currency: string; // name of the points currency, e.g. "miles"
  modules: OrgModules; // opt-in Tier-2 features
};

/* Optional modules a VA can switch on. Default off — they light up extra
   nav items and pages only when enabled. */
export type OrgModules = {
  liveMap: boolean; // real-time Infinite Flight tracking of the VA's pilots
  analytics: boolean; // owner analytics dashboard (charts & trends)
  ifVerify: boolean; // require/offer Infinite Flight identity verification
};

export type Codeshare = { id: string; name: string; logoUrl: string | null };

export type Org = {
  id: number;
  slug: string;
  name: string;
  callsignPrefix: string; // e.g. "SKY"
  ownerUserId: number;
  joinCode: string; // permanent join code for this VA
  createdAt: string;
  branding: Branding;
  nav: NavItem[];
  hubs: Hub[];
  fleet: Aircraft[];
  ranks: Rank[];
  multipliers: Multiplier[];
  settings: OrgSettings;
  codeshares: Codeshare[];
  customDomain?: string | null; // e.g. "flyskyline.com" — served white-labeled
  domainToken?: string | null; // ownership-verification token (TXT record)
  domainVerified?: boolean; // only verified domains actually route
};

export type Warning = { reason: string; at: string };

/* ---- per-VA membership (a pilot/staff record inside one VA) ---- */
export type Membership = {
  id: number;
  orgId: number;
  userId: number;
  role: Role;
  callsign: string;
  status: MemberStatus;
  rankLabel: string | null; // manual override; else derived from hours
  baseMinutes: number; // carried-over hours from a previous crew center
  basePireps: number;
  ifUsername: string | null;
  joinedAt: string;
  warnings: Warning[];
  /* --- Infinite Flight verification (set when the pilot verifies) --- */
  ifVerified?: boolean;
  ifGrade?: number;
  ifMinutes?: number; // real total IF flight time at verification
  ifLandings?: number;
  ifVerifiedAt?: string;
};

export type Pirep = {
  id: number;
  orgId: number;
  membershipId: number;
  flightNo: string;
  dep: string;
  arr: string;
  aircraft: string;
  minutes: number; // credited (multiplied)
  rawMinutes: number;
  multiplier: number;
  multiplierCode: string | null;
  fuelKg: number | null;
  landingRate: number | null;
  server: string | null;
  remarks: string | null;
  status: PirepStatus;
  filedAt: string;
  reviewedAt: string | null;
  reviewer: string | null;
};

export type NewsPost = {
  id: number;
  orgId: number;
  title: string;
  body: string;
  category: string;
  imageUrl: string | null;
  author: string;
  createdAt: string;
};

export type Loa = {
  id: number;
  orgId: number;
  membershipId: number;
  reason: string;
  days: number;
  status: "pending" | "active" | "rejected" | "ended";
  startAt: string | null;
  endAt: string | null;
  createdAt: string;
  resolver: string | null;
};

export type Report = {
  id: number;
  orgId: number;
  category: "bug" | "player" | "staff" | "other";
  target: string | null;
  message: string;
  reporterName: string | null;
  status: "open" | "resolved" | "dismissed";
  createdAt: string;
  resolver: string | null;
};

/* ---- Status page incidents (platform-level, no org) ---- */
export type IncidentImpact = "maintenance" | "minor" | "major" | "critical";
export type Incident = {
  id: number;
  title: string;
  body: string;
  impact: IncidentImpact;
  resolved: boolean;
  at: string;
  resolvedAt: string | null;
};

export type InviteKind = "multi" | "single";
export type Invite = {
  id: number;
  orgId: number;
  code: string;
  kind: InviteKind; // multi = reusable join code; single = one-time
  ifcUsername: string | null; // targeted invite to a specific IFC user
  createdBy: string;
  usedByUserId: number | null;
  createdAt: string;
  expiresAt: string | null;
};

/* ---- Routes (the schedule/route database) ---- */
export type Route = {
  id: number;
  orgId: number;
  flightNo: string;
  dep: string; // ICAO
  arr: string;
  aircraft: string;
  durationMin: number;
  featured: boolean; // "Route of the Week"
  notes: string | null;
};

/* ---- Events (group flights) ---- */
export type EventItem = {
  id: number;
  orgId: number;
  title: string;
  description: string;
  dep: string;
  arr: string;
  aircraft: string;
  server: string;
  startAt: string; // ISO datetime
  bonusCode: string | null; // multiplier code applied for attendees
  bannerUrl: string | null;
  signups: number[]; // membershipIds
};

/* ---- Awards / badges ---- */
export type AwardTrigger = "manual" | "hours" | "pireps" | "points";
export type Award = {
  id: number;
  orgId: number;
  name: string;
  description: string;
  icon: string; // emoji or glyph
  color: string; // hex / hsl
  trigger: AwardTrigger;
  threshold: number; // for auto triggers
};
export type EarnedAward = {
  id: number;
  orgId: number;
  membershipId: number;
  awardId: number;
  at: string;
};

/* ---- NOTAMs (notices) ---- */
export type Notam = {
  id: number;
  orgId: number;
  title: string;
  body: string;
  severity: "info" | "advisory" | "urgent";
  createdAt: string;
  expiresAt: string | null;
};

/* ---- Challenges ---- */
export type Challenge = {
  id: number;
  orgId: number;
  title: string;
  description: string;
  goalType: "pireps" | "hours" | "route"; // what completion measures
  goalValue: number; // e.g. 5 pireps, 20 hours
  routeIcaoPair: string | null; // "EGLL-KJFK" for route challenges
  reward: number; // points awarded on completion
  active: boolean;
};
export type ChallengeProgress = {
  id: number;
  orgId: number;
  membershipId: number;
  challengeId: number;
  progress: number;
  completedAt: string | null;
};

/* ---- Frequent Flyer: points ledger + shop ---- */
export type PointsEntry = {
  id: number;
  orgId: number;
  membershipId: number;
  delta: number; // + earned, - spent
  reason: string;
  at: string;
};
export type ShopItem = {
  id: number;
  orgId: number;
  name: string;
  description: string;
  cost: number;
  stock: number; // -1 = unlimited
  icon: string;
};
export type Redemption = {
  id: number;
  orgId: number;
  membershipId: number;
  itemId: number;
  cost: number;
  status: "pending" | "fulfilled" | "cancelled";
  at: string;
};

/* ---- Notifications ---- */
export type Notification = {
  id: number;
  orgId: number;
  membershipId: number;
  text: string;
  href: string | null;
  read: boolean;
  at: string;
};

/* ---- Application form builder + exams ---- */
export type AppQuestion = {
  id: string;
  label: string;
  type: "text" | "long" | "choice" | "quiz";
  options: string[]; // for choice/quiz
  answer: string | null; // correct option for quiz (auto-graded)
  required: boolean;
};
export type ApplicationForm = {
  orgId: number;
  enabled: boolean;
  intro: string;
  passScore: number; // % needed on quiz questions to auto-pass
  questions: AppQuestion[];
};
export type Application = {
  id: number;
  orgId: number;
  userId: number;
  ifcUsername: string;
  answers: Record<string, string>;
  score: number | null; // quiz % if any quiz questions
  status: "pending" | "accepted" | "rejected";
  at: string;
};

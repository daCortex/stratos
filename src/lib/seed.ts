import type {
  PlatformUser, Org, Membership, Pirep, NewsPost, Loa, Report, Invite,
  Route, EventItem, Award, EarnedAward, Notam, Challenge, ChallengeProgress,
  PointsEntry, ShopItem, Redemption, Notification, ApplicationForm, Application,
} from "./types";
import { defaultBranding, defaultNav, defaultRanks, defaultMultipliers, defaultHubs, defaultFleet, defaultSettings } from "./theme";
import { hashSecret } from "./crypto";

/* The in-memory snapshot shape. The Postgres backend stores each of these
   arrays as its own table; this object is also what the demo seed produces. */
export type DB = {
  users: PlatformUser[];
  orgs: Org[];
  members: Membership[];
  pireps: Pirep[];
  news: NewsPost[];
  loas: Loa[];
  reports: Report[];
  invites: Invite[];
  routes: Route[];
  events: EventItem[];
  awards: Award[];
  earned: EarnedAward[];
  notams: Notam[];
  challenges: Challenge[];
  challengeProgress: ChallengeProgress[];
  points: PointsEntry[];
  shop: ShopItem[];
  redemptions: Redemption[];
  notifications: Notification[];
  appForms: ApplicationForm[];
  applications: Application[];
  seq: number;
};

/* Collections that have a numeric `id` (everything except the per-org appForms). */
export const COLLECTIONS = [
  "users", "orgs", "members", "pireps", "news", "loas", "reports", "invites",
  "routes", "events", "awards", "earned", "notams", "challenges", "challengeProgress",
  "points", "shop", "redemptions", "notifications", "applications",
] as const;
export type Collection = (typeof COLLECTIONS)[number];

/* Which collections carry an orgId column (for WHERE org_id = $1 lookups). */
export const ORG_SCOPED: Record<string, boolean> = {
  members: true, pireps: true, news: true, loas: true, reports: true, invites: true,
  routes: true, events: true, awards: true, earned: true, notams: true, challenges: true,
  challengeProgress: true, points: true, shop: true, redemptions: true, notifications: true, applications: true,
};

export function emptyDB(): DB {
  return {
    users: [], orgs: [], members: [], pireps: [], news: [], loas: [], reports: [], invites: [],
    routes: [], events: [], awards: [], earned: [], notams: [], challenges: [], challengeProgress: [],
    points: [], shop: [], redemptions: [], notifications: [], appForms: [], applications: [], seq: 0,
  };
}

/* Build the seeded demo data (Skyline Virtual + sample pilots/flights/etc.).
   Used by the in-memory backend directly and by the Postgres backend to seed
   a fresh database on first connect. */
export function buildSeed(): DB {
  const db = emptyDB();
  const nextId = () => (db.seq += 1);
  const now = "2026-01-15T00:00:00.000Z";

  const owner: PlatformUser = { id: nextId(), ifcUsername: "demo", displayName: "Alex Rivera", passwordHash: hashSecret("demo"), avatar: null, createdAt: now };
  db.users.push(owner);

  const org: Org = {
    id: nextId(), slug: "skyline", name: "Skyline Virtual", callsignPrefix: "SKY",
    ownerUserId: owner.id, joinCode: "SKYLINE", createdAt: now,
    branding: { ...defaultBranding(205), accentHue: 165 },
    nav: defaultNav(), hubs: defaultHubs(), fleet: defaultFleet(),
    ranks: defaultRanks(), multipliers: defaultMultipliers(), settings: defaultSettings("Skyline Virtual"),
    codeshares: [{ id: "c1", name: "Aurora Atlantic", logoUrl: null }, { id: "c2", name: "Meridian Air", logoUrl: null }],
  };
  org.settings.tagline = "Connecting the world, one leg at a time.";
  db.orgs.push(org);

  const ownerMember: Membership = {
    id: nextId(), orgId: org.id, userId: owner.id, role: "owner", callsign: "SKY001",
    status: "active", rankLabel: null, baseMinutes: 18000, basePireps: 120, ifUsername: "demo", joinedAt: now, warnings: [],
  };
  db.members.push(ownerMember);

  const sample = [
    ["Jordan Pike", "skypilot1", "SKY014", 9200, 64],
    ["Mina Castellanos", "mina_c", "SKY027", 4100, 31],
    ["Tom Whitfield", "twf", "SKY033", 1500, 12],
  ] as const;
  for (const [name, ifc, cs, mins, preps] of sample) {
    const u: PlatformUser = { id: nextId(), ifcUsername: ifc, displayName: name, passwordHash: hashSecret("demo"), avatar: null, createdAt: now };
    db.users.push(u);
    db.members.push({ id: nextId(), orgId: org.id, userId: u.id, role: "pilot", callsign: cs, status: "active", rankLabel: null, baseMinutes: mins, basePireps: preps, ifUsername: ifc, joinedAt: now, warnings: [] });
  }

  db.pireps.push({ id: nextId(), orgId: org.id, membershipId: ownerMember.id, flightNo: "SKY302", dep: "EGLL", arr: "LFPG", aircraft: "A320neo", minutes: 75, rawMinutes: 75, multiplier: 1, multiplierCode: null, fuelKg: 8200, landingRate: -142, server: "Expert", remarks: "Smooth.", status: "approved", filedAt: now, reviewedAt: now, reviewer: "Alex Rivera" });
  db.pireps.push({ id: nextId(), orgId: org.id, membershipId: db.members[1].id, flightNo: "SKY880", dep: "EGLL", arr: "KJFK", aircraft: "B787-9", minutes: 444, rawMinutes: 444, multiplier: 1, multiplierCode: null, fuelKg: 64000, landingRate: -98, server: "Expert", remarks: "", status: "pending", filedAt: now, reviewedAt: null, reviewer: null });

  db.news.push({ id: nextId(), orgId: org.id, title: "Skyline Virtual is now on Stratos", body: "We've moved our crew center to a new home. Same family, sharper tools.", category: "Announcement", imageUrl: null, author: "Alex Rivera", createdAt: now });

  const routeData: [string, string, string, string, number, boolean][] = [
    ["SKY100", "EGLL", "LFPG", "A320neo", 75, true],
    ["SKY880", "EGLL", "KJFK", "B787-9", 444, false],
    ["SKY204", "EGLL", "OMDB", "B787-9", 420, false],
    ["SKY330", "EGLL", "LEBL", "A320neo", 125, false],
    ["SKY540", "EGLL", "EDDF", "A320neo", 95, false],
  ];
  for (const [fn, d, a, ac, dur, feat] of routeData)
    db.routes.push({ id: nextId(), orgId: org.id, flightNo: fn, dep: d, arr: a, aircraft: ac, durationMin: dur, featured: feat, notes: null });

  db.events.push({ id: nextId(), orgId: org.id, title: "Friday Night Transatlantic", description: "Mass departure from Heathrow to JFK on the Expert Server. Double points for all attendees.", dep: "EGLL", arr: "KJFK", aircraft: "B787-9", server: "Expert", startAt: "2026-01-23T20:00:00.000Z", bonusCode: "EVENT", bannerUrl: null, signups: [] });

  const awardData: [string, string, string, string, Award["trigger"], number][] = [
    ["First Flight", "Filed your very first PIREP.", "🛫", "#C9A84C", "pireps", 1],
    ["Century Club", "Logged 100 hours with the airline.", "💯", "#4FA3FF", "hours", 100],
    ["Frequent Flyer", "Completed 50 flights.", "✈️", "#7DD8A8", "pireps", 50],
    ["Veteran Aviator", "Reached 1,000 hours.", "🎖️", "#E0556A", "hours", 1000],
  ];
  for (const [n, d, ic, col, tr, th] of awardData)
    db.awards.push({ id: nextId(), orgId: org.id, name: n, description: d, icon: ic, color: col, trigger: tr, threshold: th });

  db.notams.push({ id: nextId(), orgId: org.id, title: "New livery rolling out fleet-wide", body: "Expect the refreshed Skyline livery on all 787 services from February.", severity: "info", createdAt: now, expiresAt: null });

  db.challenges.push({ id: nextId(), orgId: org.id, title: "Long-Haul Legend", description: "Fly 5 long-haul sectors this month to earn a bonus.", goalType: "pireps", goalValue: 5, routeIcaoPair: null, reward: 500, active: true });

  const shopData: [string, string, number, number, string][] = [
    ["Custom callsign", "Pick a personalised callsign number.", 1000, -1, "🔢"],
    ["Senior Captain fast-track", "Skip ahead one rank tier.", 5000, 5, "⏫"],
    ["Profile spotlight", "Featured on the roster for a week.", 750, -1, "🌟"],
    ["Event aircraft choice", "Choose the aircraft for the next event.", 2000, 1, "🛩️"],
  ];
  for (const [n, d, c, st, ic] of shopData)
    db.shop.push({ id: nextId(), orgId: org.id, name: n, description: d, cost: c, stock: st, icon: ic });

  db.points.push({ id: nextId(), orgId: org.id, membershipId: ownerMember.id, delta: 3200, reason: "Carried-over balance", at: now });

  db.appForms.push({
    orgId: org.id, enabled: true, passScore: 70,
    intro: "Thanks for your interest in Skyline Virtual! Answer a few questions and we'll be in touch.",
    questions: [
      { id: "q1", label: "Why do you want to fly for Skyline?", type: "long", options: [], answer: null, required: true },
      { id: "q2", label: "What is your Infinite Flight grade?", type: "choice", options: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5"], answer: null, required: true },
      { id: "q3", label: "On the Expert Server, which clearance must you have before pushback at a controlled gate?", type: "quiz", options: ["Pushback approval", "Takeoff clearance", "None"], answer: "Pushback approval", required: true },
    ],
  });

  return db;
}

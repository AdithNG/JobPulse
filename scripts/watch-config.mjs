// Configuration for the job watcher. Edit freely — no rebuild needed.

export const config = {
  // Terms you can actually work, given F-1/CPT rules and a May 2027 graduation.
  // Internships/co-ops matching these terms are included; everything tagged
  // new-grad is always included.
  internTerms: ["Fall 2026", "Spring 2027", "Winter 2027"],

  // Included but flagged — Summer 2027 starts after graduation, so it only
  // works if you defer graduation or convert it to a full-time start.
  stretchTerms: ["Summer 2027"],

  newGradTermLabel: "New Grad 2027",

  // Community-maintained listing feeds (SimplifyJobs). The internships repo
  // carries off-season (Fall/Spring co-op) terms too.
  simplifySources: [
    {
      name: "SimplifyJobs internships",
      url: "https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/.github/scripts/listings.json",
      kind: "internship",
    },
    {
      name: "SimplifyJobs new-grad",
      url: "https://raw.githubusercontent.com/SimplifyJobs/New-Grad-Positions/dev/.github/scripts/listings.json",
      kind: "new-grad",
    },
  ],

  // Direct ATS boards for hand-picked target companies (fintech-heavy).
  // These catch postings the moment they go live, before aggregators list them.
  //   greenhouse: https://boards-api.greenhouse.io/v1/boards/<board>/jobs
  //   ashby:      https://api.ashbyhq.com/posting-api/job-board/<board>
  //   lever:      https://api.lever.co/v0/postings/<board>?mode=json
  atsBoards: [
    { company: "Stripe", type: "greenhouse", board: "stripe" },
    { company: "Affirm", type: "greenhouse", board: "affirm" },
    { company: "Coinbase", type: "greenhouse", board: "coinbase" },
    { company: "Robinhood", type: "greenhouse", board: "robinhood" },
    { company: "Chime", type: "greenhouse", board: "chime" },
    { company: "Brex", type: "greenhouse", board: "brex" },
    { company: "Ramp", type: "ashby", board: "ramp" },
    { company: "Mercury", type: "greenhouse", board: "mercury" },
    { company: "Adyen", type: "greenhouse", board: "adyen" },
    { company: "Marqeta", type: "greenhouse", board: "marqeta" },
  ],

  // Titles must look like software engineering...
  titleInclude:
    /\b(software|swe|sde|developer|engineer(ing)?|backend|back-end|full[- ]?stack|infrastructure|platform)\b/i,
  // ...and must not look senior, non-eng, or otherwise irrelevant.
  titleExclude:
    /\b(senior|staff|principal|lead|manager|director|architect|sr\.?|phd|intern(ship)? manager|mechanical|civil|electrical|chemical|aerospace|sales|marketing|recruiter|designer|attorney|accountant|clearance|citizen(ship)?|hardware|fpga|silicon|photonics|research scientist|solar|failure analysis|product support|test technician)\b/i,

  // Signals that make a matching title early-career on raw ATS boards
  // (aggregator feeds are already scoped to interns / new grads).
  earlyCareer:
    /\b(intern(ship)?|co-?op|new ?grad|university|campus|early career|graduate|entry[- ]?level)\b/i,

  // Fit keywords (mirrors the app's default profile). Score 0-100.
  keywords: [
    { word: "fintech", weight: 15 },
    { word: "payment", weight: 12 },
    { word: "aws", weight: 12 },
    { word: "backend", weight: 10 },
    { word: "distributed", weight: 8 },
    { word: "cloud", weight: 6 },
    { word: "infrastructure", weight: 6 },
    { word: "banking", weight: 6 },
    { word: "trading", weight: 5 },
    { word: "microservice", weight: 5 },
  ],
  // Being on the curated ATS list is itself a strong fintech signal.
  atsBoardBonus: 30,

  // Skip listings that resurface after being posted this many days ago.
  maxAgeDays: 30,

  // Cap notifications per run so a bad diff can't flood your phone.
  maxNotificationsPerRun: 15,

  // Feed size cap (newest first) for the UI.
  feedLimit: 300,
};

// US-location check: "City, ST" with a real US state, or explicit US/remote-US.
const US_STATES = new Set(
  "AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC".split(
    " "
  )
);

export function isUsLocation(loc) {
  if (!loc) return false;
  const s = String(loc).trim();
  if (/\b(united states|usa|u\.s\.)\b/i.test(s)) return true;
  if (/^remote$/i.test(s)) return true;
  const m = s.match(/,\s*([A-Z]{2})(?:,\s*(?:USA|United States))?$/);
  return m ? US_STATES.has(m[1]) : false;
}

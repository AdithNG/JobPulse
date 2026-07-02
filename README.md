# JobPulse

A job application tracker built for **international students on F-1 visas** — because a generic tracker doesn't know that a "Fall internship" needs to be a co-op, or that 12 months of full-time CPT kills your OPT.

Built with Next.js 14, TypeScript, Tailwind, Zustand, and Recharts. All data lives in your browser (localStorage) — no accounts, no server, fully private, and deployable for free as a static site.

## Why this exists

Most trackers treat every job the same. On F-1, the rules are different:

- **Fall / Spring semesters** — full-time work is only possible through a **co-op** integral to your curriculum (regular internships are capped at ≤20 hr/wk part-time CPT).
- **Summer** — full-time internships on CPT are fine (annual vacation).
- **Full-time roles** — only possible after graduation, on OPT.
- **The 12-month trap** — 12+ cumulative months of *full-time* CPT forfeits OPT entirely.

JobPulse encodes all of this and checks every application against it.

## Features

### 🔔 Job watcher (auto-discovery + phone alerts)
- A GitHub Action scans **every ~10 minutes**: the SimplifyJobs internship & new-grad feeds (33k+ community-maintained listings) plus the live Greenhouse/Ashby/Lever boards of hand-picked target companies (Stripe, Ramp, Affirm, Coinbase...).
- New postings are filtered to **F-1-workable roles only** (co-op-compatible terms, US locations, no citizenship-required listings), fit-scored, and pushed instantly to **Telegram and Discord** — being in the first 20 minutes of a posting beats the 500-applicants pile.
- Everything discovered lands in the **Feed** tab with a one-click "Track" button into your pipeline. Runs entirely on free tiers: GitHub Actions + raw GitHub as the data store. Setup: [docs/watcher-setup.md](docs/watcher-setup.md).

### F-1 / CPT awareness
- **Eligibility engine** — every application is tagged with a term (Fall 2026, Spring 2027, New Grad 2027...) and role type (co-op / internship / new grad / part-time). JobPulse flags impossible pairings (e.g. a regular internship during Spring) *before you waste an application*, with an explanation and what to ask the recruiter.
- **CPT runway meter** — record your CPT authorizations and watch cumulative full-time CPT against the 12-month OPT limit, always visible in the sidebar.
- **Cycle radar** — season-aware guidance on which recruiting cycles are open right now relative to your graduation date (new-grad postings peak Aug–Oct the year before, spring co-ops post in fall, etc.).

### Pipeline tracking
- **Table view** — search, filter by status/term/role type, sort by recency, fit, excitement, or applied date.
- **Kanban board** — drag cards through Saved → Applied → OA → Phone → Interview → Offer → Closed.
- **Activity timeline** — every status change is logged automatically; add notes for recruiter calls, prep, and follow-ups.
- **Stale detection** — applications with no movement for 14+ days get flagged for follow-up.
- **Next actions & deadlines** — a "needs attention" list surfaces overdue follow-ups, upcoming interviews, and closing deadlines.

### Targeting
- **Resume-based fit** — paste your resume in Settings and JobPulse extracts your skills into weighted keywords entirely client-side (the resume never leaves your browser). Every job in the feed and tracker is then scored 0–100 against *your* experience, so each visitor to a hosted instance gets personalized scores with no accounts and no backend.
- **Fit score (0–100)** — combines your keywords with sponsorship signal and referral boost, with a live preview while you fill in the form. Weights are fully tunable in Settings.
- **Sponsorship tracking** — mark companies as sponsoring / not sponsoring / unknown; it feeds the fit score.

### Analytics
- **Conversion funnel** — % of applications reaching each stage, computed from your real status history.
- **Application velocity** — weekly applications vs. your goal.
- **Stat cards** — active pipeline, in-interview count, offers.

### Network
- **Contacts** — recruiters, alumni, referrers. Contacts go **cold after 30 days** without a touch and get flagged for a nudge. Contacts at companies in your pipeline are highlighted.

### Your data
- JSON backup export/import and CSV export (opens in Excel/Sheets).
- Everything is local to your browser. Export a backup before clearing browser data.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying

It's a static Next.js app with no backend — the free tier of [Vercel](https://vercel.com) works out of the box:

```bash
npx vercel
```

(Netlify, Cloudflare Pages, or GitHub Pages with `output: "export"` work too.)

Visitors each get their own private workspace automatically: applications, resume, and profile live in each visitor's own browser localStorage — nothing is shared, no accounts needed.

## Run your own (fork)

Fork it and everything works out of the box except the job watcher, which needs:

1. **A `data` branch** — create an orphan branch containing empty `seen.json` (`{}`) and `feed.json` (`[]`); the workflow commits watcher state there.
2. **Secrets** (optional, for phone alerts): `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `DISCORD_WEBHOOK_URL` — see [docs/watcher-setup.md](docs/watcher-setup.md).
3. **Feed URL**: set the `NEXT_PUBLIC_FEED_URL` env var to `https://raw.githubusercontent.com/<you>/<repo>/data/feed.json` so the Feed tab reads your fork's data branch.
4. Tune target companies, terms, and keywords in [scripts/watch-config.mjs](scripts/watch-config.mjs).

## Disclaimer

The CPT/OPT rules encoded here are a planning aid, not legal advice. Always confirm work authorization details with your DSO.

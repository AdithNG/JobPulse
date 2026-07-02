// Academic term utilities and the F-1 / CPT eligibility engine.
//
// Rules encoded here (informational, not legal advice):
// - Fall & Spring semesters: CPT is limited — full-time work is only possible
//   through a co-op program integral to the curriculum. Regular internships
//   during the semester are capped at part-time (≤20 hrs/week).
// - Summer (annual vacation): full-time internships on CPT are fine.
// - Full-time roles that start before graduation are not possible on F-1.
// - 12+ months of cumulative FULL-TIME CPT forfeits OPT eligibility entirely.

import {
  Application,
  CptPeriod,
  EligibilityResult,
  Profile,
  RoleType,
  Term,
  TermSeason,
} from "./types";

const SEASONS: TermSeason[] = ["Spring", "Summer", "Fall"];

/** Approximate term boundaries for a US semester system. */
export function termDates(term: Term): { start: Date; end: Date } {
  switch (term.season) {
    case "Spring":
      return {
        start: new Date(term.year, 0, 10),
        end: new Date(term.year, 4, 15),
      };
    case "Summer":
      return {
        start: new Date(term.year, 4, 16),
        end: new Date(term.year, 7, 20),
      };
    case "Fall":
      return {
        start: new Date(term.year, 7, 21),
        end: new Date(term.year, 11, 20),
      };
  }
}

export function termLabel(term: Term): string {
  return `${term.season} ${term.year}`;
}

export function parseTerm(label: string): Term | null {
  const newGrad = label.match(/^New Grad\s+(\d{4})$/i);
  if (newGrad) return null; // handled separately
  const m = label.match(/^(Spring|Summer|Fall)\s+(\d{4})$/i);
  if (!m) return null;
  const season = (m[1][0].toUpperCase() +
    m[1].slice(1).toLowerCase()) as TermSeason;
  return { season, year: parseInt(m[2], 10) };
}

export function isNewGradTerm(label: string): boolean {
  return /^New Grad\s+\d{4}$/i.test(label);
}

/**
 * Terms worth applying to, from "now" through a year past graduation.
 * Includes semester terms plus "New Grad <year>" pseudo-terms.
 */
export function upcomingTerms(profile: Profile, now = new Date()): string[] {
  const grad = new Date(profile.graduationDate);
  const labels: string[] = [];
  let year = now.getFullYear();
  let seasonIdx = SEASONS.findIndex(
    (s) => termDates({ season: s, year }).end >= now
  );
  if (seasonIdx === -1) {
    seasonIdx = 0;
    year += 1;
  }
  const horizon = new Date(grad);
  horizon.setFullYear(horizon.getFullYear() + 1);
  let cursor: Term = { season: SEASONS[seasonIdx], year };
  while (termDates(cursor).start <= horizon) {
    labels.push(termLabel(cursor));
    const nextIdx = (SEASONS.indexOf(cursor.season) + 1) % SEASONS.length;
    cursor = {
      season: SEASONS[nextIdx],
      year: nextIdx === 0 ? cursor.year + 1 : cursor.year,
    };
  }
  labels.push(`New Grad ${grad.getFullYear()}`);
  labels.push(`New Grad ${grad.getFullYear() + 1}`);
  return labels;
}

/** The core rule check: can this role type actually work for this term on F-1? */
export function checkEligibility(
  roleType: RoleType,
  termLabelStr: string,
  profile: Profile
): EligibilityResult {
  const grad = new Date(profile.graduationDate);

  if (isNewGradTerm(termLabelStr)) {
    if (roleType === "new-grad") {
      return {
        level: "ok",
        title: "Eligible — post-graduation",
        detail:
          "Full-time after graduation works via OPT (and STEM OPT extension for a CS degree). Ask about H-1B/green-card sponsorship early.",
      };
    }
    return {
      level: "warn",
      title: "Unusual pairing",
      detail:
        "A non-full-time role tagged as New Grad — double-check the role type or term.",
    };
  }

  const term = parseTerm(termLabelStr);
  if (!term) {
    return {
      level: "warn",
      title: "Unknown term",
      detail: "Couldn't parse the term, so eligibility can't be checked.",
    };
  }
  const { start } = termDates(term);

  if (roleType === "new-grad") {
    if (start < grad) {
      return {
        level: "blocked",
        title: "Not possible on F-1",
        detail: `This is a full-time role starting before your graduation (${grad.toLocaleDateString(
          "en-US",
          { month: "long", year: "numeric" }
        )}). Full-time employment before graduating isn't allowed on F-1.`,
      };
    }
    return {
      level: "ok",
      title: "Eligible — post-graduation",
      detail: "Starts after graduation, so OPT covers it.",
    };
  }

  if (term.season === "Summer") {
    return {
      level: "ok",
      title: "Eligible — summer CPT",
      detail:
        "Full-time CPT is allowed during annual vacation (summer). You'll still need CPT authorization from your DSO before the start date.",
    };
  }

  // Fall or Spring
  if (roleType === "co-op") {
    return {
      level: "ok",
      title: "Eligible — co-op CPT",
      detail:
        `Full-time CPT during ${term.season} works when the co-op is integral to your curriculum. ` +
        "Watch your cumulative full-time CPT: 12+ months forfeits OPT.",
    };
  }
  if (roleType === "part-time") {
    return {
      level: "ok",
      title: "Eligible — part-time CPT",
      detail:
        "Part-time CPT (≤20 hrs/week) is allowed while classes are in session.",
    };
  }
  return {
    level: "blocked",
    title: `${term.season} needs a co-op`,
    detail:
      `A regular internship during ${term.season} isn't possible for you — only co-ops ` +
      "(or ≤20 hr/wk part-time CPT) work while school is in session. " +
      "Ask the recruiter if the role can be structured as a co-op.",
  };
}

/** Months of full-time CPT used across recorded periods (fractional). */
export function fullTimeCptMonths(periods: CptPeriod[]): number {
  const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30.44;
  return periods
    .filter((p) => p.fullTime)
    .reduce((sum, p) => {
      const ms = new Date(p.end).getTime() - new Date(p.start).getTime();
      return sum + Math.max(0, ms / MS_PER_MONTH);
    }, 0);
}

export interface CptRunway {
  usedMonths: number;
  limitMonths: number; // 12 — where OPT is forfeited
  remainingMonths: number;
  level: "ok" | "warn" | "danger";
  message: string;
}

/** How much full-time CPT room is left before OPT is at risk. */
export function cptRunway(profile: Profile): CptRunway {
  const used = fullTimeCptMonths(profile.cptPeriods);
  const remaining = Math.max(0, 12 - used);
  let level: CptRunway["level"] = "ok";
  let message =
    "Plenty of full-time CPT runway. 12 cumulative months would forfeit OPT.";
  if (used >= 12) {
    level = "danger";
    message =
      "You've hit 12 months of full-time CPT — OPT eligibility is forfeited. Talk to your DSO.";
  } else if (used >= 9) {
    level = "danger";
    message = `Only ${remaining.toFixed(
      1
    )} months of full-time CPT left before OPT is forfeited. Plan carefully.`;
  } else if (used >= 6) {
    level = "warn";
    message = `${remaining.toFixed(
      1
    )} months of full-time CPT runway left. Keep an eye on it — 12 months forfeits OPT.`;
  }
  return {
    usedMonths: used,
    limitMonths: 12,
    remainingMonths: remaining,
    level,
    message,
  };
}

/** Days until a date (negative = past). */
export function daysUntil(iso: string, now = new Date()): number {
  const target = new Date(iso);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate()
  );
  return Math.round(
    (startOfTarget.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24)
  );
}

/** Applications that look stale: applied 14+ days ago with no movement. */
export function isStale(app: Application, now = new Date()): boolean {
  if (app.status !== "applied") return false;
  const anchor = app.appliedDate ?? app.updatedAt;
  return daysUntil(anchor, now) <= -14;
}

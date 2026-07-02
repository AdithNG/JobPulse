// Fit scoring: how closely an application matches the target profile
// (e.g. "SDE on an AWS fintech-style team").

import { checkEligibility } from "./terms";
import { Application, Profile } from "./types";

export interface FitBreakdown {
  score: number; // 0-100
  keywordPoints: number;
  matchedKeywords: string[];
  sponsorshipPoints: number;
  referralPoints: number;
  eligibilityPenalty: number;
}

const KEYWORD_MAX = 60;
const SPONSORSHIP_MAX = 20;
const REFERRAL_MAX = 20;

export function fitScore(app: Application, profile: Profile): FitBreakdown {
  const haystack = [app.role, app.company, app.notes, app.tags.join(" ")]
    .join(" ")
    .toLowerCase();

  const totalWeight =
    profile.fitKeywords.reduce((s, k) => s + k.weight, 0) || 1;
  let matchedWeight = 0;
  const matchedKeywords: string[] = [];
  for (const kw of profile.fitKeywords) {
    if (haystack.includes(kw.word.toLowerCase())) {
      matchedWeight += kw.weight;
      matchedKeywords.push(kw.word);
    }
  }
  // Diminishing returns: matching half the weight already earns ~71% of points.
  const keywordPoints = Math.round(
    KEYWORD_MAX * Math.sqrt(matchedWeight / totalWeight)
  );

  const sponsorshipPoints =
    app.sponsorship === "yes"
      ? SPONSORSHIP_MAX
      : app.sponsorship === "unknown"
        ? Math.round(SPONSORSHIP_MAX / 2)
        : 0;

  const referralPoints = app.referrerName ? REFERRAL_MAX : 0;

  const eligibility = checkEligibility(app.roleType, app.term, profile);
  const eligibilityPenalty =
    eligibility.level === "blocked" ? 40 : eligibility.level === "warn" ? 10 : 0;

  const score = Math.max(
    0,
    Math.min(
      100,
      keywordPoints + sponsorshipPoints + referralPoints - eligibilityPenalty
    )
  );

  return {
    score,
    keywordPoints,
    matchedKeywords,
    sponsorshipPoints,
    referralPoints,
    eligibilityPenalty,
  };
}

export function fitTier(score: number): {
  label: string;
  color: string;
} {
  if (score >= 75) return { label: "Strong fit", color: "text-emerald-400" };
  if (score >= 50) return { label: "Good fit", color: "text-sky-400" };
  if (score >= 25) return { label: "Partial fit", color: "text-amber-400" };
  return { label: "Weak fit", color: "text-zinc-500" };
}

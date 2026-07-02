// Core domain types for JobPulse.

export type RoleType = "co-op" | "internship" | "new-grad" | "part-time";

export type ApplicationStatus =
  | "saved"
  | "applied"
  | "oa"
  | "phone"
  | "interview"
  | "offer"
  | "accepted"
  | "rejected"
  | "withdrawn"
  | "ghosted";

export type WorkMode = "onsite" | "hybrid" | "remote";

export type Sponsorship = "yes" | "no" | "unknown";

export type TermSeason = "Spring" | "Summer" | "Fall";

export interface Term {
  season: TermSeason;
  year: number;
}

export type EligibilityLevel = "ok" | "warn" | "blocked";

export interface EligibilityResult {
  level: EligibilityLevel;
  title: string;
  detail: string;
}

export interface ApplicationEvent {
  id: string;
  date: string; // ISO date
  type: "status" | "note" | "reminder";
  status?: ApplicationStatus;
  text: string;
}

export interface Application {
  id: string;
  company: string;
  role: string;
  url?: string;
  location?: string;
  workMode?: WorkMode;
  roleType: RoleType;
  term: string; // e.g. "Fall 2026", "Spring 2027", "New Grad 2027"
  status: ApplicationStatus;
  salary?: string;
  source?: string; // LinkedIn, referral, career fair, cold apply...
  referrerName?: string;
  sponsorship: Sponsorship;
  excitement: number; // 1-5
  tags: string[];
  notes: string;
  appliedDate?: string; // ISO date
  deadline?: string; // ISO date — application deadline
  nextActionDate?: string; // ISO date — follow-up / interview date
  nextAction?: string;
  events: ApplicationEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  name: string;
  company: string;
  title?: string;
  linkedin?: string;
  email?: string;
  relationship?: string; // alum, recruiter, friend, met at career fair...
  lastTouch?: string; // ISO date
  notes: string;
  createdAt: string;
}

export interface CptPeriod {
  id: string;
  label: string; // e.g. "Amazon Fall 2026 co-op"
  start: string; // ISO date
  end: string; // ISO date
  fullTime: boolean; // >20 hrs/week
}

export interface FitKeyword {
  word: string;
  weight: number; // relative importance
}

export interface Profile {
  graduationDate: string; // ISO date
  programStart: string; // ISO date
  targetTitle: string; // e.g. "SDE — fintech / payments infra"
  fitKeywords: FitKeyword[];
  cptPeriods: CptPeriod[];
  weeklyGoal: number; // applications per week
}

export const STATUS_ORDER: ApplicationStatus[] = [
  "saved",
  "applied",
  "oa",
  "phone",
  "interview",
  "offer",
  "accepted",
  "rejected",
  "withdrawn",
  "ghosted",
];

export const ACTIVE_STATUSES: ApplicationStatus[] = [
  "saved",
  "applied",
  "oa",
  "phone",
  "interview",
  "offer",
];

export const CLOSED_STATUSES: ApplicationStatus[] = [
  "accepted",
  "rejected",
  "withdrawn",
  "ghosted",
];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  oa: "Online Assessment",
  phone: "Phone Screen",
  interview: "Interview",
  offer: "Offer",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
  ghosted: "Ghosted",
};

export const ROLE_TYPE_LABELS: Record<RoleType, string> = {
  "co-op": "Co-op",
  internship: "Internship",
  "new-grad": "New Grad (Full-time)",
  "part-time": "Part-time",
};

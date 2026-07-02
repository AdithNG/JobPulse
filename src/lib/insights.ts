// Derived analytics for the dashboard.

import { daysUntil, isStale } from "./terms";
import {
  ACTIVE_STATUSES,
  Application,
  ApplicationStatus,
  Profile,
} from "./types";
import { parseISODate } from "./utils";

const PIPELINE: ApplicationStatus[] = [
  "applied",
  "oa",
  "phone",
  "interview",
  "offer",
];

function pipelineIndex(status: ApplicationStatus): number {
  // Accepted and declined both mean an offer was reached.
  if (status === "accepted" || status === "declined")
    return PIPELINE.indexOf("offer");
  return PIPELINE.indexOf(status);
}

/** Furthest pipeline stage this application has ever reached. */
export function reachedStage(app: Application): number {
  let max = pipelineIndex(app.status);
  for (const ev of app.events) {
    if (ev.type === "status" && ev.status) {
      max = Math.max(max, pipelineIndex(ev.status));
    }
  }
  return max;
}

export interface FunnelStage {
  stage: string;
  count: number;
  pct: number; // % of applied
}

export function funnel(applications: Application[]): FunnelStage[] {
  const labels = ["Applied", "OA", "Phone", "Interview", "Offer"];
  const counts = PIPELINE.map(
    (_, idx) => applications.filter((a) => reachedStage(a) >= idx).length
  );
  const base = counts[0] || 1;
  return labels.map((stage, i) => ({
    stage,
    count: counts[i],
    pct: Math.round((counts[i] / base) * 100),
  }));
}

export interface WeekBucket {
  label: string; // e.g. "Jun 22"
  count: number;
}

/** Applications submitted per week for the trailing `weeks` weeks. */
export function weeklyVelocity(
  applications: Application[],
  weeks = 8,
  now = new Date()
): WeekBucket[] {
  const startOfWeek = (d: Date) => {
    const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    copy.setDate(copy.getDate() - copy.getDay()); // Sunday
    return copy;
  };
  const buckets: WeekBucket[] = [];
  const thisWeek = startOfWeek(now);
  for (let i = weeks - 1; i >= 0; i--) {
    const ws = new Date(thisWeek);
    ws.setDate(ws.getDate() - i * 7);
    const we = new Date(ws);
    we.setDate(we.getDate() + 7);
    const count = applications.filter((a) => {
      if (!a.appliedDate) return false;
      const d = parseISODate(a.appliedDate);
      return d >= ws && d < we;
    }).length;
    buckets.push({
      label: ws.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count,
    });
  }
  return buckets;
}

export function appliedThisWeek(
  applications: Application[],
  now = new Date()
): number {
  return weeklyVelocity(applications, 1, now)[0]?.count ?? 0;
}

export interface ActionItem {
  app: Application;
  kind: "overdue" | "due" | "deadline" | "stale";
  text: string;
  days: number;
}

/** Everything that needs attention, most urgent first. */
export function actionItems(
  applications: Application[],
  now = new Date()
): ActionItem[] {
  const items: ActionItem[] = [];
  for (const app of applications) {
    if (!ACTIVE_STATUSES.includes(app.status)) continue;
    if (app.nextActionDate) {
      const d = daysUntil(app.nextActionDate, now);
      if (d < 0) {
        items.push({
          app,
          kind: "overdue",
          text: app.nextAction ?? "Follow up",
          days: d,
        });
      } else if (d <= 7) {
        items.push({
          app,
          kind: "due",
          text: app.nextAction ?? "Follow up",
          days: d,
        });
      }
    }
    if (app.deadline && app.status === "saved") {
      const d = daysUntil(app.deadline, now);
      if (d >= 0 && d <= 14) {
        items.push({ app, kind: "deadline", text: "Application deadline", days: d });
      }
    }
    if (isStale(app, now)) {
      const d = daysUntil(app.appliedDate ?? app.updatedAt, now);
      items.push({
        app,
        kind: "stale",
        text: "No response — send a follow-up or nudge a contact",
        days: d,
      });
    }
  }
  return items.sort((a, b) => a.days - b.days);
}

export interface RadarItem {
  title: string;
  window: string;
  detail: string;
  active: boolean;
}

/**
 * Season-aware guidance for an F-1 student: which recruiting cycles are
 * open right now relative to graduation.
 */
export function cycleRadar(profile: Profile, now = new Date()): RadarItem[] {
  const grad = parseISODate(profile.graduationDate);
  const gradYear = grad.getFullYear();
  const month = now.getMonth(); // 0-11
  const year = now.getFullYear();

  const items: RadarItem[] = [];

  // New grad cycle: opens ~Aug the year before graduation, peaks Aug-Oct.
  if (year === gradYear - 1 || (year === gradYear && month <= 3)) {
    items.push({
      title: `New Grad ${gradYear} (full-time)`,
      window: `Aug–Oct ${gradYear - 1} is peak posting season`,
      detail:
        "Big tech new-grad reqs open earliest and close fast. Returning-intern conversions eat headcount — apply in the first two weeks of a posting.",
      active: year === gradYear - 1 ? month >= 6 : true,
    });
  }

  // Spring co-op: apply Aug-Nov the semester before.
  const springYear = month >= 7 ? year + 1 : year;
  if (
    new Date(springYear, 0, 15) <= grad ||
    springYear === gradYear
  ) {
    items.push({
      title: `Spring ${springYear} co-op`,
      window: `Aug–Nov ${springYear - 1}`,
      detail:
        "Co-op-friendly companies (fintech, banks, industrials) post spring slots in fall. Confirm the role can be a curriculum-integrated co-op for CPT.",
      active: month >= 7 || month <= 10,
    });
  }

  // Summer internships: only if a summer term before graduation remains.
  const summerYear = month >= 5 ? year + 1 : year;
  if (new Date(summerYear, 5, 1) < grad) {
    items.push({
      title: `Summer ${summerYear} internship`,
      window: `Jul–Oct ${summerYear - 1} for big tech; smaller companies into spring`,
      detail:
        "Summer allows full-time CPT — regular internships are fair game. Applications open absurdly early; set alerts now.",
      active: month >= 6,
    });
  }

  if (items.length === 0) {
    items.push({
      title: "Full-time on OPT",
      window: "Rolling — apply continuously",
      detail:
        "You're at or past graduation, so OPT (plus the STEM extension) is your lane. Prioritize companies with a real H-1B/green-card track record.",
      active: true,
    });
  }

  return items;
}

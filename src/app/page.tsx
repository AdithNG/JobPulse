"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Flame,
  Plus,
  Radar,
  Send,
  Trophy,
} from "lucide-react";
import {
  Bar,
  BarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ApplicationForm from "@/components/ApplicationForm";
import StatusBadge from "@/components/StatusBadge";
import { useJobPulse } from "@/lib/store";
import {
  actionItems,
  appliedThisWeek,
  cycleRadar,
  funnel,
  weeklyVelocity,
} from "@/lib/insights";
import { cptRunway } from "@/lib/terms";
import { ACTIVE_STATUSES, OFFER_STATUSES } from "@/lib/types";
import { cn, relativeDays } from "@/lib/utils";

export default function Dashboard() {
  const applications = useJobPulse((s) => s.applications);
  const profile = useJobPulse((s) => s.profile);
  const hydrated = useJobPulse((s) => s.hydrated);
  const [formOpen, setFormOpen] = useState(false);

  const stats = useMemo(() => {
    const active = applications.filter((a) =>
      ACTIVE_STATUSES.includes(a.status)
    );
    const interviewing = active.filter((a) =>
      ["oa", "phone", "interview"].includes(a.status)
    );
    const offers = applications.filter((a) =>
      OFFER_STATUSES.includes(a.status)
    );
    return {
      active: active.length,
      interviewing: interviewing.length,
      offers: offers.length,
      thisWeek: appliedThisWeek(applications),
    };
  }, [applications]);

  const funnelData = useMemo(() => funnel(applications), [applications]);
  const velocity = useMemo(() => weeklyVelocity(applications), [applications]);
  const actions = useMemo(() => actionItems(applications), [applications]);
  const radar = useMemo(() => cycleRadar(profile), [profile]);
  const runway = cptRunway(profile);

  if (!hydrated) return <div className="card h-64 animate-pulse" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-zinc-400">
            Targeting: {profile.targetTitle}
          </p>
        </div>
        <button onClick={() => setFormOpen(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> Add application
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          icon={Send}
          label="Applied this week"
          value={`${stats.thisWeek} / ${profile.weeklyGoal}`}
          accent={stats.thisWeek >= profile.weeklyGoal ? "emerald" : "sky"}
          sub={
            stats.thisWeek >= profile.weeklyGoal
              ? "Weekly goal hit 🎉"
              : `${profile.weeklyGoal - stats.thisWeek} to go this week`
          }
        />
        <StatCard
          icon={Flame}
          label="Active pipeline"
          value={String(stats.active)}
          accent="indigo"
          sub="saved → offer"
        />
        <StatCard
          icon={CalendarClock}
          label="In interviews"
          value={String(stats.interviewing)}
          accent="violet"
          sub="OA, phone, or onsite"
        />
        <StatCard
          icon={Trophy}
          label="Offers"
          value={String(stats.offers)}
          accent="emerald"
          sub="incl. accepted & declined"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {/* Needs attention */}
        <div className="card p-5 xl:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            Needs attention
          </h2>
          {actions.length === 0 ? (
            <p className="flex items-center gap-2 py-6 text-sm text-zinc-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Nothing urgent. Go apply to something great.
            </p>
          ) : (
            <ul className="space-y-2">
              {actions.slice(0, 6).map((item, i) => (
                <li
                  key={`${item.app.id}-${item.kind}-${i}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-100">
                      {item.app.company}
                      <span className="ml-2 font-normal text-zinc-400">
                        {item.text}
                      </span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge status={item.app.status} />
                    <span
                      className={cn(
                        "whitespace-nowrap text-xs font-medium",
                        item.kind === "overdue"
                          ? "text-red-400"
                          : item.kind === "stale"
                            ? "text-amber-400"
                            : "text-zinc-400"
                      )}
                    >
                      {item.kind === "stale"
                        ? `applied ${relativeDays(item.days)}`
                        : relativeDays(item.days)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {actions.length > 6 && (
            <Link
              href="/applications"
              className="mt-3 inline-block text-xs text-indigo-400 hover:underline"
            >
              +{actions.length - 6} more in Applications →
            </Link>
          )}
        </div>

        {/* CPT runway */}
        <div className="card p-5">
          <h2 className="mb-3 font-semibold">CPT runway</h2>
          <div className="mb-2 flex items-end justify-between">
            <span className="text-3xl font-bold tabular-nums">
              {runway.usedMonths.toFixed(1)}
              <span className="text-base font-normal text-zinc-500"> / 12 mo</span>
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-semibold uppercase",
                runway.level === "ok"
                  ? "bg-emerald-950 text-emerald-400"
                  : runway.level === "warn"
                    ? "bg-amber-950 text-amber-400"
                    : "bg-red-950 text-red-400"
              )}
            >
              {runway.level === "ok"
                ? "Healthy"
                : runway.level === "warn"
                  ? "Watch"
                  : "Critical"}
            </span>
          </div>
          <div className="mb-3 h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className={cn(
                "h-full rounded-full",
                runway.level === "ok"
                  ? "bg-emerald-500"
                  : runway.level === "warn"
                    ? "bg-amber-500"
                    : "bg-red-500"
              )}
              style={{
                width: `${Math.min(100, (runway.usedMonths / 12) * 100)}%`,
              }}
            />
          </div>
          <p className="text-xs leading-relaxed text-zinc-400">{runway.message}</p>
          <Link
            href="/settings"
            className="mt-3 inline-block text-xs text-indigo-400 hover:underline"
          >
            Manage CPT periods →
          </Link>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {/* Funnel */}
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Conversion funnel</h2>
          <div className="space-y-2.5">
            {funnelData.map((stage, i) => (
              <div key={stage.stage} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-xs text-zinc-400">
                  {stage.stage}
                </span>
                <div className="h-6 flex-1 overflow-hidden rounded bg-zinc-800/60">
                  <div
                    className={cn(
                      "flex h-full items-center rounded px-2 text-xs font-semibold text-white transition-all",
                      [
                        "bg-sky-600",
                        "bg-violet-600",
                        "bg-purple-600",
                        "bg-fuchsia-600",
                        "bg-emerald-600",
                      ][i]
                    )}
                    style={{
                      width: `${Math.max(stage.pct, stage.count > 0 ? 8 : 0)}%`,
                    }}
                  >
                    {stage.count > 0 && stage.count}
                  </div>
                </div>
                <span className="w-10 shrink-0 text-right text-xs tabular-nums text-zinc-500">
                  {stage.pct}%
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            % of applications that reached each stage.
          </p>
        </div>

        {/* Weekly velocity */}
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Application velocity</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={velocity}
              margin={{ top: 5, right: 5, left: -28, bottom: 0 }}
            >
              <XAxis
                dataKey="label"
                tick={{ fill: "#71717a", fontSize: 11 }}
                axisLine={{ stroke: "#27272a" }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#71717a", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "#27272a", opacity: 0.4 }}
                contentStyle={{
                  background: "#18181b",
                  border: "1px solid #3f3f46",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "#e4e4e7" }}
              />
              <ReferenceLine
                y={profile.weeklyGoal}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                label={{
                  value: "goal",
                  fill: "#f59e0b",
                  fontSize: 10,
                  position: "insideTopRight",
                }}
              />
              <Bar
                dataKey="count"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
                name="Applied"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cycle radar */}
      <div className="card p-5">
        <h2 className="mb-1 flex items-center gap-2 font-semibold">
          <Radar className="h-4 w-4 text-indigo-400" />
          Cycle radar
        </h2>
        <p className="mb-4 text-xs text-zinc-500">
          Which recruiting cycles matter for you right now, based on your May{" "}
          {new Date(profile.graduationDate).getFullYear()} graduation.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          {radar.map((item) => (
            <div
              key={item.title}
              className={cn(
                "rounded-lg border p-4",
                item.active
                  ? "border-indigo-800/70 bg-indigo-950/20"
                  : "border-zinc-800 bg-zinc-900/40"
              )}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="font-medium text-zinc-100">{item.title}</p>
                {item.active && (
                  <span className="rounded-full bg-indigo-600/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-300">
                    Open now
                  </span>
                )}
              </div>
              <p className="mb-1.5 text-xs font-medium text-zinc-300">
                {item.window}
              </p>
              <p className="text-xs leading-relaxed text-zinc-500">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      <ApplicationForm open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  accent: "sky" | "indigo" | "violet" | "emerald";
}) {
  const accentClass = {
    sky: "bg-sky-950/60 text-sky-400",
    indigo: "bg-indigo-950/60 text-indigo-400",
    violet: "bg-violet-950/60 text-violet-400",
    emerald: "bg-emerald-950/60 text-emerald-400",
  }[accent];
  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          {label}
        </span>
        <span className={cn("rounded-lg p-1.5", accentClass)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{sub}</p>
    </div>
  );
}

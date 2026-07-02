"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, Plus, Search } from "lucide-react";
import ApplicationForm from "@/components/ApplicationForm";
import ApplicationDetail from "@/components/ApplicationDetail";
import StatusBadge from "@/components/StatusBadge";
import EligibilityBadge from "@/components/EligibilityBadge";
import FitRing from "@/components/FitRing";
import { useJobPulse } from "@/lib/store";
import { fitScore } from "@/lib/fit";
import { isStale, upcomingTerms } from "@/lib/terms";
import {
  ACTIVE_STATUSES,
  Application,
  ApplicationStatus,
  ROLE_TYPE_LABELS,
  RoleType,
  STATUS_LABELS,
  STATUS_ORDER,
} from "@/lib/types";
import { cn, formatDateShort } from "@/lib/utils";

type SortKey = "updated" | "fit" | "company" | "applied" | "excitement";

export default function ApplicationsPage() {
  const applications = useJobPulse((s) => s.applications);
  const profile = useJobPulse((s) => s.profile);
  const hydrated = useJobPulse((s) => s.hydrated);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all" | "active">("active");
  const [termFilter, setTermFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<RoleType | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("updated");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Application | null>(null);
  const [selected, setSelected] = useState<Application | null>(null);

  const terms = useMemo(() => {
    const used = new Set(applications.map((a) => a.term));
    for (const t of upcomingTerms(profile)) used.add(t);
    return Array.from(used);
  }, [applications, profile]);

  const scored = useMemo(
    () =>
      applications.map((app) => ({
        app,
        fit: fitScore(app, profile).score,
      })),
    [applications, profile]
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    let rows = scored.filter(({ app }) => {
      if (q) {
        const hay =
          `${app.company} ${app.role} ${app.location ?? ""} ${app.tags.join(" ")} ${app.notes}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (statusFilter === "active") {
        if (!ACTIVE_STATUSES.includes(app.status)) return false;
      } else if (statusFilter !== "all" && app.status !== statusFilter) {
        return false;
      }
      if (termFilter !== "all" && app.term !== termFilter) return false;
      if (typeFilter !== "all" && app.roleType !== typeFilter) return false;
      return true;
    });
    rows = rows.sort((a, b) => {
      switch (sortKey) {
        case "fit":
          return b.fit - a.fit;
        case "company":
          return a.app.company.localeCompare(b.app.company);
        case "applied":
          return (b.app.appliedDate ?? "").localeCompare(a.app.appliedDate ?? "");
        case "excitement":
          return b.app.excitement - a.app.excitement;
        default:
          return b.app.updatedAt.localeCompare(a.app.updatedAt);
      }
    });
    return rows;
  }, [scored, query, statusFilter, termFilter, typeFilter, sortKey]);

  // Keep the detail modal in sync with store updates (status moves, notes).
  const selectedLive = selected
    ? applications.find((a) => a.id === selected.id) ?? null
    : null;

  if (!hydrated) {
    return <div className="card h-64 animate-pulse" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Applications</h1>
          <p className="text-sm text-zinc-400">
            {filtered.length} of {applications.length} shown
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" /> Add application
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            className="input pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company, role, tags..."
          />
        </div>
        <select
          className="input w-auto"
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as ApplicationStatus | "all" | "active")
          }
        >
          <option value="active">Active pipeline</option>
          <option value="all">All statuses</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select
          className="input w-auto"
          value={termFilter}
          onChange={(e) => setTermFilter(e.target.value)}
        >
          <option value="all">All terms</option>
          {terms.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          className="input w-auto"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as RoleType | "all")}
        >
          <option value="all">All types</option>
          {(Object.keys(ROLE_TYPE_LABELS) as RoleType[]).map((rt) => (
            <option key={rt} value={rt}>
              {ROLE_TYPE_LABELS[rt]}
            </option>
          ))}
        </select>
        <button
          className="btn-ghost"
          onClick={() =>
            setSortKey((k) =>
              k === "updated"
                ? "fit"
                : k === "fit"
                  ? "excitement"
                  : k === "excitement"
                    ? "applied"
                    : k === "applied"
                      ? "company"
                      : "updated"
            )
          }
          title="Cycle sort order"
        >
          <ArrowUpDown className="h-4 w-4" />
          {
            {
              updated: "Recent",
              fit: "Best fit",
              excitement: "Excitement",
              applied: "Applied date",
              company: "Company",
            }[sortKey]
          }
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-zinc-400">No applications match.</p>
          <button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" /> Add your first application
          </button>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-3 font-medium">Company / Role</th>
                <th className="px-4 py-3 font-medium">Term</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">F-1</th>
                <th className="px-4 py-3 font-medium">Fit</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">
                  Applied
                </th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">
                  Next action
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ app, fit }) => {
                const stale = isStale(app);
                return (
                  <tr
                    key={app.id}
                    onClick={() => setSelected(app)}
                    className="cursor-pointer border-b border-zinc-800/60 transition last:border-0 hover:bg-zinc-800/40"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-100">
                        {app.company}
                        {stale && (
                          <span
                            className="ml-2 rounded-full bg-amber-950/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-400"
                            title="No movement for 14+ days — consider following up"
                          >
                            Stale
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-zinc-400">{app.role}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-300">
                      <p>{app.term}</p>
                      <p className="text-xs text-zinc-500">
                        {ROLE_TYPE_LABELS[app.roleType]}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-4 py-3">
                      <EligibilityBadge
                        roleType={app.roleType}
                        term={app.term}
                        profile={profile}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <FitRing score={fit} />
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-zinc-400 md:table-cell">
                      {formatDateShort(app.appliedDate)}
                    </td>
                    <td
                      className={cn(
                        "hidden max-w-48 truncate px-4 py-3 lg:table-cell",
                        app.nextAction ? "text-amber-300" : "text-zinc-600"
                      )}
                    >
                      {app.nextAction
                        ? `${app.nextAction}${
                            app.nextActionDate
                              ? ` · ${formatDateShort(app.nextActionDate)}`
                              : ""
                          }`
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ApplicationForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        existing={editing}
      />
      <ApplicationDetail
        app={formOpen ? null : selectedLive}
        onClose={() => setSelected(null)}
        onEdit={(app) => {
          setEditing(app);
          setFormOpen(true);
        }}
      />
    </div>
  );
}

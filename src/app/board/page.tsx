"use client";

import { useMemo, useState } from "react";
import { Plus, Star } from "lucide-react";
import ApplicationForm from "@/components/ApplicationForm";
import ApplicationDetail from "@/components/ApplicationDetail";
import EligibilityBadge from "@/components/EligibilityBadge";
import FitRing from "@/components/FitRing";
import StatusBadge from "@/components/StatusBadge";
import { useJobPulse } from "@/lib/store";
import { fitScore } from "@/lib/fit";
import { Application, ApplicationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const COLUMNS: { key: string; label: string; statuses: ApplicationStatus[]; drop: ApplicationStatus }[] = [
  { key: "saved", label: "Saved", statuses: ["saved"], drop: "saved" },
  { key: "applied", label: "Applied", statuses: ["applied"], drop: "applied" },
  { key: "oa", label: "OA", statuses: ["oa"], drop: "oa" },
  { key: "phone", label: "Phone", statuses: ["phone"], drop: "phone" },
  { key: "interview", label: "Interview", statuses: ["interview"], drop: "interview" },
  { key: "offer", label: "Offer", statuses: ["offer", "accepted"], drop: "offer" },
  { key: "closed", label: "Closed", statuses: ["rejected", "withdrawn", "ghosted"], drop: "rejected" },
];

export default function BoardPage() {
  const applications = useJobPulse((s) => s.applications);
  const profile = useJobPulse((s) => s.profile);
  const hydrated = useJobPulse((s) => s.hydrated);
  const setStatus = useJobPulse((s) => s.setStatus);

  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  const [selected, setSelected] = useState<Application | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Application | null>(null);

  const byColumn = useMemo(() => {
    const map = new Map<string, Application[]>();
    for (const col of COLUMNS) {
      map.set(
        col.key,
        applications
          .filter((a) => col.statuses.includes(a.status))
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      );
    }
    return map;
  }, [applications]);

  const selectedLive = selected
    ? applications.find((a) => a.id === selected.id) ?? null
    : null;

  if (!hydrated) return <div className="card h-64 animate-pulse" />;

  return (
    <div className="flex h-full flex-col space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pipeline board</h1>
          <p className="text-sm text-zinc-400">
            Drag cards between stages. Drop on Closed marks as rejected — refine
            inside the card.
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      <div className="flex flex-1 gap-3 overflow-x-auto pb-2">
        {COLUMNS.map((col) => {
          const apps = byColumn.get(col.key) ?? [];
          return (
            <div
              key={col.key}
              onDragOver={(e) => {
                e.preventDefault();
                setOverCol(col.key);
              }}
              onDragLeave={() => setOverCol((c) => (c === col.key ? null : c))}
              onDrop={(e) => {
                e.preventDefault();
                setOverCol(null);
                if (dragId) setStatus(dragId, col.drop);
                setDragId(null);
              }}
              className={cn(
                "flex w-64 shrink-0 flex-col rounded-xl border bg-zinc-900/40 transition",
                overCol === col.key
                  ? "border-indigo-500/70 bg-indigo-950/20"
                  : "border-zinc-800"
              )}
            >
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-sm font-semibold text-zinc-200">
                  {col.label}
                </span>
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                  {apps.length}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
                {apps.map((app) => (
                  <div
                    key={app.id}
                    draggable
                    onDragStart={() => setDragId(app.id)}
                    onDragEnd={() => setDragId(null)}
                    onClick={() => setSelected(app)}
                    className={cn(
                      "cursor-grab rounded-lg border border-zinc-800 bg-zinc-900 p-3 shadow-sm transition hover:border-zinc-600 active:cursor-grabbing",
                      dragId === app.id && "opacity-40"
                    )}
                  >
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold leading-tight text-zinc-100">
                        {app.company}
                      </p>
                      <FitRing score={fitScore(app, profile).score} size={28} />
                    </div>
                    <p className="mb-2 line-clamp-2 text-xs text-zinc-400">
                      {app.role}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                        {app.term}
                      </span>
                      <EligibilityBadge
                        roleType={app.roleType}
                        term={app.term}
                        profile={profile}
                      />
                      {col.key === "offer" || col.key === "closed" ? (
                        <StatusBadge status={app.status} />
                      ) : null}
                    </div>
                    {app.excitement >= 4 && (
                      <div className="mt-1.5 flex gap-0.5">
                        {Array.from({ length: app.excitement }).map((_, i) => (
                          <Star
                            key={i}
                            className="h-3 w-3 fill-amber-400 text-amber-400"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {apps.length === 0 && (
                  <div className="rounded-lg border border-dashed border-zinc-800 py-6 text-center text-xs text-zinc-600">
                    Empty
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

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

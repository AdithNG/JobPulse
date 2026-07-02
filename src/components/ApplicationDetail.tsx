"use client";

import { useState } from "react";
import {
  CalendarClock,
  ExternalLink,
  MapPin,
  Pencil,
  Trash2,
  UserCheck,
} from "lucide-react";
import Modal from "./Modal";
import StatusBadge from "./StatusBadge";
import EligibilityBadge from "./EligibilityBadge";
import FitRing from "./FitRing";
import { useJobPulse } from "@/lib/store";
import { fitScore } from "@/lib/fit";
import {
  Application,
  ApplicationStatus,
  ROLE_TYPE_LABELS,
  STATUS_LABELS,
  STATUS_ORDER,
} from "@/lib/types";
import { formatDate, todayISO } from "@/lib/utils";

export default function ApplicationDetail({
  app,
  onClose,
  onEdit,
}: {
  app: Application | null;
  onClose: () => void;
  onEdit: (app: Application) => void;
}) {
  const profile = useJobPulse((s) => s.profile);
  const setStatus = useJobPulse((s) => s.setStatus);
  const deleteApplication = useJobPulse((s) => s.deleteApplication);
  const addEvent = useJobPulse((s) => s.addEvent);
  const [note, setNote] = useState("");

  if (!app) return null;
  const fit = fitScore(app, profile);
  const sortedEvents = [...app.events].sort((a, b) =>
    a.date < b.date ? 1 : -1
  );

  const submitNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    addEvent(app.id, { date: todayISO(), type: "note", text: note.trim() });
    setNote("");
  };

  return (
    <Modal open={!!app} onClose={onClose} title={`${app.company} — ${app.role}`} wide>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={app.status} />
          <span className="rounded-full border border-zinc-700 bg-zinc-800/60 px-2.5 py-0.5 text-xs text-zinc-300">
            {ROLE_TYPE_LABELS[app.roleType]} · {app.term}
          </span>
          <EligibilityBadge
            roleType={app.roleType}
            term={app.term}
            profile={profile}
          />
          <div className="ml-auto">
            <FitRing score={fit.score} showLabel />
          </div>
        </div>

        <div className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          {app.location && (
            <p className="flex items-center gap-2 text-zinc-300">
              <MapPin className="h-4 w-4 text-zinc-500" />
              {app.location}
              {app.workMode ? ` · ${app.workMode}` : ""}
            </p>
          )}
          {app.referrerName && (
            <p className="flex items-center gap-2 text-zinc-300">
              <UserCheck className="h-4 w-4 text-zinc-500" />
              Referred by {app.referrerName}
            </p>
          )}
          {app.nextAction && (
            <p className="flex items-center gap-2 text-amber-300">
              <CalendarClock className="h-4 w-4" />
              {app.nextAction}
              {app.nextActionDate ? ` — ${formatDate(app.nextActionDate)}` : ""}
            </p>
          )}
          {app.url && (
            <a
              href={app.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-indigo-400 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Job posting
            </a>
          )}
          <p className="text-zinc-400">
            Applied: <span className="text-zinc-200">{formatDate(app.appliedDate)}</span>
          </p>
          {app.salary && (
            <p className="text-zinc-400">
              Comp: <span className="text-zinc-200">{app.salary}</span>
            </p>
          )}
        </div>

        {fit.matchedKeywords.length > 0 && (
          <p className="text-xs text-zinc-500">
            Fit signals:{" "}
            <span className="text-zinc-300">
              {fit.matchedKeywords.join(", ")}
            </span>
            {fit.referralPoints > 0 && " · referral boost"}
            {fit.sponsorshipPoints === 20 && " · sponsors visas"}
          </p>
        )}

        {app.notes && (
          <div className="card p-3 text-sm leading-relaxed text-zinc-300">
            {app.notes}
          </div>
        )}

        <div>
          <p className="label">Move to</p>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_ORDER.filter((s) => s !== app.status).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(app.id, s as ApplicationStatus)}
                className="rounded-full border border-zinc-700 px-2.5 py-1 text-xs text-zinc-300 transition hover:border-indigo-500 hover:text-white"
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="label">Activity</p>
          <form onSubmit={submitNote} className="mb-3 flex gap-2">
            <input
              className="input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Log a note (recruiter call, prep, follow-up sent...)"
            />
            <button type="submit" className="btn-ghost shrink-0">
              Log
            </button>
          </form>
          <ol className="relative ml-2 space-y-3 border-l border-zinc-800 pl-5">
            {sortedEvents.map((ev) => (
              <li key={ev.id} className="relative text-sm">
                <span
                  className={`absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full ${
                    ev.type === "status" ? "bg-indigo-500" : "bg-zinc-600"
                  }`}
                />
                <span className="text-zinc-200">{ev.text}</span>
                <span className="ml-2 text-xs text-zinc-500">
                  {formatDate(ev.date)}
                </span>
              </li>
            ))}
            {sortedEvents.length === 0 && (
              <li className="text-sm text-zinc-500">No activity yet.</li>
            )}
          </ol>
        </div>

        <div className="flex justify-between border-t border-zinc-800 pt-4">
          <button
            onClick={() => {
              if (confirm(`Delete ${app.company} — ${app.role}?`)) {
                deleteApplication(app.id);
                onClose();
              }
            }}
            className="btn-danger"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
          <button onClick={() => onEdit(app)} className="btn-primary">
            <Pencil className="h-4 w-4" /> Edit
          </button>
        </div>
      </div>
    </Modal>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import Modal from "./Modal";
import EligibilityBadge from "./EligibilityBadge";
import FitRing from "./FitRing";
import { useJobPulse } from "@/lib/store";
import { fitScore } from "@/lib/fit";
import { upcomingTerms } from "@/lib/terms";
import {
  Application,
  ApplicationStatus,
  ROLE_TYPE_LABELS,
  RoleType,
  STATUS_LABELS,
  STATUS_ORDER,
  Sponsorship,
  WorkMode,
} from "@/lib/types";
import { cn, todayISO } from "@/lib/utils";

interface FormState {
  company: string;
  role: string;
  url: string;
  location: string;
  workMode: WorkMode | "";
  roleType: RoleType;
  term: string;
  status: ApplicationStatus;
  salary: string;
  source: string;
  referrerName: string;
  sponsorship: Sponsorship;
  excitement: number;
  tags: string;
  notes: string;
  appliedDate: string;
  deadline: string;
  nextActionDate: string;
  nextAction: string;
}

function emptyForm(defaultTerm: string): FormState {
  return {
    company: "",
    role: "",
    url: "",
    location: "",
    workMode: "",
    roleType: "co-op",
    term: defaultTerm,
    status: "saved",
    salary: "",
    source: "",
    referrerName: "",
    sponsorship: "unknown",
    excitement: 3,
    tags: "",
    notes: "",
    appliedDate: "",
    deadline: "",
    nextActionDate: "",
    nextAction: "",
  };
}

function fromApplication(app: Application): FormState {
  return {
    company: app.company,
    role: app.role,
    url: app.url ?? "",
    location: app.location ?? "",
    workMode: app.workMode ?? "",
    roleType: app.roleType,
    term: app.term,
    status: app.status,
    salary: app.salary ?? "",
    source: app.source ?? "",
    referrerName: app.referrerName ?? "",
    sponsorship: app.sponsorship,
    excitement: app.excitement,
    tags: app.tags.join(", "),
    notes: app.notes,
    appliedDate: app.appliedDate ?? "",
    deadline: app.deadline ?? "",
    nextActionDate: app.nextActionDate ?? "",
    nextAction: app.nextAction ?? "",
  };
}

export default function ApplicationForm({
  open,
  onClose,
  existing,
}: {
  open: boolean;
  onClose: () => void;
  existing?: Application | null;
}) {
  const profile = useJobPulse((s) => s.profile);
  const addApplication = useJobPulse((s) => s.addApplication);
  const updateApplication = useJobPulse((s) => s.updateApplication);
  const setStatus = useJobPulse((s) => s.setStatus);

  const terms = useMemo(() => upcomingTerms(profile), [profile]);
  const [form, setForm] = useState<FormState>(() =>
    emptyForm(terms[0] ?? "Fall 2026")
  );

  useEffect(() => {
    if (open) {
      setForm(
        existing ? fromApplication(existing) : emptyForm(terms[0] ?? "Fall 2026")
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, existing]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const preview = useMemo(() => {
    const draft: Application = {
      id: "preview",
      company: form.company,
      role: form.role,
      roleType: form.roleType,
      term: form.term,
      status: form.status,
      sponsorship: form.sponsorship,
      excitement: form.excitement,
      referrerName: form.referrerName || undefined,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      notes: form.notes,
      events: [],
      createdAt: "",
      updatedAt: "",
    };
    return fitScore(draft, profile);
  }, [form, profile]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      company: form.company.trim(),
      role: form.role.trim(),
      url: form.url.trim() || undefined,
      location: form.location.trim() || undefined,
      workMode: form.workMode || undefined,
      roleType: form.roleType,
      term: form.term,
      status: form.status,
      salary: form.salary.trim() || undefined,
      source: form.source.trim() || undefined,
      referrerName: form.referrerName.trim() || undefined,
      sponsorship: form.sponsorship,
      excitement: form.excitement,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      notes: form.notes,
      appliedDate:
        form.appliedDate ||
        (form.status !== "saved" ? todayISO() : undefined),
      deadline: form.deadline || undefined,
      nextActionDate: form.nextActionDate || undefined,
      nextAction: form.nextAction.trim() || undefined,
    };
    if (existing) {
      const { status, ...rest } = payload;
      updateApplication(existing.id, rest);
      if (status !== existing.status) setStatus(existing.id, status);
    } else {
      addApplication(payload);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existing ? "Edit application" : "Add application"}
      wide
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Company *</label>
            <input
              className="input"
              required
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
              placeholder="Amazon"
            />
          </div>
          <div>
            <label className="label">Role *</label>
            <input
              className="input"
              required
              value={form.role}
              onChange={(e) => set("role", e.target.value)}
              placeholder="SDE Co-op — Payments"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Role type</label>
            <select
              className="input"
              value={form.roleType}
              onChange={(e) => set("roleType", e.target.value as RoleType)}
            >
              {(Object.keys(ROLE_TYPE_LABELS) as RoleType[]).map((rt) => (
                <option key={rt} value={rt}>
                  {ROLE_TYPE_LABELS[rt]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Term</label>
            <select
              className="input"
              value={form.term}
              onChange={(e) => set("term", e.target.value)}
            >
              {!terms.includes(form.term) && (
                <option value={form.term}>{form.term}</option>
              )}
              {terms.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={form.status}
              onChange={(e) =>
                set("status", e.target.value as ApplicationStatus)
              }
            >
              {STATUS_ORDER.map((st) => (
                <option key={st} value={st}>
                  {STATUS_LABELS[st]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <EligibilityBadge
          roleType={form.roleType}
          term={form.term}
          profile={profile}
          detailed
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Location</label>
            <input
              className="input"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="Seattle, WA"
            />
          </div>
          <div>
            <label className="label">Work mode</label>
            <select
              className="input"
              value={form.workMode}
              onChange={(e) => set("workMode", e.target.value as WorkMode | "")}
            >
              <option value="">—</option>
              <option value="onsite">Onsite</option>
              <option value="hybrid">Hybrid</option>
              <option value="remote">Remote</option>
            </select>
          </div>
          <div>
            <label className="label">Salary / rate</label>
            <input
              className="input"
              value={form.salary}
              onChange={(e) => set("salary", e.target.value)}
              placeholder="$55/hr"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Sponsorship</label>
            <select
              className="input"
              value={form.sponsorship}
              onChange={(e) => set("sponsorship", e.target.value as Sponsorship)}
            >
              <option value="unknown">Unknown</option>
              <option value="yes">Sponsors visas</option>
              <option value="no">No sponsorship</option>
            </select>
          </div>
          <div>
            <label className="label">Source</label>
            <input
              className="input"
              value={form.source}
              onChange={(e) => set("source", e.target.value)}
              placeholder="LinkedIn, career fair..."
            />
          </div>
          <div>
            <label className="label">Referred by</label>
            <input
              className="input"
              value={form.referrerName}
              onChange={(e) => set("referrerName", e.target.value)}
              placeholder="Name (if referral)"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Job URL</label>
            <input
              className="input"
              type="url"
              value={form.url}
              onChange={(e) => set("url", e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="label">Applied date</label>
            <input
              className="input"
              type="date"
              value={form.appliedDate}
              onChange={(e) => set("appliedDate", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Deadline</label>
            <input
              className="input"
              type="date"
              value={form.deadline}
              onChange={(e) => set("deadline", e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Next action</label>
            <input
              className="input"
              value={form.nextAction}
              onChange={(e) => set("nextAction", e.target.value)}
              placeholder="Follow up with recruiter"
            />
          </div>
          <div>
            <label className="label">Next action date</label>
            <input
              className="input"
              type="date"
              value={form.nextActionDate}
              onChange={(e) => set("nextActionDate", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label">Tags (comma-separated)</label>
          <input
            className="input"
            value={form.tags}
            onChange={(e) => set("tags", e.target.value)}
            placeholder="fintech, aws, backend"
          />
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea
            className="input min-h-20 resize-y"
            rows={3}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Team details, recruiter name, prep notes..."
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-zinc-800 pt-4">
          <div className="flex items-center gap-5">
            <div>
              <p className="label mb-1.5">Excitement</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => set("excitement", n)}
                    aria-label={`Excitement ${n}`}
                  >
                    <Star
                      className={cn(
                        "h-5 w-5 transition",
                        n <= form.excitement
                          ? "fill-amber-400 text-amber-400"
                          : "text-zinc-700 hover:text-zinc-500"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="label mb-1.5">Fit preview</p>
              <FitRing score={preview.score} showLabel />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {existing ? "Save changes" : "Add application"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

"use client";

import { useRef, useState } from "react";
import {
  Download,
  FileSpreadsheet,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { useJobPulse } from "@/lib/store";
import { applicationsToCsv, download } from "@/lib/csv";
import { cptRunway, fullTimeCptMonths } from "@/lib/terms";
import { cn, formatDate, todayISO } from "@/lib/utils";

export default function SettingsPage() {
  const state = useJobPulse();
  const {
    profile,
    applications,
    contacts,
    hydrated,
    updateProfile,
    addCptPeriod,
    deleteCptPeriod,
    importData,
    resetAll,
  } = state;

  const fileRef = useRef<HTMLInputElement>(null);
  const [keyword, setKeyword] = useState("");
  const [keywordWeight, setKeywordWeight] = useState(5);
  const [cptForm, setCptForm] = useState({
    label: "",
    start: "",
    end: "",
    fullTime: true,
  });
  const [importError, setImportError] = useState("");

  if (!hydrated) return <div className="card h-64 animate-pulse" />;

  const runway = cptRunway(profile);

  const exportJson = () => {
    download(
      `jobpulse-backup-${todayISO()}.json`,
      JSON.stringify({ applications, contacts, profile }, null, 2),
      "application/json"
    );
  };

  const exportCsv = () => {
    download(
      `jobpulse-applications-${todayISO()}.csv`,
      applicationsToCsv(applications),
      "text/csv"
    );
  };

  const handleImport = (file: File) => {
    setImportError("");
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (!data.applications && !data.contacts && !data.profile) {
          throw new Error("Not a JobPulse backup file.");
        }
        importData(data);
      } catch (err) {
        setImportError(
          err instanceof Error ? err.message : "Couldn't parse that file."
        );
      }
    };
    reader.readAsText(file);
  };

  const addKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    const word = keyword.trim().toLowerCase();
    if (!word) return;
    if (profile.fitKeywords.some((k) => k.word === word)) return;
    updateProfile({
      fitKeywords: [...profile.fitKeywords, { word, weight: keywordWeight }],
    });
    setKeyword("");
  };

  const submitCpt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cptForm.label.trim() || !cptForm.start || !cptForm.end) return;
    addCptPeriod({
      label: cptForm.label.trim(),
      start: cptForm.start,
      end: cptForm.end,
      fullTime: cptForm.fullTime,
    });
    setCptForm({ label: "", start: "", end: "", fullTime: true });
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-zinc-400">
          Profile, fit targeting, CPT tracking, and your data.
        </p>
      </div>

      {/* Profile */}
      <section className="card p-5">
        <h2 className="mb-4 font-semibold">Profile</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Target role</label>
            <input
              className="input"
              value={profile.targetTitle}
              onChange={(e) => updateProfile({ targetTitle: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Weekly application goal</label>
            <input
              className="input"
              type="number"
              min={1}
              max={100}
              value={profile.weeklyGoal}
              onChange={(e) =>
                updateProfile({ weeklyGoal: Math.max(1, Number(e.target.value)) })
              }
            />
          </div>
          <div>
            <label className="label">Program start</label>
            <input
              className="input"
              type="date"
              value={profile.programStart}
              onChange={(e) => updateProfile({ programStart: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Graduation date</label>
            <input
              className="input"
              type="date"
              value={profile.graduationDate}
              onChange={(e) =>
                updateProfile({ graduationDate: e.target.value })
              }
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          Graduation date drives term eligibility: co-op-only Fall/Spring
          checks, summer internship windows, and when full-time new-grad roles
          become possible.
        </p>
      </section>

      {/* Fit keywords */}
      <section className="card p-5">
        <h2 className="mb-1 font-semibold">Fit keywords</h2>
        <p className="mb-4 text-xs text-zinc-500">
          Applications are scored against these (matched in role, company,
          tags, notes). Higher weight = more important to you.
        </p>
        <div className="mb-4 flex flex-wrap gap-2">
          {profile.fitKeywords
            .slice()
            .sort((a, b) => b.weight - a.weight)
            .map((k) => (
              <span
                key={k.word}
                className="group inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-sm"
              >
                {k.word}
                <span className="text-xs text-zinc-500">×{k.weight}</span>
                <button
                  onClick={() =>
                    updateProfile({
                      fitKeywords: profile.fitKeywords.filter(
                        (x) => x.word !== k.word
                      ),
                    })
                  }
                  className="text-zinc-600 transition hover:text-red-400"
                  aria-label={`Remove ${k.word}`}
                >
                  ×
                </button>
              </span>
            ))}
        </div>
        <form onSubmit={addKeyword} className="flex flex-wrap gap-2">
          <input
            className="input max-w-52"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="e.g. payments"
          />
          <select
            className="input w-auto"
            value={keywordWeight}
            onChange={(e) => setKeywordWeight(Number(e.target.value))}
          >
            {[3, 5, 8, 10, 12, 15].map((w) => (
              <option key={w} value={w}>
                weight {w}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-ghost">
            <Plus className="h-4 w-4" /> Add
          </button>
        </form>
      </section>

      {/* CPT periods */}
      <section className="card p-5">
        <h2 className="mb-1 font-semibold">CPT periods</h2>
        <p className="mb-4 text-xs text-zinc-500">
          Track every CPT authorization. {runway.message}
        </p>
        <ul className="mb-4 space-y-2">
          {profile.cptPeriods.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm"
            >
              <div>
                <p className="font-medium text-zinc-100">{p.label}</p>
                <p className="text-xs text-zinc-500">
                  {formatDate(p.start)} → {formatDate(p.end)} ·{" "}
                  <span
                    className={cn(
                      p.fullTime ? "text-amber-400" : "text-emerald-400"
                    )}
                  >
                    {p.fullTime ? "full-time (counts toward 12mo)" : "part-time"}
                  </span>
                </p>
              </div>
              <button
                onClick={() => deleteCptPeriod(p.id)}
                className="rounded p-1.5 text-zinc-500 transition hover:bg-red-950 hover:text-red-400"
                aria-label={`Delete ${p.label}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
          {profile.cptPeriods.length === 0 && (
            <li className="text-sm text-zinc-500">No CPT periods recorded.</li>
          )}
        </ul>
        <form onSubmit={submitCpt} className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto_auto]">
          <input
            className="input"
            value={cptForm.label}
            onChange={(e) => setCptForm({ ...cptForm, label: e.target.value })}
            placeholder="Label (e.g. Spring 2027 co-op)"
          />
          <input
            className="input"
            type="date"
            value={cptForm.start}
            onChange={(e) => setCptForm({ ...cptForm, start: e.target.value })}
          />
          <input
            className="input"
            type="date"
            value={cptForm.end}
            onChange={(e) => setCptForm({ ...cptForm, end: e.target.value })}
          />
          <label className="flex items-center gap-2 whitespace-nowrap px-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={cptForm.fullTime}
              onChange={(e) =>
                setCptForm({ ...cptForm, fullTime: e.target.checked })
              }
              className="h-4 w-4 accent-indigo-600"
            />
            full-time
          </label>
          <button type="submit" className="btn-ghost">
            <Plus className="h-4 w-4" /> Add
          </button>
        </form>
        <p className="mt-3 text-xs text-zinc-600">
          Full-time CPT used: {fullTimeCptMonths(profile.cptPeriods).toFixed(1)}{" "}
          months. 12+ months of full-time CPT forfeits OPT. Part-time CPT never
          counts. This is a tracker, not legal advice — confirm with your DSO.
        </p>
      </section>

      {/* Data */}
      <section className="card p-5">
        <h2 className="mb-1 font-semibold">Your data</h2>
        <p className="mb-4 text-xs text-zinc-500">
          Everything lives in this browser&apos;s localStorage. Export backups
          regularly — especially before clearing browser data.
        </p>
        <div className="flex flex-wrap gap-3">
          <button onClick={exportJson} className="btn-ghost">
            <Download className="h-4 w-4" /> Export JSON backup
          </button>
          <button onClick={exportCsv} className="btn-ghost">
            <FileSpreadsheet className="h-4 w-4" /> Export CSV
          </button>
          <button onClick={() => fileRef.current?.click()} className="btn-ghost">
            <Upload className="h-4 w-4" /> Import JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => {
              if (
                confirm(
                  "Reset ALL data (applications, contacts, profile)? Export a backup first!"
                )
              ) {
                resetAll();
              }
            }}
            className="btn-danger"
          >
            <Trash2 className="h-4 w-4" /> Reset everything
          </button>
        </div>
        {importError && (
          <p className="mt-3 text-sm text-red-400">{importError}</p>
        )}
        <p className="mt-3 text-xs text-zinc-600">
          {applications.length} applications · {contacts.length} contacts
        </p>
      </section>
    </div>
  );
}

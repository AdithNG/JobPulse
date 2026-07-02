"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  ExternalLink,
  FileText,
  Plus,
  RefreshCw,
  Rss,
  Search,
} from "lucide-react";
import FitRing from "@/components/FitRing";
import { useJobPulse } from "@/lib/store";
import { fitScore } from "@/lib/fit";
import { RoleType, ROLE_TYPE_LABELS, Sponsorship } from "@/lib/types";
import { cn } from "@/lib/utils";

const FEED_URL =
  "https://raw.githubusercontent.com/AdithNG/JobPulse/data/feed.json";

interface FeedJob {
  key: string;
  company: string;
  title: string;
  url: string;
  locations: string[];
  term: string;
  roleType: RoleType;
  stretch?: boolean;
  sponsorship: Sponsorship;
  source: string;
  fromAtsBoard?: boolean;
  score: number;
  matchedWords?: string[];
  firstSeen: number;
}

interface FeedPayload {
  updatedAt: string;
  jobs: FeedJob[];
}

function timeAgo(ts: number): string {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function FeedPage() {
  const applications = useJobPulse((s) => s.applications);
  const addApplication = useJobPulse((s) => s.addApplication);
  const profile = useJobPulse((s) => s.profile);
  const hydrated = useJobPulse((s) => s.hydrated);

  const [payload, setPayload] = useState<FeedPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<RoleType | "all">("all");
  const [goodFitOnly, setGoodFitOnly] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${FEED_URL}?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setPayload(await res.json());
    } catch (e) {
      setError(
        e instanceof Error
          ? `Couldn't load the feed (${e.message}). Has the watcher run yet?`
          : "Couldn't load the feed."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const inPipeline = useMemo(
    () => new Set(applications.map((a) => a.url).filter(Boolean)),
    [applications]
  );

  // Fit is computed client-side against YOUR profile (resume keywords),
  // so two people looking at the same feed see different scores.
  const jobs = useMemo(() => {
    if (!payload) return [];
    const q = query.toLowerCase();
    return payload.jobs
      .map((j) => ({
        ...j,
        score: fitScore(
          {
            id: j.key,
            company: j.company,
            role: j.title,
            roleType: j.roleType,
            term: j.term,
            status: "saved",
            sponsorship: j.sponsorship,
            excitement: 3,
            tags: [],
            notes: "",
            events: [],
            createdAt: "",
            updatedAt: "",
          },
          profile
        ).score,
      }))
      .filter((j) => {
        if (
          q &&
          !`${j.company} ${j.title} ${j.locations.join(" ")}`
            .toLowerCase()
            .includes(q)
        )
          return false;
        if (typeFilter !== "all" && j.roleType !== typeFilter) return false;
        if (goodFitOnly && j.score < 35) return false;
        return true;
      });
  }, [payload, query, typeFilter, goodFitOnly, profile]);

  const addToPipeline = (job: FeedJob) => {
    addApplication({
      company: job.company,
      role: job.title,
      url: job.url,
      location: job.locations[0],
      roleType: job.roleType,
      term: job.term,
      status: "saved",
      sponsorship: job.sponsorship,
      excitement: job.score >= 60 ? 4 : 3,
      source: "JobPulse feed",
      tags: job.matchedWords ?? [],
      notes: job.stretch
        ? "⚠️ Term starts after graduation — only works if deferring or converting to full-time."
        : "",
    });
  };

  if (!hydrated) return <div className="card h-64 animate-pulse" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Rss className="h-6 w-6 text-indigo-400" />
            Job feed
          </h1>
          <p className="text-sm text-zinc-400">
            Auto-discovered every ~10 minutes from SimplifyJobs + target company
            boards, filtered to F-1-workable roles.
            {payload && (
              <span className="text-zinc-500">
                {" "}
                Updated {new Date(payload.updatedAt).toLocaleString()}
              </span>
            )}
          </p>
        </div>
        <button onClick={load} className="btn-ghost" disabled={loading}>
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            className="input pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company, title, location..."
          />
        </div>
        <select
          className="input w-auto"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as RoleType | "all")}
        >
          <option value="all">All types</option>
          <option value="new-grad">New Grad</option>
          <option value="co-op">Co-op</option>
          <option value="internship">Internship</option>
        </select>
        <button
          onClick={() => setGoodFitOnly((v) => !v)}
          className={cn(
            "rounded-lg border px-4 py-2 text-sm font-medium transition",
            goodFitOnly
              ? "border-indigo-500 bg-indigo-950/40 text-indigo-300"
              : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
          )}
        >
          Good fit only
        </button>
      </div>

      {!profile.resumeText && (
        <Link
          href="/settings"
          className="card flex items-center gap-3 border-indigo-800/60 bg-indigo-950/20 p-4 text-sm transition hover:border-indigo-600"
        >
          <FileText className="h-5 w-5 shrink-0 text-indigo-400" />
          <span className="text-zinc-200">
            <span className="font-semibold">Personalize these scores:</span>{" "}
            paste your resume in Settings and every job gets re-scored against
            your actual skills — right now you&apos;re seeing generic new-grad
            SWE weights.
          </span>
        </Link>
      )}

      {error && (
        <div className="card border-amber-900/60 bg-amber-950/20 p-4 text-sm text-amber-200">
          {error}
        </div>
      )}

      {loading && !payload ? (
        <div className="card h-64 animate-pulse" />
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => {
            const added = job.url ? inPipeline.has(job.url) : false;
            return (
              <div
                key={job.key}
                className="card flex flex-wrap items-center gap-3 p-4"
              >
                <FitRing score={job.score} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-zinc-100">
                    {job.company}
                    <span className="ml-2 font-normal text-zinc-300">
                      {job.title}
                    </span>
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-zinc-300">
                      {ROLE_TYPE_LABELS[job.roleType]} · {job.term}
                    </span>
                    {job.locations[0] && <span>📍 {job.locations[0]}</span>}
                    {job.sponsorship === "yes" && (
                      <span className="text-emerald-400">🛂 sponsors</span>
                    )}
                    {job.sponsorship === "no" && (
                      <span className="text-amber-400">⚠️ no sponsorship</span>
                    )}
                    {job.stretch && (
                      <span className="text-amber-400">⚠️ post-grad term</span>
                    )}
                    {job.fromAtsBoard && (
                      <span className="text-indigo-400">target company</span>
                    )}
                    <span>{timeAgo(job.firstSeen)}</span>
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost"
                  >
                    <ExternalLink className="h-4 w-4" /> Apply
                  </a>
                  <button
                    onClick={() => addToPipeline(job)}
                    disabled={added}
                    className={cn(
                      added
                        ? "inline-flex items-center gap-2 rounded-lg border border-emerald-900 px-4 py-2 text-sm font-medium text-emerald-400"
                        : "btn-primary"
                    )}
                  >
                    {added ? (
                      <>
                        <Check className="h-4 w-4" /> Tracked
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" /> Track
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
          {!error && jobs.length === 0 && !loading && (
            <div className="card py-16 text-center text-sm text-zinc-400">
              No jobs match your filters.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { CalendarDays, Check, FileText, Rss, ShieldCheck } from "lucide-react";
import { useJobPulse } from "@/lib/store";
import { cn } from "@/lib/utils";

// First-visit hero shown while the tracker is empty. Explains what JobPulse
// is and walks through the three setup steps.
export default function Onboarding() {
  const profile = useJobPulse((s) => s.profile);
  const applications = useJobPulse((s) => s.applications);

  const steps = [
    {
      icon: CalendarDays,
      title: "Set your timeline",
      done: false, // not detectable — always shown as an action
      text: "Your graduation date drives everything: which terms allow co-ops vs. internships on CPT, and when full-time roles open up.",
      href: "/settings",
      cta: "Set dates in Settings",
    },
    {
      icon: FileText,
      title: "Paste your resume",
      done: !!profile.resumeText,
      text: "Your skills are extracted right in the browser and every job gets a personal 0–100 fit score. The resume never leaves your device.",
      href: "/settings",
      cta: "Add resume",
    },
    {
      icon: Rss,
      title: "Track your first job",
      done: applications.length > 0,
      text: "The Feed auto-discovers F-1-workable SWE roles all day. Hit Track on anything interesting, or add an application you already made.",
      href: "/feed",
      cta: "Browse the Feed",
    },
  ];

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-zinc-800 bg-gradient-to-r from-indigo-950/40 to-transparent px-6 py-8">
        <h2 className="text-xl font-semibold tracking-tight">
          Welcome to JobPulse 👋
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
          A job tracker built for international students on F-1 visas. It knows
          the rules a generic tracker doesn&apos;t: Fall/Spring semesters need
          co-ops, summers allow full-time internships, full-time jobs only work
          after graduation — and 12 months of full-time CPT forfeits OPT.
          Every job you track gets checked against them.
        </p>
        <p className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          No accounts. Everything is stored in your browser only — export a
          backup anytime in Settings.
        </p>
      </div>
      <div className="grid gap-px bg-zinc-800 md:grid-cols-3">
        {steps.map((step, i) => (
          <div key={step.title} className="bg-zinc-900/80 p-5">
            <div className="mb-2 flex items-center gap-2">
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                  step.done
                    ? "bg-emerald-600 text-white"
                    : "bg-zinc-800 text-zinc-400"
                )}
              >
                {step.done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <h3 className="font-medium text-zinc-100">{step.title}</h3>
            </div>
            <p className="mb-3 text-xs leading-relaxed text-zinc-500">
              {step.text}
            </p>
            {!step.done && (
              <Link
                href={step.href}
                className="text-xs font-medium text-indigo-400 hover:underline"
              >
                {step.cta} →
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

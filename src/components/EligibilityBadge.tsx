"use client";

import { AlertTriangle, ShieldCheck, ShieldX } from "lucide-react";
import { checkEligibility } from "@/lib/terms";
import { Profile, RoleType } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function EligibilityBadge({
  roleType,
  term,
  profile,
  detailed = false,
}: {
  roleType: RoleType;
  term: string;
  profile: Profile;
  detailed?: boolean;
}) {
  const result = checkEligibility(roleType, term, profile);

  const config = {
    ok: {
      icon: ShieldCheck,
      badge: "border-emerald-900 bg-emerald-950/60 text-emerald-300",
      panel: "border-emerald-900/60 bg-emerald-950/30 text-emerald-200",
    },
    warn: {
      icon: AlertTriangle,
      badge: "border-amber-900 bg-amber-950/60 text-amber-300",
      panel: "border-amber-900/60 bg-amber-950/30 text-amber-200",
    },
    blocked: {
      icon: ShieldX,
      badge: "border-red-900 bg-red-950/60 text-red-300",
      panel: "border-red-900/60 bg-red-950/30 text-red-200",
    },
  }[result.level];

  const Icon = config.icon;

  if (detailed) {
    return (
      <div className={cn("rounded-lg border p-3 text-sm", config.panel)}>
        <p className="flex items-center gap-2 font-semibold">
          <Icon className="h-4 w-4 shrink-0" />
          {result.title}
        </p>
        <p className="mt-1 text-xs leading-relaxed opacity-80">
          {result.detail}
        </p>
      </div>
    );
  }

  return (
    <span
      title={`${result.title} — ${result.detail}`}
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium",
        config.badge
      )}
    >
      <Icon className="h-3 w-3" />
      {result.level === "ok"
        ? "Eligible"
        : result.level === "warn"
          ? "Check"
          : "Blocked"}
    </span>
  );
}

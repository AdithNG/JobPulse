"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Columns3,
  LayoutDashboard,
  Rss,
  Settings,
  Table2,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useJobPulse } from "@/lib/store";
import { cptRunway } from "@/lib/terms";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/feed", label: "Feed", icon: Rss },
  { href: "/applications", label: "Applications", icon: Table2 },
  { href: "/board", label: "Board", icon: Columns3 },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const profile = useJobPulse((s) => s.profile);
  const hydrated = useJobPulse((s) => s.hydrated);
  const runway = cptRunway(profile);
  const pct = Math.min(100, (runway.usedMonths / runway.limitMonths) * 100);

  return (
    <aside className="sticky top-0 flex h-screen w-16 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 lg:w-60">
      <Link href="/" className="flex items-center gap-2.5 px-4 py-5 lg:px-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600">
          <Activity className="h-5 w-5 text-white" />
        </span>
        <span className="hidden text-lg font-semibold tracking-tight lg:block">
          JobPulse
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 px-2 lg:px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-zinc-800/80 text-white"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span className="hidden lg:block">{label}</span>
            </Link>
          );
        })}
      </nav>

      {hydrated && (
        <div className="hidden border-t border-zinc-800 p-4 lg:block">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Full-time CPT used
          </p>
          <div className="mb-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                runway.level === "danger"
                  ? "bg-red-500"
                  : runway.level === "warn"
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-zinc-400">
            {runway.usedMonths.toFixed(1)} / 12 mo
            <span className="text-zinc-600"> · OPT limit</span>
          </p>
        </div>
      )}
    </aside>
  );
}

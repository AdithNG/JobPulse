import { ApplicationStatus, STATUS_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

const STYLES: Record<ApplicationStatus, string> = {
  saved: "bg-zinc-800 text-zinc-300 border-zinc-700",
  applied: "bg-sky-950/60 text-sky-300 border-sky-900",
  oa: "bg-violet-950/60 text-violet-300 border-violet-900",
  phone: "bg-purple-950/60 text-purple-300 border-purple-900",
  interview: "bg-fuchsia-950/60 text-fuchsia-300 border-fuchsia-900",
  offer: "bg-emerald-950/60 text-emerald-300 border-emerald-900",
  accepted: "bg-emerald-900/80 text-emerald-200 border-emerald-700",
  declined: "bg-amber-950/60 text-amber-300 border-amber-900",
  rejected: "bg-red-950/60 text-red-300 border-red-900",
  withdrawn: "bg-zinc-900 text-zinc-500 border-zinc-800",
  ghosted: "bg-zinc-900 text-zinc-500 border-zinc-800",
};

export default function StatusBadge({
  status,
  className,
}: {
  status: ApplicationStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STYLES[status],
        className
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

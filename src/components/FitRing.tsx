"use client";

import { fitTier } from "@/lib/fit";
import { cn } from "@/lib/utils";

export default function FitRing({
  score,
  size = 36,
  showLabel = false,
}: {
  score: number;
  size?: number;
  showLabel?: boolean;
}) {
  const stroke = size >= 48 ? 4 : 3;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const tier = fitTier(score);
  const ringColor =
    score >= 75
      ? "stroke-emerald-400"
      : score >= 50
        ? "stroke-sky-400"
        : score >= 25
          ? "stroke-amber-400"
          : "stroke-zinc-600";

  return (
    <div className="flex items-center gap-2" title={`Fit score: ${score}/100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-zinc-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
          className={cn("transition-all", ringColor)}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          transform={`rotate(90 ${size / 2} ${size / 2})`}
          className={cn(
            "fill-zinc-200 font-semibold",
            size >= 48 ? "text-sm" : "text-[10px]"
          )}
        >
          {score}
        </text>
      </svg>
      {showLabel && (
        <span className={cn("text-xs font-medium", tier.color)}>
          {tier.label}
        </span>
      )}
    </div>
  );
}

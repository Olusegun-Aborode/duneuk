"use client";

export type TimeRange = "7d" | "30d" | "90d" | "180d" | "all";

const OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
  { value: "180d", label: "180D" },
  { value: "all", label: "ALL" },
];

/** Returns a cutoff Date for the given range, or null for "all". */
export function getCutoffDate(range: TimeRange): Date | null {
  if (range === "all") return null;
  const days = { "7d": 7, "30d": 30, "90d": 90, "180d": 180 }[range];
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export default function TimeRangeSelector({
  value,
  onChange,
}: {
  value: TimeRange;
  onChange: (r: TimeRange) => void;
}) {
  return (
    <div className="flex gap-0.5">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className="text-[9px] px-1.5 py-0.5 rounded transition-colors"
          style={{
            color: value === opt.value ? "var(--accent-green)" : "var(--text-muted)",
            border: `1px solid ${value === opt.value ? "var(--accent-green)" : "var(--border-bright)"}`,
            background: value === opt.value ? "rgba(0,255,136,0.08)" : "transparent",
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

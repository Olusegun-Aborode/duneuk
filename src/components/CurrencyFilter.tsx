"use client";

import { useCurrencyFilter, type CurrencyFilter as CurrencyFilterType } from "@/contexts/CurrencyFilterContext";

const OPTIONS: { value: CurrencyFilterType; label: string; flag: string }[] = [
  { value: "GBP", label: "GBP", flag: "🇬🇧" },
  { value: "EUR", label: "EUR", flag: "🇪🇺" },
  { value: "ALL", label: "ALL", flag: "" },
];

export function CurrencyFilter() {
  const { currency, setCurrency } = useCurrencyFilter();

  return (
    <div className="flex items-center gap-1 text-[11px] font-mono">
      <span className="text-[#6B7280] mr-1 hidden sm:inline">CURRENCY:</span>
      {OPTIONS.map((opt) => {
        const isActive = currency === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setCurrency(opt.value)}
            className="px-3 py-1 rounded transition-all"
            style={{
              color: isActive ? "var(--foreground)" : "var(--text-muted)",
              backgroundColor: isActive ? "var(--accent-green)15" : "transparent",
              border: `1px solid ${isActive ? "var(--accent-green)" : "var(--border)"}`,
              fontWeight: isActive ? 700 : 400,
            }}
          >
            {opt.flag ? `${opt.flag} ` : ""}{opt.label}
          </button>
        );
      })}
    </div>
  );
}

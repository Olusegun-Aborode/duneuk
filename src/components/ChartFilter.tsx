"use client";

import { useState, useRef, useEffect } from "react";
import { CHART_COLORS } from "@/lib/constants";
import {
  GBP_TOKENS,
  EUR_TOKENS,
  ALL_TOKENS,
  type CurrencyFilter,
} from "@/contexts/CurrencyFilterContext";

export interface ChartFilterState {
  currency: CurrencyFilter;
  selectedTokens: string[];
}

function getTokensForCurrency(currency: CurrencyFilter): readonly string[] {
  switch (currency) {
    case "GBP": return GBP_TOKENS;
    case "EUR": return EUR_TOKENS;
    case "ALL": return ALL_TOKENS;
  }
}

/**
 * Hook for per-chart local filter state.
 * Each chart manages its own currency + token selection independently.
 */
export function useChartFilter(defaultCurrency: CurrencyFilter = "ALL"): ChartFilterState & {
  setCurrency: (c: CurrencyFilter) => void;
  setSelectedTokens: (t: string[]) => void;
  tokens: readonly string[];
  tokenMatches: (token: string) => boolean;
} {
  const [currency, setCurrencyState] = useState<CurrencyFilter>(defaultCurrency);
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);

  const tokens = getTokensForCurrency(currency);

  const setCurrency = (c: CurrencyFilter) => {
    setCurrencyState(c);
    setSelectedTokens([]); // reset token selection when currency changes
  };

  const tokenMatches = (token: string): boolean => {
    // Currency check
    if (currency === "GBP" && !(GBP_TOKENS as readonly string[]).includes(token)) return false;
    if (currency === "EUR" && !(EUR_TOKENS as readonly string[]).includes(token)) return false;
    // Token selection check
    if (selectedTokens.length > 0 && !selectedTokens.includes(token)) return false;
    return true;
  };

  return { currency, setCurrency, selectedTokens, setSelectedTokens, tokens, tokenMatches };
}

const CURRENCY_OPTIONS: { value: CurrencyFilter; label: string; flag: string }[] = [
  { value: "GBP", label: "GBP", flag: "\u{1F1EC}\u{1F1E7}" },
  { value: "EUR", label: "EUR", flag: "\u{1F1EA}\u{1F1FA}" },
  { value: "ALL", label: "ALL", flag: "" },
];

/**
 * Compact inline filter for chart panel headers.
 * Renders: [GBP] [EUR] [ALL]  [Tokens ▼]
 */
export function ChartFilter({
  currency,
  setCurrency,
  tokens,
  selectedTokens,
  setSelectedTokens,
}: {
  currency: CurrencyFilter;
  setCurrency: (c: CurrencyFilter) => void;
  tokens: readonly string[];
  selectedTokens: string[];
  setSelectedTokens: (t: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const toggleToken = (t: string) => {
    if (selectedTokens.includes(t)) {
      setSelectedTokens(selectedTokens.filter((x) => x !== t));
    } else {
      setSelectedTokens([...selectedTokens, t]);
    }
  };

  const label = selectedTokens.length === 0
    ? "All"
    : `${selectedTokens.length}`;

  return (
    <div className="flex items-center gap-1 text-[9px] font-mono">
      {CURRENCY_OPTIONS.map((opt) => {
        const active = currency === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setCurrency(opt.value)}
            className="px-1.5 py-0.5 rounded transition-all"
            style={{
              color: active ? "var(--foreground)" : "var(--text-muted)",
              backgroundColor: active ? "var(--accent-green)15" : "transparent",
              border: `1px solid ${active ? "var(--accent-green)" : "var(--border)"}`,
              fontWeight: active ? 700 : 400,
              fontSize: "9px",
              lineHeight: "14px",
            }}
          >
            {opt.flag ? `${opt.flag} ` : ""}{opt.label}
          </button>
        );
      })}

      {/* Token dropdown */}
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((p) => !p)}
          className="px-1.5 py-0.5 rounded flex items-center gap-1 transition-all"
          style={{
            color: selectedTokens.length > 0 ? "var(--accent-green)" : "var(--text-muted)",
            border: `1px solid ${selectedTokens.length > 0 ? "var(--accent-green)" : "var(--border)"}`,
            fontSize: "9px",
            lineHeight: "14px",
          }}
        >
          {label}
          <span style={{ fontSize: "7px", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>&#x25BC;</span>
        </button>

        {open && (
          <div
            className="absolute right-0 top-full mt-1 z-50 rounded border shadow-lg min-w-[140px] max-h-[240px] overflow-y-auto"
            style={{ backgroundColor: "var(--card)", borderColor: "var(--border)" }}
          >
            <div className="flex justify-between px-2 py-1 border-b" style={{ borderColor: "var(--border)" }}>
              <button onClick={() => setSelectedTokens([])} className="text-[9px] hover:text-[var(--accent-green)]" style={{ color: "var(--text-muted)" }}>All</button>
              <button onClick={() => setSelectedTokens([...tokens])} className="text-[9px] hover:text-[var(--accent-green)]" style={{ color: "var(--text-muted)" }}>Clear</button>
            </div>
            {tokens.map((t) => {
              const checked = selectedTokens.length === 0 || selectedTokens.includes(t);
              const color = (CHART_COLORS as Record<string, string>)[t] ?? "#888";
              return (
                <label key={t} className="flex items-center gap-1.5 px-2 py-0.5 cursor-pointer hover:bg-[var(--border)]">
                  <input type="checkbox" checked={checked} onChange={() => toggleToken(t)} className="accent-[var(--accent-green)] w-2.5 h-2.5" />
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-[9px] font-mono" style={{ color: "var(--foreground)" }}>{t}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

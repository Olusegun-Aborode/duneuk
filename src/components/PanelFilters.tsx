"use client";

import { useCurrencyFilter } from "@/contexts/CurrencyFilterContext";

export function PanelFilters() {
  const { currency, selectedTokens } = useCurrencyFilter();

  const flag = currency === "GBP" ? "\u{1F1EC}\u{1F1E7}" : currency === "EUR" ? "\u{1F1EA}\u{1F1FA}" : "";
  const tokenLabel = selectedTokens.length > 0 ? `${selectedTokens.length} tokens` : null;

  return (
    <span className="inline-flex items-center gap-1.5 text-[9px] font-mono" style={{ color: "var(--text-muted)" }}>
      <span className="px-1.5 py-0.5 rounded" style={{
        border: "1px solid var(--border)",
        color: currency === "ALL" ? "var(--text-muted)" : "var(--foreground)",
      }}>
        {flag} {currency}
      </span>
      {tokenLabel && (
        <span className="px-1.5 py-0.5 rounded" style={{
          border: "1px solid var(--border)",
          color: "var(--accent-green)",
        }}>
          {tokenLabel}
        </span>
      )}
    </span>
  );
}

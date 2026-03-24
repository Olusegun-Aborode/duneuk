"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { formatCompactUSD } from "@/lib/format";
import { CHART_COLORS } from "@/lib/constants";
import type { MarketShareEntry, DuneApiResponse } from "@/lib/types";

const GROUP_COLORS: Record<string, string> = {
  GBP: "#00FF88",
  USD: "#5B7FFF",
  EUR: "#FFD700",
};

interface AlliumToken {
  chain: string;
  info: { name: string; symbol: string };
  attributes: {
    total_supply: number;
    fully_diluted_valuation_usd: number;
    holders_count: number;
  };
}

export default function MarketShareComparison() {
  const { data, isLoading, error } = useQuery<
    DuneApiResponse<MarketShareEntry>
  >({
    queryKey: ["market-share"],
    queryFn: async () => {
      const res = await fetch(
        "/api/terminal/british-stablecoin/market-share"
      );
      if (!res.ok) throw new Error("Failed to fetch market share");
      return res.json();
    },
  });

  // Fetch Solana GBP token data from Allium
  const { data: solanaData } = useQuery<{
    data: AlliumToken[];
    source: string;
  }>({
    queryKey: ["solana-tokens"],
    queryFn: async () => {
      const res = await fetch(
        "/api/terminal/british-stablecoin/solana-tokens"
      );
      if (!res.ok) return { data: [], source: "allium" };
      return res.json();
    },
  });

  // Merge Dune + Allium data
  const { rows, grouped, gbpShare } = useMemo(() => {
    const duneRows: MarketShareEntry[] = data?.data ?? [];

    // Add Solana tokens from Allium as GBP entries
    const alliumRows: MarketShareEntry[] = (solanaData?.data ?? []).map((t) => ({
      currency_group: "GBP",
      symbol: `${t.info.symbol} (SOL)`,
      total_supply: t.attributes.total_supply ?? 0,
      total_supply_usd: t.attributes.fully_diluted_valuation_usd ?? 0,
    }));

    const allRows = [...duneRows, ...alliumRows];

    const totals: Record<string, number> = { GBP: 0, USD: 0, EUR: 0 };
    for (const row of allRows) {
      if (row.currency_group && totals[row.currency_group] !== undefined) {
        totals[row.currency_group] += row.total_supply_usd ?? 0;
      }
    }

    const total = totals.GBP + totals.USD + totals.EUR;
    const share = total === 0 ? 0 : (totals.GBP / total) * 100;

    return { rows: allRows, grouped: totals, gbpShare: share };
  }, [data, solanaData]);

  if (error) {
    return (
      <div className="tui-panel">
        <div className="tui-panel-header">
          <span className="tui-panel-title">Stablecoin Market Share</span>
          <span className="text-[10px] text-[#FF4444]">ERR</span>
        </div>
        <div className="p-4 text-[#FF4444] text-xs">
          Failed to load market share data.
        </div>
      </div>
    );
  }

  const [showTooltip, setShowTooltip] = useState(false);

  // Group token symbols by currency for the tooltip
  const tokensByGroup = useMemo(() => {
    const groups: Record<string, string[]> = { GBP: [], USD: [], EUR: [] };
    for (const row of rows) {
      const g = row.currency_group;
      if (groups[g] && !groups[g].includes(row.symbol)) {
        groups[g].push(row.symbol);
      }
    }
    return groups;
  }, [rows]);

  return (
    <div className="tui-panel">
      <div className="tui-panel-header">
        <div className="flex items-center gap-2">
          <span className="tui-panel-title">Stablecoin Market Share</span>
          <div className="relative inline-block">
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip((v) => !v)}
              className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold cursor-pointer"
              style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
              aria-label="Market share info"
            >
              i
            </button>
            {showTooltip && (
              <div
                className="absolute z-50 w-72 p-3 rounded text-[11px] leading-relaxed"
                style={{
                  top: "calc(100% + 6px)",
                  right: 0,
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                }}
              >
                <span style={{ color: "var(--accent-green)" }} className="font-bold">GBP stablecoins</span> represent{" "}
                <span style={{ color: "var(--foreground)" }} className="font-bold">&lt;0.01%</span> of the combined
                GBP+USD+EUR stablecoin supply on EVM + Solana chains. This represents a significant market gap and
                growth opportunity for GBP-denominated on-chain assets.
                <div className="mt-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                  <div className="font-bold mb-1" style={{ color: "var(--foreground)" }}>Tokens covered:</div>
                  {(["GBP", "USD", "EUR"] as const).map((g) => (
                    tokensByGroup[g]?.length > 0 && (
                      <div key={g} className="mb-0.5">
                        <span style={{ color: GROUP_COLORS[g] }} className="font-bold">{g}:</span>{" "}
                        {tokensByGroup[g].join(", ")}
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <span className="tui-panel-badge">GBP vs USD vs EUR</span>
      </div>

      <div className="p-4 lg:p-5">
        {isLoading ? (
          <div className="h-32 skeleton" />
        ) : (
          <>
            {/* Three currency counters */}
            <div className="grid grid-cols-3 gap-4 mb-5">
              {(["GBP", "USD", "EUR"] as const).map((group) => (
                <div key={group} className="text-center">
                  <div
                    className="counter-value text-lg"
                    style={{ color: GROUP_COLORS[group] }}
                  >
                    {formatCompactUSD(grouped[group])}
                  </div>
                  <div className="counter-label">{group} Total Supply</div>
                </div>
              ))}
            </div>

            {/* Token breakdown table */}
            <table className="data-table">
              <thead>
                <tr>
                  <th>Currency</th>
                  <th>Token</th>
                  <th className="text-right">Supply (native)</th>
                  <th className="text-right">Supply (USD)</th>
                  <th className="text-right">Source</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((entry, idx) => {
                  const isSolana = entry.symbol.includes("(SOL)");
                  const baseSymbol = entry.symbol.replace(" (SOL)", "");
                  const tokenColor =
                    CHART_COLORS[baseSymbol as keyof typeof CHART_COLORS] ??
                    GROUP_COLORS[entry.currency_group] ??
                    "#E0E0E0";
                  return (
                    <tr key={`${entry.symbol}-${idx}`}>
                      <td>
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{
                            color: GROUP_COLORS[entry.currency_group] ?? "#E0E0E0",
                            backgroundColor: `${GROUP_COLORS[entry.currency_group] ?? "#E0E0E0"}15`,
                          }}
                        >
                          {entry.currency_group}
                        </span>
                      </td>
                      <td>
                        <span className="flex items-center">
                          <span
                            className="token-dot"
                            style={{ backgroundColor: tokenColor }}
                          />
                          <span className="font-bold" style={{ color: tokenColor }}>
                            {entry.symbol}
                          </span>
                        </span>
                      </td>
                      <td className="text-right text-[#6B7280]">
                        {formatCompactUSD(entry.total_supply).replace("$", "")}
                      </td>
                      <td className="text-right font-bold">
                        {formatCompactUSD(entry.total_supply_usd)}
                      </td>
                      <td className="text-right">
                        <span className={`text-[9px] ${isSolana ? "text-[#9945FF]" : "text-[#5B7FFF]"}`}>
                          {isSolana ? "[Allium]" : "[Dune]"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatNative, formatPercent, formatAddress } from "@/lib/format";
import { TOKEN_META } from "@/lib/constants";
import { TokenLogo } from "@/components/TokenLogo";
import type { TopHolderEntry, DuneApiResponse } from "@/lib/types";
import ChartWatermark from "./ChartWatermark";
import { useCurrencyFilter, tokenMatchesCurrency } from "@/contexts/CurrencyFilterContext";
import { PanelFilters } from "@/components/PanelFilters";

export default function TopHolders() {
  const { currency } = useCurrencyFilter();
  const showGbp = currency === "GBP" || currency === "ALL";
  const showEur = currency === "EUR" || currency === "ALL";

  const { data: gbpData, isLoading: gbpLoading, error: gbpError } = useQuery<
    DuneApiResponse<TopHolderEntry>
  >({
    queryKey: ["top-holders"],
    queryFn: async () => {
      const res = await fetch(
        "/api/terminal/british-stablecoin/top-holders"
      );
      if (!res.ok) throw new Error("Failed to fetch top holders");
      return res.json();
    },
    enabled: showGbp,
  });

  const { data: eurData, isLoading: eurLoading, error: eurError } = useQuery<
    DuneApiResponse<TopHolderEntry>
  >({
    queryKey: ["top-holders-eur"],
    queryFn: async () => {
      const res = await fetch(
        "/api/terminal/euro-stablecoin/top-holders"
      );
      if (!res.ok) throw new Error("Failed to fetch EUR top holders");
      return res.json();
    },
    enabled: showEur,
  });

  const isLoading = (showGbp && gbpLoading) || (showEur && eurLoading);
  const error = (showGbp && gbpError) || (showEur && eurError);

  const merged = useMemo(() => {
    const all: TopHolderEntry[] = [
      ...(showGbp && gbpData?.data ? gbpData.data : []),
      ...(showEur && eurData?.data ? eurData.data : []),
    ];
    return all.filter((r) => tokenMatchesCurrency(r.token, currency));
  }, [gbpData, eurData, currency, showGbp, showEur]);

  // Aggregate by token for pie chart
  const pieData = useMemo(() => {
    if (!merged.length) return [];
    const byToken: Record<string, number> = {};
    for (const entry of merged) {
      byToken[entry.token] = (byToken[entry.token] ?? 0) + (entry.balance_gbp ?? 0);
    }
    return Object.entries(byToken)
      .map(([token, value]) => ({ name: token, value }))
      .sort((a, b) => b.value - a.value);
  }, [merged]);

  if (error) {
    return (
      <div className="tui-panel">
        <div className="tui-panel-header">
          <span className="tui-panel-title">Top Holders</span>
          <span className="text-[10px] text-[#FF4444]">ERR</span>
        </div>
        <div className="p-4 text-[#FF4444] text-xs">
          Failed to load top holders.
        </div>
      </div>
    );
  }

  return (
    <div className="tui-panel">
      <div className="tui-panel-header">
        <span className="tui-panel-title">Top Holders <span className="text-[9px] text-[#5B7FFF] font-normal ml-1">[Dune]</span></span>
        <span className="flex items-center gap-2"><PanelFilters /><span className="tui-panel-badge">By balance</span></span>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="h-64 skeleton" />
        ) : (
          <div className="flex flex-col items-center relative">
            <ChartWatermark />
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  strokeWidth={1}
                  stroke="rgba(0,0,0,0.3)"
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={TOKEN_META[entry.name]?.color ?? "#6B7280"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "4px",
                    fontSize: 11,
                    fontFamily: "monospace",
                  }}
                  formatter={(value) => [formatNative(Number(value ?? 0), currency)]}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
              {pieData.map((entry) => {
                const total = pieData.reduce((s, e) => s + e.value, 0);
                const pct = total > 0 ? (entry.value / total) * 100 : 0;
                return (
                  <span key={entry.name} className="flex items-center text-[10px] text-[#9CA3AF]">
                    <TokenLogo symbol={entry.name} size={12} />
                    {entry.name}
                    <span className="text-[#6B7280] ml-1">{formatPercent(pct)}</span>
                  </span>
                );
              })}
            </div>

            {/* Top 5 holders list */}
            <div className="w-full mt-4 space-y-0">
              {merged.slice(0, 5).map((entry, idx) => {
                const meta = TOKEN_META[entry.token];
                return (
                  <div
                    key={`${entry.address}-${idx}`}
                    className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-b-0 text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[#6B7280] w-4">{idx + 1}</span>
                      <span className="text-[#6B7280]">{formatAddress(entry.address)}</span>
                      <TokenLogo symbol={entry.token} size={14} />
                      <span style={{ color: meta?.color ?? "#E0E0E0" }} className="font-bold">
                        {entry.token}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold">{formatNative(entry.balance_gbp, currency)}</span>
                      <span className="text-[#6B7280] ml-2">{formatPercent(entry.pct_of_supply)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

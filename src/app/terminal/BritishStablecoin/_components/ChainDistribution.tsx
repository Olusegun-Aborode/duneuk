"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatGBP, formatPercent } from "@/lib/format";
import { TOKEN_META } from "@/lib/constants";
import type { ChainDistributionEntry, DuneApiResponse } from "@/lib/types";
import ChartWatermark from "./ChartWatermark";

const CHAIN_COLORS: Record<string, string> = {
  ethereum: "#627EEA",
  base: "#0052FF",
  polygon: "#8247E5",
  celo: "#35D07F",
  gnosis: "#3E6957",
  bnb: "#F0B90B",
  arbitrum: "#28A0F0",
  optimism: "#FF0420",
  avalanche_c: "#E84142",
  solana: "#9945FF",
};

export default function ChainDistribution() {
  const { data, isLoading, error } = useQuery<
    DuneApiResponse<ChainDistributionEntry>
  >({
    queryKey: ["chain-distribution"],
    queryFn: async () => {
      const res = await fetch(
        "/api/terminal/british-stablecoin/chain-distribution"
      );
      if (!res.ok) throw new Error("Failed to fetch chain distribution");
      return res.json();
    },
  });

  // Aggregate by chain for the pie chart
  const pieData = useMemo(() => {
    if (!data?.data) return [];
    const byChain: Record<string, number> = {};
    for (const entry of data.data) {
      byChain[entry.blockchain] = (byChain[entry.blockchain] ?? 0) + (entry.supply_gbp ?? 0);
    }
    return Object.entries(byChain)
      .map(([chain, value]) => ({ name: chain, value }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  if (error) {
    return (
      <div className="tui-panel">
        <div className="tui-panel-header">
          <span className="tui-panel-title">Chain Distribution</span>
          <span className="text-[10px] text-[#FF4444]">ERR</span>
        </div>
        <div className="p-4 text-[#FF4444] text-xs">
          Failed to load chain distribution.
        </div>
      </div>
    );
  }

  return (
    <div className="tui-panel">
      <div className="tui-panel-header">
        <span className="tui-panel-title">Chain Distribution <span className="text-[9px] text-[#5B7FFF] font-normal ml-1">[Dune]</span></span>
        <span className="tui-panel-badge">Supply by chain</span>
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
                      fill={CHAIN_COLORS[entry.name] ?? "#6B7280"}
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
                  formatter={(value) => [formatGBP(Number(value ?? 0))]}
                  labelFormatter={(label) => String(label).charAt(0).toUpperCase() + String(label).slice(1)}
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
                    <span
                      className="token-dot"
                      style={{ backgroundColor: CHAIN_COLORS[entry.name] ?? "#6B7280" }}
                    />
                    <span className="capitalize">{entry.name}</span>
                    <span className="text-[#6B7280] ml-1">{formatPercent(pct)}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

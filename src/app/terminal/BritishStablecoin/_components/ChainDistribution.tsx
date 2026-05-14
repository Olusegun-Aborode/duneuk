"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatNative, formatPercent } from "@/lib/format";

const RADIAN = Math.PI / 180;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderChainLabel(props: any) {
  const { cx, cy, midAngle, innerRadius, outerRadius, name, percent } = props;
  if (percent < 0.03) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 1.35;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const displayName = name.charAt(0).toUpperCase() + name.slice(1);

  return (
    <text
      x={x} y={y}
      fill="var(--text-muted)"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={10}
      fontFamily="monospace"
    >
      {displayName} {(percent * 100).toFixed(0)}%
    </text>
  );
}
import type { ChainDistributionEntry, DuneApiResponse } from "@/lib/types";
import { ChainLogo } from "@/components/ChainLogo";
import ChartWatermark from "./ChartWatermark";
import { useChartFilter, ChartFilter } from "@/components/ChartFilter";

const CHAIN_COLORS: Record<string, string> = {
  ethereum: "#627EEA",
  base: "#0052FF",
  polygon: "#8247E5",
  celo: "#35D07F",
  gnosis: "#3E6957",
  bnb: "#F0B90B",
  bsc: "#F0B90B",
  arbitrum: "#28A0F0",
  optimism: "#FF0420",
  op_mainnet: "#FF0420",
  avalanche_c: "#E84142",
  avalanche: "#E84142",
  solana: "#9945FF",
  stellar: "#7B61FF",
  linea: "#61DFFF",
  sonic: "#FF6B35",
  scroll: "#FFDC00",
  fantom: "#1969FF",
  aurora: "#78D64B",
  noble: "#5B7FFF",
  cardano: "#0033AD",
  plasma: "#FF4444",
  tezos: "#2C7DF7",
  algorand: "#000000",
  zksync_lite: "#4E529A",
  fraxtal: "#000000",
  fuse: "#B4F9BA",
  everscale: "#5B8DEF",
  icp: "#29ABE2",
  concordium: "#1B6CB3",
  xrpl: "#2A2A2A",
};

export default function ChainDistribution() {
  const chartFilter = useChartFilter();
  const showGbp = chartFilter.currency === "GBP" || chartFilter.currency === "ALL";
  const showEur = chartFilter.currency === "EUR" || chartFilter.currency === "ALL";

  const { data: gbpData, isLoading: gbpLoading, error: gbpError } = useQuery<
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
    enabled: showGbp,
  });

  const { data: eurData, isLoading: eurLoading, error: eurError } = useQuery<
    DuneApiResponse<ChainDistributionEntry>
  >({
    queryKey: ["chain-distribution-eur"],
    queryFn: async () => {
      const res = await fetch(
        "/api/terminal/euro-stablecoin/chain-distribution"
      );
      if (!res.ok) throw new Error("Failed to fetch EUR chain distribution");
      return res.json();
    },
    enabled: showEur,
  });

  const isLoading = (showGbp && gbpLoading) || (showEur && eurLoading);
  // Only ERR when every active currency has an explicit error.
  // During loading (no data, no error yet) error stays false so the panel shows its skeleton.
  const error = (!showGbp || !!gbpError) && (!showEur || !!eurError);

  const merged = useMemo(() => {
    const all: ChainDistributionEntry[] = [
      ...(showGbp && gbpData?.data ? gbpData.data : []),
      ...(showEur && eurData?.data ? eurData.data : []),
    ];
    return all.filter((r) => chartFilter.tokenMatches(r.token));
  }, [gbpData, eurData, chartFilter, showGbp, showEur]);

  // Aggregate by chain for the pie chart
  const pieData = useMemo(() => {
    if (!merged.length) return [];
    const byChain: Record<string, number> = {};
    for (const entry of merged) {
      byChain[entry.blockchain] = (byChain[entry.blockchain] ?? 0) + (entry.supply_gbp ?? 0);
    }
    return Object.entries(byChain)
      .map(([chain, value]) => ({ name: chain, value }))
      .sort((a, b) => b.value - a.value);
  }, [merged]);

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
        <span className="tui-panel-title">Chain Distribution <span className="text-[9px] text-[#5B7FFF] font-normal ml-1">[{chartFilter.currency === "EUR" ? "DefiLlama" : chartFilter.currency === "ALL" ? "Dune + DefiLlama" : "Dune"}]</span></span>
        <div className="flex items-center gap-2">
          <ChartFilter
            currency={chartFilter.currency}
            setCurrency={chartFilter.setCurrency}
            tokens={chartFilter.tokens}
            selectedTokens={chartFilter.selectedTokens}
            setSelectedTokens={chartFilter.setSelectedTokens}
          />
          <span className="tui-panel-badge">Supply by chain</span>
        </div>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="h-64 skeleton" />
        ) : (
          <div className="flex flex-col items-center relative">
            <ChartWatermark />
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={75}
                  strokeWidth={1}
                  stroke="rgba(0,0,0,0.3)"
                  label={renderChainLabel}
                  labelLine={false}
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
                  formatter={(value) => [formatNative(Number(value ?? 0), chartFilter.currency)]}
                  labelFormatter={(label) => String(label).charAt(0).toUpperCase() + String(label).slice(1)}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Legend — top 8 chains */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
              {pieData.slice(0, 8).map((entry) => {
                const total = pieData.reduce((s, e) => s + e.value, 0);
                const pct = total > 0 ? (entry.value / total) * 100 : 0;
                return (
                  <span key={entry.name} className="flex items-center text-[10px]" style={{ color: "var(--text-muted)" }}>
                    <ChainLogo name={entry.name} size={12} color={CHAIN_COLORS[entry.name] ?? "#6B7280"} />
                    <span className="capitalize">{entry.name}</span>
                    <span className="ml-1" style={{ color: "var(--text-muted)" }}>{formatPercent(pct)}</span>
                  </span>
                );
              })}
              {pieData.length > 8 && (
                <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  +{pieData.length - 8} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

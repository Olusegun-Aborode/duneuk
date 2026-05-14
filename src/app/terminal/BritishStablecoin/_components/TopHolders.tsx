"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatPercent, formatAddress, formatCompactUSD } from "@/lib/format";
import { TOKEN_META, CHART_COLORS } from "@/lib/constants";
import { TokenLogo } from "@/components/TokenLogo";
import type { TopHolderEntry, DuneApiResponse } from "@/lib/types";
import ChartWatermark from "./ChartWatermark";
import { useChartFilter, ChartFilter } from "@/components/ChartFilter";

const RADIAN = Math.PI / 180;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderLabel(props: any) {
  const { cx, cy, midAngle, innerRadius, outerRadius, name, percent } = props;
  if (percent < 0.03) return null; // Hide labels for tiny slices
  const radius = innerRadius + (outerRadius - innerRadius) * 1.35;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x} y={y}
      fill="var(--text-muted)"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={10}
      fontFamily="monospace"
    >
      {name} {(percent * 100).toFixed(0)}%
    </text>
  );
}

export default function TopHolders() {
  const chartFilter = useChartFilter();
  const showGbp = chartFilter.currency === "GBP" || chartFilter.currency === "ALL";
  const showEur = chartFilter.currency === "EUR" || chartFilter.currency === "ALL";

  const { data: gbpData, isLoading: gbpLoading, error: gbpError } = useQuery<
    DuneApiResponse<TopHolderEntry>
  >({
    queryKey: ["top-holders"],
    queryFn: async () => {
      const res = await fetch("/api/terminal/british-stablecoin/top-holders");
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
      const res = await fetch("/api/terminal/euro-stablecoin/top-holders");
      if (!res.ok) throw new Error("Failed to fetch EUR top holders");
      return res.json();
    },
    enabled: showEur,
  });

  const isLoading = (showGbp && gbpLoading) || (showEur && eurLoading);
  // Only ERR when every active currency has an explicit error.
  // During loading (no data, no error yet) error stays false so the panel shows its skeleton.
  const error = (!showGbp || !!gbpError) && (!showEur || !!eurError);

  const merged = useMemo(() => {
    const all: TopHolderEntry[] = [
      ...(showGbp && gbpData?.data ? gbpData.data : []),
      ...(showEur && eurData?.data ? eurData.data : []),
    ];
    // Deduplicate by address+token
    const seen = new Set<string>();
    const deduped = all.filter((entry) => {
      const key = `${entry.address}|${entry.token}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return deduped
      .filter((r) => chartFilter.tokenMatches(r.token))
      .sort((a, b) => (b.balance_usd ?? 0) - (a.balance_usd ?? 0));
  }, [gbpData, eurData, chartFilter, showGbp, showEur]);

  // Aggregate by token for pie chart
  const pieData = useMemo(() => {
    if (!merged.length) return [];
    const byToken: Record<string, number> = {};
    for (const entry of merged) {
      byToken[entry.token] = (byToken[entry.token] ?? 0) + (entry.balance_usd ?? 0);
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
        <div className="flex items-center gap-2">
          <ChartFilter
            currency={chartFilter.currency}
            setCurrency={chartFilter.setCurrency}
            tokens={chartFilter.tokens}
            selectedTokens={chartFilter.selectedTokens}
            setSelectedTokens={chartFilter.setSelectedTokens}
          />
        </div>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="h-64 skeleton" />
        ) : (
          <div className="flex flex-col items-center relative">
            <ChartWatermark />
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={80}
                  strokeWidth={1}
                  stroke="rgba(0,0,0,0.3)"
                  label={renderLabel}
                  labelLine={false}
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={TOKEN_META[entry.name]?.color ?? (CHART_COLORS as Record<string, string>)[entry.name] ?? "#6B7280"}
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
                  formatter={(value) => [formatCompactUSD(Number(value ?? 0))]}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Top 5 holders list — sorted by USD balance */}
            <div className="w-full mt-2 space-y-0">
              {merged.slice(0, 5).map((entry, idx) => {
                const meta = TOKEN_META[entry.token];
                const color = meta?.color ?? (CHART_COLORS as Record<string, string>)[entry.token] ?? "#6B7280";
                return (
                  <div
                    key={`${entry.address}-${idx}`}
                    className="flex items-center justify-between py-1.5 border-b last:border-b-0 text-[11px]"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div className="flex items-center gap-2">
                      <span style={{ color: "var(--text-muted)" }} className="w-4">{idx + 1}</span>
                      <span style={{ color: "var(--text-muted)" }}>{formatAddress(entry.address)}</span>
                      <TokenLogo symbol={entry.token} size={14} />
                      <span style={{ color }} className="font-bold">
                        {entry.token}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold">{formatCompactUSD(entry.balance_usd)}</span>
                      <span className="ml-2" style={{ color: "var(--text-muted)" }}>{formatPercent(entry.pct_of_supply)}</span>
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

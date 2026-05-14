"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatCompactUSD, formatNumber } from "@/lib/format";
import InsightPanel from "./InsightPanel";
import ChartWatermark from "./ChartWatermark";
import type { LendingUtilizationEntry, DuneApiResponse } from "@/lib/types";
import { useChartFilter, ChartFilter } from "@/components/ChartFilter";

interface ChartRow {
  label: string;
  supply_flow: number;
  borrow_flow: number;
  project: string;
  token: string;
  event_count: number;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartRow }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#0D1117] border border-[#2A2E35] rounded px-3 py-2 text-xs shadow-lg">
      <div className="text-white font-bold capitalize mb-1">{d.project}</div>
      <div className="text-[#A0A0A0] mb-1">{d.token}</div>
      <div className="flex justify-between gap-4">
        <span className="text-[#6B7280]">Supply flow</span>
        <span className="text-[#00FF88] font-bold">{formatCompactUSD(d.supply_flow)}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-[#6B7280]">Borrow flow</span>
        <span className="text-[#FF6B35] font-bold">{formatCompactUSD(d.borrow_flow)}</span>
      </div>
      <div className="flex justify-between gap-4 mt-1 pt-1 border-t border-[#2A2E35]">
        <span className="text-[#6B7280]">Events</span>
        <span className="text-white">{formatNumber(d.event_count)}</span>
      </div>
      <div className="text-[9px] text-[#6B7280] mt-2 pt-1 border-t border-[#2A2E35] italic">
        Weekly throughput of supply/borrow events, summed since Jan 2025.
        Not point-in-time TVL.
      </div>
    </div>
  );
}

export default function LendingUtilization() {
  const chartFilter = useChartFilter();
  const showGbp = chartFilter.currency === "GBP" || chartFilter.currency === "ALL";
  const showEur = chartFilter.currency === "EUR" || chartFilter.currency === "ALL";

  const { data: gbpData, isLoading: gbpLoading, error: gbpError } = useQuery<
    DuneApiResponse<LendingUtilizationEntry>
  >({
    queryKey: ["lending"],
    queryFn: async () => {
      const res = await fetch(
        "/api/terminal/british-stablecoin/lending"
      );
      if (!res.ok) throw new Error("Failed to fetch lending data");
      return res.json();
    },
    enabled: showGbp,
  });

  const { data: eurData, isLoading: eurLoading, error: eurError } = useQuery<
    DuneApiResponse<LendingUtilizationEntry>
  >({
    queryKey: ["lending-eur"],
    queryFn: async () => {
      const res = await fetch(
        "/api/terminal/euro-stablecoin/lending"
      );
      if (!res.ok) throw new Error("Failed to fetch EUR lending data");
      return res.json();
    },
    enabled: showEur,
  });

  const isLoading = (showGbp && gbpLoading) || (showEur && eurLoading);
  // Only ERR when every active currency has an explicit error.
  // During loading (no data, no error yet) error stays false so the panel shows its skeleton.
  const error = (!showGbp || !!gbpError) && (!showEur || !!eurError);

  const data = useMemo(() => {
    const all: LendingUtilizationEntry[] = [
      ...(showGbp && gbpData?.data ? gbpData.data : []),
      ...(showEur && eurData?.data ? eurData.data : []),
    ];
    return { data: all.filter((r) => chartFilter.tokenMatches(r.token)) };
  }, [gbpData, eurData, chartFilter, showGbp, showEur]);

  if (error) {
    return (
      <div className="tui-panel">
        <div className="tui-panel-header">
          <span className="tui-panel-title">Weekly Lending Activity</span>
          <span className="text-[10px] text-[#FF4444]">ERR</span>
        </div>
        <div className="p-4 text-[#FF4444] text-xs">
          Failed to load lending data.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="tui-panel">
        <div className="tui-panel-header">
          <span className="tui-panel-title">Weekly Lending Activity</span>
          <span className="tui-panel-badge">Since Jan 2025</span>
        </div>
        <div className="p-4">
          <div className="h-32 skeleton" />
        </div>
      </div>
    );
  }

  // Filter out rows with zero activity or bad data (negative/absurd values).
  // We treat supply_usd/borrow_usd as weekly THROUGHPUT (event volumes), not stock TVL.
  const activeRows = data?.data?.filter((e) => {
    const supply = e.supply_usd ?? 0;
    const borrow = e.borrow_usd ?? 0;
    if (supply < 0 || borrow < 0) return false;
    if (supply === 0 && borrow === 0 && (e.event_count ?? 0) === 0) return false;
    if (supply > 1_000_000_000_000 || borrow > 1_000_000_000_000) return false;
    return true;
  }) ?? [];

  // If GBP is selected and there's no GBP data (always the case — see InsightPanel below),
  // OR all currencies failed to return data, show the market-gap explainer.
  if (activeRows.length === 0) {
    return (
      <InsightPanel title="Weekly Lending Activity" badge="Market Gap" icon="🏦">
        <p>
          <span className="text-white font-bold">No on-chain lending markets exist for GBP stablecoins yet.</span>{" "}
          Across Aave, Compound, Morpho, Spark, and other major lending protocols, zero GBP-denominated stablecoins are listed as collateral or borrowable assets.
        </p>
        <p>
          This is a market-size constraint, not a data gap. Lending protocols typically require
          ~$50M+ supply, a robust price oracle, and deep DEX liquidity before listing an asset.
          The largest GBP stablecoin today (tGBP, ~£3.5M) is two orders of magnitude below that bar.
        </p>
        <p className="text-[#6B7280]">
          Until GBP stablecoin supply scales meaningfully, lending integrations remain unlikely —
          a chicken-and-egg gap that delays DeFi composability for sterling. For comparison,
          switch to EUR or ALL to see weekly flow data on EUR + USD lending markets.
        </p>
      </InsightPanel>
    );
  }

  // Aggregate per (project, version, token) so the same market doesn't appear once per week.
  // What was "supply_usd" in the query is actually weekly supply-event volume; we sum across
  // all observed weeks to get a "total throughput since Jan 2025" view.
  const aggregated = new Map<string, ChartRow>();
  for (const r of activeRows) {
    const project = r.project;
    const token = r.token;
    const version = (r as unknown as { version?: string }).version ?? "";
    const key = `${project}|${version}|${token}`;
    const existing = aggregated.get(key);
    if (existing) {
      existing.supply_flow += r.supply_usd ?? 0;
      existing.borrow_flow += r.borrow_usd ?? 0;
      existing.event_count += r.event_count ?? 0;
    } else {
      aggregated.set(key, {
        label: version ? `${project} v${version} / ${token}` : `${project} / ${token}`,
        supply_flow: r.supply_usd ?? 0,
        borrow_flow: r.borrow_usd ?? 0,
        project,
        token,
        event_count: r.event_count ?? 0,
      });
    }
  }
  const chartData: ChartRow[] = [...aggregated.values()]
    .sort((a, b) => b.supply_flow + b.borrow_flow - (a.supply_flow + a.borrow_flow))
    .slice(0, 8);

  return (
    <div className="tui-panel relative">
      <div className="tui-panel-header">
        <span className="tui-panel-title">Weekly Lending Activity <span className="text-[9px] text-[#5B7FFF] font-normal ml-1">[Dune]</span></span>
        <div className="flex items-center gap-2">
          <ChartFilter
            currency={chartFilter.currency}
            setCurrency={chartFilter.setCurrency}
            tokens={chartFilter.tokens}
            selectedTokens={chartFilter.selectedTokens}
            setSelectedTokens={chartFilter.setSelectedTokens}
          />
          <span className="tui-panel-badge">Flow · since Jan 2025</span>
        </div>
      </div>
      <div className="px-2 pt-2 pb-1">
        <ResponsiveContainer width="100%" height={Math.max(240, chartData.length * 40 + 40)}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 8, right: 16, left: 4, bottom: 8 }}
            barGap={2}
            barCategoryGap="25%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: "#6B7280" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => formatCompactUSD(v)}
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fontSize: 10, fill: "#6B7280" }}
              tickLine={false}
              axisLine={false}
              width={140}
              interval={0}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar dataKey="supply_flow" name="Supply Flow" fill="#00FF88" radius={[0, 3, 3, 0]} barSize={11} />
            <Bar dataKey="borrow_flow" name="Borrow Flow" fill="#FF6B35" radius={[0, 3, 3, 0]} barSize={11} />
          </BarChart>
        </ResponsiveContainer>
        {/* Legend + metric explanation */}
        <div className="flex items-center justify-center gap-4 text-[10px] text-[#6B7280] -mt-1 mb-1">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "#00FF88" }} />
            Supply flow
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "#FF6B35" }} />
            Borrow flow
          </span>
        </div>
        <p className="text-[9px] text-[#6B7280] text-center italic px-4 mb-1">
          Cumulative USD value of weekly supply &amp; borrow events on each market.
          No GBP stables are listed on lending protocols yet — filter to GBP to see why.
        </p>
      </div>
      <ChartWatermark />
    </div>
  );
}

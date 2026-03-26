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
import { formatCompactUSD, formatNumber, formatPercent } from "@/lib/format";
import { TOKEN_META } from "@/lib/constants";
import InsightPanel from "./InsightPanel";
import ChartWatermark from "./ChartWatermark";
import type { LendingUtilizationEntry, DuneApiResponse } from "@/lib/types";
import { useCurrencyFilter, tokenMatchesCurrency } from "@/contexts/CurrencyFilterContext";

interface ChartRow {
  label: string;
  supplied: number;
  borrowed: number;
  utilization_rate: number;
  project: string;
  token: string;
  suppliers: number;
  borrowers: number;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartRow }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#0D1117] border border-[#2A2E35] rounded px-3 py-2 text-xs shadow-lg">
      <div className="text-white font-bold capitalize mb-1">{d.project}</div>
      <div className="text-[#A0A0A0] mb-1">{d.token}</div>
      <div className="flex justify-between gap-4">
        <span className="text-[#6B7280]">Supplied</span>
        <span className="text-[#00FF88] font-bold">{formatCompactUSD(d.supplied)}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-[#6B7280]">Borrowed</span>
        <span className="text-[#FF6B35] font-bold">{formatCompactUSD(d.borrowed)}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-[#6B7280]">Utilization</span>
        <span className="text-white">{formatPercent(d.utilization_rate * 100)}</span>
      </div>
      <div className="flex justify-between gap-4 mt-1 pt-1 border-t border-[#2A2E35]">
        <span className="text-[#6B7280]">Suppliers</span>
        <span className="text-white">{formatNumber(d.suppliers)}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-[#6B7280]">Borrowers</span>
        <span className="text-white">{formatNumber(d.borrowers)}</span>
      </div>
    </div>
  );
}

export default function LendingUtilization() {
  const { currency } = useCurrencyFilter();
  const showGbp = currency === "GBP" || currency === "ALL";
  const showEur = currency === "EUR" || currency === "ALL";

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
  const error = (showGbp && gbpError) || (showEur && eurError);

  const data = useMemo(() => {
    const all: LendingUtilizationEntry[] = [
      ...(showGbp && gbpData?.data ? gbpData.data : []),
      ...(showEur && eurData?.data ? eurData.data : []),
    ];
    return { data: all.filter((r) => tokenMatchesCurrency(r.token, currency)) };
  }, [gbpData, eurData, currency, showGbp, showEur]);

  if (error) {
    return (
      <div className="tui-panel">
        <div className="tui-panel-header">
          <span className="tui-panel-title">Lending & Borrowing</span>
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
          <span className="tui-panel-title">Lending & Borrowing</span>
          <span className="tui-panel-badge">Since Jan 2025</span>
        </div>
        <div className="p-4">
          <div className="h-32 skeleton" />
        </div>
      </div>
    );
  }

  // Filter out rows with zero activity or bad data (negative/absurd values)
  const activeRows = data?.data?.filter(
    (e) => {
      const supply = e.supply_usd ?? 0;
      const borrow = e.borrow_usd ?? 0;
      // Skip rows with negative values (data anomalies) or zero activity
      if (supply < 0 || borrow < 0) return false;
      if (supply === 0 && borrow === 0 && (e.event_count ?? 0) === 0) return false;
      // Skip absurdly large values (> $1T = data errors)
      if (supply > 1_000_000_000_000 || borrow > 1_000_000_000_000) return false;
      return true;
    }
  ) ?? [];

  // If no meaningful lending data exists, show insight panel
  if (activeRows.length === 0) {
    return (
      <InsightPanel title="Lending & Borrowing" badge="Market Gap" icon="🏦">
        <p>
          <span className="text-white font-bold">Zero GBP stablecoin lending markets detected</span>{" "}
          across Aave, Compound, Morpho, and other major lending protocols since January 2025.
        </p>
        <p>
          This represents one of the largest infrastructure gaps in the GBP stablecoin ecosystem.
          USD stablecoins like USDT and USDC are deployed across dozens of lending markets with
          billions in TVL. GBP stablecoins have no equivalent.
        </p>
        <p className="text-[#6B7280]">
          Until GBP stablecoins achieve sufficient supply and liquidity depth, integration into
          lending protocols remains unlikely — creating a chicken-and-egg problem for DeFi adoption.
        </p>
      </InsightPanel>
    );
  }

  const chartData: ChartRow[] = activeRows
    .map((e) => ({
      label: `${e.project} / ${e.token}`,
      supplied: e.supply_usd ?? 0,
      borrowed: e.borrow_usd ?? 0,
      utilization_rate: e.utilization_rate ?? 0,
      project: e.project,
      token: e.token,
      suppliers: e.suppliers ?? 0,
      borrowers: e.borrowers ?? 0,
    }))
    .sort((a, b) => b.supplied - a.supplied)
    .slice(0, 8); // Top 8 for readability

  return (
    <div className="tui-panel relative">
      <div className="tui-panel-header">
        <span className="tui-panel-title">Lending & Borrowing <span className="text-[9px] text-[#5B7FFF] font-normal ml-1">[Dune]</span></span>
        <span className="tui-panel-badge">Since Jan 2025</span>
      </div>
      <div className="px-2 pt-2 pb-1">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 8 }} barGap={4} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#6B7280" }}
              tickLine={false}
              axisLine={false}
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#6B7280" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => formatCompactUSD(v)}
              width={58}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar dataKey="supplied" name="Supplied" fill="#00FF88" radius={[3, 3, 0, 0]} barSize={20} />
            <Bar dataKey="borrowed" name="Borrowed" fill="#FF6B35" radius={[3, 3, 0, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-[10px] text-[#6B7280] -mt-1 mb-1">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "#00FF88" }} />
            Supplied
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "#FF6B35" }} />
            Borrowed
          </span>
        </div>
      </div>
      <ChartWatermark />
    </div>
  );
}

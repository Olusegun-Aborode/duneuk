"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { CHART_COLORS } from "@/lib/constants";
import { formatGBP, formatEUR, formatUSD, formatNative } from "@/lib/format";
import { useCurrencyFilter, tokenMatchesCurrency } from "@/contexts/CurrencyFilterContext";
import type { SupplyHistoryEntry, DuneApiResponse } from "@/lib/types";
import ChartWatermark from "./ChartWatermark";
import { TokenLogo } from "@/components/TokenLogo";
import TimeRangeSelector, { type TimeRange, getCutoffDate } from "./TimeRangeSelector";

function pivotData(rows: SupplyHistoryEntry[], useUsd: boolean) {
  const byDay: Record<string, Record<string, number>> = {};
  for (const row of rows) {
    if (!byDay[row.day]) byDay[row.day] = {};
    byDay[row.day][row.token] = useUsd ? row.supply_usd : row.supply_gbp;
  }
  return Object.entries(byDay)
    .map(([day, values]) => ({ day, ...values }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

function formatDateAxis(dateStr: string) {
  const d = new Date(dateStr);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export default function SupplyChart() {
  const [range, setRange] = useState<TimeRange>("180d");
  const { currency } = useCurrencyFilter();
  const showGbp = currency === "GBP" || currency === "ALL";
  const showEur = currency === "EUR" || currency === "ALL";
  const useUsd = currency === "ALL";

  const gbp = useQuery<DuneApiResponse<SupplyHistoryEntry>>({
    queryKey: ["supply-history-gbp"],
    queryFn: async () => {
      const res = await fetch("/api/terminal/british-stablecoin/supply-history");
      if (!res.ok) throw new Error("Failed to fetch GBP supply history");
      return res.json();
    },
    enabled: showGbp,
  });

  const eur = useQuery<DuneApiResponse<SupplyHistoryEntry>>({
    queryKey: ["supply-history-eur"],
    queryFn: async () => {
      const res = await fetch("/api/terminal/euro-stablecoin/supply-history");
      if (!res.ok) throw new Error("Failed to fetch EUR supply history");
      return res.json();
    },
    enabled: showEur,
  });

  const isLoading = (showGbp && gbp.isLoading) || (showEur && eur.isLoading);
  const error = (showGbp && gbp.error) || (showEur && eur.error);

  const allRows = useMemo(() => {
    const rows: SupplyHistoryEntry[] = [];
    if (showGbp && gbp.data?.data) rows.push(...gbp.data.data);
    if (showEur && eur.data?.data) rows.push(...eur.data.data);
    return rows;
  }, [gbp.data, eur.data, showGbp, showEur]);

  const chartData = useMemo(() => {
    if (!allRows.length) return [];
    const cutoff = getCutoffDate(range);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const filtered = allRows.filter((r) => {
      const d = new Date(r.day);
      if (d > today) return false;
      if (cutoff && d < cutoff) return false;
      return true;
    });
    return pivotData(filtered, useUsd);
  }, [allRows, range, useUsd]);

  const tokens = useMemo(() => {
    if (!allRows.length) return [];
    return [...new Set(allRows.map((r) => r.token))];
  }, [allRows]);


  if (error) {
    return (
      <div className="tui-panel">
        <div className="tui-panel-header">
          <span className="tui-panel-title">Supply Over Time</span>
          <span className="text-[10px] text-[#FF4444]">ERR</span>
        </div>
        <div className="p-4 text-[#FF4444] text-xs">
          Failed to load supply chart.
        </div>
      </div>
    );
  }

  return (
    <div className="tui-panel">
      <div className="tui-panel-header">
        <span className="tui-panel-title">Supply Over Time <span className="text-[9px] text-[#5B7FFF] font-normal ml-1">[Dune]</span></span>
        <TimeRangeSelector value={range} onChange={setRange} />
      </div>

      <div className="p-4">
        {/* Token legend */}
        <div className="flex flex-wrap gap-3 mb-3">
          {tokens.map((token) => (
            <span key={token} className="flex items-center text-[10px] text-[#6B7280]">
              <TokenLogo symbol={token} size={12} />
              {token}
            </span>
          ))}
        </div>

        {isLoading ? (
          <div className="h-64 w-full skeleton" />
        ) : (
          <div className="relative">
          <ChartWatermark />
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tickFormatter={formatDateAxis}
                tick={{ fill: "#6B7280", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => formatNative(v, currency)}
                tick={{ fill: "#6B7280", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={70}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111318",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "4px",
                  fontSize: 11,
                  fontFamily: "monospace",
                }}
                labelStyle={{ color: "#6B7280" }}
                formatter={(value, name) => [
                  formatNative(Number(value ?? 0), currency),
                  String(name),
                ]}
              />
              {tokens.map((token) => (
                <Area
                  key={token}
                  type="monotone"
                  dataKey={token}
                  stackId="1"
                  stroke={
                    CHART_COLORS[token as keyof typeof CHART_COLORS] ??
                    "#E0E0E0"
                  }
                  fill={
                    CHART_COLORS[token as keyof typeof CHART_COLORS] ??
                    "#E0E0E0"
                  }
                  fillOpacity={0.1}
                  strokeWidth={1.5}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

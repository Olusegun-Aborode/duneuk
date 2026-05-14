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
import { formatNumber } from "@/lib/format";
import type { DailyActiveUsersEntry, DuneApiResponse } from "@/lib/types";
import ChartWatermark from "./ChartWatermark";
import { TokenLogo } from "@/components/TokenLogo";
import TimeRangeSelector, { type TimeRange, getCutoffDate } from "./TimeRangeSelector";
import { useChartFilter, ChartFilter } from "@/components/ChartFilter";

function pivotData(rows: DailyActiveUsersEntry[]) {
  const byDay: Record<string, Record<string, number>> = {};
  for (const row of rows) {
    if (!byDay[row.day]) byDay[row.day] = {};
    byDay[row.day][row.token] = row.active_addresses;
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

export default function DailyActiveUsers() {
  const chartFilter = useChartFilter();
  const showGbp = chartFilter.currency === "GBP" || chartFilter.currency === "ALL";
  const showEur = chartFilter.currency === "EUR" || chartFilter.currency === "ALL";
  const [range, setRange] = useState<TimeRange>("90d");

  const { data: gbpData, isLoading: gbpLoading, error: gbpError } = useQuery<
    DuneApiResponse<DailyActiveUsersEntry>
  >({
    queryKey: ["daily-active-users"],
    queryFn: async () => {
      const res = await fetch(
        "/api/terminal/british-stablecoin/active-users"
      );
      if (!res.ok) throw new Error("Failed to fetch daily active users");
      return res.json();
    },
    enabled: showGbp,
  });

  const { data: eurData, isLoading: eurLoading, error: eurError } = useQuery<
    DuneApiResponse<DailyActiveUsersEntry>
  >({
    queryKey: ["daily-active-users-eur"],
    queryFn: async () => {
      const res = await fetch(
        "/api/terminal/euro-stablecoin/active-users"
      );
      if (!res.ok) throw new Error("Failed to fetch EUR daily active users");
      return res.json();
    },
    enabled: showEur,
  });

  const isLoading = (showGbp && gbpLoading) || (showEur && eurLoading);
  // Only ERR when every active currency has an explicit error.
  // During loading (no data, no error yet) error stays false so the panel shows its skeleton.
  const error = (!showGbp || !!gbpError) && (!showEur || !!eurError);

  const merged = useMemo(() => {
    const all: DailyActiveUsersEntry[] = [
      ...(showGbp && gbpData?.data ? gbpData.data : []),
      ...(showEur && eurData?.data ? eurData.data : []),
    ];
    return all.filter((r) => chartFilter.tokenMatches(r.token));
  }, [gbpData, eurData, chartFilter, showGbp, showEur]);

  const chartData = useMemo(() => {
    if (!merged.length) return [];
    const cutoff = getCutoffDate(range);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const filtered = merged.filter((r) => {
      const d = new Date(r.day);
      if (d > today) return false;
      if (cutoff && d < cutoff) return false;
      return true;
    });
    return pivotData(filtered);
  }, [merged, range]);

  const tokens = useMemo(() => {
    if (!merged.length) return [];
    return [...new Set(merged.map((r) => r.token))];
  }, [merged]);


  if (error) {
    return (
      <div className="tui-panel">
        <div className="tui-panel-header">
          <span className="tui-panel-title">Daily Active Users</span>
          <span className="text-[10px] text-[#FF4444]">ERR</span>
        </div>
        <div className="p-4 text-[#FF4444] text-xs">
          Failed to load daily active users.
        </div>
      </div>
    );
  }

  return (
    <div className="tui-panel">
      <div className="tui-panel-header">
        <span className="tui-panel-title">Daily Active Users <span className="text-[9px] text-[#5B7FFF] font-normal ml-1">[Dune]</span></span>
        <div className="flex items-center gap-2">
          <ChartFilter
            currency={chartFilter.currency}
            setCurrency={chartFilter.setCurrency}
            tokens={chartFilter.tokens}
            selectedTokens={chartFilter.selectedTokens}
            setSelectedTokens={chartFilter.setSelectedTokens}
          />
          <TimeRangeSelector value={range} onChange={setRange} />
        </div>
      </div>

      <div className="p-4">
        {/* Token legend */}
        <div className="flex flex-wrap gap-3 mb-3">
          {tokens.slice(0, 6).map((token) => (
            <span key={token} className="flex items-center text-[10px] text-[#6B7280]">
              <TokenLogo symbol={token} size={12} />
              {token}
            </span>
          ))}
          {tokens.length > 6 && (
            <span className="text-[10px] text-[#6B7280]">+{tokens.length - 6} more</span>
          )}
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
                tickFormatter={(v: number) => formatNumber(v)}
                tick={{ fill: "#6B7280", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={50}
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
                  formatNumber(Number(value ?? 0)),
                  String(name),
                ]}
              />
              {tokens.map((token) => (
                <Area
                  key={token}
                  type="monotone"
                  dataKey={token}
                  stroke={
                    CHART_COLORS[token as keyof typeof CHART_COLORS] ??
                    "#E0E0E0"
                  }
                  fill={
                    CHART_COLORS[token as keyof typeof CHART_COLORS] ??
                    "#E0E0E0"
                  }
                  fillOpacity={0.08}
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

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
import TimeRangeSelector, { type TimeRange, getCutoffDate } from "./TimeRangeSelector";

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
  return `${months[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}

export default function DailyActiveUsers() {
  const [range, setRange] = useState<TimeRange>("90d");
  const { data, isLoading, error } = useQuery<
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
  });

  const chartData = useMemo(() => {
    if (!data?.data) return [];
    const cutoff = getCutoffDate(range);
    const filtered = cutoff
      ? data.data.filter((r) => new Date(r.day) >= cutoff)
      : data.data;
    return pivotData(filtered);
  }, [data, range]);

  const tokens = useMemo(() => {
    if (!data?.data) return [];
    return [...new Set(data.data.map((r) => r.token))];
  }, [data]);

  const dataRange = useMemo(() => {
    if (!chartData.length) return "";
    const first = chartData[0].day.slice(0, 10);
    const last = chartData[chartData.length - 1].day.slice(0, 10);
    return `${first} → ${last}`;
  }, [chartData]);

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
          {dataRange && <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>{dataRange}</span>}
          <TimeRangeSelector value={range} onChange={setRange} />
        </div>
      </div>

      <div className="p-4">
        {/* Token legend */}
        <div className="flex flex-wrap gap-3 mb-3">
          {tokens.map((token) => (
            <span key={token} className="flex items-center text-[10px] text-[#6B7280]">
              <span
                className="token-dot"
                style={{
                  backgroundColor:
                    CHART_COLORS[token as keyof typeof CHART_COLORS] ?? "#E0E0E0",
                }}
              />
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

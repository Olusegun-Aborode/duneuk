"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { CHART_COLORS } from "@/lib/constants";
import { formatCompactUSD } from "@/lib/format";
import type { DexVolumeEntry, DuneApiResponse } from "@/lib/types";
import ChartWatermark from "./ChartWatermark";
import TimeRangeSelector, { type TimeRange, getCutoffDate } from "./TimeRangeSelector";

function formatWeekAxis(dateStr: string) {
  const d = new Date(dateStr);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

function pivotByWeek(rows: DexVolumeEntry[]) {
  const byWeek: Record<string, Record<string, number>> = {};
  for (const row of rows) {
    const week = row.week.slice(0, 10);
    if (!byWeek[week]) byWeek[week] = {};
    byWeek[week][row.token] = (byWeek[week][row.token] ?? 0) + row.volume_usd;
  }
  return Object.entries(byWeek)
    .map(([week, values]) => ({ week, ...values }))
    .sort((a, b) => a.week.localeCompare(b.week));
}

export default function DexVolume() {
  const [range, setRange] = useState<TimeRange>("90d");
  const { data, isLoading, error } = useQuery<
    DuneApiResponse<DexVolumeEntry>
  >({
    queryKey: ["dex-volume"],
    queryFn: async () => {
      const res = await fetch(
        "/api/terminal/british-stablecoin/dex-volume"
      );
      if (!res.ok) throw new Error("Failed to fetch DEX volume");
      return res.json();
    },
  });

  const chartData = useMemo(() => {
    if (!data?.data) return [];
    const cutoff = getCutoffDate(range);
    const filtered = cutoff
      ? data.data.filter((r) => new Date(r.week) >= cutoff)
      : data.data;
    return pivotByWeek(filtered);
  }, [data, range]);

  const tokens = useMemo(() => {
    if (!data?.data) return [];
    return [...new Set(data.data.map((r) => r.token))];
  }, [data]);

  const dataRange = useMemo(() => {
    if (!chartData.length) return "";
    const first = chartData[0].week.slice(0, 10);
    const last = chartData[chartData.length - 1].week.slice(0, 10);
    return `${first} → ${last}`;
  }, [chartData]);

  if (error) {
    return (
      <div className="tui-panel">
        <div className="tui-panel-header">
          <span className="tui-panel-title">DEX Volume</span>
          <span className="text-[10px] text-[#FF4444]">ERR</span>
        </div>
        <div className="p-4 text-[#FF4444] text-xs">
          Failed to load DEX volume.
        </div>
      </div>
    );
  }

  return (
    <div className="tui-panel">
      <div className="tui-panel-header">
        <span className="tui-panel-title">DEX Volume <span className="text-[9px] text-[#5B7FFF] font-normal ml-1">[Dune]</span></span>
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
            <BarChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="week"
                tickFormatter={formatWeekAxis}
                tick={{ fill: "#6B7280", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => formatCompactUSD(v)}
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
                  formatCompactUSD(Number(value ?? 0)),
                  String(name),
                ]}
              />
              {tokens.map((token) => (
                <Bar
                  key={token}
                  dataKey={token}
                  stackId="1"
                  fill={
                    CHART_COLORS[token as keyof typeof CHART_COLORS] ??
                    "#E0E0E0"
                  }
                  fillOpacity={0.85}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

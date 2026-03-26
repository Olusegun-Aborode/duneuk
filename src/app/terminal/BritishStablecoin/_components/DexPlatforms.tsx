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
  Cell,
} from "recharts";
import { formatCompactUSD, formatNumber } from "@/lib/format";
import { DEX_COLORS } from "@/lib/constants";
import type { DexPlatformEntry, DuneApiResponse } from "@/lib/types";
import { useCurrencyFilter } from "@/contexts/CurrencyFilterContext";
import ChartWatermark from "./ChartWatermark";

export default function DexPlatforms() {
  const { currency } = useCurrencyFilter();
  const showGbp = currency === "GBP" || currency === "ALL";
  const showEur = currency === "EUR" || currency === "ALL";

  const { data: gbpData, isLoading: gbpLoading, error: gbpError } = useQuery<
    DuneApiResponse<DexPlatformEntry>
  >({
    queryKey: ["dex-platforms"],
    queryFn: async () => {
      const res = await fetch(
        "/api/terminal/british-stablecoin/dex-platforms"
      );
      if (!res.ok) throw new Error("Failed to fetch DEX platforms");
      return res.json();
    },
    enabled: showGbp,
  });

  const { data: eurData, isLoading: eurLoading, error: eurError } = useQuery<
    DuneApiResponse<DexPlatformEntry>
  >({
    queryKey: ["dex-platforms-eur"],
    queryFn: async () => {
      const res = await fetch(
        "/api/terminal/euro-stablecoin/dex-platforms"
      );
      if (!res.ok) throw new Error("Failed to fetch EUR DEX platforms");
      return res.json();
    },
    enabled: showEur,
  });

  const isLoading = (showGbp && gbpLoading) || (showEur && eurLoading);
  const error = (showGbp && gbpError) || (showEur && eurError);

  const merged = useMemo(() => {
    const all: DexPlatformEntry[] = [
      ...(showGbp && gbpData?.data ? gbpData.data : []),
      ...(showEur && eurData?.data ? eurData.data : []),
    ];
    // Aggregate by dex name since both endpoints may have same DEX
    const byDex: Record<string, DexPlatformEntry> = {};
    for (const entry of all) {
      if (byDex[entry.dex]) {
        byDex[entry.dex] = {
          ...byDex[entry.dex],
          volume_usd: (byDex[entry.dex].volume_usd ?? 0) + (entry.volume_usd ?? 0),
          trade_count: (byDex[entry.dex].trade_count ?? 0) + (entry.trade_count ?? 0),
          unique_traders: (byDex[entry.dex].unique_traders ?? 0) + (entry.unique_traders ?? 0),
        };
      } else {
        byDex[entry.dex] = { ...entry };
      }
    }
    return Object.values(byDex).sort((a, b) => (b.volume_usd ?? 0) - (a.volume_usd ?? 0));
  }, [gbpData, eurData, showGbp, showEur]);

  const data = { data: merged };
  const totalVolume = merged.reduce((sum, d) => sum + (d.volume_usd ?? 0), 0);

  if (error) {
    return (
      <div className="tui-panel">
        <div className="tui-panel-header">
          <span className="tui-panel-title">DEX Platforms</span>
          <span className="text-[10px] text-[#FF4444]">ERR</span>
        </div>
        <div className="p-4 text-[#FF4444] text-xs">
          Failed to load DEX platforms.
        </div>
      </div>
    );
  }

  return (
    <div className="tui-panel overflow-x-auto">
      <div className="tui-panel-header">
        <span className="tui-panel-title">DEX Platforms <span className="text-[9px] text-[#5B7FFF] font-normal ml-1">[Dune]</span></span>
        <span className="tui-panel-badge">90 days</span>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="h-64 w-full skeleton" />
        ) : (
          <div className="relative">
            <ChartWatermark />
            <ResponsiveContainer
              width="100%"
              height={Math.max((data.data?.length ?? 0) * 45, 200)}
            >
              <BarChart layout="vertical" data={data.data}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.04)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tickFormatter={(v: number) => formatCompactUSD(v)}
                  tick={{ fill: "#6B7280", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="dex"
                  tick={{ fill: "#6B7280", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={100}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const entry = payload[0]?.payload as DexPlatformEntry | undefined;
                    if (!entry) return null;
                    const share =
                      totalVolume > 0
                        ? ((entry.volume_usd ?? 0) / totalVolume) * 100
                        : 0;
                    return (
                      <div
                        style={{
                          backgroundColor: "#111318",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "4px",
                          padding: "8px 10px",
                          fontSize: 11,
                          fontFamily: "monospace",
                        }}
                      >
                        <div style={{ color: "#E0E0E0", fontWeight: 600, marginBottom: 4 }}>
                          {entry.dex}
                        </div>
                        <div style={{ color: "#6B7280" }}>
                          Volume: <span style={{ color: "#E0E0E0" }}>{formatCompactUSD(entry.volume_usd)}</span>
                        </div>
                        <div style={{ color: "#6B7280" }}>
                          Trades: <span style={{ color: "#E0E0E0" }}>{formatNumber(entry.trade_count)}</span>
                        </div>
                        <div style={{ color: "#6B7280" }}>
                          Unique traders: <span style={{ color: "#E0E0E0" }}>{formatNumber(entry.unique_traders)}</span>
                        </div>
                        <div style={{ color: "#6B7280" }}>
                          Share: <span style={{ color: "#E0E0E0" }}>{share.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="volume_usd" fillOpacity={0.85}>
                  {data.data?.map((entry, idx) => (
                    <Cell
                      key={`${entry.dex}-${idx}`}
                      fill={DEX_COLORS[entry.dex] ?? "#E0E0E0"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

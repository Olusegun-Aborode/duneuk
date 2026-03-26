"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { formatCompactUSD, formatNumber } from "@/lib/format";
import { DEX_COLORS } from "@/lib/constants";
import { DexLogo } from "@/components/DexLogo";
import type { DexPlatformEntry, DuneApiResponse } from "@/lib/types";
import { useCurrencyFilter } from "@/contexts/CurrencyFilterContext";

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 4 }).map((_, i) => (
        <td key={i} className="py-2 px-3">
          <div className="h-4 w-16 skeleton" />
        </td>
      ))}
    </tr>
  );
}

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
      <table className="data-table">
        <thead>
          <tr>
            <th>DEX</th>
            <th className="text-right">Volume (USD)</th>
            <th className="text-right">Trades</th>
            <th className="text-right">Unique Traders</th>
            <th className="text-right">Share</th>
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))
            : data?.data?.map((entry, idx) => {
                const color = DEX_COLORS[entry.dex] ?? "#E0E0E0";
                const share = totalVolume > 0
                  ? ((entry.volume_usd ?? 0) / totalVolume) * 100
                  : 0;
                return (
                  <tr key={`${entry.dex}-${idx}`}>
                    <td>
                      <span className="flex items-center">
                        <DexLogo name={entry.dex} size={16} />
                        <span className="font-bold capitalize">
                          {entry.dex}
                        </span>
                      </span>
                    </td>
                    <td className="text-right font-bold">
                      {formatCompactUSD(entry.volume_usd)}
                    </td>
                    <td className="text-right">
                      {formatNumber(entry.trade_count)}
                    </td>
                    <td className="text-right text-[#6B7280]">
                      {formatNumber(entry.unique_traders)}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-[#1a1d24] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(share, 100)}%`,
                              backgroundColor: color,
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-[#6B7280] w-10 text-right">
                          {share.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
        </tbody>
      </table>
    </div>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { formatCompactUSD, formatNumber } from "@/lib/format";
import { DEX_COLORS } from "@/lib/constants";
import type { DexPlatformEntry, DuneApiResponse } from "@/lib/types";

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
  const { data, isLoading, error } = useQuery<
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
  });

  const totalVolume = data?.data?.reduce((sum, d) => sum + (d.volume_usd ?? 0), 0) ?? 0;

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
                        <span
                          className="token-dot"
                          style={{ backgroundColor: color }}
                        />
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

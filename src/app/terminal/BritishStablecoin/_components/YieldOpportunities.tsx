"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { formatCompactUSD, formatNumber } from "@/lib/format";
import { TOKEN_META, DEX_COLORS } from "@/lib/constants";
import { DexLogo } from "@/components/DexLogo";
import { TokenLogo } from "@/components/TokenLogo";
import type { DexPoolEntry, DuneApiResponse } from "@/lib/types";
import { useCurrencyFilter, tokenMatchesCurrency } from "@/contexts/CurrencyFilterContext";

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="py-2 px-3">
          <div className="h-4 w-16 skeleton" />
        </td>
      ))}
    </tr>
  );
}

export default function YieldOpportunities() {
  const { currency } = useCurrencyFilter();
  const showGbp = currency === "GBP" || currency === "ALL";
  const showEur = currency === "EUR" || currency === "ALL";

  const { data: gbpData, isLoading: gbpLoading, error: gbpError } = useQuery<
    DuneApiResponse<DexPoolEntry>
  >({
    queryKey: ["dex-pools"],
    queryFn: async () => {
      const res = await fetch(
        "/api/terminal/british-stablecoin/dex-pools"
      );
      if (!res.ok) throw new Error("Failed to fetch DEX pools");
      return res.json();
    },
    enabled: showGbp,
  });

  const { data: eurData, isLoading: eurLoading, error: eurError } = useQuery<
    DuneApiResponse<DexPoolEntry>
  >({
    queryKey: ["dex-pools-eur"],
    queryFn: async () => {
      const res = await fetch(
        "/api/terminal/euro-stablecoin/dex-pools"
      );
      if (!res.ok) throw new Error("Failed to fetch EUR DEX pools");
      return res.json();
    },
    enabled: showEur,
  });

  const isLoading = (showGbp && gbpLoading) || (showEur && eurLoading);
  const error = (showGbp && gbpError) || (showEur && eurError);

  const data = useMemo(() => {
    const all: DexPoolEntry[] = [
      ...(showGbp && gbpData?.data ? gbpData.data : []),
      ...(showEur && eurData?.data ? eurData.data : []),
    ];
    return { data: all.filter((r) => tokenMatchesCurrency(r.gbp_token, currency)) };
  }, [gbpData, eurData, currency, showGbp, showEur]);

  if (error) {
    return (
      <div className="tui-panel">
        <div className="tui-panel-header">
          <span className="tui-panel-title">Active LP Pools</span>
          <span className="text-[10px] text-[#FF4444]">ERR</span>
        </div>
        <div className="p-4 text-[#FF4444] text-xs">
          Failed to load pool data.
        </div>
      </div>
    );
  }

  return (
    <div className="tui-panel overflow-x-auto">
      <div className="tui-panel-header">
        <span className="tui-panel-title">Active LP Pools <span className="text-[9px] text-[#5B7FFF] font-normal ml-1">[Dune]</span></span>
        <span className="tui-panel-badge">30 days · min 5 trades</span>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>DEX</th>
            <th>Chain</th>
            <th>Pair</th>
            <th className="text-right">Volume (USD)</th>
            <th className="text-right">Trades</th>
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))
            : data?.data?.map((entry, idx) => {
                const gbpMeta = TOKEN_META[entry.gbp_token];
                const dexColor = DEX_COLORS[entry.dex] ?? "#E0E0E0";
                return (
                  <tr key={`${entry.dex}-${entry.gbp_token}-${entry.pair_token}-${idx}`}>
                    <td>
                      <span className="flex items-center">
                        <DexLogo name={entry.dex} size={16} />
                        <span className="capitalize font-bold">
                          {entry.dex}
                        </span>
                      </span>
                    </td>
                    <td className="capitalize">{entry.blockchain}</td>
                    <td>
                      <span className="inline-flex items-center">
                        <TokenLogo symbol={entry.gbp_token} size={14} />
                        <span
                          className="font-bold"
                          style={{ color: gbpMeta?.color ?? "#E0E0E0" }}
                        >
                          {entry.gbp_token}
                        </span>
                        <span className="text-[#6B7280]"> / </span>
                        <span className="text-white">{entry.pair_token}</span>
                      </span>
                    </td>
                    <td className="text-right font-bold">
                      {formatCompactUSD(entry.volume_usd_30d)}
                    </td>
                    <td className="text-right text-[#6B7280]">
                      {formatNumber(entry.trade_count_30d)}
                    </td>
                  </tr>
                );
              })}
        </tbody>
      </table>
    </div>
  );
}

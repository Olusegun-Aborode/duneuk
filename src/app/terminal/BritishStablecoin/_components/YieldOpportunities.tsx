"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { formatCompactUSD, formatNumber } from "@/lib/format";
import { TOKEN_META, DEX_COLORS } from "@/lib/constants";
import { DexLogo } from "@/components/DexLogo";
import { ChainLogo } from "@/components/ChainLogo";
import { TokenLogo } from "@/components/TokenLogo";
import type { DexPoolEntry, DuneApiResponse } from "@/lib/types";
import { useCurrencyFilter, tokenMatchesCurrency } from "@/contexts/CurrencyFilterContext";
import Link from "next/link";

const DEFAULT_VISIBLE = 9;

function SkeletonCard() {
  return (
    <div className="tui-panel p-3">
      <div className="h-4 w-24 skeleton mb-2" />
      <div className="h-5 w-32 skeleton mb-3" />
      <div className="h-3 w-full skeleton" />
    </div>
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

  const sorted = [...(data?.data ?? [])].sort(
    (a, b) => (b.volume_usd_30d ?? 0) - (a.volume_usd_30d ?? 0)
  );
  const maxVolume = sorted.length > 0 ? sorted[0].volume_usd_30d ?? 1 : 1;
  const visible = sorted.slice(0, DEFAULT_VISIBLE);

  return (
    <div className="tui-panel">
      <div className="tui-panel-header">
        <span className="tui-panel-title">Active LP Pools <span className="text-[9px] text-[#5B7FFF] font-normal ml-1">[Dune]</span></span>
        <span className="tui-panel-badge">30 days · min 5 trades</span>
      </div>
      <div className="p-3">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {visible.map((entry, idx) => {
                const gbpMeta = TOKEN_META[entry.gbp_token];
                const dexColor = DEX_COLORS[entry.dex] ?? "#E0E0E0";
                const volPct = maxVolume > 0 ? ((entry.volume_usd_30d ?? 0) / maxVolume) * 100 : 0;

                return (
                  <div
                    key={`${entry.dex}-${entry.gbp_token}-${entry.pair_token}-${idx}`}
                    className="border border-[#2A2E35] rounded-lg p-3 bg-[#0D1117]/50 hover:border-[#3A3E45] transition-colors"
                  >
                    {/* Top row: DEX + Chain */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center text-xs">
                        <DexLogo name={entry.dex} size={16} />
                        <span className="capitalize font-bold" style={{ color: dexColor }}>
                          {entry.dex}
                        </span>
                      </span>
                      <span className="flex items-center text-[10px] text-[#6B7280] bg-[#1A1D24] rounded px-1.5 py-0.5">
                        <ChainLogo name={entry.blockchain} size={12} />
                        <span className="capitalize">{entry.blockchain}</span>
                      </span>
                    </div>

                    {/* Middle: Token pair */}
                    <div className="flex items-center mb-3">
                      <TokenLogo symbol={entry.gbp_token} size={20} />
                      <span
                        className="font-bold text-sm"
                        style={{ color: gbpMeta?.color ?? "#E0E0E0" }}
                      >
                        {entry.gbp_token}
                      </span>
                      <span className="text-[#6B7280] mx-1">/</span>
                      <span className="text-white text-sm font-medium">{entry.pair_token}</span>
                    </div>

                    {/* Bottom: Volume bar + trade count */}
                    <div>
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-[#6B7280]">Vol 30d</span>
                        <span className="text-white font-bold">
                          {formatCompactUSD(entry.volume_usd_30d)}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#1A1D24] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.max(volPct, 2)}%`,
                            backgroundColor: dexColor,
                          }}
                        />
                      </div>
                      <div className="text-[10px] text-[#6B7280] mt-1">
                        {formatNumber(entry.trade_count_30d)} trades
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {sorted.length > DEFAULT_VISIBLE && (
              <div className="flex justify-center mt-3">
                <Link
                  href="/terminal/BritishStablecoin/pools"
                  className="text-[11px] text-[#5B7FFF] hover:text-[#7B9FFF] transition-colors cursor-pointer"
                >
                  View all {sorted.length} pools &rarr;
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

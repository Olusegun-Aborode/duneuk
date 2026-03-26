"use client";

import { useQuery } from "@tanstack/react-query";
import { useCurrencyFilter, tokenMatchesFilter } from "@/contexts/CurrencyFilterContext";
import { CurrencyFilterProvider } from "@/contexts/CurrencyFilterContext";
import { CurrencyFilter } from "@/components/CurrencyFilter";
import { formatCompactUSD, formatNumber } from "@/lib/format";
import { TokenLogo } from "@/components/TokenLogo";
import { DexLogo } from "@/components/DexLogo";
import { ChainLogo } from "@/components/ChainLogo";
import { DEX_COLORS } from "@/lib/constants";
import type { DexPoolEntry, DuneApiResponse } from "@/lib/types";

function PoolsContent() {
  const { currency, selectedTokens } = useCurrencyFilter();
  const showGbp = currency === "GBP" || currency === "ALL";
  const showEur = currency === "EUR" || currency === "ALL";

  const gbp = useQuery<DuneApiResponse<DexPoolEntry>>({
    queryKey: ["dex-pools-gbp"],
    queryFn: async () => {
      const res = await fetch("/api/terminal/british-stablecoin/dex-pools");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: showGbp,
  });

  const eur = useQuery<DuneApiResponse<DexPoolEntry>>({
    queryKey: ["dex-pools-eur"],
    queryFn: async () => {
      const res = await fetch("/api/terminal/euro-stablecoin/dex-pools");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: showEur,
  });

  const pools = [
    ...(showGbp && gbp.data?.data ? gbp.data.data : []),
    ...(showEur && eur.data?.data ? eur.data.data : []),
  ]
    .filter(r => tokenMatchesFilter(r.gbp_token, currency, selectedTokens))
    .sort((a, b) => b.volume_usd_30d - a.volume_usd_30d);

  const isLoading = (showGbp && gbp.isLoading) || (showEur && eur.isLoading);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-2">
        <div>
          <a href="/terminal/BritishStablecoin" className="inline-flex items-center gap-1 text-[10px] text-[var(--text-muted)] hover:text-[var(--accent-green)] transition-colors mb-1">
            <span>&larr;</span> Back to Terminal
          </a>
          <h1 className="text-lg font-bold text-[var(--foreground)] tracking-tight">Active LP Pools</h1>
          <p className="text-[var(--text-muted)] text-[11px] mt-0.5">{pools.length} pools · 30 day activity · min 5 trades</p>
        </div>
        <CurrencyFilter />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-28 skeleton rounded" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {pools.map((pool, i) => {
            const maxVol = pools[0]?.volume_usd_30d || 1;
            const barWidth = Math.max((pool.volume_usd_30d / maxVol) * 100, 2);
            const dexColor = (DEX_COLORS as Record<string, string>)[pool.dex] ?? "var(--accent-green)";
            return (
              <div key={`${pool.dex}-${pool.blockchain}-${pool.gbp_token}-${pool.pair_token}-${i}`}
                className="rounded border p-3"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5 text-[11px] font-mono" style={{ color: dexColor }}>
                    <DexLogo name={pool.dex} size={14} />
                    {pool.dex}
                  </span>
                  <span className="flex items-center gap-1 text-[9px]" style={{ color: "var(--text-muted)" }}>
                    <ChainLogo name={pool.blockchain} size={12} />
                    {pool.blockchain}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mb-2">
                  <TokenLogo symbol={pool.gbp_token} size={16} />
                  <span className="text-xs font-bold" style={{ color: "var(--foreground)" }}>
                    {pool.gbp_token} / {pool.pair_token}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
                    <div className="h-full rounded-full" style={{ width: `${barWidth}%`, backgroundColor: dexColor }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px]" style={{ color: "var(--text-muted)" }}>
                    <span>{formatCompactUSD(pool.volume_usd_30d)}</span>
                    <span>{formatNumber(pool.trade_count_30d)} trades</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PoolsPage() {
  return (
    <CurrencyFilterProvider>
      <PoolsContent />
    </CurrencyFilterProvider>
  );
}

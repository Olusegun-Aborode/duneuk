"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { formatGBP, formatEUR, formatUSD, formatPercent, formatNumber, formatNative } from "@/lib/format";
import { TOKEN_META } from "@/lib/constants";
import { TokenLogo } from "@/components/TokenLogo";
import { useCurrencyFilter, type CurrencyFilter } from "@/contexts/CurrencyFilterContext";
import type { LeaderboardEntry, DuneApiResponse } from "@/lib/types";

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="py-2 px-3">
          <div className="h-4 w-16 skeleton" />
        </td>
      ))}
    </tr>
  );
}

function useLeaderboardData(currency: CurrencyFilter) {
  const showGbp = currency === "GBP" || currency === "ALL";
  const showEur = currency === "EUR" || currency === "ALL";

  const gbp = useQuery<DuneApiResponse<LeaderboardEntry>>({
    queryKey: ["supply-leaderboard-gbp"],
    queryFn: async () => {
      const res = await fetch("/api/terminal/british-stablecoin/leaderboard");
      if (!res.ok) throw new Error("Failed to fetch GBP leaderboard");
      return res.json();
    },
    enabled: showGbp,
  });

  const eur = useQuery<DuneApiResponse<LeaderboardEntry>>({
    queryKey: ["supply-leaderboard-eur"],
    queryFn: async () => {
      const res = await fetch("/api/terminal/euro-stablecoin/leaderboard");
      if (!res.ok) throw new Error("Failed to fetch EUR leaderboard");
      return res.json();
    },
    enabled: showEur,
  });

  const entries: LeaderboardEntry[] = [];
  if (showGbp && gbp.data?.data) entries.push(...gbp.data.data);
  if (showEur && eur.data?.data) entries.push(...eur.data.data);

  // Re-sort by USD supply when in ALL mode
  if (currency === "ALL") {
    entries.sort((a, b) => b.supply_usd - a.supply_usd);
  }

  return {
    data: entries,
    isLoading: (showGbp && gbp.isLoading) || (showEur && eur.isLoading),
    error: (showGbp && gbp.error) || (showEur && eur.error),
    lastUpdated: gbp.data?.lastUpdated || eur.data?.lastUpdated,
  };
}

export default function SupplyLeaderboard() {
  const { currency } = useCurrencyFilter();
  const { data: entries, isLoading, error, lastUpdated } = useLeaderboardData(currency);

  if (error) {
    return (
      <div className="tui-panel">
        <div className="tui-panel-header">
          <span className="tui-panel-title">Supply Leaderboard</span>
          <span className="text-[10px] text-[#FF4444]">ERR</span>
        </div>
        <div className="p-4 text-[#FF4444] text-xs">
          Failed to load leaderboard.
        </div>
      </div>
    );
  }

  return (
    <div className="tui-panel overflow-x-auto">
      <div className="tui-panel-header">
        <span className="tui-panel-title">Supply Leaderboard</span>
        <span className="tui-panel-badge">Ranked by market share <span className="text-[9px] text-[#5B7FFF] ml-1">[Dune]</span></span>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Token</th>
            <th>Issuer</th>
            <th>Chains</th>
            <th className="text-right">Supply ({currency === "ALL" ? "Native" : currency})</th>
            <th className="text-right">Supply (USD)</th>
            <th className="text-right">Share</th>
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            : entries?.map((entry, idx) => {
                const meta = TOKEN_META[entry.token];
                const isEur = ["EURC", "EURT"].includes(entry.token);
                const nativeFormat = isEur ? formatEUR : formatGBP;
                return (
                  <tr key={entry.token}>
                    <td className="text-[#6B7280]">{idx + 1}</td>
                    <td>
                      <Link
                        href={`/terminal/BritishStablecoin/${entry.token}`}
                        className="flex items-center hover:underline"
                      >
                        <TokenLogo symbol={entry.token} size={16} />
                        <span
                          className="font-bold"
                          style={{ color: meta?.color ?? "#E0E0E0" }}
                        >
                          {entry.token}
                        </span>
                      </Link>
                    </td>
                    <td className="text-[#6B7280]">{entry.issuer}</td>
                    <td>{formatNumber(entry.num_chains)}</td>
                    <td className="text-right font-bold">
                      {currency === "ALL" ? formatUSD(entry.supply_usd) : nativeFormat(entry.supply_gbp)}
                    </td>
                    <td className="text-right text-[#6B7280]">
                      {formatUSD(entry.supply_usd)}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="tui-progress w-14">
                          <div
                            className="tui-progress-fill"
                            style={{
                              width: `${Math.min(entry.market_share_pct, 100)}%`,
                              backgroundColor: meta?.color ?? "#00FF88",
                            }}
                          />
                        </div>
                        <span className="text-xs min-w-[3rem] text-right">
                          {formatPercent(entry.market_share_pct)}
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

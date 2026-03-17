"use client";

import { useQuery } from "@tanstack/react-query";
import { formatCompactUSD, formatNumber, formatPercent } from "@/lib/format";
import { TOKEN_META } from "@/lib/constants";
import InsightPanel from "./InsightPanel";
import type { LendingUtilizationEntry, DuneApiResponse } from "@/lib/types";

export default function LendingUtilization() {
  const { data, isLoading, error } = useQuery<
    DuneApiResponse<LendingUtilizationEntry>
  >({
    queryKey: ["lending"],
    queryFn: async () => {
      const res = await fetch(
        "/api/terminal/british-stablecoin/lending"
      );
      if (!res.ok) throw new Error("Failed to fetch lending data");
      return res.json();
    },
  });

  if (error) {
    return (
      <div className="tui-panel">
        <div className="tui-panel-header">
          <span className="tui-panel-title">Lending & Borrowing</span>
          <span className="text-[10px] text-[#FF4444]">ERR</span>
        </div>
        <div className="p-4 text-[#FF4444] text-xs">
          Failed to load lending data.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="tui-panel">
        <div className="tui-panel-header">
          <span className="tui-panel-title">Lending & Borrowing</span>
          <span className="tui-panel-badge">Since Jan 2025</span>
        </div>
        <div className="p-4">
          <div className="h-32 skeleton" />
        </div>
      </div>
    );
  }

  // Filter out rows with zero activity
  const activeRows = data?.data?.filter(
    (e) => (e.supply_usd ?? 0) > 0 || (e.borrow_usd ?? 0) > 0 || (e.event_count ?? 0) > 0
  ) ?? [];

  // If no meaningful lending data exists, show insight panel
  if (activeRows.length === 0) {
    return (
      <InsightPanel title="Lending & Borrowing" badge="Market Gap" icon="🏦">
        <p>
          <span className="text-white font-bold">Zero GBP stablecoin lending markets detected</span>{" "}
          across Aave, Compound, Morpho, and other major lending protocols since January 2025.
        </p>
        <p>
          This represents one of the largest infrastructure gaps in the GBP stablecoin ecosystem.
          USD stablecoins like USDT and USDC are deployed across dozens of lending markets with
          billions in TVL. GBP stablecoins have no equivalent.
        </p>
        <p className="text-[#6B7280]">
          Until GBP stablecoins achieve sufficient supply and liquidity depth, integration into
          lending protocols remains unlikely — creating a chicken-and-egg problem for DeFi adoption.
        </p>
      </InsightPanel>
    );
  }

  return (
    <div className="tui-panel overflow-x-auto">
      <div className="tui-panel-header">
        <span className="tui-panel-title">Lending & Borrowing <span className="text-[9px] text-[#5B7FFF] font-normal ml-1">[Dune]</span></span>
        <span className="tui-panel-badge">Since Jan 2025</span>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Protocol</th>
            <th>Chain</th>
            <th>Token</th>
            <th className="text-right">Supplied</th>
            <th className="text-right">Borrowed</th>
            <th className="text-right">Util.</th>
            <th className="text-right">Users</th>
          </tr>
        </thead>
        <tbody>
          {activeRows.map((entry, idx) => {
            const meta = TOKEN_META[entry.token];
            const utilPct = (entry.utilization_rate ?? 0) * 100;
            return (
              <tr key={`${entry.project}-${entry.token}-${idx}`}>
                <td className="capitalize font-bold">{entry.project}</td>
                <td className="capitalize">{entry.blockchain}</td>
                <td>
                  <span className="flex items-center">
                    <span
                      className="token-dot"
                      style={{ backgroundColor: meta?.color ?? "#E0E0E0" }}
                    />
                    <span style={{ color: meta?.color ?? "#E0E0E0" }}>
                      {entry.token}
                    </span>
                  </span>
                </td>
                <td className="text-right">{formatCompactUSD(entry.supply_usd)}</td>
                <td className="text-right">{formatCompactUSD(entry.borrow_usd)}</td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <div className="w-10 h-1.5 bg-[#1a1d24] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#FF6B35]"
                        style={{ width: `${Math.min(utilPct, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-[#6B7280]">
                      {formatPercent(utilPct)}
                    </span>
                  </div>
                </td>
                <td className="text-right text-[#6B7280]">
                  {formatNumber((entry.suppliers ?? 0) + (entry.borrowers ?? 0))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { formatGBP, formatNumber } from "@/lib/format";
import { TOKEN_META } from "@/lib/constants";
import type { TransferVolumeEntry, DuneApiResponse } from "@/lib/types";

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

export default function TransferVolume() {
  const { data, isLoading, error } = useQuery<
    DuneApiResponse<TransferVolumeEntry>
  >({
    queryKey: ["transfer-volume"],
    queryFn: async () => {
      const res = await fetch(
        "/api/terminal/british-stablecoin/transfer-volume"
      );
      if (!res.ok) throw new Error("Failed to fetch transfer volume");
      return res.json();
    },
  });

  if (error) {
    return (
      <div className="tui-panel">
        <div className="tui-panel-header">
          <span className="tui-panel-title">Transfer Volume</span>
          <span className="text-[10px] text-[#FF4444]">ERR</span>
        </div>
        <div className="p-4 text-[#FF4444] text-xs">
          Failed to load transfer volume.
        </div>
      </div>
    );
  }

  return (
    <div className="tui-panel overflow-x-auto">
      <div className="tui-panel-header">
        <span className="tui-panel-title">Transfer Volume <span className="text-[9px] text-[#5B7FFF] font-normal ml-1">[Dune]</span></span>
        <span className="tui-panel-badge">Last 30 days</span>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Chain</th>
            <th>Token</th>
            <th className="text-right">Transfers</th>
            <th className="text-right">Volume (GBP)</th>
            <th className="text-right">Senders</th>
            <th className="text-right">Receivers</th>
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))
            : data?.data?.map((entry, idx) => {
                const meta = TOKEN_META[entry.token];
                return (
                  <tr key={`${entry.blockchain}-${entry.token}-${idx}`}>
                    <td className="capitalize">{entry.blockchain}</td>
                    <td>
                      <span className="flex items-center">
                        <span
                          className="token-dot"
                          style={{
                            backgroundColor: meta?.color ?? "#E0E0E0",
                          }}
                        />
                        <span
                          className="font-bold"
                          style={{ color: meta?.color ?? "#E0E0E0" }}
                        >
                          {entry.token}
                        </span>
                      </span>
                    </td>
                    <td className="text-right">
                      {formatNumber(entry.num_transfers)}
                    </td>
                    <td className="text-right font-bold">
                      {formatGBP(entry.volume_gbp)}
                    </td>
                    <td className="text-right text-[#6B7280]">
                      {formatNumber(entry.unique_senders)}
                    </td>
                    <td className="text-right text-[#6B7280]">
                      {formatNumber(entry.unique_receivers)}
                    </td>
                  </tr>
                );
              })}
        </tbody>
      </table>
    </div>
  );
}

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
import { formatNative, formatNumber, formatCompactUSD } from "@/lib/format";
import { TOKEN_META, CHART_COLORS } from "@/lib/constants";
import { TokenLogo } from "@/components/TokenLogo";
import type { TransferVolumeEntry, DuneApiResponse } from "@/lib/types";
import { useChartFilter, ChartFilter } from "@/components/ChartFilter";
import ChartWatermark from "./ChartWatermark";

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

interface ChainRow {
  blockchain: string;
  total_volume: number;
  num_transfers: number;
  unique_senders: number;
  unique_receivers: number;
  [token: string]: string | number;
}

export default function TransferVolume() {
  const chartFilter = useChartFilter();
  const showGbp = chartFilter.currency === "GBP" || chartFilter.currency === "ALL";
  const showEur = chartFilter.currency === "EUR" || chartFilter.currency === "ALL";
  const [showTable, setShowTable] = useState(false);

  const { data: gbpData, isLoading: gbpLoading, error: gbpError } = useQuery<
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
    enabled: showGbp,
  });

  const { data: eurData, isLoading: eurLoading, error: eurError } = useQuery<
    DuneApiResponse<TransferVolumeEntry>
  >({
    queryKey: ["transfer-volume-eur"],
    queryFn: async () => {
      const res = await fetch(
        "/api/terminal/euro-stablecoin/transfer-volume"
      );
      if (!res.ok) throw new Error("Failed to fetch EUR transfer volume");
      return res.json();
    },
    enabled: showEur,
  });

  const isLoading = (showGbp && gbpLoading) || (showEur && eurLoading);
  const error = (showGbp && gbpError) || (showEur && eurError);

  const data = useMemo(() => {
    const all: TransferVolumeEntry[] = [
      ...(showGbp && gbpData?.data ? gbpData.data : []),
      ...(showEur && eurData?.data ? eurData.data : []),
    ];
    return { data: all.filter((r) => chartFilter.tokenMatches(r.token)) };
  }, [gbpData, eurData, chartFilter, showGbp, showEur]);

  const MAX_CHAINS = 6;

  const { chartData, tokens } = useMemo(() => {
    if (!data.data?.length) return { chartData: [], tokens: [] };
    const byChain: Record<string, ChainRow> = {};
    const tokenSet = new Set<string>();
    for (const entry of data.data) {
      tokenSet.add(entry.token);
      if (!byChain[entry.blockchain]) {
        byChain[entry.blockchain] = {
          blockchain: entry.blockchain,
          total_volume: 0,
          num_transfers: 0,
          unique_senders: 0,
          unique_receivers: 0,
        };
      }
      const row = byChain[entry.blockchain];
      row[entry.token] = ((row[entry.token] as number) || 0) + entry.volume_gbp;
      row.total_volume += entry.volume_gbp;
      row.num_transfers += entry.num_transfers;
      row.unique_senders += entry.unique_senders;
      row.unique_receivers += entry.unique_receivers;
    }
    const sorted = Object.values(byChain).sort(
      (a, b) => b.total_volume - a.total_volume
    );

    // Limit to top N chains, group rest as "Others"
    if (sorted.length > MAX_CHAINS) {
      const top = sorted.slice(0, MAX_CHAINS);
      const rest = sorted.slice(MAX_CHAINS);
      const others: ChainRow = {
        blockchain: `others (${rest.length})`,
        total_volume: 0,
        num_transfers: 0,
        unique_senders: 0,
        unique_receivers: 0,
      };
      for (const r of rest) {
        others.total_volume += r.total_volume;
        others.num_transfers += r.num_transfers;
        for (const t of tokenSet) {
          others[t] = ((others[t] as number) || 0) + ((r[t] as number) || 0);
        }
      }
      top.push(others);
      return { chartData: top, tokens: [...tokenSet] };
    }

    return { chartData: sorted, tokens: [...tokenSet] };
  }, [data]);

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
        <div className="flex items-center gap-2">
          <ChartFilter
            currency={chartFilter.currency}
            setCurrency={chartFilter.setCurrency}
            tokens={chartFilter.tokens}
            selectedTokens={chartFilter.selectedTokens}
            setSelectedTokens={chartFilter.setSelectedTokens}
          />
          <button
            onClick={() => setShowTable((v) => !v)}
            className="text-[9px] px-1.5 py-0.5 rounded border border-white/10 hover:border-white/20 text-[#6B7280] hover:text-[#E0E0E0] transition-colors"
          >
            {showTable ? "Hide table" : "View table"}
          </button>
          <span className="tui-panel-badge">Last 30 days</span>
        </div>
      </div>

      <div className="p-4">
        {/* Token legend — top 6 */}
        <div className="flex flex-wrap gap-3 mb-3">
          {tokens.slice(0, 6).map((token) => (
            <span key={token} className="flex items-center text-[10px]" style={{ color: "var(--text-muted)" }}>
              <TokenLogo symbol={token} size={12} />
              {token}
            </span>
          ))}
          {tokens.length > 6 && (
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>+{tokens.length - 6} more</span>
          )}
        </div>

        {isLoading ? (
          <div className="h-64 w-full skeleton" />
        ) : (
          <div className="relative">
            <ChartWatermark />
            <ResponsiveContainer
              width="100%"
              height={Math.max(chartData.length * 42, 200)}
            >
              <BarChart layout="vertical" data={chartData}>
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
                  dataKey="blockchain"
                  tick={{ fill: "#6B7280", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={90}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111318",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "4px",
                    fontSize: 11,
                    fontFamily: "monospace",
                  }}
                  labelStyle={{ color: "#6B7280", textTransform: "capitalize" }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const row = payload[0]?.payload as ChainRow | undefined;
                    if (!row) return null;
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
                        <div style={{ color: "#E0E0E0", fontWeight: 600, marginBottom: 4, textTransform: "capitalize" }}>
                          {label}
                        </div>
                        <div style={{ color: "#6B7280" }}>
                          Volume: <span style={{ color: "#E0E0E0" }}>{formatNative(row.total_volume, chartFilter.currency)}</span>
                        </div>
                        <div style={{ color: "#6B7280" }}>
                          Transfers: <span style={{ color: "#E0E0E0" }}>{formatNumber(row.num_transfers)}</span>
                        </div>
                        <div style={{ color: "#6B7280" }}>
                          Senders: <span style={{ color: "#E0E0E0" }}>{formatNumber(row.unique_senders)}</span>
                        </div>
                        <div style={{ color: "#6B7280" }}>
                          Receivers: <span style={{ color: "#E0E0E0" }}>{formatNumber(row.unique_receivers)}</span>
                        </div>
                      </div>
                    );
                  }}
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

      {showTable && !isLoading && (
        <div className="max-h-[400px] overflow-y-auto border-t" style={{ borderColor: "var(--border)" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Chain</th>
              <th>Token</th>
              <th className="text-right">Transfers</th>
              <th className="text-right">Volume ({chartFilter.currency === "ALL" ? "Native" : chartFilter.currency})</th>
              <th className="text-right">Senders</th>
              <th className="text-right">Receivers</th>
            </tr>
          </thead>
          <tbody>
            {data?.data?.map((entry, idx) => {
              const meta = TOKEN_META[entry.token];
              return (
                <tr key={`${entry.blockchain}-${entry.token}-${idx}`}>
                  <td className="capitalize">{entry.blockchain}</td>
                  <td>
                    <span className="flex items-center">
                      <TokenLogo symbol={entry.token} size={16} />
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
                    {formatNative(entry.volume_gbp, chartFilter.currency)}
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
      )}
    </div>
  );
}

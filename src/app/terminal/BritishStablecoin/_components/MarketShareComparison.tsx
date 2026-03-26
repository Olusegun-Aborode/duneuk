"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatCompactUSD } from "@/lib/format";
import { CHART_COLORS } from "@/lib/constants";
import type { MarketShareEntry, MarketOverview, SupplyHistoryEntry, DuneApiResponse } from "@/lib/types";
import { useChartFilter, ChartFilter } from "@/components/ChartFilter";
import { GBP_TOKENS, EUR_TOKENS } from "@/contexts/CurrencyFilterContext";
import ChartWatermark from "./ChartWatermark";
import TimeRangeSelector, { type TimeRange, getCutoffDate } from "./TimeRangeSelector";

const GROUP_COLORS: Record<string, string> = {
  GBP: "#00FF88",
  USD: "#5B7FFF",
  EUR: "#FFD700",
};

interface AlliumToken {
  chain: string;
  info: { name: string; symbol: string };
  attributes: {
    total_supply: number;
    fully_diluted_valuation_usd: number;
    holders_count: number;
  };
}

function formatDateAxis(dateStr: string) {
  const d = new Date(dateStr);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function getCurrencyGroup(token: string): "GBP" | "EUR" | null {
  if ((GBP_TOKENS as readonly string[]).includes(token)) return "GBP";
  if ((EUR_TOKENS as readonly string[]).includes(token)) return "EUR";
  return null;
}

export default function MarketShareComparison() {
  const chartFilter = useChartFilter();
  const showGbp = chartFilter.currency === "GBP" || chartFilter.currency === "ALL";
  const showEur = chartFilter.currency === "EUR" || chartFilter.currency === "ALL";
  const [range, setRange] = useState<TimeRange>("180d");

  // Market share per-token breakdown (for counters)
  const { data: gbpData, isLoading: gbpLoading, error: gbpError } = useQuery<
    DuneApiResponse<MarketShareEntry>
  >({
    queryKey: ["market-share"],
    queryFn: async () => {
      const res = await fetch("/api/terminal/british-stablecoin/market-share");
      if (!res.ok) throw new Error("Failed to fetch market share");
      return res.json();
    },
    enabled: showGbp,
  });

  const { data: eurData, isLoading: eurLoading, error: eurError } = useQuery<
    DuneApiResponse<MarketShareEntry>
  >({
    queryKey: ["market-share-eur"],
    queryFn: async () => {
      const res = await fetch("/api/terminal/euro-stablecoin/market-share");
      if (!res.ok) throw new Error("Failed to fetch EUR market share");
      return res.json();
    },
    enabled: showEur,
  });

  // Accurate totals from overview endpoints
  const { data: gbpOverview } = useQuery<DuneApiResponse<MarketOverview>>({
    queryKey: ["market-overview-gbp"],
    queryFn: async () => {
      const res = await fetch("/api/terminal/british-stablecoin/overview");
      if (!res.ok) throw new Error("overview");
      return res.json();
    },
    enabled: showGbp,
  });

  const { data: eurOverview } = useQuery<DuneApiResponse<MarketOverview>>({
    queryKey: ["market-overview-eur"],
    queryFn: async () => {
      const res = await fetch("/api/terminal/euro-stablecoin/overview");
      if (!res.ok) throw new Error("overview");
      return res.json();
    },
    enabled: showEur,
  });

  // Supply history for area chart
  const { data: gbpHistory } = useQuery<DuneApiResponse<SupplyHistoryEntry>>({
    queryKey: ["supply-history-gbp"],
    queryFn: async () => {
      const res = await fetch("/api/terminal/british-stablecoin/supply-history");
      if (!res.ok) throw new Error("Failed to fetch GBP supply history");
      return res.json();
    },
    enabled: showGbp,
  });

  const { data: eurHistory } = useQuery<DuneApiResponse<SupplyHistoryEntry>>({
    queryKey: ["supply-history-eur"],
    queryFn: async () => {
      const res = await fetch("/api/terminal/euro-stablecoin/supply-history");
      if (!res.ok) throw new Error("Failed to fetch EUR supply history");
      return res.json();
    },
    enabled: showEur,
  });

  const isLoading = (showGbp && gbpLoading) || (showEur && eurLoading);
  const error = (showGbp && gbpError) || (showEur && eurError);

  // Fetch Solana GBP token data from Allium
  const { data: solanaData } = useQuery<{
    data: AlliumToken[];
    source: string;
  }>({
    queryKey: ["solana-tokens"],
    queryFn: async () => {
      const res = await fetch(
        "/api/terminal/british-stablecoin/solana-tokens"
      );
      if (!res.ok) return { data: [], source: "allium" };
      return res.json();
    },
  });

  // Compute counter totals from market-share / overview data
  const { grouped, gbpShare, tokensByGroup } = useMemo(() => {
    const duneRows: MarketShareEntry[] = [
      ...(showGbp && gbpData?.data ? gbpData.data : []),
      ...(showEur && eurData?.data ? eurData.data : []),
    ];
    // Deduplicate
    const seen = new Set<string>();
    const allRows: MarketShareEntry[] = [];
    for (const entry of duneRows) {
      if (!seen.has(entry.symbol)) {
        seen.add(entry.symbol);
        allRows.push(entry);
      }
    }
    // Add Solana tokens
    const alliumRows: MarketShareEntry[] = (solanaData?.data ?? []).map((t) => ({
      currency_group: "GBP",
      symbol: `${t.info.symbol} (SOL)`,
      total_supply: t.attributes.total_supply ?? 0,
      total_supply_usd: t.attributes.fully_diluted_valuation_usd ?? 0,
    }));
    const rows = [...allRows, ...alliumRows];

    const totals: Record<string, number> = { GBP: 0, USD: 0, EUR: 0 };
    if (gbpOverview?.data?.[0]) totals.GBP = gbpOverview.data[0].total_supply_usd;
    if (eurOverview?.data?.[0]) totals.EUR = eurOverview.data[0].total_supply_usd;
    for (const row of rows) {
      if (row.currency_group === "USD") {
        totals.USD += row.total_supply_usd ?? 0;
      }
    }

    const total = totals.GBP + totals.USD + totals.EUR;
    const share = total === 0 ? 0 : (totals.GBP / total) * 100;

    // Group token symbols for tooltip
    const groups: Record<string, string[]> = { GBP: [], USD: [], EUR: [] };
    for (const row of rows) {
      const g = row.currency_group;
      if (groups[g] && !groups[g].includes(row.symbol)) {
        groups[g].push(row.symbol);
      }
    }

    return { grouped: totals, gbpShare: share, tokensByGroup: groups };
  }, [gbpData, eurData, solanaData, gbpOverview, eurOverview, showGbp, showEur]);

  // Aggregate supply-history by currency group per day for the area chart
  const chartData = useMemo(() => {
    const historyRows: SupplyHistoryEntry[] = [
      ...(showGbp && gbpHistory?.data ? gbpHistory.data : []),
      ...(showEur && eurHistory?.data ? eurHistory.data : []),
    ];
    if (!historyRows.length) return [];

    const cutoff = getCutoffDate(range);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Aggregate by day and currency group
    const byDay: Record<string, { GBP: number; EUR: number }> = {};
    for (const row of historyRows) {
      const d = new Date(row.day);
      if (d > today) continue;
      if (cutoff && d < cutoff) continue;

      const group = getCurrencyGroup(row.token);
      if (!group) continue;

      if (!byDay[row.day]) byDay[row.day] = { GBP: 0, EUR: 0 };
      byDay[row.day][group] += row.supply_usd;
    }

    return Object.entries(byDay)
      .map(([day, values]) => ({ day, ...values }))
      .sort((a, b) => a.day.localeCompare(b.day));
  }, [gbpHistory, eurHistory, range, showGbp, showEur]);

  const [showTooltip, setShowTooltip] = useState(false);

  if (error) {
    return (
      <div className="tui-panel">
        <div className="tui-panel-header">
          <span className="tui-panel-title">Stablecoin Market Share</span>
          <span className="text-[10px] text-[#FF4444]">ERR</span>
        </div>
        <div className="p-4 text-[#FF4444] text-xs">
          Failed to load market share data.
        </div>
      </div>
    );
  }

  return (
    <div className="tui-panel">
      <div className="tui-panel-header">
        <div className="flex items-center gap-2">
          <span className="tui-panel-title">Stablecoin Market Share</span>
          <div className="relative inline-block"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <button
              onClick={() => setShowTooltip((v) => !v)}
              className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold cursor-pointer"
              style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
              aria-label="Market share info"
            >
              i
            </button>
            {showTooltip && (
              <div
                className="fixed z-[9999] w-72 p-3 rounded text-[11px] leading-relaxed"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                }}
                ref={(el) => {
                  if (el) {
                    const btn = el.previousElementSibling as HTMLElement;
                    if (btn) {
                      const rect = btn.getBoundingClientRect();
                      el.style.top = `${rect.bottom + 6}px`;
                      el.style.left = `${rect.left}px`;
                    }
                  }
                }}
              >
                <span style={{ color: "var(--accent-green)" }} className="font-bold">GBP stablecoins</span> represent{" "}
                <span style={{ color: "var(--foreground)" }} className="font-bold">&lt;0.01%</span> of the combined
                GBP+USD+EUR stablecoin supply on EVM + Solana chains. This represents a significant market gap and
                growth opportunity for GBP-denominated on-chain assets.
                <div className="mt-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                  <div className="font-bold mb-1" style={{ color: "var(--foreground)" }}>Tokens covered:</div>
                  {(["GBP", "USD", "EUR"] as const).map((g) => (
                    tokensByGroup[g]?.length > 0 && (
                      <div key={g} className="mb-0.5">
                        <span style={{ color: GROUP_COLORS[g] }} className="font-bold">{g}:</span>{" "}
                        {tokensByGroup[g].join(", ")}
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ChartFilter
            currency={chartFilter.currency}
            setCurrency={chartFilter.setCurrency}
            tokens={chartFilter.tokens}
            selectedTokens={chartFilter.selectedTokens}
            setSelectedTokens={chartFilter.setSelectedTokens}
          />
          <TimeRangeSelector value={range} onChange={setRange} />
        </div>
      </div>

      <div className="p-4 lg:p-5">
        {isLoading ? (
          <div className="h-32 skeleton" />
        ) : (
          <>
            {/* Three currency counters */}
            <div className="grid grid-cols-3 gap-4 mb-5">
              {(["GBP", "USD", "EUR"] as const).map((group) => (
                <div key={group} className="text-center">
                  <div
                    className="counter-value text-lg"
                    style={{ color: GROUP_COLORS[group] }}
                  >
                    {formatCompactUSD(grouped[group])}
                  </div>
                  <div className="counter-label">{group} Total Supply</div>
                </div>
              ))}
            </div>

            {/* Stacked area chart: GBP vs EUR supply over time */}
            <div className="relative">
              <ChartWatermark />
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.04)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    tickFormatter={formatDateAxis}
                    tick={{ fill: "#6B7280", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v: number) => formatCompactUSD(v)}
                    tick={{ fill: "#6B7280", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={60}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111318",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "4px",
                      fontSize: 11,
                      fontFamily: "monospace",
                    }}
                    labelStyle={{ color: "#6B7280" }}
                    formatter={(value, name) => [
                      formatCompactUSD(Number(value ?? 0)),
                      String(name),
                    ]}
                  />
                  {showGbp && (
                    <Area
                      type="monotone"
                      dataKey="GBP"
                      stackId="1"
                      stroke={GROUP_COLORS.GBP}
                      fill={GROUP_COLORS.GBP}
                      fillOpacity={0.15}
                      strokeWidth={1.5}
                    />
                  )}
                  {showEur && (
                    <Area
                      type="monotone"
                      dataKey="EUR"
                      stackId="1"
                      stroke={GROUP_COLORS.EUR}
                      fill={GROUP_COLORS.EUR}
                      fillOpacity={0.15}
                      strokeWidth={1.5}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 text-[10px] text-[#6B7280] mt-1">
              {showGbp && (
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: GROUP_COLORS.GBP }} />
                  GBP
                </span>
              )}
              {showEur && (
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: GROUP_COLORS.EUR }} />
                  EUR
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

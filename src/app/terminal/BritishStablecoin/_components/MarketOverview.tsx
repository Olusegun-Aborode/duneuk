"use client";

import { useQuery } from "@tanstack/react-query";
import { formatGBP, formatUSD, formatNumber, timeAgo } from "@/lib/format";
import type {
  MarketOverview as MarketOverviewType,
  DuneApiResponse,
} from "@/lib/types";

function CounterSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-3 w-16 skeleton" />
      <div className="h-7 w-28 skeleton" />
    </div>
  );
}

export default function MarketOverview() {
  const { data, isLoading, error } = useQuery<
    DuneApiResponse<MarketOverviewType>
  >({
    queryKey: ["market-overview"],
    queryFn: async () => {
      const res = await fetch("/api/terminal/british-stablecoin/overview");
      if (!res.ok) throw new Error("Failed to fetch market overview");
      return res.json();
    },
  });

  // Live GBP/USD rate + token prices
  const { data: priceData } = useQuery<{
    data: Record<string, { price: number; chain: string }>;
    gbpUsdRate: number | null;
  }>({
    queryKey: ["prices"],
    queryFn: async () => {
      const res = await fetch("/api/terminal/british-stablecoin/prices");
      if (!res.ok) return { data: {}, gbpUsdRate: null };
      return res.json();
    },
  });

  const overview = data?.data?.[0];
  const FALLBACK_GBP_USD = 1.27;
  const gbpUsdRate = priceData?.gbpUsdRate ?? FALLBACK_GBP_USD;
  const isLiveRate = !!priceData?.gbpUsdRate;

  if (error) {
    return (
      <div className="tui-panel">
        <div className="tui-panel-header">
          <span className="tui-panel-title">Market Overview</span>
          <span className="text-[10px]" style={{ color: "var(--accent-red)" }}>ERR</span>
        </div>
        <div className="p-4 text-xs" style={{ color: "var(--accent-red)" }}>
          Failed to load market overview.
        </div>
      </div>
    );
  }

  const counters = [
    {
      label: "Total Supply (GBP)",
      value: overview ? formatGBP(overview.total_supply_gbp) : null,
      accent: true,
    },
    {
      label: "Total Supply (USD)",
      value: overview ? formatUSD(overview.total_supply_usd) : null,
      accent: false,
    },
    {
      label: "GBP/USD Rate",
      value: `$${gbpUsdRate.toFixed(4)}`,
      accent: false,
      sub: isLiveRate ? "[ECB]" : "[cached]",
    },
    {
      label: "Tokens / Chains",
      value: overview
        ? `${overview.num_tokens} / ${overview.total_chain_deployments}`
        : null,
      accent: false,
    },
  ];

  return (
    <div className="tui-panel">
      <div className="tui-panel-header">
        <span className="tui-panel-title">Market Overview</span>
        <div className="flex items-center gap-3">
          {data?.lastUpdated && (
            <span className="tui-panel-badge">
              Updated {timeAgo(new Date(data.lastUpdated))}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
            <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--accent-green)" }} />
            LIVE
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {counters.map((c, i) => (
          <div
            key={c.label}
            className={`p-4 lg:p-5 ${i < counters.length - 1 ? "border-r" : ""}`}
            style={{ borderColor: "var(--border)" }}
          >
            {isLoading ? (
              <CounterSkeleton />
            ) : (
              <>
                <p className="counter-label">{c.label}</p>
                <p
                  className="counter-value"
                  style={{ color: c.accent ? "var(--accent-green)" : "var(--foreground)" }}
                >
                  {c.value}
                </p>
                {c.sub && (
                  <span className="text-[9px]" style={{ color: "var(--accent-purple)" }}>{c.sub}</span>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

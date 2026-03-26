"use client";

import { useQuery } from "@tanstack/react-query";
import { formatGBP, formatEUR, formatUSD, formatNumber, timeAgo } from "@/lib/format";
import { useChartFilter, ChartFilter } from "@/components/ChartFilter";
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
  const chartFilter = useChartFilter();
  const showGbp = chartFilter.currency === "GBP" || chartFilter.currency === "ALL";
  const showEur = chartFilter.currency === "EUR" || chartFilter.currency === "ALL";

  const { data: gbpData, isLoading: gbpLoading, error: gbpError } = useQuery<
    DuneApiResponse<MarketOverviewType>
  >({
    queryKey: ["market-overview-gbp"],
    queryFn: async () => {
      const res = await fetch("/api/terminal/british-stablecoin/overview");
      if (!res.ok) throw new Error("Failed to fetch GBP overview");
      return res.json();
    },
    enabled: showGbp,
  });

  const { data: eurData, isLoading: eurLoading, error: eurError } = useQuery<
    DuneApiResponse<MarketOverviewType>
  >({
    queryKey: ["market-overview-eur"],
    queryFn: async () => {
      const res = await fetch("/api/terminal/euro-stablecoin/overview");
      if (!res.ok) throw new Error("Failed to fetch EUR overview");
      return res.json();
    },
    enabled: showEur,
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

  const isLoading = (showGbp && gbpLoading) || (showEur && eurLoading);
  const error = (showGbp && gbpError) || (showEur && eurError);
  const gbpOverview = gbpData?.data?.[0];
  const eurOverview = eurData?.data?.[0];
  const lastUpdated = gbpData?.lastUpdated || eurData?.lastUpdated;

  // Persist last live rate to localStorage so we never show a stale hardcoded value
  const GBP_USD_STORAGE_KEY = "duneuk_gbp_usd_rate";
  const liveRate = priceData?.gbpUsdRate ?? null;

  if (liveRate !== null && typeof window !== "undefined") {
    localStorage.setItem(GBP_USD_STORAGE_KEY, String(liveRate));
  }

  const cachedRate =
    typeof window !== "undefined"
      ? parseFloat(localStorage.getItem(GBP_USD_STORAGE_KEY) ?? "")
      : NaN;

  const gbpUsdRate = liveRate ?? (isNaN(cachedRate) ? null : cachedRate);
  const isLiveRate = liveRate !== null;

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

  // Build supply displays
  const totalUsdValue = () => {
    let total = 0;
    if (showGbp && gbpOverview) total += gbpOverview.total_supply_usd;
    if (showEur && eurOverview) total += eurOverview.total_supply_usd;
    return total;
  };

  const totalTokensChains = () => {
    let tokens = 0, chains = 0;
    if (showGbp && gbpOverview) { tokens += gbpOverview.num_tokens; chains += gbpOverview.total_chain_deployments; }
    if (showEur && eurOverview) { tokens += eurOverview.num_tokens; chains += eurOverview.total_chain_deployments; }
    return tokens > 0 ? `${tokens} / ${chains}` : null;
  };

  // In ALL mode: show combined USD as primary, with GBP+EUR breakdown below
  // In single currency mode: show native supply as primary, USD as secondary
  const counters = chartFilter.currency === "ALL" ? [
    {
      label: "Total Supply (USD)",
      value: totalUsdValue() > 0 ? formatUSD(totalUsdValue()) : null,
      accent: true,
      sub: gbpOverview && eurOverview
        ? `${formatGBP(gbpOverview.total_supply_gbp)} GBP + ${formatEUR(eurOverview.total_supply_gbp)} EUR`
        : undefined,
    },
    {
      label: "GBP Supply",
      value: gbpOverview ? formatGBP(gbpOverview.total_supply_gbp) : null,
      accent: false,
      sub: gbpOverview ? formatUSD(gbpOverview.total_supply_usd) : undefined,
    },
    {
      label: "EUR Supply",
      value: eurOverview ? formatEUR(eurOverview.total_supply_gbp) : null,
      accent: false,
      sub: eurOverview ? formatUSD(eurOverview.total_supply_usd) : undefined,
    },
    {
      label: "Tokens / Chains",
      value: totalTokensChains(),
      accent: false,
    },
  ] : [
    {
      label: `Total Supply (${chartFilter.currency})`,
      value: chartFilter.currency === "GBP" && gbpOverview
        ? formatGBP(gbpOverview.total_supply_gbp)
        : chartFilter.currency === "EUR" && eurOverview
          ? formatEUR(eurOverview.total_supply_gbp)
          : null,
      accent: true,
    },
    {
      label: "Total Supply (USD)",
      value: totalUsdValue() > 0 ? formatUSD(totalUsdValue()) : null,
      accent: false,
    },
    {
      label: `${chartFilter.currency}/USD Rate`,
      value: gbpUsdRate !== null ? `$${gbpUsdRate.toFixed(4)}` : "\u2014",
      accent: false,
      sub: gbpUsdRate !== null ? (isLiveRate ? "[ECB]" : "[cached]") : undefined,
    },
    {
      label: "Tokens / Chains",
      value: totalTokensChains(),
      accent: false,
    },
  ];

  return (
    <div className="tui-panel">
      <div className="tui-panel-header">
        <span className="tui-panel-title">Market Overview</span>
        <div className="flex items-center gap-3">
          <ChartFilter
            currency={chartFilter.currency}
            setCurrency={chartFilter.setCurrency}
            tokens={chartFilter.tokens}
            selectedTokens={chartFilter.selectedTokens}
            setSelectedTokens={chartFilter.setSelectedTokens}
          />
          {lastUpdated && (
            <span className="tui-panel-badge">
              Updated {timeAgo(new Date(lastUpdated))}
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

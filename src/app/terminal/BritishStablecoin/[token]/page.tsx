"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
  BarChart, Bar,
} from "recharts";
import { TOKEN_META, DEX_COLORS } from "@/lib/constants";
import {
  formatGBP, formatNumber, formatPercent, formatCompactUSD,
  formatAddress, formatUSD,
} from "@/lib/format";
import ChartWatermark from "../_components/ChartWatermark";
import ScreenshotButton from "../_components/ScreenshotButton";
import TimeRangeSelector, { type TimeRange, getCutoffDate } from "../_components/TimeRangeSelector";
import type {
  SupplyHistoryEntry, TransferVolumeEntry, ChainDistributionEntry,
  TopHolderEntry, DexPoolEntry, DexVolumeEntry, DailyActiveUsersEntry,
  LeaderboardEntry, DuneApiResponse,
} from "@/lib/types";

const CHAIN_COLORS: Record<string, string> = {
  ethereum: "#627EEA", base: "#0052FF", polygon: "#8247E5",
  celo: "#35D07F", gnosis: "#3E6957", bnb: "#F0B90B",
  arbitrum: "#28A0F0", optimism: "#FF0420", avalanche_c: "#E84142",
  solana: "#9945FF",
};

function formatDateAxis(dateStr: string) {
  const d = new Date(dateStr);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function formatWeekAxis(dateStr: string) {
  const d = new Date(dateStr);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export default function TokenDetailPage() {
  const params = useParams();
  const token = params.token as string;
  const meta = TOKEN_META[token];
  const color = meta?.color ?? "#E0E0E0";

  const [supplyRange, setSupplyRange] = useState<TimeRange>("180d");
  const [dauRange, setDauRange] = useState<TimeRange>("90d");
  const [dexRange, setDexRange] = useState<TimeRange>("90d");

  // Leaderboard (for stats)
  const { data: leaderboardData } = useQuery<DuneApiResponse<LeaderboardEntry>>({
    queryKey: ["supply-leaderboard"],
    queryFn: async () => {
      const res = await fetch("/api/terminal/british-stablecoin/leaderboard");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  // Supply history
  const { data: supplyData } = useQuery<DuneApiResponse<SupplyHistoryEntry>>({
    queryKey: ["supply-history"],
    queryFn: async () => {
      const res = await fetch("/api/terminal/british-stablecoin/supply-history");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  // Transfer volume
  const { data: volumeData } = useQuery<DuneApiResponse<TransferVolumeEntry>>({
    queryKey: ["transfer-volume"],
    queryFn: async () => {
      const res = await fetch("/api/terminal/british-stablecoin/transfer-volume");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  // Chain distribution
  const { data: chainData } = useQuery<DuneApiResponse<ChainDistributionEntry>>({
    queryKey: ["chain-distribution"],
    queryFn: async () => {
      const res = await fetch("/api/terminal/british-stablecoin/chain-distribution");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  // Top holders
  const { data: holderData } = useQuery<DuneApiResponse<TopHolderEntry>>({
    queryKey: ["top-holders"],
    queryFn: async () => {
      const res = await fetch("/api/terminal/british-stablecoin/top-holders");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  // DEX pools
  const { data: poolData } = useQuery<DuneApiResponse<DexPoolEntry>>({
    queryKey: ["dex-pools"],
    queryFn: async () => {
      const res = await fetch("/api/terminal/british-stablecoin/dex-pools");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  // DEX volume (weekly)
  const { data: dexVolumeData } = useQuery<DuneApiResponse<DexVolumeEntry>>({
    queryKey: ["dex-volume"],
    queryFn: async () => {
      const res = await fetch("/api/terminal/british-stablecoin/dex-volume");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  // Daily active users
  const { data: dauData } = useQuery<DuneApiResponse<DailyActiveUsersEntry>>({
    queryKey: ["daily-active-users"],
    queryFn: async () => {
      const res = await fetch("/api/terminal/british-stablecoin/active-users");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  // Leaderboard entry for this token
  const stats = useMemo(() => {
    if (!leaderboardData?.data) return null;
    return leaderboardData.data.find((r) => r.token === token) ?? null;
  }, [leaderboardData, token]);

  const rank = useMemo(() => {
    if (!leaderboardData?.data) return 0;
    const idx = leaderboardData.data.findIndex((r) => r.token === token);
    return idx >= 0 ? idx + 1 : 0;
  }, [leaderboardData, token]);

  // Supply chart
  const supplyChart = useMemo(() => {
    if (!supplyData?.data) return [];
    const cutoff = getCutoffDate(supplyRange);
    return supplyData.data
      .filter((r) => r.token === token && (!cutoff || new Date(r.day) >= cutoff))
      .sort((a, b) => a.day.localeCompare(b.day));
  }, [supplyData, token, supplyRange]);

  // DAU chart
  const dauChart = useMemo(() => {
    if (!dauData?.data) return [];
    const cutoff = getCutoffDate(dauRange);
    return dauData.data
      .filter((r) => r.token === token && (!cutoff || new Date(r.day) >= cutoff))
      .sort((a, b) => a.day.localeCompare(b.day));
  }, [dauData, token, dauRange]);

  // DEX volume chart (weekly, by DEX)
  const dexChart = useMemo(() => {
    if (!dexVolumeData?.data) return [];
    const cutoff = getCutoffDate(dexRange);
    const filtered = dexVolumeData.data.filter(
      (r) => r.token === token && (!cutoff || new Date(r.week) >= cutoff)
    );
    const byWeek: Record<string, Record<string, number>> = {};
    for (const row of filtered) {
      const week = row.week.slice(0, 10);
      if (!byWeek[week]) byWeek[week] = {};
      byWeek[week][row.dex] = (byWeek[week][row.dex] ?? 0) + row.volume_usd;
    }
    return Object.entries(byWeek)
      .map(([week, values]) => ({ week, ...values }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }, [dexVolumeData, token, dexRange]);

  const dexNames = useMemo(() => {
    if (!dexVolumeData?.data) return [];
    return [...new Set(dexVolumeData.data.filter((r) => r.token === token).map((r) => r.dex))];
  }, [dexVolumeData, token]);

  const volumes = useMemo(() => {
    if (!volumeData?.data) return [];
    return volumeData.data.filter((r) => r.token === token);
  }, [volumeData, token]);

  const chains = useMemo(() => {
    if (!chainData?.data) return [];
    return chainData.data.filter((r) => r.token === token);
  }, [chainData, token]);

  const holders = useMemo(() => {
    if (!holderData?.data) return [];
    return holderData.data.filter((r) => r.token === token);
  }, [holderData, token]);

  const pools = useMemo(() => {
    if (!poolData?.data) return [];
    return poolData.data.filter((r) => r.gbp_token === token);
  }, [poolData, token]);

  // Holder concentration — top 5 as % of supply
  const holderConcentration = useMemo(() => {
    const top5 = holders.slice(0, 5);
    return top5.reduce((sum, h) => sum + (h.pct_of_supply ?? 0), 0);
  }, [holders]);

  // Holder distribution pie data
  const HOLDER_COLORS = ["#00FF88", "#5B7FFF", "#FF6B35", "#B44AFF", "#00D4FF", "#FFD700", "#FF4444", "#9945FF", "#35D07F", "#F0B90B"];
  const pieHolders = useMemo(() => {
    if (holders.length === 0) return [];
    const top = holders.slice(0, 5);
    const topTotal = top.reduce((s, h) => s + (h.balance_gbp ?? 0), 0);
    const allTotal = holders.reduce((s, h) => s + (h.balance_gbp ?? 0), 0);
    const otherTotal = allTotal - topTotal;
    return [
      ...top.map((h, i) => ({ name: formatAddress(h.address), value: h.balance_gbp, color: HOLDER_COLORS[i] })),
      ...(otherTotal > 0 ? [{ name: `Other (${holders.length - 5})`, value: otherTotal, color: "#374151" }] : []),
    ];
  }, [holders]);

  // Total volume across all chains
  const totalVolume = useMemo(() => {
    return volumes.reduce((sum, v) => sum + (v.volume_gbp ?? 0), 0);
  }, [volumes]);

  const totalTransfers = useMemo(() => {
    return volumes.reduce((sum, v) => sum + (v.num_transfers ?? 0), 0);
  }, [volumes]);

  if (!meta) {
    return (
      <div className="space-y-4">
        <Link href="/terminal/BritishStablecoin" className="text-xs" style={{ color: "var(--accent-green)" }}>
          &larr; Back to terminal
        </Link>
        <div className="tui-panel p-8 text-center">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Token &quot;{token}&quot; not found</p>
        </div>
      </div>
    );
  }

  return (
    <div id="token-detail" className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link href="/terminal/BritishStablecoin" className="text-xs" style={{ color: "var(--accent-green)" }}>
            &larr; Back
          </Link>
          <span className="token-dot" style={{ backgroundColor: color, width: 14, height: 14 }} />
          <div>
            <h1 className="text-lg font-bold" style={{ color }}>{token}</h1>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              Issued by {meta.issuer}
            </p>
          </div>
        </div>
        <ScreenshotButton targetId="token-detail" />
      </div>

      {/* Key stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="tui-panel p-3">
          <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Supply</p>
          <p className="text-base font-bold" style={{ color }}>{stats ? formatGBP(stats.supply_gbp) : "—"}</p>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{stats ? formatUSD(stats.supply_usd) : ""}</p>
        </div>
        <div className="tui-panel p-3">
          <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Market Share</p>
          <p className="text-base font-bold" style={{ color }}>{stats ? formatPercent(stats.market_share_pct) : "—"}</p>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{rank ? `#${rank} of 6` : ""}</p>
        </div>
        <div className="tui-panel p-3">
          <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>30d Volume</p>
          <p className="text-base font-bold" style={{ color }}>{totalVolume ? formatGBP(totalVolume) : "—"}</p>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{totalTransfers ? `${formatNumber(totalTransfers)} transfers` : ""}</p>
        </div>
        <div className="tui-panel p-3">
          <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Chains</p>
          <p className="text-base font-bold" style={{ color }}>{stats ? formatNumber(stats.num_chains) : "—"}</p>
          <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>{chains.map((c) => c.blockchain).join(", ")}</p>
        </div>
      </div>

      {/* Token profile */}
      <div className="tui-panel">
        <div className="tui-panel-header">
          <span className="tui-panel-title">Token Profile</span>
          <span className="tui-panel-badge">{meta.regulation}</span>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Description</p>
              <p className="text-xs" style={{ color: "var(--foreground)" }}>{meta.description}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Backing</p>
              <p className="text-xs" style={{ color: "var(--foreground)" }}>{meta.backing}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>CEX Listings</p>
              {meta.cex.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {meta.cex.map((ex) => (
                    <span key={ex} className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ color: "#FF6B35", border: "1px solid #FF6B35", background: "rgba(255,107,53,0.08)" }}>
                      {ex}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs" style={{ color: "#FF4444" }}>No CEX listings — DEX only</p>
              )}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Holder Concentration</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="tui-progress flex-1">
                  <div className="tui-progress-fill" style={{ width: `${Math.min(holderConcentration, 100)}%`, backgroundColor: color }} />
                </div>
                <span className="text-xs font-bold" style={{ color }}>{formatPercent(holderConcentration)}</span>
              </div>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>Top 5 holders as % of supply</p>
            </div>
          </div>
        </div>
      </div>

      {/* Supply chart */}
      <div className="tui-panel">
        <div className="tui-panel-header">
          <span className="tui-panel-title">Supply History</span>
          <div className="flex items-center gap-2">
            <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>{supplyChart.length} pts</span>
            <TimeRangeSelector value={supplyRange} onChange={setSupplyRange} />
          </div>
        </div>
        {supplyChart.length > 0 ? (
          <div className="p-4 relative">
            <ChartWatermark />
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={supplyChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="day" tickFormatter={formatDateAxis} tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v: number) => formatGBP(v)} tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "4px", fontSize: 11, fontFamily: "monospace" }}
                  formatter={(value) => [formatGBP(Number(value ?? 0))]}
                />
                <Area type="monotone" dataKey="supply_gbp" stroke={color} fill={color} fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="p-6 text-center text-[11px]" style={{ color: "var(--text-muted)" }}>No supply history data available</div>
        )}
      </div>

      {/* DAU chart — full width */}
      <div className="tui-panel">
        <div className="tui-panel-header">
          <span className="tui-panel-title">Daily Active Users</span>
          <TimeRangeSelector value={dauRange} onChange={setDauRange} />
        </div>
        {dauChart.length > 0 ? (
          <div className="p-4 relative">
            <ChartWatermark />
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={dauChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="day" tickFormatter={formatDateAxis} tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "4px", fontSize: 11, fontFamily: "monospace" }}
                  formatter={(value) => [formatNumber(Number(value ?? 0)), "Users"]}
                />
                <Area type="monotone" dataKey="active_addresses" stroke={color} fill={color} fillOpacity={0.08} strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="p-6 text-center text-[11px]" style={{ color: "var(--text-muted)" }}>No active user data available</div>
        )}
      </div>

      {/* Two pie charts side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chain distribution pie */}
        <div className="tui-panel">
          <div className="tui-panel-header">
            <span className="tui-panel-title">Chain Distribution</span>
            <span className="tui-panel-badge">{chains.length} chains</span>
          </div>
          {chains.length > 0 ? (
            <div className="p-4 relative">
              <ChartWatermark />
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={chains.map((c) => ({ name: c.blockchain, value: c.supply_gbp }))} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={75} strokeWidth={1} stroke="rgba(0,0,0,0.3)">
                    {chains.map((c) => (
                      <Cell key={c.blockchain} fill={CHAIN_COLORS[c.blockchain] ?? "#6B7280"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "4px", fontSize: 11, fontFamily: "monospace" }} formatter={(value) => [formatGBP(Number(value ?? 0))]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 justify-center">
                {chains.map((c) => (
                  <span key={c.blockchain} className="flex items-center text-[10px]" style={{ color: "var(--text-muted)" }}>
                    <span className="token-dot" style={{ backgroundColor: CHAIN_COLORS[c.blockchain] ?? "#6B7280" }} />
                    <span className="capitalize">{c.blockchain}</span>
                    <span className="ml-1">{formatPercent(c.share_pct)}</span>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-[11px]" style={{ color: "var(--text-muted)" }}>No chain distribution data available</div>
          )}
        </div>

        {/* Holder distribution pie */}
        <div className="tui-panel">
          <div className="tui-panel-header">
            <span className="tui-panel-title">Holder Distribution</span>
            <span className="tui-panel-badge">{holders.length > 0 ? `Top 5 of ${holders.length}` : "—"}</span>
          </div>
          {pieHolders.length > 0 ? (
            <div className="p-4 relative">
              <ChartWatermark />
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieHolders} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={75} strokeWidth={1} stroke="rgba(0,0,0,0.3)">
                    {pieHolders.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "4px", fontSize: 11, fontFamily: "monospace" }} formatter={(value) => [formatGBP(Number(value ?? 0))]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 justify-center">
                {(() => {
                  const allTotal = holders.reduce((s, h) => s + (h.balance_gbp ?? 0), 0);
                  return pieHolders.map((entry, i) => (
                    <span key={i} className="flex items-center text-[10px]" style={{ color: "var(--text-muted)" }}>
                      <span className="token-dot" style={{ backgroundColor: entry.color }} />
                      <span className="font-mono">{entry.name}</span>
                      <span className="ml-1">{formatPercent(allTotal > 0 ? (entry.value / allTotal) * 100 : 0)}</span>
                    </span>
                  ));
                })()}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-[11px]" style={{ color: "var(--text-muted)" }}>No holder data available</div>
          )}
        </div>
      </div>

      {/* DEX volume chart (by DEX) */}
      <div className="tui-panel">
        <div className="tui-panel-header">
          <span className="tui-panel-title">DEX Volume</span>
          <div className="flex items-center gap-2">
            <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>Weekly</span>
            <TimeRangeSelector value={dexRange} onChange={setDexRange} />
          </div>
        </div>
        {dexChart.length > 0 ? (
          <div className="p-4">
            <div className="flex flex-wrap gap-3 mb-3">
              {dexNames.map((dex) => (
                <span key={dex} className="flex items-center text-[10px]" style={{ color: "var(--text-muted)" }}>
                  <span className="token-dot" style={{ backgroundColor: DEX_COLORS[dex] ?? "#6B7280" }} />
                  <span className="capitalize">{dex}</span>
                </span>
              ))}
            </div>
            <div className="relative">
              <ChartWatermark />
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dexChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="week" tickFormatter={formatWeekAxis} tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v: number) => formatCompactUSD(v)} tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "4px", fontSize: 11, fontFamily: "monospace" }}
                    formatter={(value, name) => [formatCompactUSD(Number(value ?? 0)), String(name)]}
                  />
                  {dexNames.map((dex) => (
                    <Bar key={dex} dataKey={dex} stackId="1" fill={DEX_COLORS[dex] ?? "#6B7280"} fillOpacity={0.85} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-[11px]" style={{ color: "var(--text-muted)" }}>No DEX trading activity detected</div>
        )}
      </div>

      {/* Transfer volume table */}
      <div className="tui-panel">
        <div className="tui-panel-header">
          <span className="tui-panel-title">Transfer Activity</span>
          <span className="tui-panel-badge">30 days</span>
        </div>
        {volumes.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Chain</th>
                <th className="text-right">Transfers</th>
                <th className="text-right">Volume (GBP)</th>
                <th className="text-right">Senders</th>
                <th className="text-right">Receivers</th>
              </tr>
            </thead>
            <tbody>
              {volumes.map((v, i) => (
                <tr key={`${v.blockchain}-${i}`}>
                  <td className="capitalize">{v.blockchain}</td>
                  <td className="text-right">{formatNumber(v.num_transfers)}</td>
                  <td className="text-right font-bold">{formatGBP(v.volume_gbp)}</td>
                  <td className="text-right" style={{ color: "var(--text-muted)" }}>{formatNumber(v.unique_senders)}</td>
                  <td className="text-right" style={{ color: "var(--text-muted)" }}>{formatNumber(v.unique_receivers)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-6 text-center text-[11px]" style={{ color: "var(--text-muted)" }}>No transfer activity in last 30 days</div>
        )}
      </div>

      {/* DEX pools */}
      <div className="tui-panel">
        <div className="tui-panel-header">
          <span className="tui-panel-title">DEX Trading Pairs</span>
          <span className="tui-panel-badge">{pools.length > 0 ? `${pools.length} pairs` : "—"}</span>
        </div>
        {pools.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>DEX</th>
                <th>Chain</th>
                <th>Pair</th>
                <th className="text-right">Volume (30d)</th>
                <th className="text-right">Trades</th>
              </tr>
            </thead>
            <tbody>
              {pools.map((p, i) => (
                <tr key={`${p.dex}-${p.pair_token}-${i}`}>
                  <td className="capitalize font-bold">{p.dex}</td>
                  <td className="capitalize">{p.blockchain}</td>
                  <td>
                    <span style={{ color }} className="font-bold">{p.gbp_token}</span>
                    <span style={{ color: "var(--text-muted)" }}> / </span>
                    <span>{p.pair_token}</span>
                  </td>
                  <td className="text-right font-bold">{formatCompactUSD(p.volume_usd_30d)}</td>
                  <td className="text-right" style={{ color: "var(--text-muted)" }}>{formatNumber(p.trade_count_30d)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-6 text-center text-[11px]" style={{ color: "var(--text-muted)" }}>No active DEX trading pairs</div>
        )}
      </div>

      {/* Top holders */}
      <div className="tui-panel">
        <div className="tui-panel-header">
          <span className="tui-panel-title">Top Holders</span>
          <span className="tui-panel-badge">{holders.length > 0 ? `${holders.length} addresses` : "—"}</span>
        </div>
        {holders.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Chain</th>
                <th>Address</th>
                <th className="text-right">Balance</th>
                <th className="text-right">% Supply</th>
                <th className="text-right w-20">Share</th>
              </tr>
            </thead>
            <tbody>
              {holders.slice(0, 15).map((h, i) => (
                <tr key={`${h.address}-${i}`}>
                  <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                  <td className="capitalize">{h.blockchain}</td>
                  <td className="text-xs" style={{ color: "var(--text-muted)" }}>{formatAddress(h.address)}</td>
                  <td className="text-right font-bold">{formatGBP(h.balance_gbp)}</td>
                  <td className="text-right" style={{ color: "var(--text-muted)" }}>{formatPercent(h.pct_of_supply)}</td>
                  <td className="text-right w-20">
                    <div className="tui-progress">
                      <div className="tui-progress-fill" style={{ width: `${Math.min(h.pct_of_supply, 100)}%`, backgroundColor: color }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-6 text-center text-[11px]" style={{ color: "var(--text-muted)" }}>No holder data available</div>
        )}
      </div>
    </div>
  );
}

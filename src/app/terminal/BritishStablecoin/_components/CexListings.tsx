"use client";

import { TOKEN_META } from "@/lib/constants";
import { TokenLogo } from "@/components/TokenLogo";

interface CexListing {
  token: string;
  exchange: string;
  pairs: string;
  status: "active" | "limited" | "historical" | "none";
  notes: string;
}

const CEX_DATA: CexListing[] = [
  { token: "tGBP", exchange: "Kraken", pairs: "USD, EUR, GBP, ETH, USDT, CAD", status: "active", notes: "Listed Nov 2025. FCA-registered issuer (BCP Technologies)." },
  { token: "VGBP", exchange: "Coinbase", pairs: "USD, EUR, CAD", status: "active", notes: "Licensed under Liechtenstein Blockchain Act (VNX)." },
  { token: "GBPT", exchange: "CEX.IO", pairs: "GBP, USD", status: "active", notes: "Fireblocks integrated (1,300+ institutions). KPMG audited." },
  { token: "GBPT", exchange: "Gate.io", pairs: "ETH, USDT, BTC", status: "historical", notes: "Historical listing. Keyrock as market maker." },
  { token: "eGBP", exchange: "Mercado Bitcoin", pairs: "BRL", status: "active", notes: "Latin America's largest digital asset platform. Since Apr 2024." },
  { token: "GBPe", exchange: "LBank", pairs: "USDT", status: "limited", notes: "Low activity. Primarily traded on Gnosis DEXes." },
  { token: "GBPm", exchange: "—", pairs: "—", status: "none", notes: "No CEX listings. Trading on Uniswap V3 (Celo) and Mento." },
];

const STATUS_STYLE: Record<string, { color: string; label: string }> = {
  active: { color: "#FF6B35", label: "ACTIVE" },
  limited: { color: "#F0B90B", label: "LIMITED" },
  historical: { color: "#6B7280", label: "HIST" },
  none: { color: "#FF4444", label: "NONE" },
};

export default function CexListings() {
  return (
    <div className="tui-panel">
      <div className="tui-panel-header">
        <span className="tui-panel-title">CEX Listings Report</span>
        <span className="tui-panel-badge">6 tokens · {new Date().toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</span>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Token</th>
            <th>Exchange</th>
            <th>Pairs</th>
            <th>Status</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {CEX_DATA.map((row, i) => {
            const meta = TOKEN_META[row.token];
            const status = STATUS_STYLE[row.status];
            return (
              <tr key={`${row.token}-${row.exchange}-${i}`}>
                <td>
                  <span className="flex items-center">
                    <TokenLogo symbol={row.token} size={16} />
                    <span className="font-bold" style={{ color: meta?.color ?? "#E0E0E0" }}>
                      {row.token}
                    </span>
                  </span>
                </td>
                <td className="font-bold" style={{ color: "var(--foreground)" }}>{row.exchange}</td>
                <td style={{ color: "var(--text-muted)" }}>{row.pairs}</td>
                <td>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      color: status.color,
                      border: `1px solid ${status.color}`,
                      background: `${status.color}10`,
                    }}
                  >
                    {status.label}
                  </span>
                </td>
                <td className="text-[11px]" style={{ color: "var(--text-muted)" }}>{row.notes}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
        <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
          Only tGBP (Kraken) and VGBP (Coinbase) have top-tier global CEX listings.
          None of the six are listed on Binance, Bybit, or OKX.
          Data sourced from exchange websites and CoinGecko as of March 2026.
        </p>
      </div>
    </div>
  );
}

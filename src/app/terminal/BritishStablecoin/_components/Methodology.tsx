"use client";

const SECTIONS = [
  {
    title: "Token Coverage",
    content: `This terminal tracks stablecoins across two currency groups:

GBP (6 tokens): tGBP (TrustToken), GBPm (Mento), GBPe (Monerium), GBPT (Poundtoken), VGBP (VNX), eGBP (Aryze). Tracked across Ethereum, Base, Polygon, Celo, Gnosis, BNB Chain, Avalanche, Solana, and other networks.

EUR (17+ tokens): EURC (Circle), EURCV (SG-Forge), EURI (Banking Circle), AEUR (Anchored Coins), EURe (Monerium), EURR (StablR), EURS (Stasis), EUROP (Schuman), EURm (Mento), EURA (Angle), VEUR (VNX), PAR (Mimo), EURAU (AllUnity), EURT (Tether, discontinued), and others. Tracked across 28+ chains.`,
  },
  {
    title: "Data Sources",
    content: `Supply data uses a hybrid approach for accuracy and coverage:

DefiLlama Stablecoins API — Primary source for EUR stablecoin supply, leaderboard, chain distribution, supply history, and market share comparison. Provides consistent, deduplicated data across all EUR tokens and chains with daily historical granularity. Free, no API key required.

Dune Analytics — Primary source for GBP stablecoin supply (via custom materialized views from @jreytgbp and spellbook tables). Also the primary source for on-chain activity data across both currencies: DEX trades (dex.trades), lending (lending.supply, lending.borrow), transfer volume (erc20_{chain}.evt_Transfer), daily active users, and top holder analysis.

Allium API — Supplements Dune for Solana chain coverage (VGBP, tGBP on Solana), providing token supply, holder counts, and price data.

Data source is tagged [Dune], [DefiLlama], or [Allium] throughout the UI.`,
  },
  {
    title: "Supply Calculation",
    content: `GBP tokens: Supply reconstructed from mint/burn events. tGBP uses pre-computed tables from the jreytgbp Dune dataset. GBPm uses raw Transfer events from celo.logs. GBPT and GBPe use decoded Mint/Burn events. VGBP uses stablecoins_evm.balances spellbook + Allium for Solana.

EUR tokens: Supply sourced from DefiLlama's stablecoins_multichain.balances, which aggregates on-chain data across all supported chains. This provides consistent cross-chain supply tracking without the need for per-token custom queries.`,
  },
  {
    title: "DEX & Market Data",
    content: `DEX volume and trading pair data comes from the dex.trades Spellbook table on Dune, which aggregates decoded swap events across Uniswap, Curve, Aerodrome, PancakeSwap, Balancer, Trader Joe, and 20+ other DEXes. Volume is tracked per-token per-DEX per-chain with weekly aggregation. The LP Pools view shows individual trading pair activity over 30 days with a minimum 5-trade threshold.`,
  },
  {
    title: "Lending & Borrowing",
    content: `Lending utilization tracked via Dune's lending.supply and lending.borrow Spellbook tables, joined by token contract address across all tracked chains. EUR stablecoins (particularly EURC) have active lending markets on Aave and Morpho. GBP stablecoin lending activity remains minimal across major protocols, reflecting a significant infrastructure gap.`,
  },
  {
    title: "Market Share Comparison",
    content: `Market share comparison uses DefiLlama's stablecoins API to compare total supply across GBP, EUR, and USD stablecoin groups. This provides an accurate, consistent cross-currency comparison using the same data methodology. EUR/USD and GBP/USD rates are sourced from the ECB via the Frankfurter API and EURC market price respectively.`,
  },
  {
    title: "Caching & Freshness",
    content: `DefiLlama data: 30-minute server-side cache. Dune data: 6-hour cache TTL. Allium data: 6-hour cache. Time-series data uses DATE_TRUNC for weekly/daily bucketing. Supply snapshots use the most recent available day (typically 2 days lag from the spellbook).`,
  },
  {
    title: "Per-Chart Filtering",
    content: `Each chart has its own independent currency filter (GBP / EUR / ALL) and token selector. In ALL mode, supply values are displayed in USD as a common denominator. In single-currency mode, native currency formatting (£ / €) is used. Filters are local to each chart — changing one doesn't affect others.`,
  },
  {
    title: "Limitations",
    content: `This terminal tracks on-chain activity only. Off-chain / CEX trading volumes, OTC desk flows, and custodial balances are not captured. Wrapped or bridged token variants may be tracked separately. Currency conversions use approximate market rates. Some smaller EUR tokens have limited DEX/lending activity. EURT (Tether Euro) was discontinued in November 2025 — historical data is retained.`,
  },
];

export default function Methodology() {
  return (
    <div className="tui-panel">
      <div className="tui-panel-header">
        <span className="tui-panel-title">Methodology</span>
        <span className="tui-panel-badge">Data Sources & Approach</span>
      </div>

      <div className="p-4 lg:p-5 space-y-4">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <h4 className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--accent-red)" }}>
              {section.title}
            </h4>
            <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: "var(--text-muted)" }}>
              {section.content}
            </p>
          </div>
        ))}

        <div className="border-t pt-3 mt-3" style={{ borderColor: "var(--border)" }}>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            Built by DuneUK &middot; Data: DefiLlama + Dune Analytics + Allium &middot;
            Last methodology update: March 2026
          </p>
        </div>
      </div>
    </div>
  );
}

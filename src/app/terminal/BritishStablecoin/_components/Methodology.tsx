"use client";

const SECTIONS = [
  {
    title: "Token Coverage",
    content: `This terminal tracks stablecoins across two currency groups:

GBP (6 tokens): tGBP (BCP Technologies Ltd), GBPm (Mento), GBPe (Monerium), GBPT (Poundtoken), VGBP (VNX), eGBP (Aryze). Tracked across Ethereum, Base, Polygon, Celo, Gnosis, BNB Chain, Avalanche, Solana, and other networks.

EUR (17 tokens): EURC (Circle), EURCV (SG-Forge), EURI (Banking Circle), AEUR (Anchored Coins), EURe (Monerium), EURR (StablR), EURS (Stasis), EUROP (Schuman Financial), EURA (Angle Protocol), VEUR (VNX), EURAU (AllUnity), EURT (Tether, discontinued), EUROe (Membrane Finance), sEUR (Synthetix), EUR0 (Usual), EURQ (Quantoz), dEURO (DecentralisedEURO), jEUR (Jarvis Network).`,
  },
  {
    title: "Data Sources",
    content: `Dune Analytics is the primary data source for both GBP and EUR. DefiLlama and Allium are used as supplements where Dune coverage is limited (e.g. some Solana data) and to verify accuracy.

Dune Analytics — Primary source for: GBP supply (custom materialised views from @jreytgbp and spellbook tables), EUR supply (stablecoins_multichain.balances spellbook), DEX trades (dex.trades), lending (lending.supply / lending.borrow), transfer volume (erc20_{chain}.evt_Transfer), daily active users, top holders.

Allium API — Supplements Dune for Solana chain coverage (VGBP, tGBP on Solana), providing token supply and price data not available in the spellbook.

DefiLlama Stablecoins API — Reference / verification layer. Used to cross-check Dune-derived totals and to fill gaps where Dune doesn't yet cover a token.

Data source is tagged [Dune], [DefiLlama], or [Allium] throughout the UI.`,
  },
  {
    title: "Supply Calculation",
    content: `GBP tokens: Supply reconstructed from mint/burn events. tGBP uses pre-computed tables from the jreytgbp Dune dataset. GBPm uses raw Transfer events from celo.logs. GBPT and GBPe use decoded Mint/Burn events. VGBP uses stablecoins_evm.balances spellbook + Allium for Solana.

EUR tokens: Supply sourced from Dune's stablecoins_multichain.balances spellbook, aggregated per (token, chain, day). The most recent fully-populated day is used (typically 2 days behind realtime due to spellbook lag).`,
  },
  {
    title: "Treasury Exclusion (Circulating vs Total Supply)",
    content: `By default, the spellbook reports the on-chain totalSupply() of each contract, which includes tokens minted but held by the issuer themselves in their own treasury wallet. For tokens where the issuer parks large unissued reserves on-chain, this inflates the reported supply versus what's actually in circulation.

This dashboard subtracts known issuer treasury balances to report circulating supply rather than gross totalSupply. Treasury balances are computed live from raw transfer events (no staleness).

Currently excluded:
  • EURT — Tether Treasury (0x5754...b949). Without this exclusion, EURT reports ~€50M instead of its actual ~€3M circulating.
  • EURS — Stasis Treasury (0x1bee...5ac9). Without this exclusion, EURS reports ~€126M instead of its actual ~€8M circulating.

Other tokens reviewed (no treasury exclusion needed): EURC (Circle uses CCTP — minimal on-chain treasury), EURI (top holder is Binance, not Banking Circle), EURCV (top holder is Morpho lending market, not SG-Forge), EURe (top holder is CoW Protocol settlement contract).

Note: this is a deviation from the standard Dune convention which reports raw spellbook totals. Numbers on this dashboard will not exactly match other Dune-based EUR stablecoin dashboards for tokens where treasury exclusion applies. Last verified: April 2026.`,
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
    content: `Market share comparison uses Dune's stablecoins_multichain.balances spellbook to compare total supply across GBP, EUR, and USD stablecoin groups (filtered to USDT, USDC, DAI, FDUSD, TUSD on the USD side). EUR/USD rate is derived from EURC's price on Ethereum via prices.usd_latest. GBP/USD rate is sourced from the ECB via the Frankfurter API.`,
  },
  {
    title: "Caching & Freshness",
    content: `Dune data: 6-hour cache TTL. Allium data: 6-hour cache. DefiLlama data (when used as fallback): 30-minute server-side cache. Time-series data uses DATE_TRUNC for weekly/daily bucketing. Supply snapshots use the most recent available day (typically 2 days lag from the spellbook).`,
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
            Built by DuneUK &middot; Data: Dune Analytics + Allium + DefiLlama &middot;
            Last methodology update: April 2026
          </p>
        </div>
      </div>
    </div>
  );
}

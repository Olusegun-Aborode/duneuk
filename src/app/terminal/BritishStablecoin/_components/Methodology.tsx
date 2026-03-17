"use client";

const SECTIONS = [
  {
    title: "Token Coverage",
    content: `Six GBP-denominated stablecoins are tracked: tGBP (TrustToken), GBPm (Mento/Celo), GBPe (Monerium), GBPT (Poundtoken), VGBP (VNX), and eGBP (Aryze). Each token is identified by its contract address on its respective chain(s). Tokens are tracked across Ethereum, Base, Polygon, Celo, Gnosis, BNB Chain, Arbitrum, Optimism, Avalanche, Solana, and other supported networks.`,
  },
  {
    title: "Data Sources",
    content: `Primary data comes from Dune Analytics [Dune] using both Spellbook tables (dex.trades, lending.supply, lending.borrow, stablecoins_evm.balances) and decoded contract tables (Poundtoken, Monerium events). Raw logs (celo.logs) are used for GBPm where decoded tables are unavailable. ERC-20 transfer events are used for eGBP on Polygon. Allium API [Allium] supplements Dune for Solana chain coverage (VGBP and tGBP on Solana), providing token supply, holder counts, and price data. Data source is tagged [Dune] or [Allium] throughout the UI.`,
  },
  {
    title: "Lending & Borrowing",
    content: `Lending utilization is tracked using the lending.supply and lending.borrow Spellbook tables, joined by token contract address (not symbol) across all tracked chains. This approach captures activity even when token symbols differ across protocols. GBP stablecoin lending activity is currently minimal-to-zero across major protocols (Aave, Compound, Morpho), reflecting a significant infrastructure gap.`,
  },
  {
    title: "Supply Calculation",
    content: `Token supply is calculated by reconstructing mint/burn balances from on-chain events. For tGBP, pre-computed tables from the jreytgbp dataset are used. For GBPm, raw Transfer events from celo.logs are decoded using the ERC-20 topic0 hash, with uint256 values cast to DOUBLE before arithmetic to prevent overflow. GBPT and GBPe use decoded Mint/Burn events. VGBP uses the stablecoins_evm.balances spellbook on EVM chains, supplemented by Allium for Solana supply data.`,
  },
  {
    title: "DEX & Market Data",
    content: `DEX volume and trading pair data comes from the dex.trades Spellbook table, which aggregates decoded swap events across Uniswap, Curve, Aerodrome, Mento, PancakeSwap, Balancer, and other DEXes. Market share comparison uses stablecoins_evm.balances to compare GBP stablecoin supply against USDT, USDC, EURC, and EURT, with Solana GBP tokens added via Allium.`,
  },
  {
    title: "Aggregation & Caching",
    content: `Time-series data is aggregated using DATE_TRUNC('week', ...) for weekly bucketing. All API responses are cached server-side with a 6-hour TTL to balance freshness with API rate limits. Supply snapshots use the most recent available day from the spellbook balance tables. Allium data follows the same 6-hour cache pattern.`,
  },
  {
    title: "CEX Coverage",
    content: `CEX listings vary significantly across the six tokens. tGBP is listed on Kraken (since November 2025) with 6 trading pairs. VGBP is listed on Coinbase with USD/EUR/CAD pairs. GBPT is on CEX.IO (with historical listings on Gate.io and Bittrex Global, now defunct) and integrated with Fireblocks (1,300+ institutions). eGBP is listed on Mercado Bitcoin (Latin America). GBPe has minimal presence on LBank. GBPm has no confirmed CEX listings. None of the six tokens are listed on Binance, Bybit, or OKX. On-chain CEX flow data (deposits/withdrawals to exchange wallets) is not currently tracked in this terminal due to limitations in available labelled wallet datasets.`,
  },
  {
    title: "Limitations",
    content: `This terminal tracks on-chain activity only. Off-chain / CEX trading volumes, OTC desk flows, and custodial balances are not captured. Wrapped or bridged token variants may be tracked separately from their canonical versions. GBP/USD conversion uses approximate market rates. Some tokens have limited historical data availability. Lending utilization data is sparse for GBP stablecoins due to limited DeFi protocol integration.`,
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
            <h4 className="text-[11px] text-[#FF6B35] font-bold uppercase tracking-wider mb-1.5">
              {section.title}
            </h4>
            <p className="text-xs text-[#9CA3AF] leading-relaxed">
              {section.content}
            </p>
          </div>
        ))}

        <div className="border-t border-[#1a1d24] pt-3 mt-3">
          <p className="text-[10px] text-[#6B7280]">
            Built by DuneUK &middot; Data: Dune Analytics + Allium &middot;
            Last methodology update: March 2026
          </p>
        </div>
      </div>
    </div>
  );
}

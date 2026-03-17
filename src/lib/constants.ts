export const QUERY_IDS = {
  MARKET_OVERVIEW: 6842786,
  SUPPLY_LEADERBOARD: 6842787,
  SUPPLY_OVER_TIME: 6842788,
  TRANSFER_VOLUME: 6842790,
  DAILY_ACTIVE_USERS: 6842791,
  CHAIN_DISTRIBUTION: 6842792,
  TOP_HOLDERS: 6842793,
  DEX_VOLUME: 6843561,
  DEX_PLATFORMS: 6843563,
  MARKET_SHARE: 6843568,
  LENDING: 6843569,
  DEX_POOLS: 6843570,
} as const;

export const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

export const CHART_COLORS = {
  tGBP: "#00FF88",
  GBPm: "#5B7FFF",
  GBPe: "#FF6B35",
  GBPT: "#B44AFF",
  VGBP: "#00D4FF",
  eGBP: "#FFD700",
} as const;

export const DEX_COLORS: Record<string, string> = {
  uniswap: "#FF007A",
  curve: "#0000FF",
  mento: "#35D07F",
  balancer: "#1E1E1E",
  sushiswap: "#FA52A0",
  pancakeswap: "#D1884F",
  aerodrome: "#0052FF",
  velodrome: "#FF0420",
};

export interface TokenMeta {
  issuer: string;
  color: string;
  regulation: string;
  backing: string;
  cex: string[];
  description: string;
}

export const TOKEN_META: Record<string, TokenMeta> = {
  tGBP: {
    issuer: "BCP Technologies",
    color: CHART_COLORS.tGBP,
    regulation: "FCA-registered (UK)",
    backing: "Cash + short-dated UK government bonds",
    cex: ["Kraken"],
    description: "First GBP stablecoin issued by an FCA-registered firm. Uses LayerZero OFT for cross-chain transfers.",
  },
  GBPm: {
    issuer: "Mento Protocol",
    color: CHART_COLORS.GBPm,
    regulation: "Mento governance",
    backing: "Algorithmic / Mento reserve",
    cex: [],
    description: "Formerly Celo British Pound (cGBP). Native to the Celo ecosystem with Mento stability mechanism.",
  },
  GBPe: {
    issuer: "Monerium",
    color: CHART_COLORS.GBPe,
    regulation: "Central Bank of Iceland (MiCAR-compliant)",
    backing: "E-money — 1:1 GBP reserves",
    cex: ["LBank"],
    description: "Authorised e-money token. Integrated with Gnosis Pay for real-world card spending.",
  },
  GBPT: {
    issuer: "Blackfridge SC (Poundtoken)",
    color: CHART_COLORS.GBPT,
    regulation: "Isle of Man FSA",
    backing: "100% fiat reserves in segregated UK bank accounts",
    cex: ["CEX.IO", "Gate.io (hist.)"],
    description: "Monthly KPMG proof-of-reserve attestations. Integrated with Fireblocks (1,300+ institutions).",
  },
  VGBP: {
    issuer: "VNX",
    color: CHART_COLORS.VGBP,
    regulation: "Liechtenstein Blockchain Act",
    backing: "1:1 GBP reserves (Swiss/Liechtenstein banks)",
    cex: ["Coinbase"],
    description: "Multi-chain deployment including Solana. Active Aerodrome DEX liquidity on Base.",
  },
  eGBP: {
    issuer: "Aryze",
    color: CHART_COLORS.eGBP,
    regulation: "Danish FSA (VASP)",
    backing: "Short-term government bonds",
    cex: ["Mercado Bitcoin"],
    description: "Part of Aryze's multi-currency suite (eUSD, eEUR, eGBP). Cross-currency conversion built in.",
  },
};

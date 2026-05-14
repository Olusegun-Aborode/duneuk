/**
 * Token contract registry — (chain_id, contract) per logical token.
 *
 * Used by the Sim integration (`lib/sim.ts`) to fan out token-holders /
 * token-info queries. Addresses come from the Dune SQL queries that power
 * the dashboard; keep this list in sync if those queries change on Dune.
 *
 * Note: tGBP (LayerZero OFT at 0x27f6...5287) is intentionally omitted —
 * Sim's standard ERC-20 indexer does not see it (verified May 2026).
 * GBP top-holders therefore stays on the Dune query path.
 */

export interface TokenContract {
  symbol: string;     // dashboard symbol (matches CHART_COLORS / TOKEN_META keys)
  chainId: number;    // Sim numeric chain ID
  chain: string;      // human-readable chain name
  address: string;    // ERC-20 contract address (lowercase 0x...)
  decimals: number;
}

// Sim chain ID lookup for cross-referencing in code
export const SIM_CHAIN_IDS = {
  ethereum: 1,
  base: 8453,
  polygon: 137,
  avalanche_c: 43114,
  bnb: 56,
  arbitrum: 42161,
  optimism: 10,
  celo: 42220,
  gnosis: 100,
} as const;

// EUR stablecoin contracts. Verified against Sim's token-info endpoint.
export const EUR_TOKEN_CONTRACTS: TokenContract[] = [
  { symbol: "EURC", chainId: 1,    chain: "ethereum", address: "0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c", decimals: 6  },
  { symbol: "EURT", chainId: 1,    chain: "ethereum", address: "0xC581b735A1688071A1746c968e0798D642EDE491", decimals: 6  },
  { symbol: "EURS", chainId: 1,    chain: "ethereum", address: "0xdB25f211AB05b1c97D595516F45794528a807ad8", decimals: 2  },
  { symbol: "EURA", chainId: 1,    chain: "ethereum", address: "0x1a7e4e63778B4f12a199C062f3eFdD288afCBce8", decimals: 18 },
  { symbol: "EURe", chainId: 100,  chain: "gnosis",   address: "0xcB444e90D8198415266c6a2724b7900fb12FC56E", decimals: 18 },
];

// Rough EUR → USD reference rate. The dashboard's USD totals are illustrative
// (no live FX oracle), so a static rate is fine here. Update if drift matters.
export const EUR_USD_RATE = 1.08;

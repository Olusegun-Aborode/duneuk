/**
 * DefiLlama Stablecoins API connector
 * Replaces Dune for: overview, leaderboard, supply history, chain distribution, market share
 * Keeps Dune for: DEX volume/platforms/pools, lending, transfers, DAU, top holders
 */

const DEFILLAMA_BASE = "https://stablecoins.llama.fi";

// DefiLlama IDs for EUR stablecoins (sorted by supply)
export const EUR_STABLECOIN_IDS: Record<string, { id: number; issuer: string; mechanism: string }> = {
  EURC:  { id: 50,  issuer: "Circle", mechanism: "fiat-backed" },
  EURCV: { id: 254, issuer: "SG-Forge (Société Générale)", mechanism: "fiat-backed" },
  EURI:  { id: 325, issuer: "Banking Circle", mechanism: "fiat-backed" },
  AEUR:  { id: 147, issuer: "Anchored Coins", mechanism: "fiat-backed" },
  EURe:  { id: 101, issuer: "Monerium", mechanism: "fiat-backed" },
  EURR:  { id: 239, issuer: "StablR", mechanism: "fiat-backed" },
  EURS:  { id: 51,  issuer: "Stasis", mechanism: "fiat-backed" },
  EUROP: { id: 247, issuer: "Schuman Financial", mechanism: "fiat-backed" },
  EURm:  { id: 52,  issuer: "Mento Protocol", mechanism: "algorithmic" },
  EURA:  { id: 55,  issuer: "Angle Protocol", mechanism: "crypto-backed" },
  VEUR:  { id: 158, issuer: "VNX", mechanism: "fiat-backed" },
  PAR:   { id: 56,  issuer: "Mimo Protocol", mechanism: "crypto-backed" },
  EURAU: { id: 319, issuer: "AllUnity", mechanism: "fiat-backed" },
  EURT:  { id: 49,  issuer: "Tether", mechanism: "fiat-backed" },
  EUROe: { id: 98,  issuer: "Membrane Finance", mechanism: "fiat-backed" },
  sEUR:  { id: 53,  issuer: "Synthetix", mechanism: "crypto-backed" },
};

// Cache in memory (server-side, lasts per serverless invocation)
const cache: Record<string, { data: unknown; ts: number }> = {};
const CACHE_TTL = 30 * 60 * 1000; // 30 min

async function cachedFetch<T>(url: string): Promise<T> {
  const now = Date.now();
  if (cache[url] && now - cache[url].ts < CACHE_TTL) {
    return cache[url].data as T;
  }
  const res = await fetch(url, { next: { revalidate: 1800 } });
  if (!res.ok) throw new Error(`DefiLlama fetch failed: ${res.status} ${url}`);
  const data = await res.json();
  cache[url] = { data, ts: now };
  return data as T;
}

interface DLStablecoin {
  id: number;
  name: string;
  symbol: string;
  gecko_id: string;
  pegType: string;
  pegMechanism: string;
  circulating: { peggedEUR: number; peggedUSD?: number; peggedGBP?: number };
  chainCirculating: Record<string, { current: { peggedEUR: number } }>;
  price: number;
}

interface DLStablecoinsResponse {
  peggedAssets: DLStablecoin[];
}

interface DLStablecoinDetail {
  id: number;
  name: string;
  symbol: string;
  chainBalances: Record<string, { tokens: Array<{ date: number; circulating: { peggedEUR: number } }> }>;
}

/**
 * Get all EUR stablecoins with current supply
 */
export async function getEurStablecoins(): Promise<DLStablecoin[]> {
  const data = await cachedFetch<DLStablecoinsResponse>(
    `${DEFILLAMA_BASE}/stablecoins?includePrices=true`
  );
  return data.peggedAssets.filter(
    (s) => s.pegType === "peggedEUR" && (s.circulating?.peggedEUR ?? 0) > 1000
  );
}

/**
 * Market Overview: total supply, num tokens, chain deployments
 */
export async function getEurMarketOverview() {
  const stables = await getEurStablecoins();
  let totalSupplyEur = 0;
  const uniqueChains = new Set<string>();

  for (const s of stables) {
    totalSupplyEur += s.circulating?.peggedEUR ?? 0;
    for (const chain of Object.keys(s.chainCirculating ?? {})) {
      uniqueChains.add(chain.toLowerCase());
    }
  }

  // EUR/USD rate from EURC price
  const eurc = stables.find((s) => s.symbol === "EURC");
  const eurUsdRate = eurc?.price ?? 1.08;

  return {
    data: [{
      total_supply_gbp: Math.round(totalSupplyEur * 100) / 100, // normalized field name
      total_supply_usd: Math.round(totalSupplyEur * eurUsdRate * 100) / 100,
      num_tokens: stables.length,
      total_chain_deployments: uniqueChains.size,
    }],
    lastUpdated: new Date().toISOString(),
    source: "defillama",
  };
}

/**
 * Supply Leaderboard: per-token supply ranking
 */
export async function getEurLeaderboard() {
  const stables = await getEurStablecoins();
  const eurc = stables.find((s) => s.symbol === "EURC");
  const eurUsdRate = eurc?.price ?? 1.08;
  const totalSupply = stables.reduce((sum, s) => sum + (s.circulating?.peggedEUR ?? 0), 0);

  const rows = stables
    .map((s) => {
      const supplyEur = s.circulating?.peggedEUR ?? 0;
      const meta = EUR_STABLECOIN_IDS[s.symbol];
      return {
        token: s.symbol,
        issuer: meta?.issuer ?? s.name,
        num_chains: Object.keys(s.chainCirculating ?? {}).length,
        supply_gbp: Math.round(supplyEur * 100) / 100, // normalized field name
        supply_usd: Math.round(supplyEur * eurUsdRate * 100) / 100,
        market_share_pct: totalSupply > 0 ? Math.round(supplyEur / totalSupply * 1000) / 10 : 0,
      };
    })
    .sort((a, b) => b.supply_gbp - a.supply_gbp);

  return {
    data: rows,
    lastUpdated: new Date().toISOString(),
    source: "defillama",
  };
}

/**
 * Supply Over Time: daily supply per token (top tokens only for performance)
 */
export async function getEurSupplyHistory() {
  const stables = await getEurStablecoins();
  const eurc = stables.find((s) => s.symbol === "EURC");
  const eurUsdRate = eurc?.price ?? 1.08;

  // Fetch detailed history for top tokens by supply
  const topTokens = stables
    .sort((a, b) => (b.circulating?.peggedEUR ?? 0) - (a.circulating?.peggedEUR ?? 0))
    .slice(0, 10);

  const rows: Array<{ day: string; token: string; supply_gbp: number; supply_usd: number }> = [];

  await Promise.all(
    topTokens.map(async (token) => {
      try {
        const detail = await cachedFetch<DLStablecoinDetail>(
          `${DEFILLAMA_BASE}/stablecoin/${token.id}`
        );
        // Aggregate across all chains per day
        const byDay: Record<number, number> = {};
        for (const chain of Object.values(detail.chainBalances ?? {})) {
          for (const point of chain.tokens ?? []) {
            const ts = point.date;
            byDay[ts] = (byDay[ts] ?? 0) + (point.circulating?.peggedEUR ?? 0);
          }
        }
        for (const [ts, supply] of Object.entries(byDay)) {
          const d = new Date(Number(ts) * 1000);
          const day = d.toISOString().slice(0, 10);
          if (supply > 100) {
            rows.push({
              day,
              token: token.symbol,
              supply_gbp: Math.round(supply * 100) / 100, // normalized
              supply_usd: Math.round(supply * eurUsdRate * 100) / 100,
            });
          }
        }
      } catch {
        // Skip tokens that fail
      }
    })
  );

  rows.sort((a, b) => a.day.localeCompare(b.day) || a.token.localeCompare(b.token));

  return {
    data: rows,
    lastUpdated: new Date().toISOString(),
    source: "defillama",
  };
}

/**
 * Chain Distribution: supply by chain for all EUR tokens
 */
export async function getEurChainDistribution() {
  const stables = await getEurStablecoins();
  const eurc = stables.find((s) => s.symbol === "EURC");
  const eurUsdRate = eurc?.price ?? 1.08;
  const totalSupply = stables.reduce((sum, s) => sum + (s.circulating?.peggedEUR ?? 0), 0);

  const rows: Array<{
    blockchain: string; token: string; supply_gbp: number; supply_usd: number; share_pct: number;
  }> = [];

  for (const s of stables) {
    for (const [chain, data] of Object.entries(s.chainCirculating ?? {})) {
      const supply = data.current?.peggedEUR ?? 0;
      if (supply > 100) {
        rows.push({
          blockchain: chain.toLowerCase().replace(/ /g, "_"),
          token: s.symbol,
          supply_gbp: Math.round(supply * 100) / 100, // normalized
          supply_usd: Math.round(supply * eurUsdRate * 100) / 100,
          share_pct: totalSupply > 0 ? Math.round(supply / totalSupply * 1000) / 10 : 0,
        });
      }
    }
  }

  rows.sort((a, b) => b.supply_gbp - a.supply_gbp);

  return {
    data: rows,
    lastUpdated: new Date().toISOString(),
    source: "defillama",
  };
}

/**
 * Market Share: EUR vs USD stablecoins
 */
export async function getEurMarketShare() {
  const data = await cachedFetch<DLStablecoinsResponse>(
    `${DEFILLAMA_BASE}/stablecoins?includePrices=true`
  );

  const rows: Array<{
    currency_group: string; symbol: string; total_supply: number; total_supply_usd: number;
  }> = [];

  // EUR tokens
  const eurTokens = data.peggedAssets.filter(
    (s) => s.pegType === "peggedEUR" && (s.circulating?.peggedEUR ?? 0) > 1000
  );
  for (const s of eurTokens) {
    const supply = s.circulating?.peggedEUR ?? 0;
    const rate = s.price ?? 1.08;
    rows.push({
      currency_group: "EUR",
      symbol: s.symbol,
      total_supply: Math.round(supply * 100) / 100,
      total_supply_usd: Math.round(supply * rate * 100) / 100,
    });
  }

  // Top USD tokens for comparison
  const usdSymbols = ["USDT", "USDC", "DAI", "FDUSD", "TUSD", "USDS", "USDE"];
  const usdTokens = data.peggedAssets.filter(
    (s) => s.pegType === "peggedUSD" && usdSymbols.includes(s.symbol)
  );
  for (const s of usdTokens) {
    const supply = s.circulating?.peggedUSD ?? 0;
    rows.push({
      currency_group: "USD",
      symbol: s.symbol,
      total_supply: Math.round(supply * 100) / 100,
      total_supply_usd: Math.round(supply * 100) / 100, // 1:1
    });
  }

  // GBP tokens for comparison
  const gbpTokens = data.peggedAssets.filter(
    (s) => s.pegType === "peggedGBP" && (s.circulating?.peggedGBP ?? 0) > 100
  );
  for (const s of gbpTokens) {
    const supply = s.circulating?.peggedGBP ?? 0;
    const rate = s.price ?? 1.27;
    rows.push({
      currency_group: "GBP",
      symbol: s.symbol,
      total_supply: Math.round(supply * 100) / 100,
      total_supply_usd: Math.round(supply * rate * 100) / 100,
    });
  }

  rows.sort((a, b) => b.total_supply_usd - a.total_supply_usd);

  return {
    data: rows,
    lastUpdated: new Date().toISOString(),
    source: "defillama",
  };
}

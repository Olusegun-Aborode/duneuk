/**
 * Dune Sim — wallet/token REST API.
 *
 * Currently used for: EUR top-holders (real-time, replaces the scheduled Dune query).
 *
 * Sim's free/basic tier rate-limits aggressively (~6 rapid requests trigger 429),
 * so we pace fan-out calls and cache results aggressively. Use a single SimConnector
 * instance per process so the cache and pacing apply across requests.
 */

import type { TokenContract } from "./token-registry";

const SIM_BASE = "https://api.sim.dune.com";
const FAN_OUT_DELAY_MS = 1500; // pacing between sequential Sim calls
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

interface SimHoldersResponse {
  token_address: string;
  chain_id: number;
  holders?: Array<{
    wallet_address: string;
    balance: string; // raw integer string (apply decimals)
    first_acquired?: string;
    has_initiated_transfer?: boolean;
  }>;
  next_offset?: string | null;
}

class SimConnector {
  private apiKey: string;
  private cache = new Map<string, { ts: number; data: unknown }>();

  constructor() {
    this.apiKey = process.env.SIM_API_KEY ?? "";
  }

  private async cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.ts < CACHE_TTL_MS) return hit.data as T;
    const data = await fn();
    this.cache.set(key, { ts: Date.now(), data });
    return data;
  }

  async tokenHolders(chainId: number, address: string, limit = 100): Promise<SimHoldersResponse> {
    if (!this.apiKey) throw new Error("SIM_API_KEY not configured");
    return this.cached(`holders:${chainId}:${address.toLowerCase()}:${limit}`, async () => {
      const url = `${SIM_BASE}/v1/evm/token-holders/${chainId}/${address}?limit=${limit}`;
      const res = await fetch(url, { headers: { "X-Sim-Api-Key": this.apiKey } });
      if (!res.ok) throw new Error(`Sim token-holders ${chainId}/${address}: ${res.status}`);
      return (await res.json()) as SimHoldersResponse;
    });
  }
}

const sim = new SimConnector();

export interface TopHolderRow {
  blockchain: string;
  token: string;
  address: string;
  balance_gbp: number; // normalised field used by the panel (here = EUR balance)
  balance_usd: number;
  pct_of_supply: number;
}

/**
 * Fetch top holders across the EUR token registry via Sim.
 * Paces sequential calls (Sim rate-limits at ~6 rapid req/s).
 * Computes per-token pct_of_supply from the returned balances.
 */
export async function getEurTopHoldersFromSim(
  contracts: TokenContract[],
  perTokenLimit = 50,
  eurUsdRate = 1.08,
): Promise<TopHolderRow[]> {
  const rows: TopHolderRow[] = [];

  for (let i = 0; i < contracts.length; i++) {
    const c = contracts[i];
    if (i > 0) await new Promise((r) => setTimeout(r, FAN_OUT_DELAY_MS));

    try {
      const resp = await sim.tokenHolders(c.chainId, c.address, perTokenLimit);
      const holders = resp.holders ?? [];
      if (holders.length === 0) continue;

      // Decode balances and compute share-of-top-N (we don't have global supply
      // here; pct is share of the top-N total per token, which is what the panel uses).
      const decoded = holders.map((h) => ({
        address: h.wallet_address,
        balance: Number(BigInt(h.balance)) / 10 ** c.decimals,
      }));
      const total = decoded.reduce((s, d) => s + d.balance, 0);

      for (const d of decoded) {
        rows.push({
          blockchain: c.chain,
          token: c.symbol,
          address: d.address,
          balance_gbp: Math.round(d.balance * 100) / 100,
          balance_usd: Math.round(d.balance * eurUsdRate * 100) / 100,
          pct_of_supply: total > 0 ? Math.round((d.balance / total) * 10000) / 100 : 0,
        });
      }
    } catch (err) {
      // Skip a single token on failure (rate limit, indexing gap, etc.) but
      // keep returning the rest — degrade gracefully rather than ERR the panel.
      console.error(`Sim top-holders failed for ${c.symbol} on ${c.chain}:`, (err as Error).message);
    }
  }

  // Sort by balance descending globally so the panel's leaderboard ranks correctly.
  rows.sort((a, b) => b.balance_gbp - a.balance_gbp);
  return rows;
}

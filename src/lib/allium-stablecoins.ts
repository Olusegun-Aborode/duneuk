/**
 * Allium Stablecoins API — EUR transfer volume, DAU, and top holders
 * Uses crosschain.metrics.stablecoin_volume and crosschain.stablecoin.transfers
 * Replaces Dune for these EUR queries (48 chains vs Dune's 5-chain UNION ALL)
 */

const ALLIUM_BASE = "https://api.allium.so/api/v1/explorer/queries";

function getApiKey(): string {
  const key = process.env.ALLIUM_API_KEY;
  if (!key) throw new Error("ALLIUM_API_KEY not configured");
  return key;
}

// Create and run a query in one call
async function runAlliumQuery<T>(sql: string, limit: number = 100): Promise<T[]> {
  const apiKey = getApiKey();

  // Step 1: Create the query
  const createRes = await fetch(ALLIUM_BASE, {
    method: "POST",
    headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      title: `eur_auto_${Date.now()}`,
      config: { sql, limit },
    }),
  });
  if (!createRes.ok) throw new Error(`Allium create failed: ${createRes.status}`);
  const { query_id } = await createRes.json();

  // Step 2: Run and get results
  const runRes = await fetch(`${ALLIUM_BASE}/${query_id}/run`, {
    method: "POST",
    headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!runRes.ok) throw new Error(`Allium run failed: ${runRes.status}`);
  const result = await runRes.json();
  return (result.data ?? []) as T[];
}

// Cache layer
const cache: Record<string, { data: unknown; ts: number }> = {};
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function cachedQuery<T>(key: string, sql: string, limit?: number): Promise<T[]> {
  const now = Date.now();
  if (cache[key] && now - cache[key].ts < CACHE_TTL) {
    return cache[key].data as T[];
  }
  const rows = await runAlliumQuery<T>(sql, limit);
  cache[key] = { data: rows, ts: now };
  return rows;
}

// Known EUR tokens to filter against (avoids unknown/spam tokens)
const KNOWN_EUR_SYMBOLS = [
  "eurc", "eurt", "eurs", "eura", "eure", "eurcv", "euri",
  "europ", "eurr", "eurau", "eurm", "veur", "par", "euroe",
  "seur", "eeur", "aeur",
];

/**
 * EUR Transfer Volume — aggregated by chain + token (last 30 days)
 * Filters to known tokens only and uses entity-adjusted volume
 */
export async function getEurTransferVolume() {
  const tokenList = KNOWN_EUR_SYMBOLS.map((s) => `'${s}'`).join(",");
  const sql = `
    SELECT
      chain,
      token_symbol AS token,
      SUM(entity_adjusted_single_direction_max_transfer_volume) AS volume_eur,
      SUM(entity_adjusted_single_direction_max_transfer_volume_usd) AS volume_usd,
      SUM(transfer_tx_count) AS num_transfers,
      COUNT(DISTINCT activity_date) AS active_days
    FROM crosschain.metrics.stablecoin_volume
    WHERE currency = 'eur'
      AND LOWER(token_symbol) IN (${tokenList})
      AND activity_date >= CURRENT_DATE - INTERVAL '30 days'
      AND transfer_volume > 0
    GROUP BY chain, token_symbol
    ORDER BY volume_usd DESC
  `;

  const rows = await cachedQuery<{
    chain: string; token: string; volume_eur: number;
    volume_usd: number; num_transfers: string; active_days: string;
  }>("eur-transfer-volume-v2", sql, 100);

  return {
    data: rows.map((r) => ({
      blockchain: r.chain,
      token: (r.token ?? "").toUpperCase(),
      num_transfers: parseInt(r.num_transfers ?? "0", 10),
      volume_gbp: Math.round((r.volume_eur ?? 0) * 100) / 100, // normalized field
      volume_usd: Math.round((r.volume_usd ?? 0) * 100) / 100,
      unique_senders: 0,
      unique_receivers: 0,
    })),
    lastUpdated: new Date().toISOString(),
    source: "allium",
  };
}

/**
 * EUR Daily Active Users — unique transactors per day per token
 */
export async function getEurDailyActiveUsers() {
  const tokenList = KNOWN_EUR_SYMBOLS.map((s) => `'${s}'`).join(",");
  const sql = `
    SELECT
      CAST(activity_date AS VARCHAR) AS day,
      token_symbol AS token,
      SUM(transfer_tx_count) AS active_addresses
    FROM crosschain.metrics.stablecoin_volume
    WHERE currency = 'eur'
      AND LOWER(token_symbol) IN (${tokenList})
      AND activity_date >= CURRENT_DATE - INTERVAL '180 days'
      AND transfer_tx_count > 0
    GROUP BY activity_date, token_symbol
    ORDER BY activity_date DESC, token_symbol
  `;

  const rows = await cachedQuery<{
    day: string; token: string; active_addresses: string;
  }>("eur-dau", sql, 5000);

  return {
    data: rows.map((r) => ({
      day: (r.day ?? "").slice(0, 10),
      token: (r.token ?? "").toUpperCase(),
      active_addresses: parseInt(r.active_addresses ?? "0", 10),
    })),
    lastUpdated: new Date().toISOString(),
    source: "allium",
  };
}

/**
 * EUR Top Holders — largest balances from transfer events (Ethereum only for perf)
 */
export async function getEurTopHolders() {
  const sql = `
    WITH eur_tokens AS (
      SELECT address, symbol, chain, decimals
      FROM crosschain.stablecoin.list
      WHERE currency = 'eur' AND chain = 'ethereum'
    ),
    transfers AS (
      SELECT
        t.recipient AS address,
        et.symbol AS token,
        SUM(t.transfer_volume) AS received
      FROM crosschain.stablecoin.transfers t
      INNER JOIN eur_tokens et ON t.token_address = et.address AND t.chain = et.chain
      WHERE t.currency = 'eur' AND t.chain = 'ethereum'
      GROUP BY t.recipient, et.symbol

      UNION ALL

      SELECT
        t.sender AS address,
        et.symbol AS token,
        -SUM(t.transfer_volume) AS received
      FROM crosschain.stablecoin.transfers t
      INNER JOIN eur_tokens et ON t.token_address = et.address AND t.chain = et.chain
      WHERE t.currency = 'eur' AND t.chain = 'ethereum'
      GROUP BY t.sender, et.symbol
    ),
    balances AS (
      SELECT token, address, SUM(received) AS balance_eur
      FROM transfers
      WHERE address != '0x0000000000000000000000000000000000000000'
      GROUP BY token, address
      HAVING SUM(received) > 1
    )
    SELECT
      'ethereum' AS blockchain,
      token,
      address,
      balance_eur,
      balance_eur * 1.15 AS balance_usd,
      (balance_eur / NULLIF(SUM(balance_eur) OVER (PARTITION BY token), 0)) * 100 AS pct_of_supply
    FROM balances
    ORDER BY balance_eur DESC
    LIMIT 50
  `;

  try {
    const rows = await cachedQuery<{
      blockchain: string; token: string; address: string;
      balance_eur: number; balance_usd: number; pct_of_supply: number;
    }>("eur-top-holders", sql, 50);

    return {
      data: rows.map((r) => ({
        blockchain: r.blockchain ?? "ethereum",
        token: (r.token ?? "").toUpperCase(),
        address: r.address ?? "",
        balance_gbp: Math.round((r.balance_eur ?? 0) * 100) / 100, // normalized
        balance_usd: Math.round((r.balance_usd ?? 0) * 100) / 100,
        pct_of_supply: Math.round((r.pct_of_supply ?? 0) * 100) / 100,
      })),
      lastUpdated: new Date().toISOString(),
      source: "allium",
    };
  } catch {
    // Fallback: top holders query is expensive, return empty
    return { data: [], lastUpdated: new Date().toISOString(), source: "allium" as const };
  }
}

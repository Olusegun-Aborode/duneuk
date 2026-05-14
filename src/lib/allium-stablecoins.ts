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

// Persist query_id per logical SQL key so we don't spam Allium with create-per-request
// (which triggered 429s and bloated the workspace with eur_auto_* queries).
// Optionally seeded via ALLIUM_QUERY_ID_<KEY> env vars for cross-instance reuse on Vercel.
const queryIdByKey: Record<string, string> = {};
function loadSeededId(key: string): string | undefined {
  const envName = `ALLIUM_QUERY_ID_${key.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;
  return process.env[envName];
}

async function getOrCreateQueryId(key: string, sql: string, limit: number): Promise<string> {
  const cached = queryIdByKey[key] ?? loadSeededId(key);
  if (cached) return cached;

  const apiKey = getApiKey();
  const createRes = await fetch(ALLIUM_BASE, {
    method: "POST",
    headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      title: `duneuk_${key}`,
      config: { sql, limit },
    }),
  });
  if (!createRes.ok) {
    throw new Error(`Allium create failed: ${createRes.status}`);
  }
  const { query_id } = await createRes.json();
  queryIdByKey[key] = query_id;
  return query_id;
}

async function runQuery<T>(queryId: string): Promise<T[]> {
  const apiKey = getApiKey();
  const runRes = await fetch(`${ALLIUM_BASE}/${queryId}/run`, {
    method: "POST",
    headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!runRes.ok) throw new Error(`Allium run failed: ${runRes.status}`);
  const result = await runRes.json();
  return (result.data ?? []) as T[];
}

async function runAlliumQuery<T>(key: string, sql: string, limit: number = 100): Promise<T[]> {
  const queryId = await getOrCreateQueryId(key, sql, limit);
  return runQuery<T>(queryId);
}

// Result cache + negative cache for rate limits (avoids hammering Allium when 429)
const cache: Record<string, { data: unknown; ts: number }> = {};
const errorCache: Record<string, { ts: number; msg: string }> = {};
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours (match Dune)
const ERROR_BACKOFF_MS = 15 * 60 * 1000; // 15 min backoff after a failure

async function cachedQuery<T>(key: string, sql: string, limit?: number): Promise<T[]> {
  const now = Date.now();
  if (cache[key] && now - cache[key].ts < CACHE_TTL) {
    return cache[key].data as T[];
  }
  const lastError = errorCache[key];
  if (lastError && now - lastError.ts < ERROR_BACKOFF_MS) {
    throw new Error(`Allium ${key} backoff: ${lastError.msg}`);
  }
  try {
    const rows = await runAlliumQuery<T>(key, sql, limit ?? 100);
    cache[key] = { data: rows, ts: now };
    delete errorCache[key];
    return rows;
  } catch (err) {
    errorCache[key] = { ts: now, msg: (err as Error).message };
    throw err;
  }
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

// (Allium top-holders SQL removed — EUR top holders now served by Sim, see lib/sim.ts.)

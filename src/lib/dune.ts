import { DuneConnector } from "./connectors/dune";

/**
 * Dune connector for fetching query results.
 *
 * Uses a single request with a high row limit (10000) to avoid
 * pagination overhead that causes Vercel serverless function timeouts.
 * Results are cached in-memory for 6 hours.
 */
const dune = new DuneConnector({
  pageSize: 10000,
  cacheTtlMs: 6 * 60 * 60 * 1000, // 6 hours
});

interface GetOptions {
  /** If Dune-side data is older than this, trigger a fresh execution (blocks). */
  maxAgeMs?: number;
  /** Force a fresh execution. Used by the admin refresh route. */
  forceExecute?: boolean;
}

export async function getDuneQueryResults(queryId: number, options?: GetOptions) {
  const result = await dune.getQueryResults(queryId, 10000, options);
  return {
    data: result.data,
    lastUpdated: result.lastUpdated,
    stale: result.stale,
  };
}

/** Trigger a fresh execution on Dune and wait for completion. */
export async function executeDuneQuery(queryId: number) {
  return dune.executeQuery(queryId);
}

/** Clear cached results for a single query. Forces the next call to refetch. */
export function invalidateDuneQuery(queryId: number) {
  dune.invalidate(queryId);
}

/** Clear all cached Dune results. */
export function clearDuneCache() {
  dune.clearCache();
}

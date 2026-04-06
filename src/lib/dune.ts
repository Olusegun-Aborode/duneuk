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

export async function getDuneQueryResults(queryId: number) {
  const result = await dune.getQueryResults(queryId, 10000);
  return {
    data: result.data,
    lastUpdated: result.lastUpdated,
  };
}

/** Clear cached results for a single query. Forces the next call to refetch. */
export function invalidateDuneQuery(queryId: number) {
  dune.invalidate(queryId);
}

/** Clear all cached Dune results. */
export function clearDuneCache() {
  dune.clearCache();
}

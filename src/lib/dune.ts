import { DuneConnector } from "@datumlabs/data-connectors";

/**
 * Dune connector with automatic pagination and freshness control.
 *
 * - pageSize: 1000 rows per API call (paginated automatically to fetch ALL rows)
 * - cacheTtlMs: 6 hours in-memory cache
 * - maxAgeMs: 24 hours — if Dune's cached results are older, triggers a fresh execution
 */
const dune = new DuneConnector({
  pageSize: 1000,
  cacheTtlMs: 6 * 60 * 60 * 1000, // 6 hours
});

const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours — auto-refresh if data is older

export async function getDuneQueryResults(queryId: number) {
  const result = await dune.getQueryResults(queryId, undefined, {
    maxAgeMs: MAX_AGE_MS,
  });
  return {
    data: result.data,
    lastUpdated: result.lastUpdated,
  };
}

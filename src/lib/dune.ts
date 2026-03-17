import { CACHE_TTL_MS } from "./constants";

interface CacheEntry {
  data: Record<string, unknown>[];
  timestamp: number;
}

const cache = new Map<number, CacheEntry>();

export async function getDuneQueryResults(queryId: number) {
  const cached = cache.get(queryId);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return {
      data: cached.data,
      lastUpdated: new Date(cached.timestamp).toISOString(),
    };
  }

  const apiKey = process.env.DUNE_API_KEY;
  if (!apiKey) throw new Error("DUNE_API_KEY not configured");

  const res = await fetch(
    `https://api.dune.com/api/v1/query/${queryId}/results?limit=1000`,
    {
      headers: { "X-Dune-Api-Key": apiKey },
      next: { revalidate: 0 },
    }
  );

  if (!res.ok) {
    throw new Error(`Dune API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const rows = json.result?.rows ?? [];

  cache.set(queryId, { data: rows, timestamp: now });

  return {
    data: rows,
    lastUpdated: new Date(now).toISOString(),
  };
}

import { CACHE_TTL_MS } from "./constants";

interface CacheEntry {
  data: Record<string, unknown>[];
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

const BASE_URL = "https://api.allium.so";

export async function getAlliumData(endpoint: string): Promise<{
  data: Record<string, unknown>[];
  lastUpdated: string;
  source: "allium";
}> {
  const cached = cache.get(endpoint);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return {
      data: cached.data,
      lastUpdated: new Date(cached.timestamp).toISOString(),
      source: "allium",
    };
  }

  const apiKey = process.env.ALLIUM_API_KEY;
  if (!apiKey) throw new Error("ALLIUM_API_KEY not configured");

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Allium API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const rows = Array.isArray(json) ? json : json.data ?? [];

  cache.set(endpoint, { data: rows, timestamp: now });

  return {
    data: rows,
    lastUpdated: new Date(now).toISOString(),
    source: "allium",
  };
}

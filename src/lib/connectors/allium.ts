/**
 * Allium API connector with built-in caching.
 * Inlined from @datumlabs/data-connectors for production deployment.
 */

import { DataCache } from './cache';

interface AlliumResult {
  data: Record<string, unknown>[];
  lastUpdated: string;
  source: 'allium';
}

export class AlliumConnector {
  private apiKey: string;
  private baseUrl: string;
  private cache: DataCache;
  private cacheTtlMs: number;

  constructor(config: { apiKey?: string; baseUrl?: string; cacheTtlMs?: number } = {}) {
    this.apiKey = config.apiKey || process.env.ALLIUM_API_KEY || '';
    this.baseUrl = config.baseUrl ?? 'https://api.allium.so';
    this.cacheTtlMs = config.cacheTtlMs ?? 6 * 60 * 60 * 1000;
    this.cache = new DataCache({ defaultTtlMs: this.cacheTtlMs });
  }

  async getData(endpoint: string): Promise<AlliumResult> {
    if (!this.apiKey) throw new Error('ALLIUM_API_KEY not configured');

    const cacheKey = `allium:${endpoint}`;
    const cached = this.cache.get<Record<string, unknown>[]>(cacheKey);
    if (cached) {
      return {
        data: cached,
        lastUpdated: this.cache.lastUpdated(cacheKey)!,
        source: 'allium',
      };
    }

    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'X-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Allium API error: ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    const rows: Record<string, unknown>[] = Array.isArray(json) ? json : json.data ?? [];

    this.cache.set(cacheKey, rows);

    return {
      data: rows,
      lastUpdated: new Date().toISOString(),
      source: 'allium',
    };
  }

  invalidate(endpoint: string): void {
    this.cache.invalidate(`allium:${endpoint}`);
  }

  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * In-memory cache with configurable TTL per key.
 * Inlined from @datumlabs/data-connectors for production deployment.
 */

interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
}

const DEFAULT_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

export class DataCache {
  private store = new Map<string, CacheEntry>();
  private defaultTtlMs: number;

  constructor(config: { defaultTtlMs?: number } = {}) {
    this.defaultTtlMs = config.defaultTtlMs ?? DEFAULT_TTL_MS;
  }

  get<T>(key: string, ttlMs?: number): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    const ttl = ttlMs ?? this.defaultTtlMs;
    if (Date.now() - entry.timestamp > ttl) {
      this.store.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T): void {
    this.store.set(key, { data, timestamp: Date.now() });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  lastUpdated(key: string): string | null {
    const entry = this.store.get(key);
    return entry ? new Date(entry.timestamp).toISOString() : null;
  }
}

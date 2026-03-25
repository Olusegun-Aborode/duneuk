/**
 * Dune Analytics connector with automatic pagination and freshness control.
 * Inlined from @datumlabs/data-connectors for production deployment.
 */

import { DataCache } from './cache';

interface DuneResult {
  data: Record<string, unknown>[];
  lastUpdated: string;
  source: 'dune';
}

interface ExecuteOptions {
  pollIntervalMs?: number;
  timeoutMs?: number;
  params?: Record<string, string | number | boolean>;
}

interface GetQueryOptions {
  maxAgeMs?: number;
  executeOptions?: ExecuteOptions;
}

type DuneExecutionState =
  | 'QUERY_STATE_PENDING'
  | 'QUERY_STATE_EXECUTING'
  | 'QUERY_STATE_COMPLETED'
  | 'QUERY_STATE_FAILED'
  | 'QUERY_STATE_CANCELLED'
  | 'QUERY_STATE_EXPIRED';

const DUNE_API_BASE = 'https://api.dune.com/api/v1';

export class DuneConnector {
  private apiKey: string;
  private cache: DataCache;
  private cacheTtlMs: number;
  private pageSize: number;

  constructor(config: { apiKey?: string; cacheTtlMs?: number; pageSize?: number } = {}) {
    this.apiKey = config.apiKey || process.env.DUNE_API_KEY || '';
    this.cacheTtlMs = config.cacheTtlMs ?? 6 * 60 * 60 * 1000;
    this.pageSize = config.pageSize ?? 1000;
    this.cache = new DataCache({ defaultTtlMs: this.cacheTtlMs });
  }

  /**
   * Fetch ALL rows from a Dune endpoint by paginating automatically.
   */
  private async fetchAllRows(url: string): Promise<Record<string, unknown>[]> {
    const allRows: Record<string, unknown>[] = [];
    let offset = 0;

    while (true) {
      const separator = url.includes('?') ? '&' : '?';
      const pageUrl = `${url}${separator}limit=${this.pageSize}&offset=${offset}`;

      const res = await fetch(pageUrl, {
        headers: { 'X-Dune-Api-Key': this.apiKey },
      });

      if (!res.ok) {
        throw new Error(`Dune API error: ${res.status} ${res.statusText}`);
      }

      const json = await res.json();
      const rows: Record<string, unknown>[] = json.result?.rows ?? [];

      allRows.push(...rows);

      if (rows.length < this.pageSize) break;
      offset += this.pageSize;
    }

    return allRows;
  }

  /**
   * Fetch results for a Dune query by ID.
   * Auto-paginates to retrieve ALL rows.
   * When maxAgeMs is set, triggers a fresh execution if data is stale.
   */
  async getQueryResults(
    queryId: number,
    limit?: number,
    options?: GetQueryOptions,
  ): Promise<DuneResult> {
    if (!this.apiKey) throw new Error('DUNE_API_KEY not configured');

    const cacheKey = `dune:${queryId}`;
    const cached = this.cache.get<Record<string, unknown>[]>(cacheKey);

    if (cached) {
      if (options?.maxAgeMs) {
        const lastUpdatedStr = this.cache.lastUpdated(cacheKey);
        if (lastUpdatedStr) {
          const age = Date.now() - new Date(lastUpdatedStr).getTime();
          if (age > options.maxAgeMs) {
            return this.executeQuery(queryId, options.executeOptions);
          }
        }
      }

      return {
        data: cached,
        lastUpdated: this.cache.lastUpdated(cacheKey)!,
        source: 'dune',
      };
    }

    if (options?.maxAgeMs) {
      return this.executeQuery(queryId, options.executeOptions);
    }

    const rows = await this.fetchAllRows(
      `${DUNE_API_BASE}/query/${queryId}/results`
    );

    this.cache.set(cacheKey, rows);

    return {
      data: rows,
      lastUpdated: new Date().toISOString(),
      source: 'dune',
    };
  }

  /**
   * Trigger a fresh query execution on Dune, poll for completion, and return results.
   */
  async executeQuery(
    queryId: number,
    options: ExecuteOptions = {},
  ): Promise<DuneResult> {
    if (!this.apiKey) throw new Error('DUNE_API_KEY not configured');

    const pollInterval = options.pollIntervalMs ?? 5000;
    const timeout = options.timeoutMs ?? 300_000;
    const params = options.params;

    const execRes = await fetch(
      `${DUNE_API_BASE}/query/${queryId}/execute`,
      {
        method: 'POST',
        headers: {
          'X-Dune-Api-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: params ? JSON.stringify({ query_parameters: params }) : undefined,
      }
    );

    if (!execRes.ok) {
      throw new Error(`Dune execute error: ${execRes.status} ${execRes.statusText}`);
    }

    const { execution_id }: { execution_id: string } = await execRes.json();

    const deadline = Date.now() + timeout;
    let state: DuneExecutionState = 'QUERY_STATE_PENDING';

    while (Date.now() < deadline) {
      const statusRes = await fetch(
        `${DUNE_API_BASE}/execution/${execution_id}/status`,
        { headers: { 'X-Dune-Api-Key': this.apiKey } }
      );

      if (!statusRes.ok) {
        throw new Error(`Dune status error: ${statusRes.status} ${statusRes.statusText}`);
      }

      const statusJson = await statusRes.json();
      state = statusJson.state;

      if (state === 'QUERY_STATE_COMPLETED') break;

      if (
        state === 'QUERY_STATE_FAILED' ||
        state === 'QUERY_STATE_CANCELLED' ||
        state === 'QUERY_STATE_EXPIRED'
      ) {
        throw new Error(`Dune execution ${execution_id} ended with state: ${state}`);
      }

      await new Promise((r) => setTimeout(r, pollInterval));
    }

    if (state !== 'QUERY_STATE_COMPLETED') {
      throw new Error(
        `Dune execution ${execution_id} timed out after ${timeout}ms (state: ${state})`
      );
    }

    const rows = await this.fetchAllRows(
      `${DUNE_API_BASE}/execution/${execution_id}/results`
    );

    const cacheKey = `dune:${queryId}`;
    this.cache.set(cacheKey, rows);

    return {
      data: rows,
      lastUpdated: new Date().toISOString(),
      source: 'dune',
    };
  }

  invalidate(queryId: number): void {
    this.cache.invalidate(`dune:${queryId}`);
  }

  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Dune Analytics connector with automatic pagination and freshness control.
 * Inlined from @datumlabs/data-connectors for production deployment.
 */

import { DataCache } from './cache';

interface DuneResult {
  data: Record<string, unknown>[];
  lastUpdated: string;
  source: 'dune';
  stale?: boolean;
}

interface ExecuteOptions {
  pollIntervalMs?: number;
  timeoutMs?: number;
  params?: Record<string, string | number | boolean>;
}

interface GetQueryOptions {
  /** If Dune-side data is older than this, trigger a fresh execution and block until done. */
  maxAgeMs?: number;
  /** Always trigger a fresh execution regardless of cached/Dune freshness. */
  forceExecute?: boolean;
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
   * Also returns Dune's execution_ended_at so callers know how fresh the
   * underlying data on Dune is (independent of our local cache age).
   */
  private async fetchAllRows(url: string): Promise<{
    rows: Record<string, unknown>[];
    executionEndedAt: string | null;
  }> {
    const allRows: Record<string, unknown>[] = [];
    let offset = 0;
    let executionEndedAt: string | null = null;

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
      if (executionEndedAt === null) {
        executionEndedAt = json.execution_ended_at ?? json.result?.metadata?.execution_ended_at ?? null;
      }

      allRows.push(...rows);

      if (rows.length < this.pageSize) break;
      offset += this.pageSize;
    }

    return { rows: allRows, executionEndedAt };
  }

  /**
   * Fetch results for a Dune query by ID.
   * Auto-paginates to retrieve ALL rows.
   *
   * The reported `lastUpdated` is Dune's `execution_ended_at` (when the
   * underlying query last ran on Dune), NOT when we cached it locally.
   *
   * - `forceExecute: true` always triggers a fresh execution.
   * - `maxAgeMs` triggers a fresh execution if Dune-side data is stale.
   */
  async getQueryResults(
    queryId: number,
    limit?: number,
    options?: GetQueryOptions,
  ): Promise<DuneResult> {
    if (!this.apiKey) throw new Error('DUNE_API_KEY not configured');

    if (options?.forceExecute) {
      return this.executeQuery(queryId, options.executeOptions);
    }

    const cacheKey = `dune:${queryId}`;
    const metaKey = `dune:${queryId}:meta`;
    const cached = this.cache.get<Record<string, unknown>[]>(cacheKey);
    const cachedMeta = this.cache.get<{ executionEndedAt: string | null }>(metaKey);

    const isStaleOnDune = (executionEndedAt: string | null): boolean => {
      if (!options?.maxAgeMs || !executionEndedAt) return false;
      const age = Date.now() - new Date(executionEndedAt).getTime();
      return age > options.maxAgeMs;
    };

    if (cached) {
      const executionEndedAt = cachedMeta?.executionEndedAt ?? null;
      if (isStaleOnDune(executionEndedAt)) {
        return this.executeQuery(queryId, options?.executeOptions);
      }
      return {
        data: cached,
        lastUpdated: executionEndedAt ?? this.cache.lastUpdated(cacheKey)!,
        source: 'dune',
      };
    }

    const { rows, executionEndedAt } = await this.fetchAllRows(
      `${DUNE_API_BASE}/query/${queryId}/results`
    );

    if (isStaleOnDune(executionEndedAt)) {
      return this.executeQuery(queryId, options?.executeOptions);
    }

    this.cache.set(cacheKey, rows);
    this.cache.set(metaKey, { executionEndedAt });

    return {
      data: rows,
      lastUpdated: executionEndedAt ?? new Date().toISOString(),
      source: 'dune',
      stale: !!(executionEndedAt && Date.now() - new Date(executionEndedAt).getTime() > 36 * 60 * 60 * 1000),
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

    // Retry the /execute call on 429 — Dune's free/basic tier caps concurrent
    // executions at 1, and many queries fired in a row would otherwise fail outright.
    let execRes!: Response;
    let attempt = 0;
    const maxAttempts = 8;
    while (attempt < maxAttempts) {
      execRes = await fetch(`${DUNE_API_BASE}/query/${queryId}/execute`, {
        method: 'POST',
        headers: {
          'X-Dune-Api-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: params ? JSON.stringify({ query_parameters: params }) : undefined,
      });
      if (execRes.status !== 429) break;
      const backoff = Math.min(30000, 2000 * Math.pow(2, attempt));
      await new Promise((r) => setTimeout(r, backoff));
      attempt++;
    }

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

    const { rows, executionEndedAt } = await this.fetchAllRows(
      `${DUNE_API_BASE}/execution/${execution_id}/results`
    );

    const cacheKey = `dune:${queryId}`;
    const metaKey = `dune:${queryId}:meta`;
    this.cache.set(cacheKey, rows);
    this.cache.set(metaKey, { executionEndedAt });

    return {
      data: rows,
      lastUpdated: executionEndedAt ?? new Date().toISOString(),
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

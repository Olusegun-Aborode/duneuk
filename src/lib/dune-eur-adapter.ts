/**
 * EUR Dune adapter
 *
 * The shared dashboard types in `lib/types.ts` use `*_gbp` as the
 * "native currency" field name for historical reasons (the GBP terminal was
 * built first and the EUR terminal reuses the same component / type shapes).
 *
 * Dune EUR queries naturally return `*_eur` fields. This adapter wraps the
 * dune connector and renames the EUR-specific fields onto the unified shape
 * so EUR routes can drop straight in without touching every consumer.
 *
 * Renames applied (when present on each row):
 *   total_supply_eur → total_supply_gbp
 *   supply_eur       → supply_gbp
 *   volume_eur       → volume_gbp
 *   balance_eur      → balance_gbp
 */
import { getDuneQueryResults } from "./dune";

const RENAMES: Array<[string, string]> = [
  ["total_supply_eur", "total_supply_gbp"],
  ["supply_eur", "supply_gbp"],
  ["volume_eur", "volume_gbp"],
  ["balance_eur", "balance_gbp"],
];

function normaliseRow(
  row: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...row };
  for (const [from, to] of RENAMES) {
    if (from in out) {
      out[to] = out[from];
      delete out[from];
    }
  }
  return out;
}

export async function getDuneEurQueryResults(queryId: number) {
  const result = await getDuneQueryResults(queryId);
  return {
    data: (result.data ?? []).map((r) =>
      normaliseRow(r as Record<string, unknown>)
    ),
    lastUpdated: result.lastUpdated,
  };
}

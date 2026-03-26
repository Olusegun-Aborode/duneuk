"use client";

import type { CurrencyFilter } from "@/contexts/CurrencyFilterContext";

/**
 * Maps EUR-specific field names to GBP equivalents so the frontend
 * can use a single set of type definitions.
 *
 * e.g. { supply_eur: 100 } → { supply_gbp: 100 }
 */
const EUR_TO_GBP_FIELDS: Record<string, string> = {
  total_supply_eur: "total_supply_gbp",
  supply_eur: "supply_gbp",
  volume_eur: "volume_gbp",
  balance_eur: "balance_gbp",
  eur_token: "gbp_token",
};

export function normalizeEurRow<T extends Record<string, unknown>>(row: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(row)) {
    const mapped = EUR_TO_GBP_FIELDS[key];
    if (mapped) {
      out[mapped] = val;
    } else {
      out[key] = val;
    }
  }
  return out as T;
}

export function normalizeEurResponse<T extends Record<string, unknown>>(
  response: { data: T[]; lastUpdated: string }
): { data: T[]; lastUpdated: string } {
  return {
    ...response,
    data: response.data.map(normalizeEurRow),
  };
}

/**
 * Returns the API base path(s) for a given currency filter.
 * GBP → british-stablecoin
 * EUR → euro-stablecoin
 * ALL → both (caller merges)
 */
export function getApiPaths(currency: CurrencyFilter): string[] {
  switch (currency) {
    case "GBP":
      return ["/api/terminal/british-stablecoin"];
    case "EUR":
      return ["/api/terminal/euro-stablecoin"];
    case "ALL":
      return [
        "/api/terminal/british-stablecoin",
        "/api/terminal/euro-stablecoin",
      ];
  }
}

/**
 * Returns the native currency label for display
 */
export function getNativeLabel(currency: CurrencyFilter): string {
  switch (currency) {
    case "GBP": return "GBP";
    case "EUR": return "EUR";
    case "ALL": return "USD";
  }
}

/**
 * Returns the field name to use for the native supply value.
 * In ALL mode, use USD since we can't sum GBP + EUR natively.
 */
export function getNativeField(currency: CurrencyFilter): "supply_gbp" | "supply_usd" {
  return currency === "ALL" ? "supply_usd" : "supply_gbp";
}

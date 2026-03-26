"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export type CurrencyFilter = "GBP" | "EUR" | "ALL";

interface CurrencyFilterContextValue {
  currency: CurrencyFilter;
  setCurrency: (c: CurrencyFilter) => void;
  selectedTokens: string[];
  setSelectedTokens: (tokens: string[]) => void;
}

const CurrencyFilterContext = createContext<CurrencyFilterContextValue>({
  currency: "ALL",
  setCurrency: () => {},
  selectedTokens: [],
  setSelectedTokens: () => {},
});

const STORAGE_KEY = "duneuk-currency-filter";
const TOKEN_STORAGE_KEY = "duneuk-token-filter";

export function CurrencyFilterProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyFilter>("ALL");
  const [selectedTokens, setSelectedTokensState] = useState<string[]>([]);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "GBP" || stored === "EUR" || stored === "ALL") {
      setCurrencyState(stored);
    }
    try {
      const storedTokens = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (storedTokens) {
        const parsed = JSON.parse(storedTokens);
        if (Array.isArray(parsed)) {
          setSelectedTokensState(parsed);
        }
      }
    } catch {
      // ignore invalid JSON
    }
  }, []);

  const setCurrency = useCallback((c: CurrencyFilter) => {
    setCurrencyState(c);
    localStorage.setItem(STORAGE_KEY, c);
    // Clear selected tokens when currency changes (token list changes)
    setSelectedTokensState([]);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }, []);

  const setSelectedTokens = useCallback((tokens: string[]) => {
    setSelectedTokensState(tokens);
    if (tokens.length === 0) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } else {
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
    }
  }, []);

  return (
    <CurrencyFilterContext.Provider value={{ currency, setCurrency, selectedTokens, setSelectedTokens }}>
      {children}
    </CurrencyFilterContext.Provider>
  );
}

export function useCurrencyFilter() {
  return useContext(CurrencyFilterContext);
}

/** Token lists by currency group */
export const GBP_TOKENS = ["tGBP", "GBPm", "GBPe", "GBPT", "VGBP", "eGBP"] as const;
export const EUR_TOKENS = ["EURC", "EURT", "EURS", "EURA", "EURe", "EURCV", "EURI", "EUROe", "EURQ", "EUROP", "EURR", "EURAU", "PAR", "sEUR", "EURL"] as const;
export const ALL_TOKENS = [...GBP_TOKENS, ...EUR_TOKENS] as const;

/** Helper to get the token list for a currency filter */
export function getTokensForCurrency(currency: CurrencyFilter): readonly string[] {
  switch (currency) {
    case "GBP": return GBP_TOKENS;
    case "EUR": return EUR_TOKENS;
    case "ALL": return ALL_TOKENS;
  }
}

/** Helper to check if a token belongs to a currency group */
export function tokenMatchesCurrency(token: string, currency: CurrencyFilter): boolean {
  if (currency === "ALL") return true;
  if (currency === "GBP") return (GBP_TOKENS as readonly string[]).includes(token);
  if (currency === "EUR") return (EUR_TOKENS as readonly string[]).includes(token);
  return false;
}

/** Helper to check if a token matches both the currency group and the selected token filter.
 *  Returns true if selectedTokens is empty (all tokens) OR token is in selectedTokens,
 *  AND token matches the currency group. */
export function tokenMatchesFilter(token: string, currency: CurrencyFilter, selectedTokens: string[]): boolean {
  if (!tokenMatchesCurrency(token, currency)) return false;
  if (selectedTokens.length === 0) return true;
  return selectedTokens.includes(token);
}
